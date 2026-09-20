import { createDoc, createDocWithId, fetchDoc, patchDoc, listenCollection, queryCollection } from "./firestoreService"

// ─── Role / permission config ──────────────────────────────────

export const ROLES = {
  admin1: { label: "Relief Coordinator", icon: "shield_person" },
  admin2: { label: "Supply Manager", icon: "inventory_2" },
  incharge: { label: "Camp In-charge", icon: "home_work" },
  logistics: { label: "Logistics", icon: "local_shipping" },
}

export const SIDEBAR_ACCESS = {
  "/admin":                ["admin1", "admin2", "incharge", "logistics"],
  "/admin/requests":       ["admin1", "incharge", "admin2", "logistics"],
  "/admin/supply":         ["admin2", "admin1", "logistics"],
  "/admin/matches":        ["admin1", "logistics", "incharge", "admin2"],
  "/admin/control-center": ["admin1"],
}

/**
 * Can this role write (create/update) on a given page?
 */
export const canWrite = (role, page) => {
  const map = {
    "/admin/requests": ["admin1", "incharge", "admin2"],
    "/admin/supply": ["admin2"],
    "/admin/matches": ["admin1", "logistics", "incharge"],
    "/admin/control-center": ["admin1"],
  }
  return (map[page] || []).includes(role)
}

// ─── KPI configs per role ─────────────────────────────────────

export const KPI_CONFIG = {
  admin1: [
    { key: "openRequests", label: "Open Requests", icon: "assignment", borderColor: "border-l-orange-500" },
    { key: "unmatched", label: "Unmatched", icon: "link_off", borderColor: "border-l-amber-500" },
    { key: "deliveredToday", label: "Delivered Today", icon: "check_circle", borderColor: "border-l-green-500" },
    { key: "urgentShortages", label: "Urgent Shortages", icon: "campaign", borderColor: "border-l-red-600" },
  ],
  admin2: [
    { key: "pendingRequests", label: "Pending Requests", icon: "assignment", borderColor: "border-l-orange-500" },
    { key: "criticalShortages", label: "Critical Shortages", icon: "warning", borderColor: "border-l-red-600" },
    { key: "ordersPreparing", label: "Orders Preparing", icon: "inventory", borderColor: "border-l-blue-500" },
    { key: "inTransitDelivered", label: "In Transit / Delivered", icon: "local_shipping", borderColor: "border-l-green-500" },
  ],
  incharge: [
    { key: "myOpenRequests", label: "My Open Requests", icon: "assignment", borderColor: "border-l-orange-500" },
    { key: "awaitingMatch", label: "Awaiting Match", icon: "hourglass_top", borderColor: "border-l-amber-500" },
    { key: "delivered", label: "Delivered", icon: "check_circle", borderColor: "border-l-green-500" },
    { key: "urgentDelayed", label: "Urgent / Delayed", icon: "priority_high", borderColor: "border-l-red-600" },
  ],
  logistics: [
    { key: "assignedTrips", label: "Assigned Trips", icon: "route", borderColor: "border-l-blue-500" },
    { key: "pickupsPending", label: "Pickups Pending", icon: "move_to_inbox", borderColor: "border-l-amber-500" },
    { key: "deliveredToday", label: "Delivered Today", icon: "check_circle", borderColor: "border-l-green-500" },
    { key: "delayed", label: "Delayed", icon: "running_with_errors", borderColor: "border-l-red-600" },
  ],
}

// ─── Top-right CTA button per role ────────────────────────────

export const ROLE_CTA = {
  admin1: { label: "RUN MATCHING", icon: "auto_fix_high", action: "runMatching" },
  admin2: { label: "LIST SUPPLY", icon: "add_box", action: "navigateSupply" },
  incharge: { label: "NEW REQUEST", icon: "post_add", action: "newRequest" },
  logistics: { label: "MY TRIPS", icon: "route", action: "myTrips" },
}

