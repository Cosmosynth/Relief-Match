import { createDocWithId, createDoc } from "../services/firestoreService"
import { logAudit } from "../services/adminService"

/**
 * Seed demo data for Relief Match.
 * 6 Gujarat camps, 10-12 supplies, 8-10 requests.
 */
export const seedDemoData = async (actorUid) => {
  // ─── Seed admin1 user ───
  try {
    await createDocWithId("users", "demo-admin-123", {
      email: "patelsaumy@gmail.com",
      displayName: "Relief Coordinator",
      role: "admin1",
      status: "active",
      campId: null,
    })
  } catch (e) { console.warn("Admin seed:", e) }

  // ─── 6 Gujarat Camps ───
  const campDefs = [
    { id: "camp_riverside", name: "Riverside Camp", lat: 23.0225, lng: 72.5714, population: 300, zone: "Ahmedabad" },
    { id: "camp_sabarmati", name: "Sabarmati Relief Center", lat: 23.0527, lng: 72.5854, population: 450, zone: "Ahmedabad" },
    { id: "camp_vadodara", name: "Vadodara Camp", lat: 22.3072, lng: 73.1812, population: 200, zone: "Vadodara" },
    { id: "camp_surat", name: "Surat Flood Camp", lat: 21.1702, lng: 72.8311, population: 500, zone: "Surat" },
    { id: "camp_rajkot", name: "Rajkot Emergency Camp", lat: 22.3039, lng: 70.8022, population: 180, zone: "Rajkot" },
    { id: "camp_bhuj", name: "Bhuj Relief Camp", lat: 23.2420, lng: 69.6669, population: 250, zone: "Kutch" },
  ]

  for (const c of campDefs) {
    try {
      await createDocWithId("camps", c.id, { name: c.name, lat: c.lat, lng: c.lng, population: c.population, zone: c.zone, inchargeUid: null })
    } catch (e) { console.warn("Camp seed:", e) }
  }

  // ─── 12 Supplies ───
  const supplyDefs = [
    { donor: "Red Cross Gujarat", itemKey: "water", qtyTotal: 5000, unit: "liters", lat: 23.0300, lng: 72.5500, expiryDate: "2026-10-15", verified: true },
    { donor: "UNICEF India", itemKey: "water", qtyTotal: 3000, unit: "liters", lat: 22.3100, lng: 73.2000, expiryDate: "2026-10-20", verified: true },
    { donor: "Local NGO", itemKey: "food", qtyTotal: 2000, unit: "packets", lat: 23.0400, lng: 72.5900, expiryDate: "2026-09-25", verified: true },
    { donor: "Gujarat Govt", itemKey: "food", qtyTotal: 1500, unit: "packets", lat: 21.1800, lng: 72.8400, expiryDate: "2026-10-01", verified: true },
    { donor: "Pharma Aid", itemKey: "medicine", qtyTotal: 500, unit: "boxes", lat: 23.0600, lng: 72.6000, expiryDate: "2027-03-01", verified: true },
    { donor: "MedRelief", itemKey: "medicine", qtyTotal: 300, unit: "boxes", lat: 22.3200, lng: 73.1900, expiryDate: "2026-12-01", verified: true },
    { donor: "TextileAid", itemKey: "blankets", qtyTotal: 0, unit: "units", lat: 23.0100, lng: 72.5600, expiryDate: null, verified: true },
    { donor: "TentRelief", itemKey: "tents", qtyTotal: 100, unit: "units", lat: 23.0500, lng: 72.5800, expiryDate: null, verified: true },
    { donor: "HygieneFirst", itemKey: "hygiene_kits", qtyTotal: 400, unit: "kits", lat: 21.1600, lng: 72.8200, expiryDate: "2027-06-01", verified: true },
    { donor: "Community Drive", itemKey: "water", qtyTotal: 1000, unit: "liters", lat: 22.3050, lng: 70.8100, expiryDate: "2026-09-22", verified: true },
    { donor: "Unverified Donor", itemKey: "food", qtyTotal: 800, unit: "packets", lat: 23.2500, lng: 69.6700, expiryDate: "2026-10-10", verified: false },
    { donor: "ExpiringSoon Co", itemKey: "medicine", qtyTotal: 200, unit: "boxes", lat: 23.0350, lng: 72.5650, expiryDate: "2026-09-21", verified: true },
  ]

  for (const s of supplyDefs) {
    try {
      await createDoc("supplies", {
        ...s,
        qtyAvailable: s.qtyTotal,
        qtyReserved: 0,
        phone: "",
        availability: "immediate",
        status: "listed",
        addedBy: actorUid || "seed",
      })
    } catch (e) { console.warn("Supply seed:", e) }
  }

  // ─── 10 Requests ───
  const requestDefs = [
    { campId: "camp_riverside", itemKey: "water", qtyRequested: 600, urgency: "critical", notes: "Urgent — children dehydrated" },
    { campId: "camp_riverside", itemKey: "medicine", qtyRequested: 100, urgency: "critical", notes: "ORS and antibiotics needed" },
    { campId: "camp_sabarmati", itemKey: "blankets", qtyRequested: 300, urgency: "high", notes: "Night temperatures dropping" },
    { campId: "camp_sabarmati", itemKey: "food", qtyRequested: 400, urgency: "high", notes: "Running low on rations" },
    { campId: "camp_vadodara", itemKey: "water", qtyRequested: 400, urgency: "normal", notes: "" },
    { campId: "camp_surat", itemKey: "food", qtyRequested: 800, urgency: "high", notes: "Large camp, urgent" },
    { campId: "camp_surat", itemKey: "hygiene_kits", qtyRequested: 200, urgency: "normal", notes: "" },
    { campId: "camp_rajkot", itemKey: "tents", qtyRequested: 50, urgency: "high", notes: "Makeshift shelters collapsing" },
    { campId: "camp_bhuj", itemKey: "water", qtyRequested: 5000, urgency: "normal", notes: "Inflated request — needs review" },
    { campId: "camp_bhuj", itemKey: "medicine", qtyRequested: 150, urgency: "normal", notes: "" },
  ]

  const campNameMap = {}
  campDefs.forEach(c => { campNameMap[c.id] = c.name })

  for (const r of requestDefs) {
    try {
      await createDoc("requests", {
        ...r,
        campName: campNameMap[r.campId] || r.campId,
        qtyMatched: 0,
        status: "submitted",
        submittedBy: actorUid || "seed",
        rejectionReason: null,
      })
    } catch (e) { console.warn("Request seed:", e) }
  }

  await logAudit("DEMO_DATA_SEEDED", "Seeded 6 camps, 12 supplies, 10 requests", actorUid)
}
