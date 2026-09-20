import { createDoc, patchDoc, listenCollection, queryCollection } from "./firestoreService"
import { logAudit } from "./adminService"
import { logActivity } from "./activityService"

// ─── Match CRUD ───────────────────────────────────────────────

export const createMatch = async (data) => {
  return createDoc("matches", {
    requestId: data.requestId,
    supplyId: data.supplyId,
    qty: Number(data.qty),
    score: Number(data.score) || 0,
    distanceKm: Number(data.distanceKm) || 0,
    status: "proposed", // proposed → approved → in_transit → delivered → fulfilled / rejected
    campId: data.campId || "",
    campName: data.campName || "",
    itemKey: data.itemKey || "",
    donorName: data.donorName || "",
    supplyLat: data.supplyLat || 0,
    supplyLng: data.supplyLng || 0,
    campLat: data.campLat || 0,
    campLng: data.campLng || 0,
  })
}

export const approveMatch = async (matchId, actorUid) => {
  await patchDoc("matches", matchId, { status: "approved" })
  await logActivity("match_approved", `Match ${matchId} approved`, "success", matchId, actorUid)
  await logAudit("MATCH_APPROVED", `Approved match ${matchId}`, actorUid)
}

export const rejectMatch = async (matchId, actorUid) => {
  await patchDoc("matches", matchId, { status: "rejected" })
  await logActivity("match_rejected", `Match ${matchId} rejected — stock released`, "warning", matchId, actorUid)
  await logAudit("MATCH_REJECTED", `Rejected match ${matchId}`, actorUid)
}

export const listenToMatches = (callback, filters = {}) => {
  const constraints = []
  if (filters.requestId) constraints.push({ field: "requestId", op: "==", value: filters.requestId })
  if (filters.status) constraints.push({ field: "status", op: "==", value: filters.status })
  if (filters.campId) constraints.push({ field: "campId", op: "==", value: filters.campId })
  return listenCollection("matches", callback, constraints, { field: "createdAt", dir: "desc" })
}

export const getAllMatches = async () => {
  return queryCollection("matches", [], { field: "createdAt", dir: "desc" })
}

// ─── Shipment CRUD ────────────────────────────────────────────

export const createShipment = async (data, actorUid) => {
  const id = await createDoc("shipments", {
    matchIds: data.matchIds || [],
    driverUid: data.driverUid || actorUid,
    status: "assigned", // assigned → picked_up → in_transit → delivered
    lastLocation: data.lastLocation || null,
    route: data.route || null,
    campId: data.campId || "",
    campName: data.campName || "",
  })
  await logActivity("trip_assigned", `Trip ${id} assigned to ${actorUid}`, "info", id, actorUid)
  await logAudit("TRIP_ASSIGNED", `Trip ${id} assigned`, actorUid)
  return id
}

export const markPickedUp = async (shipmentId, actorUid) => {
  await patchDoc("shipments", shipmentId, { status: "picked_up" })
  await logActivity("pickup_completed", `Pickup completed for shipment ${shipmentId}`, "info", shipmentId, actorUid)
  await logAudit("PICKUP_COMPLETED", `Shipment ${shipmentId} picked up`, actorUid)
}

export const markDelivered = async (shipmentId, actorUid) => {
  await patchDoc("shipments", shipmentId, { status: "delivered" })
  await logActivity("delivery_completed", `Delivery completed for shipment ${shipmentId}`, "success", shipmentId, actorUid)
  await logAudit("DELIVERY_COMPLETED", `Shipment ${shipmentId} delivered`, actorUid)
}

export const confirmReceipt = async (shipmentId, actorUid) => {
  await patchDoc("shipments", shipmentId, { status: "confirmed" })
  await logActivity("receipt_confirmed", `Receipt confirmed for shipment ${shipmentId}`, "success", shipmentId, actorUid)
  await logAudit("RECEIPT_CONFIRMED", `Shipment ${shipmentId} receipt confirmed by incharge`, actorUid)
}

export const listenToShipments = (callback, filters = {}) => {
  const constraints = []
  if (filters.driverUid) constraints.push({ field: "driverUid", op: "==", value: filters.driverUid })
  if (filters.status) constraints.push({ field: "status", op: "==", value: filters.status })
  if (filters.campId) constraints.push({ field: "campId", op: "==", value: filters.campId })
  return listenCollection("shipments", callback, constraints, { field: "createdAt", dir: "desc" })
}

export const getAllShipments = async () => {
  return queryCollection("shipments", [], { field: "createdAt", dir: "desc" })
}
