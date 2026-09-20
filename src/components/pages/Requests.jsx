import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { useAuth } from '../../context/AuthContext'
import { listenToRequests, submitRequest, verifyRequest, rejectRequest } from '../../services/requestService'
import { listenToCamps } from '../../services/campService'
import { canWrite } from '../../services/adminService'

export const Requests = () => {
  const { userRole, userCampId, currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [camps, setCamps] = useState([])
  const [activeChip, setActiveChip] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    itemKey: "water",
    qtyRequested: "",
    urgency: "normal",
    notes: "",
  })

  useEffect(() => {
    const filters = {}
    if (userRole === "incharge" && userCampId) filters.campId = userCampId
    const unsubs = [
      listenToRequests(setRequests, filters),
      listenToCamps(setCamps),
    ]
    return () => unsubs.forEach(u => u())
  }, [userRole, userCampId])

  const campMap = {}
  camps.forEach(c => { campMap[c.id] = c })

  const canSubmit = userRole === "incharge"
  const canVerify = userRole === "admin1"
  const isReadOnly = !canWrite(userRole, "/admin/requests")

  // Filter by chip
  let filteredRequests = requests
  if (activeChip === "Unmatched") {
    filteredRequests = requests.filter(r => ["submitted", "verified", "unmatched"].includes(r.status))
  } else if (activeChip === "Urgent") {
    filteredRequests = requests.filter(r => r.urgency === "critical" || r.urgency === "high")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const camp = campMap[userCampId] || {}
      await submitRequest({
        campId: userCampId,
        campName: camp.name || userCampId,
        itemKey: form.itemKey,
        qtyRequested: Number(form.qtyRequested),
        urgency: form.urgency,
        notes: form.notes,
      }, currentUser?.uid)
      setForm({ itemKey: "water", qtyRequested: "", urgency: "normal", notes: "" })
      setShowForm(false)
    } catch (e) {
      console.error("Submit error:", e)
      alert("Failed: " + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (id) => {
    try {
      await verifyRequest(id, currentUser?.uid)
    } catch (e) {
      alert("Verify failed: " + e.message)
    }
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    try {
      await rejectRequest(rejectModal, rejectReason, currentUser?.uid)
      setRejectModal(null)
      setRejectReason("")
    } catch (e) {
      alert("Reject failed: " + e.message)
    }
  }

  const statusBadge = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      verified: "bg-green-100 text-green-800 border-green-200",
      matched: "bg-emerald-100 text-emerald-800 border-emerald-200",
      partially_matched: "bg-amber-100 text-amber-800 border-amber-200",
      unmatched: "bg-orange-100 text-orange-800 border-orange-200",
      approved: "bg-indigo-100 text-indigo-800 border-indigo-200",
      in_transit: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-teal-100 text-teal-800 border-teal-200",
      fulfilled: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const urgencyBadge = (urg) => {
    const colors = { critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", normal: "bg-blue-100 text-blue-800" }
    return colors[urg] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Requests" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Chips */}
            <div className="flex items-center gap-2">
              {["All", "Unmatched", "Urgent"].map(chip => (
                <button key={chip} onClick={() => setActiveChip(chip)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    activeChip === chip
                      ? "bg-[#001d36] text-white"
                      : "bg-[#FFFDF9] border border-[#E7DED2] text-[#001d36] hover:bg-[#F7F3EC]"
                  }`}>
                  {chip}
                  {chip === "Unmatched" && <span className="ml-1.5 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{requests.filter(r => ["submitted", "verified", "unmatched"].includes(r.status)).length}</span>}
                </button>
              ))}
              {isReadOnly && (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Read-Only
                </span>
              )}
            </div>

            {canSubmit && (
              <button onClick={() => setShowForm(!showForm)}
                className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined text-sm">post_add</span>
                {showForm ? "Cancel" : "New Request"}
              </button>
            )}
          </div>

          {/* Submit Form (incharge only) */}
          {showForm && canSubmit && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-[#001d36] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">post_add</span>
                Submit New Request
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Item *</label>
                  <select value={form.itemKey} onChange={e => setForm({...form, itemKey: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]">
                    <option value="water">Water</option>
                    <option value="food">Food Packets</option>
                    <option value="medicine">Medicine</option>
                    <option value="blankets">Blankets</option>
                    <option value="tents">Tents</option>
                    <option value="hygiene_kits">Hygiene Kits</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Quantity *</label>
                  <input type="number" required min="1" value={form.qtyRequested}
                    onChange={e => setForm({...form, qtyRequested: e.target.value})}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Urgency</label>
                  <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D98B3A]">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#001d36] mb-1">Notes</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Any additional details..."
                    className="w-full px-3 py-2 border border-[#E7DED2] rounded-lg text-xs font-medium focus:outline-none focus:border-[#D98B3A]" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" disabled={submitting}
                    className="bg-[#D98B3A] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#c47a2f] transition-colors disabled:opacity-50 cursor-pointer">
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Request Cards */}
          <div className="space-y-3">
            {filteredRequests.length > 0 ? filteredRequests.map(r => (
              <div key={r.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyBadge(r.urgency)}`}>{r.urgency}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge(r.status)}`}>{r.status.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-[10px] text-[#74777e] font-mono">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "Recently"}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-4">
                  <h4 className="font-bold text-base text-[#001d36] capitalize">{r.itemKey?.replace(/_/g, " ")}</h4>
                  <span className="text-sm font-mono font-bold text-[#001d36]">×{r.qtyRequested}</span>
                  {r.qtyMatched > 0 && (
                    <span className="text-xs font-mono text-green-700">({r.qtyMatched} matched)</span>
                  )}
                </div>

                <div className="mt-1 text-xs text-[#74777e]">
                  Camp: <span className="font-semibold text-[#001d36]">{r.campName || campMap[r.campId]?.name || r.campId}</span>
                  {r.notes && <span className="ml-3">— {r.notes}</span>}
                </div>

                {r.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    <span className="font-bold">Rejected:</span> {r.rejectionReason}
                  </div>
                )}

                {/* Admin1 Actions */}
                {canVerify && r.status === "submitted" && (
                  <div className="mt-3 pt-3 border-t border-[#E7DED2] flex items-center gap-2">
                    <button onClick={() => handleVerify(r.id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span> Verify
                    </button>
                    <button onClick={() => setRejectModal(r.id)}
                      className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">cancel</span> Reject
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 text-center text-sm text-[#74777e]">
                No requests found. {canSubmit ? 'Click "New Request" to submit one.' : ''}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-[#001d36] flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">cancel</span>
              Reject Request
            </h3>
            <div>
              <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">Reason (required)</label>
              <textarea rows="3" required value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs text-[#001d36] focus:border-[#D98B3A]" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason("") }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 cursor-pointer">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Requests
