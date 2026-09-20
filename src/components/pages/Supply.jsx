import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { useAuth } from '../../context/AuthContext'
import { listenToSupplies, saveSupply } from '../../services/supplyService'
import { executeMatching } from '../../services/matchingEngine'

export const Supply = () => {
  const { userRole, currentUser } = useAuth()
  const [supplies, setSupplies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    donor: "", phone: "", itemKey: "water", qtyTotal: "", unit: "liters",
    expiryDate: "", availability: "immediate", lat: "23.0225", lng: "72.5714",
  })

  useEffect(() => {
    return listenToSupplies(setSupplies)
  }, [])

  const canWrite = userRole === "admin2"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await saveSupply(form, currentUser?.uid)
      setForm({ donor: "", phone: "", itemKey: "water", qtyTotal: "", unit: "liters", expiryDate: "", availability: "immediate", lat: "23.0225", lng: "72.5714" })
      setShowForm(false)
      // Auto re-run matching
      try { await executeMatching(currentUser?.uid) } catch (e) { console.warn("Auto-match:", e) }
    } catch (e) {
      alert("Failed: " + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor = (s) => {
    const m = { listed: "bg-green-100 text-green-800", reserved: "bg-amber-100 text-amber-800", dispatched: "bg-blue-100 text-blue-800", expired: "bg-red-100 text-red-800" }
    return m[s] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Supply Management" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#001d36] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D98B3A]">inventory_2</span>
              Donor Supply Inventory
              <span className="bg-[#001d36] text-white text-[10px] px-2 py-0.5 rounded-full font-mono">{supplies.length}</span>
            </h2>
            {canWrite && (
              <button onClick={() => setShowForm(!showForm)}
                className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-sm">add_box</span>
                {showForm ? "Cancel" : "Add Supply"}
              </button>
            )}
          </div>

          {showForm && canWrite && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-[#001d36] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">add_box</span> Register Donor Supply
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Donor Name *</label>
                  <input type="text" required value={form.donor} onChange={e => setForm({...form, donor: e.target.value})}
                    placeholder="e.g. Red Cross Gujarat" className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Item *</label>
                  <select value={form.itemKey} onChange={e => setForm({...form, itemKey: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]">
                    <option value="water">Water</option><option value="food">Food Packets</option>
                    <option value="medicine">Medicine</option><option value="blankets">Blankets</option>
                    <option value="tents">Tents</option><option value="hygiene_kits">Hygiene Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Quantity *</label>
                  <input type="number" required min="1" value={form.qtyTotal} onChange={e => setForm({...form, qtyTotal: e.target.value})}
                    placeholder="e.g. 1000" className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]">
                    <option value="liters">Liters</option><option value="packets">Packets</option>
                    <option value="units">Units</option><option value="kg">Kg</option><option value="boxes">Boxes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Latitude</label>
                  <input type="text" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Longitude</label>
                  <input type="text" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div className="flex items-end">
                  <button type="submit" disabled={submitting}
                    className="w-full bg-[#D98B3A] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#c47a2f] transition-colors disabled:opacity-50 cursor-pointer">
                    {submitting ? "Saving..." : "Save Supply"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Supply Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplies.map(s => {
              const pct = s.qtyTotal > 0 ? Math.round((s.qtyAvailable / s.qtyTotal) * 100) : 0
              return (
                <div key={s.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#001d36] capitalize">{s.itemKey?.replace(/_/g, " ")}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor(s.status)}`}>{s.status}</span>
                  </div>
                  <div className="text-xs text-[#74777e] mb-2">{s.donor}</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold text-[#001d36] font-mono">{s.qtyAvailable}</span>
                    <span className="text-xs text-[#74777e]">/ {s.qtyTotal} {s.unit}</span>
                    {s.qtyReserved > 0 && <span className="text-xs text-amber-600 font-mono">({s.qtyReserved} reserved)</span>}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#E7DED2] rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full ${pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#74777e]">
                    <span>{pct}% available</span>
                    {s.expiryDate && <span className="text-orange-600 font-semibold">Exp: {typeof s.expiryDate === "string" ? s.expiryDate : "—"}</span>}
                  </div>
                </div>
              )
            })}
            {supplies.length === 0 && (
              <div className="col-span-full bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 text-center text-sm text-[#74777e]">
                No supplies registered yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
export default Supply
