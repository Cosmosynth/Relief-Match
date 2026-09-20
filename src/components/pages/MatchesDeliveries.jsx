import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { useAuth } from '../../context/AuthContext'
import { listenToMatches, approveMatch, rejectMatch, createShipment, listenToShipments, markPickedUp, markDelivered, confirmReceipt } from '../../services/matchService'
import { releaseStock } from '../../services/supplyService'
import { executeMatching } from '../../services/matchingEngine'

export const MatchesDeliveries = () => {
  const navigate = useNavigate()
  const { userRole, userCampId, currentUser } = useAuth()
  const [matches, setMatches] = useState([])
  const [shipments, setShipments] = useState([])
  const [activeTab, setActiveTab] = useState(userRole === "logistics" ? "deliveries" : "matches")

  useEffect(() => {
    const mFilters = userRole === "incharge" && userCampId ? { campId: userCampId } : {}
    const sFilters = userRole === "logistics" ? { driverUid: currentUser?.uid } : userRole === "incharge" && userCampId ? { campId: userCampId } : {}
    const unsubs = [
      listenToMatches(setMatches, mFilters),
      listenToShipments(setShipments, sFilters),
    ]
    return () => unsubs.forEach(u => u())
  }, [userRole, userCampId, currentUser?.uid])

  const handleApprove = async (matchId) => {
    try { await approveMatch(matchId, currentUser?.uid) } catch (e) { alert("Error: " + e.message) }
  }

  const handleReject = async (m) => {
    try {
      await rejectMatch(m.id, currentUser?.uid)
      await releaseStock(m.supplyId, m.qty)
      try { await executeMatching(currentUser?.uid) } catch (e) { console.warn("Re-match:", e) }
    } catch (e) { alert("Error: " + e.message) }
  }

  const handleAssignTrip = async (m) => {
    try {
      await createShipment({ matchIds: [m.id], campId: m.campId, campName: m.campName }, currentUser?.uid)
    } catch (e) { alert("Error: " + e.message) }
  }

  const handlePickup = async (shipId) => {
    try { await markPickedUp(shipId, currentUser?.uid) } catch (e) { alert("Error: " + e.message) }
  }

  const handleDeliver = async (shipId) => {
    try { await markDelivered(shipId, currentUser?.uid) } catch (e) { alert("Error: " + e.message) }
  }

  const handleConfirm = async (shipId) => {
    try { await confirmReceipt(shipId, currentUser?.uid) } catch (e) { alert("Error: " + e.message) }
  }

  const matchStatus = (s) => {
    const c = { proposed: "bg-blue-100 text-blue-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", in_transit: "bg-purple-100 text-purple-800", delivered: "bg-teal-100 text-teal-800", fulfilled: "bg-emerald-100 text-emerald-800" }
    return c[s] || "bg-gray-100 text-gray-800"
  }

  const shipStatus = (s) => {
    const c = { assigned: "bg-blue-100 text-blue-800", picked_up: "bg-amber-100 text-amber-800", in_transit: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800", confirmed: "bg-emerald-100 text-emerald-800" }
    return c[s] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Matches & Deliveries" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="flex items-center gap-6 border-b border-[#E7DED2]">
            <div className="flex gap-6">
              <button onClick={() => setActiveTab("matches")}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === "matches" ? "border-[#D98B3A] text-[#001d36]" : "border-transparent text-[#74777e] hover:text-[#001d36]"}`}>
                Matches ({matches.length})
              </button>
              <button onClick={() => setActiveTab("deliveries")}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === "deliveries" ? "border-[#D98B3A] text-[#001d36]" : "border-transparent text-[#74777e] hover:text-[#001d36]"}`}>
                Deliveries ({shipments.length})
              </button>
            </div>
            {userRole === "admin2" && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-sm">visibility</span>
                Read-Only
              </span>
            )}
          </div>

          {activeTab === "matches" && (
            <div className="space-y-3">
              {matches.length > 0 ? matches.map(m => (
                <div key={m.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${matchStatus(m.status)}`}>{m.status}</span>
                      <span className="text-xs font-mono text-[#74777e]">Score: {m.score}</span>
                      <span className="text-xs font-mono text-[#74777e]">{m.distanceKm} km</span>
                    </div>
                    <span className="text-[10px] text-[#74777e] font-mono">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ""}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-4">
                    <h4 className="font-bold text-sm text-[#001d36] capitalize">{m.itemKey?.replace(/_/g, " ")}</h4>
                    <span className="font-mono font-bold text-[#001d36]">×{m.qty}</span>
                    <span className="text-xs text-[#74777e]">from <b>{m.donorName || "Donor"}</b> → <b>{m.campName || "Camp"}</b></span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E7DED2] flex flex-wrap items-center gap-2">
                    {userRole === "admin1" && m.status === "proposed" && (
                      <>
                        <button onClick={() => handleApprove(m.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-green-700 cursor-pointer flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span> Approve
                        </button>
                        <button onClick={() => handleReject(m)} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-red-100 cursor-pointer flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">cancel</span> Reject
                        </button>
                      </>
                    )}
                    {(userRole === "admin1" || userRole === "logistics") && m.status === "approved" && (
                      <button onClick={() => handleAssignTrip(m)} className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-[#17324d] cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">local_shipping</span> Assign Trip
                      </button>
                    )}
                    {userRole === "admin2" && (
                      <span className="text-[10px] text-[#74777e] italic">View only — no actions available</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 text-center text-sm text-[#74777e]">No matches yet. Run matching from Command Center.</div>
              )}
            </div>
          )}

          {activeTab === "deliveries" && (
            <div className="space-y-3">
              {shipments.length > 0 ? shipments.map(s => (
                <div key={s.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#D98B3A]">local_shipping</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${shipStatus(s.status)}`}>{s.status?.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#001d36]">→ {s.campName || "Camp"}</span>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-1 my-3">
                    {["assigned", "picked_up", "delivered", "confirmed"].map((step, i) => {
                      const steps = ["assigned", "picked_up", "delivered", "confirmed"]
                      const currentIdx = steps.indexOf(s.status)
                      const done = i <= currentIdx
                      return (
                        <React.Fragment key={step}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? "bg-green-600 text-white" : "bg-[#E7DED2] text-[#74777e]"}`}>
                            {done ? "✓" : i + 1}
                          </div>
                          {i < 3 && <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-green-500" : "bg-[#E7DED2]"}`}></div>}
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#74777e] mb-3">
                    <span>Assigned</span><span>Picked Up</span><span>Delivered</span><span>Confirmed</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userRole === "logistics" && s.status === "assigned" && (
                      <button onClick={() => handlePickup(s.id)} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-amber-700 cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">move_to_inbox</span> Mark Picked Up
                      </button>
                    )}
                    {userRole === "logistics" && s.status === "picked_up" && (
                      <button onClick={() => handleDeliver(s.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-green-700 cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span> Mark Delivered
                      </button>
                    )}
                    {userRole === "incharge" && s.status === "delivered" && (
                      <button onClick={() => handleConfirm(s.id)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-emerald-700 cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span> Confirm Receipt
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 text-center text-sm text-[#74777e]">No deliveries yet.</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
export default MatchesDeliveries
