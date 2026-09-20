import { getVerifiedRequests } from "./requestService"
import { getAllSupplies } from "./supplyService"
import { createMatch } from "./matchService"
import { reserveStock } from "./supplyService"
import { updateRequestMatched } from "./requestService"
import { getMatchingConfig, logAudit } from "./adminService"
import { logActivity } from "./activityService"

// ─── Haversine distance (km) ──────────────────────────────────

export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Pure matching function ───────────────────────────────────

/**
 * Core matching algorithm (pure function, no Firestore).
 *
 * @param {Array} requests - verified/unmatched requests [{id, campId, itemKey, qtyRequested, qtyMatched, urgency, campLat, campLng}]
 * @param {Array} supplies - available supplies [{id, itemKey, qtyAvailable, lat, lng, expiryDate, verified, status, donor}]
 * @param {Object} config  - { weights: {distance, coverage, expiry}, criticalWeights, maxRadiusKm }
 * @returns {Object} { matches: [...], updatedRequests: [...] }
 */
export const runMatching = (requests, supplies, config) => {
  const maxKm = config.maxRadiusKm || 500
  const now = Date.now()

  // 1. Sort requests: critical first, then high, then normal; oldest first within same urgency
  const urgencyOrder = { critical: 0, high: 1, normal: 2 }
  const sortedRequests = [...requests].sort((a, b) => {
    const ua = urgencyOrder[a.urgency] ?? 2
    const ub = urgencyOrder[b.urgency] ?? 2
    if (ua !== ub) return ua - ub
    const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0
    const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0
    return ta - tb
  })

  // Track available stock (mutable copy)
  const stockAvailable = {}
  supplies.forEach(s => {
    stockAvailable[s.id] = s.qtyAvailable
  })

  const matches = []
  const updatedRequests = []

  for (const req of sortedRequests) {
    const need = req.qtyRequested - (req.qtyMatched || 0)
    if (need <= 0) continue

    // 2. Find candidate supplies: same item, verified, available, not expired
    const candidates = supplies.filter(s => {
      if (s.itemKey !== req.itemKey) return false
      if (!s.verified) return false
      if (s.status === "expired" || s.status === "dispatched") return false
      if ((stockAvailable[s.id] || 0) <= 0) return false
      if (s.expiryDate) {
        const exp = typeof s.expiryDate === "string" ? new Date(s.expiryDate).getTime() : (s.expiryDate?.toMillis?.() || s.expiryDate?.seconds * 1000 || 0)
        if (exp < now) return false
      }
      return true
    })

    // 3. Score each candidate
    const isCriticalOrHigh = req.urgency === "critical" || req.urgency === "high"
    const w = isCriticalOrHigh
      ? (config.criticalWeights || { distance: 0.55, coverage: 0.25, expiry: 0.2 })
      : (config.weights || { distance: 0.4, coverage: 0.3, expiry: 0.3 })

    const scored = candidates.map(s => {
      const km = haversineKm(req.campLat || 0, req.campLng || 0, s.lat || 0, s.lng || 0)
      const distScore = 1 - Math.min(km / maxKm, 1)
      const available = stockAvailable[s.id] || 0
      const coverageScore = Math.min(available, need) / need

      let expiryScore = 0.5 // default if no expiry
      if (s.expiryDate) {
        const exp = typeof s.expiryDate === "string" ? new Date(s.expiryDate).getTime() : (s.expiryDate?.toMillis?.() || s.expiryDate?.seconds * 1000 || 0)
        const daysToExpiry = (exp - now) / (1000 * 60 * 60 * 24)
        expiryScore = Math.max(0, Math.min(1, 1 - daysToExpiry / 30)) // sooner expiry scores higher
      }

      const score = w.distance * distScore + w.coverage * coverageScore + w.expiry * expiryScore

      return { supply: s, score, distanceKm: km, available }
    })

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    // 4. Greedy allocation across donors
    let remaining = need
    const requestMatches = []

    for (const candidate of scored) {
      if (remaining <= 0) break
      const allocate = Math.min(candidate.available, remaining)
      if (allocate <= 0) continue

      stockAvailable[candidate.supply.id] -= allocate
      remaining -= allocate

      requestMatches.push({
        requestId: req.id,
        supplyId: candidate.supply.id,
        qty: allocate,
        score: Math.round(candidate.score * 100) / 100,
        distanceKm: Math.round(candidate.distanceKm * 10) / 10,
        campId: req.campId,
        campName: req.campName || "",
        itemKey: req.itemKey,
        donorName: candidate.supply.donor || "",
        supplyLat: candidate.supply.lat,
        supplyLng: candidate.supply.lng,
        campLat: req.campLat || 0,
        campLng: req.campLng || 0,
      })
    }

    matches.push(...requestMatches)

    // 5. Determine request status
    const totalMatched = (req.qtyMatched || 0) + (need - remaining)
    let newStatus
    if (remaining === 0) {
      newStatus = "matched"
    } else if (remaining < need) {
      newStatus = "partially_matched"
    } else {
      newStatus = "unmatched"
    }

    updatedRequests.push({
      id: req.id,
      qtyMatched: totalMatched,
      status: newStatus,
    })
  }

  return { matches, updatedRequests }
}

// ─── Firestore wrapper ────────────────────────────────────────

/**
 * Execute full matching cycle:
 * 1. Load verified requests and available supplies
 * 2. Run pure matching function
 * 3. Write match documents and reserve stock in Firestore
 */
export const executeMatching = async (actorUid) => {
  const config = await getMatchingConfig()
  const requests = await getVerifiedRequests()
  const supplies = await getAllSupplies()

  // Enrich requests with camp coordinates
  const { getAllCamps } = await import("./campService")
  const camps = await getAllCamps()
  const campMap = {}
  camps.forEach(c => { campMap[c.id] = c })

  const enrichedRequests = requests
    .filter(r => ["verified", "unmatched", "partially_matched"].includes(r.status))
    .map(r => ({
      ...r,
      campLat: campMap[r.campId]?.lat || 0,
      campLng: campMap[r.campId]?.lng || 0,
      campName: campMap[r.campId]?.name || r.campName || "",
    }))

  const validSupplies = supplies.filter(s => s.status === "listed" && s.verified && s.qtyAvailable > 0)

  const { matches, updatedRequests } = runMatching(enrichedRequests, validSupplies, config)

  // Write matches and reserve stock
  let matchCount = 0
  for (const m of matches) {
    try {
      await createMatch(m)
      await reserveStock(m.supplyId, m.qty)
      matchCount++
    } catch (err) {
      console.error("Match write/reserve error:", err)
    }
  }

  // Update request statuses
  for (const r of updatedRequests) {
    try {
      await updateRequestMatched(r.id, r.qtyMatched, r.status)
    } catch (err) {
      console.error("Request status update error:", err)
    }
  }

  await logActivity("matching_completed", `Matching run: ${matchCount} matches from ${enrichedRequests.length} requests`, "success", null, actorUid)
  await logAudit("MATCHING_RUN", `Generated ${matchCount} matches across ${enrichedRequests.length} requests`, actorUid)

  return { matchCount, requestCount: enrichedRequests.length, matches, updatedRequests }
}
