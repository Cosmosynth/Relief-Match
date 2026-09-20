import { createDoc, fetchDoc, patchDoc, listenCollection, queryCollection } from "./firestoreService"
import { logAudit } from "./adminService"

// ─── Camp CRUD ────────────────────────────────────────────────

export const createCamp = async (data) => {
  const id = await createDoc("camps", {
    name: data.name,
    lat: Number(data.lat),
    lng: Number(data.lng),
    population: Number(data.population) || 0,
    inchargeUid: data.inchargeUid || null,
    zone: data.zone || "",
  })
  await logAudit("CAMP_CREATED", `Created camp "${data.name}" (${id})`)
  return id
}

export const getCampById = async (campId) => {
  return fetchDoc("camps", campId)
}

export const updateCamp = async (campId, data) => {
  await patchDoc("camps", campId, data)
  await logAudit("CAMP_UPDATED", `Updated camp ${campId}`)
}

export const listenToCamps = (callback) => {
  return listenCollection("camps", callback, [], { field: "name", dir: "asc" })
}

export const getAllCamps = async () => {
  return queryCollection("camps", [], { field: "name", dir: "asc" }, 100)
}
