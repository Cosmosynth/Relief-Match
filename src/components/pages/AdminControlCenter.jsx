import React, { useState, useEffect } from 'react'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { useAuth } from '../../context/AuthContext'
import { listenToUsers, approveUser, suspendUser, changeUserRole, assignUserCamp, inviteUser, listenToAuditLogs, getMatchingConfig, updateMatchingConfig } from '../../services/adminService'
import { listenToCamps, createCamp } from '../../services/campService'
import { seedDemoData } from '../../scripts/seedData'

export const AdminControlCenter = () => {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [camps, setCamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("incharge")
  const [inviteCampId, setInviteCampId] = useState("")
  const [inviting, setInviting] = useState(false)

  // Camp form
  const [showCampForm, setShowCampForm] = useState(false)
  const [campForm, setCampForm] = useState({ name: "", lat: "", lng: "", population: "" })
  const [addingCamp, setAddingCamp] = useState(false)

  useEffect(() => {
    const unsubs = [
      listenToUsers(setUsers),
      listenToAuditLogs((a) => { setAuditLogs(a); setLoading(false) }),
      listenToCamps(setCamps),
    ]
    return () => unsubs.forEach(u => u())
  }, [])

  const handleApproveUser = async (userId, role) => {
    try { await approveUser(userId, role || "incharge") } catch (e) { alert("Error: " + e.message) }
  }

  const handleSuspendUser = async (userId) => {
    try { await suspendUser(userId) } catch (e) { alert("Error: " + e.message) }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    try {
      await inviteUser({ email: inviteEmail, role: inviteRole, campId: inviteCampId || null })
      alert(`Invited ${inviteEmail} as ${inviteRole}`)
      setIsInviteOpen(false); setInviteEmail("")
    } catch (e) { alert("Error: " + e.message) }
    finally { setInviting(false) }
  }

  const handleAddCamp = async (e) => {
    e.preventDefault()
    setAddingCamp(true)
    try {
      await createCamp(campForm)
      setCampForm({ name: "", lat: "", lng: "", population: "" }); setShowCampForm(false)
    } catch (e) { alert("Error: " + e.message) }
    finally { setAddingCamp(false) }
  }

  const handleSeed = async () => {
    if (!confirm("Seed demo data? This will add camps, supplies, and requests.")) return
    setSeeding(true)
    try { await seedDemoData(currentUser?.uid); alert("Demo data seeded!") }
    catch (e) { alert("Seed failed: " + e.message) }
    finally { setSeeding(false) }
  }

  const roleBadge = (r) => {
    const c = { admin1: "bg-purple-100 text-purple-800", admin2: "bg-blue-100 text-blue-800", incharge: "bg-amber-100 text-amber-800", logistics: "bg-green-100 text-green-800" }
    return c[r] || "bg-gray-100 text-gray-800"
  }

  const statusBadge = (s) => {
    const c = { active: "bg-green-100 text-green-800", pending: "bg-amber-100 text-amber-800", suspended: "bg-red-100 text-red-800" }
    return c[s] || "bg-gray-100 text-gray-800"
  }

  const tabs = [
    { key: "users", label: "Users & Roles" },
    { key: "camps", label: "Camps & Settings" },
    { key: "audit", label: "Audit Logs" },
  ]

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Control Center" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Banner */}
          <div className="bg-[#001d36] text-white p-6 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">admin_panel_settings</span>
                System Administration
              </h2>
              <p className="text-xs text-white/70 mt-1">Manage users, camps, matching settings, and audit logs.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSeed} disabled={seeding}
                className="bg-[#D98B3A] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#c47a2f] disabled:opacity-50 cursor-pointer flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">database</span>
                {seeding ? "Seeding..." : "Seed Demo Data"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E7DED2] gap-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === t.key ? "border-[#D98B3A] text-[#001d36]" : "border-transparent text-[#74777e] hover:text-[#001d36]"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#001d36]">User Accounts ({users.length})</h3>
                <button onClick={() => setIsInviteOpen(true)}
                  className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] flex items-center gap-1.5 cursor-pointer">
                  <span className="material-symbols-outlined text-sm">person_add</span> Invite User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F3EC] border-b border-[#E7DED2] text-[#74777e] uppercase font-mono">
                    <tr>
                      <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th>
                      <th className="p-3">Status</th><th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2]">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-[#F7F3EC]/50">
                        <td className="p-3 font-bold text-[#001d36]">{u.displayName || u.name || "User"}</td>
                        <td className="p-3 font-mono text-[#74777e]">{u.email}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleBadge(u.role)}`}>{u.role || "—"}</span></td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadge(u.status)}`}>{u.status || "pending"}</span></td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {u.status === "pending" && (
                              <button onClick={() => handleApproveUser(u.id, u.role || "incharge")}
                                className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-700 cursor-pointer">Approve</button>
                            )}
                            {u.status === "active" && (
                              <button onClick={() => handleSuspendUser(u.id)}
                                className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-100 cursor-pointer">Suspend</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Camps Tab */}
          {activeTab === "camps" && (
            <div className="space-y-4">
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-[#001d36]">Camp Registry ({camps.length})</h3>
                  <button onClick={() => setShowCampForm(!showCampForm)}
                    className="bg-[#001d36] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#17324d] flex items-center gap-1.5 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">add_location</span> {showCampForm ? "Cancel" : "Add Camp"}
                  </button>
                </div>
                {showCampForm && (
                  <form onSubmit={handleAddCamp} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input required placeholder="Camp name" value={campForm.name} onChange={e => setCampForm({...campForm, name: e.target.value})}
                      className="px-3 py-2 border border-[#E7DED2] rounded-lg text-xs focus:border-[#D98B3A]" />
                    <input required type="number" step="any" placeholder="Latitude" value={campForm.lat} onChange={e => setCampForm({...campForm, lat: e.target.value})}
                      className="px-3 py-2 border border-[#E7DED2] rounded-lg text-xs focus:border-[#D98B3A]" />
                    <input required type="number" step="any" placeholder="Longitude" value={campForm.lng} onChange={e => setCampForm({...campForm, lng: e.target.value})}
                      className="px-3 py-2 border border-[#E7DED2] rounded-lg text-xs focus:border-[#D98B3A]" />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Population" value={campForm.population} onChange={e => setCampForm({...campForm, population: e.target.value})}
                        className="flex-1 px-3 py-2 border border-[#E7DED2] rounded-lg text-xs focus:border-[#D98B3A]" />
                      <button type="submit" disabled={addingCamp}
                        className="bg-[#D98B3A] text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">Save</button>
                    </div>
                  </form>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {camps.map(c => (
                    <div key={c.id} className="border border-[#E7DED2] rounded-lg p-3 bg-white shadow-sm">
                      <div className="font-bold text-sm text-[#001d36]">{c.name}</div>
                      <div className="text-[11px] text-[#74777e] mt-1">📍 {c.lat?.toFixed?.(4) || c.lat}, {c.lng?.toFixed?.(4) || c.lng}</div>
                      <div className="text-[11px] text-[#74777e]">Pop: {c.population || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === "audit" && (
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#001d36]">Audit Logs (Immutable)</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 border border-[#E7DED2] rounded-lg bg-white flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#D98B3A]">{log.action}</span>
                      <span className="text-[#74777e]">{log.details}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-[#74777e]">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : "—"}</span>
                      <span className="bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded text-[10px]">{log.status}</span>
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-xs text-[#74777e] text-center py-4">No audit logs yet.</p>}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-[#001d36]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E7DED2] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E7DED2] pb-3">
              <h3 className="font-bold text-base text-[#001d36] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">person_add</span> Invite User
              </h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-[#74777e] hover:text-[#001d36]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">Email</label>
                <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="user@example.com" className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A] cursor-pointer">
                  <option value="admin1">Relief Coordinator (Admin 1)</option>
                  <option value="admin2">Supply Manager (Admin 2)</option>
                  <option value="incharge">Camp In-charge</option>
                  <option value="logistics">Logistics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#74777e] mb-1">Assign Camp (optional)</label>
                <select value={inviteCampId} onChange={e => setInviteCampId(e.target.value)}
                  className="w-full border border-[#E7DED2] rounded-lg p-2 text-xs focus:border-[#D98B3A] cursor-pointer">
                  <option value="">None</option>
                  {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer">Cancel</button>
                <button type="submit" disabled={inviting}
                  className="px-4 py-2 bg-[#001d36] text-white rounded-lg text-xs font-bold uppercase hover:bg-[#17324d] disabled:opacity-50 cursor-pointer">
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminControlCenter
