import { createDoc, patchDoc, listenCollection, queryCollection } from "./firestoreService"
import { logAudit } from "./adminService"
import { logActivity } from "./activityService"

// ─── Status flow ──────────────────────────────────────────────
// submitted → verified → matched | partially_matched | unmatched → approved → in_transit → delivered → fulfilled
// Also: rejected, cancelled

export const REQUEST_STATUSES = [
  "submitted", "verified", "matched", "partially_matched", "unmatched",
  "approved", "preparing", "ready_for_pickup", "dispatched", "in_transit", "delivered", "fulfilled", "rejected", "cancelled"
]

// ─── CRUD ─────────────────────────────────────────────────────

export const submitRequest = async (data, actorUid) => {
  const id = await createDoc("requests", {
    campId: data.campId,
    campName: data.campName || "",
    itemKey: data.itemKey,
    qtyRequested: Number(data.qtyRequested),
    qtyMatched: 0,
    urgency: data.urgency || "normal", // critical, high, normal
    status: "submitted",
    notes: data.notes || "",
    submittedBy: actorUid,
    rejectionReason: null,
  })
  await logActivity("request_submitted", `New request: ${data.itemKey} ×${data.qtyRequested}`, "info", id, actorUid)
  await logAudit("REQUEST_SUBMITTED", `${data.itemKey} ×${data.qtyRequested} for camp ${data.campId}`, actorUid)
  return id
}

export const verifyRequest = async (requestId, actorUid) => {
  await patchDoc("requests", requestId, { status: "verified" })
  await logActivity("request_verified", `Request ${requestId} verified`, "info", requestId, actorUid)
  await logAudit("REQUEST_VERIFIED", `Verified request ${requestId}`, actorUid)
}

export const rejectRequest = async (requestId, reason, actorUid) => {
  await patchDoc("requests", requestId, { status: "rejected", rejectionReason: reason })
  await logActivity("request_rejected", `Request ${requestId} rejected: ${reason}`, "warning", requestId, actorUid)
  await logAudit("REQUEST_REJECTED", `Rejected request ${requestId}: ${reason}`, actorUid)
}

export const updateRequestStatus = async (requestId, status, extra = {}, actorUid = null) => {
  await patchDoc("requests", requestId, { status, ...extra })
  await logActivity(`request_${status}`, `Request ${requestId} → ${status}`, "info", requestId, actorUid)
}

export const acceptRequest = async (requestId, actorUid) => {
  await patchDoc("requests", requestId, { status: "preparing" })
  await logActivity("request_accepted", `Request ${requestId} accepted and preparing`, "info", requestId, actorUid)
}

export const markReadyForPickup = async (requestId, actorUid) => {
  await patchDoc("requests", requestId, { status: "ready_for_pickup" })
  await logActivity("request_ready", `Request ${requestId} ready for pickup`, "success", requestId, actorUid)
}

export const verifyPickup = async (requestId, actorUid) => {
  await patchDoc("requests", requestId, { status: "in_transit" }) // merging dispatched and in_transit for simplicity
  await logActivity("request_dispatched", `Request ${requestId} picked up and in transit`, "info", requestId, actorUid)
}

export const completeDelivery = async (requestId, actorUid) => {
  await patchDoc("requests", requestId, { status: "delivered" })
  await logActivity("request_delivered", `Request ${requestId} delivered`, "success", requestId, actorUid)
}

export const updateRequestMatched = async (requestId, qtyMatched, status) => {
  await patchDoc("requests", requestId, { qtyMatched, status })
}

// ─── Queries ──────────────────────────────────────────────────

export const listenToRequests = (callback, filters = {}) => {
  const constraints = []
  if (filters.campId) constraints.push({ field: "campId", op: "==", value: filters.campId })
  if (filters.status) constraints.push({ field: "status", op: "==", value: filters.status })
  if (filters.urgency) constraints.push({ field: "urgency", op: "==", value: filters.urgency })
  return listenCollection("requests", callback, constraints, { field: "createdAt", dir: "desc" })
}

export const getAllRequests = async (filters = {}) => {
  const constraints = []
  if (filters.campId) constraints.push({ field: "campId", op: "==", value: filters.campId })
  if (filters.status) constraints.push({ field: "status", op: "==", value: filters.status })
  return queryCollection("requests", constraints, { field: "createdAt", dir: "desc" })
}

export const getOpenRequests = async () => {
  return queryCollection("requests", [
    { field: "status", op: "in", value: ["submitted", "verified", "unmatched", "partially_matched"] }
  ], { field: "createdAt", dir: "desc" })
}

export const getVerifiedRequests = async () => {
  return queryCollection("requests", [
    { field: "status", op: "in", value: ["verified", "unmatched", "partially_matched"] }
  ], { field: "createdAt", dir: "desc" })
}