// ─── Map layer visibility per role ────────────────────────────

export const MAP_LAYERS = {
  admin1:    { camps: true,  supply: true,  trips: true  },
  admin2:    { camps: true,  supply: true,  trips: false },
  incharge:  { camps: true,  supply: true,  trips: true  },
  logistics: { camps: false, supply: false, trips: true  },
}

// ─── Dashboard filter bar visibility per role ─────────────────

export const DASHBOARD_FILTERS = {
  admin1:    { item: true,  camp: true,  urgency: true  },
  admin2:    { item: true,  camp: false, urgency: false },
  incharge:  { item: true,  camp: false, urgency: true  },
  logistics: { item: false, camp: false, urgency: false },
}

// ─── Dashboard side-panel visibility per role ─────────────────

export const DASHBOARD_PANELS = {
  admin1:    { urgentShortages: true,  activity: true,  stats: true  },
  admin2:    { urgentShortages: true,  activity: true,  stats: false },
  incharge:  { urgentShortages: true,  activity: true,  stats: false },
  logistics: { urgentShortages: false, activity: true,  stats: false },
}

// ─── User Management (Firestore direct) ────────────────────────

export const fetchUsers = async () => {
  return queryCollection("users", [], { field: "createdAt", dir: "desc" }, 200)
}

export const listenToUsers = (callback) => {
  return listenCollection("users", callback, [], { field: "createdAt", dir: "desc" })
}

export const approveUser = async (userId, role, campId = null) => {
  const update = { status: "active", role }
  if (campId) update.campId = campId
  await patchDoc("users", userId, update)
  await logAudit("USER_APPROVED", `Approved user ${userId} as ${role}`)
}

export const suspendUser = async (userId) => {
  await patchDoc("users", userId, { status: "suspended" })
  await logAudit("USER_SUSPENDED", `Suspended user ${userId}`)
}

export const changeUserRole = async (userId, role) => {
  await patchDoc("users", userId, { role })
  await logAudit("ROLE_CHANGED", `Changed role of ${userId} to ${role}`)
}

export const assignUserCamp = async (userId, campId) => {
  await patchDoc("users", userId, { campId })
  await logAudit("CAMP_ASSIGNED", `Assigned user ${userId} to camp ${campId}`)
}

// ─── Invite flow ──────────────────────────────────────────────

export const inviteUser = async ({ email, role, campId = null }) => {
  await createDocWithId("invites", email, { email, role, campId, claimed: false })
  await logAudit("USER_INVITED", `Invited ${email} as ${role}`)
}

export const checkInvite = async (email) => {
  return fetchDoc("invites", email)
}

export const claimInvite = async (email, uid) => {
  const invite = await fetchDoc("invites", email)
  if (invite && !invite.claimed) {
    await patchDoc("invites", email, { claimed: true, claimedBy: uid })
    return invite
  }
  return null
}

// ─── Audit Logs ───────────────────────────────────────────────

export const logAudit = async (action, details, actorUid = null) => {
  try {
    await createDoc("auditLogs", {
      action,
      details,
      actorUid: actorUid || "system",
      status: "Success",
    })
  } catch (e) {
    console.warn("[Audit] Write failed:", e.message)
  }
}

export const listenToAuditLogs = (callback) => {
  return listenCollection("auditLogs", callback, [], { field: "createdAt", dir: "desc" }, 100)
}

// ─── Config ───────────────────────────────────────────────────

export const getMatchingConfig = async () => {
  const doc = await fetchDoc("config", "matching")
  return doc || {
    weights: { distance: 0.4, coverage: 0.3, expiry: 0.3 },
    criticalWeights: { distance: 0.55, coverage: 0.25, expiry: 0.2 },
    maxRadiusKm: 500,
  }
}

export const updateMatchingConfig = async (config) => {
  await createDocWithId("config", "matching", config)
  await logAudit("CONFIG_UPDATED", "Updated matching configuration")
}
