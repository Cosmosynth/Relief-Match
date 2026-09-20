import { createDoc, patchDoc, listenCollection, queryCollection } from "./firestoreService"
import { logAudit } from "./adminService"
import { logActivity } from "./activityService"

// ─── Status flow ──────────────────────────────────────────────
// listed → reserved → dispatched (also: expired)

export const SUPPLY_STATUSES = ["listed", "reserved", "dispatched", "expired"]

// ─── CRUD ─────────────────────────────────────────────────────

export const saveSupply = async (data, actorUid) => {
  const qtyTotal = Number(data.qtyTotal)
  const id = await createDoc("supplies", {
    donor: data.donor || "Anonymous",
    phone: data.phone || "",
    itemKey: data.itemKey,
    qtyTotal,
    qtyAvailable: qtyTotal,
    qtyReserved: 0,
    unit: data.unit || "units",
    lat: Number(data.lat) || 0,
    lng: Number(data.lng) || 0,
    expiryDate: data.expiryDate || null,
    availability: data.availability || "immediate",
    status: "listed",
    verified: data.verified !== false,
    addedBy: actorUid,
  })
  await logActivity("supply_added", `New supply: ${data.itemKey} ×${qtyTotal} from ${data.donor}`, "info", id, actorUid)
  await logAudit("SUPPLY_ADDED", `${data.itemKey} ×${qtyTotal} from ${data.donor}`, actorUid)
  return id
}

export const updateSupply = async (supplyId, data, actorUid) => {
  await patchDoc("supplies", supplyId, data)
  if (actorUid) {
    await logAudit("SUPPLY_UPDATED", `Updated supply ${supplyId}`, actorUid)
  }
}

/**
 * Reserve stock for a match. Enforces qtyAvailable + qtyReserved <= qtyTotal.
 */
export const reserveStock = async (supplyId, qty) => {
  const { db } = await import("../firebase/firebase")
  const { doc, runTransaction } = await import("firebase/firestore")
  
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "supplies", supplyId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error("Supply not found")
    
    const data = snap.data()
    const newAvailable = data.qtyAvailable - qty
    const newReserved = data.qtyReserved + qty
    
    if (newAvailable < 0) throw new Error("Insufficient available stock")
    if (newAvailable + newReserved > data.qtyTotal) throw new Error("Reservation exceeds total")
    
    tx.update(ref, {
      qtyAvailable: newAvailable,
      qtyReserved: newReserved,
      status: newAvailable === 0 ? "reserved" : "listed",
    })
  })
}

/**
 * Release reserved stock (e.g., match rejected).
 */
export const releaseStock = async (supplyId, qty) => {
  const { db } = await import("../firebase/firebase")
  const { doc, runTransaction } = await import("firebase/firestore")
  
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "supplies", supplyId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error("Supply not found")
    
    const data = snap.data()
    tx.update(ref, {
      qtyAvailable: data.qtyAvailable + qty,
      qtyReserved: Math.max(0, data.qtyReserved - qty),
      status: "listed",
    })
  })
}

// ─── Queries ──────────────────────────────────────────────────

export const listenToSupplies = (callback, filters = {}) => {
  const constraints = []
  if (filters.itemKey) constraints.push({ field: "itemKey", op: "==", value: filters.itemKey })
  if (filters.status) constraints.push({ field: "status", op: "==", value: filters.status })
  return listenCollection("supplies", callback, constraints, { field: "createdAt", dir: "desc" })
}

export const getAllSupplies = async () => {
  return queryCollection("supplies", [], { field: "createdAt", dir: "desc" })
}

export const getAvailableSupplies = async (itemKey = null) => {
  const constraints = [
    { field: "status", op: "in", value: ["listed"] },
    { field: "verified", op: "==", value: true },
  ]
  if (itemKey) constraints.push({ field: "itemKey", op: "==", value: itemKey })
  return queryCollection("supplies", constraints, { field: "createdAt", dir: "desc" })
}
