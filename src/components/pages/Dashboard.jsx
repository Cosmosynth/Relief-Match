import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { Header } from '../common/Header'
import { ReliefMap } from '../common/DisasterMap'
import { useAuth } from '../../context/AuthContext'
import { KPI_CONFIG, ROLE_CTA, MAP_LAYERS, DASHBOARD_FILTERS, DASHBOARD_PANELS } from '../../services/adminService'
import { listenToRequests } from '../../services/requestService'
import { listenToSupplies } from '../../services/supplyService'
import { listenToMatches, listenToShipments } from '../../services/matchService'
import { listenToCamps } from '../../services/campService'
import { listenToActivity } from '../../services/activityService'
import { executeMatching } from '../../services/matchingEngine'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { userRole, userCampId, currentUser } = useAuth()

  const [selectedItem, setSelectedItem] = useState("All")
  const [selectedCamp, setSelectedCamp] = useState("All")
  const [selectedUrgency, setSelectedUrgency] = useState("All")

  const [requests, setRequests] = useState([])
  const [supplies, setSupplies] = useState([])
  const [matches, setMatches] = useState([])
  const [shipments, setShipments] = useState([])
  const [camps, setCamps] = useState([])
  const [activity, setActivity] = useState([])
  const [runningMatch, setRunningMatch] = useState(false)

  useEffect(() => {
    const filters = {}
    if (userRole === "incharge" && userCampId) filters.campId = userCampId
    
    const unsubs = [
      listenToRequests(setRequests, filters),
      listenToSupplies(setSupplies),
      listenToMatches(setMatches, userRole === "incharge" && userCampId ? { campId: userCampId } : {}),
      listenToShipments(setShipments, userRole === "logistics" ? { driverUid: currentUser?.uid } : {}),
      listenToCamps(setCamps),
      listenToActivity(setActivity, 20),
    ]
    return () => unsubs.forEach(u => u())
  }, [userRole, userCampId, currentUser?.uid])

  // ─── Compute KPIs ───
  const now = new Date()
  const today = now.toDateString()

  const computeKpi = (key) => {
    switch (key) {
      // Admin1 KPIs
      case "openRequests": return requests.filter(r => !["fulfilled", "rejected", "cancelled", "delivered"].includes(r.status)).length
      case "unmatched": return requests.filter(r => ["submitted", "verified", "unmatched"].includes(r.status)).length
      case "deliveredToday": return shipments.filter(s => s.status === "delivered" || s.status === "confirmed").length
      case "urgentShortages": return requests.filter(r => r.urgency === "critical" && ["submitted", "verified", "unmatched"].includes(r.status)).length
      // Admin2 KPIs
      case "pendingRequests": return requests.filter(r => r.status === "submitted").length
      case "criticalShortages": return requests.filter(r => r.urgency === "critical" && ["submitted", "verified", "unmatched"].includes(r.status)).length
      case "ordersPreparing": return requests.filter(r => r.status === "preparing" || r.status === "ready_for_pickup").length
      case "inTransitDelivered": return requests.filter(r => r.status === "in_transit" || r.status === "delivered").length
      // Incharge KPIs
      case "myOpenRequests": return requests.filter(r => !["fulfilled", "rejected", "cancelled", "delivered"].includes(r.status)).length
      case "awaitingMatch": return requests.filter(r => ["verified", "unmatched"].includes(r.status)).length
      case "delivered": return requests.filter(r => r.status === "delivered" || r.status === "fulfilled").length
      case "urgentDelayed": return requests.filter(r => r.urgency === "critical" || r.urgency === "high").length
      // Logistics KPIs
      case "assignedTrips": return shipments.filter(s => s.status === "assigned").length
      case "pickupsPending": return shipments.filter(s => s.status === "assigned").length
      case "delayed": return shipments.filter(s => s.status === "assigned").length // simplified
      default: return 0
    }
  }

  const kpis = (KPI_CONFIG[userRole] || KPI_CONFIG.admin1).map(k => ({
    ...k,
    value: computeKpi(k.key),
  }))

  const cta = ROLE_CTA[userRole] || ROLE_CTA.admin1

  const handleCta = async () => {
    switch (cta.action) {
      case "runMatching":
        setRunningMatch(true)
        try {
          const result = await executeMatching(currentUser?.uid)
          alert(`Matching complete: ${result.matchCount} matches from ${result.requestCount} requests`)
        } catch (e) {
          console.error("Matching error:", e)
          alert("Matching failed: " + e.message)
        } finally {
          setRunningMatch(false)
        }
        break
      case "navigateSupply": navigate("/admin/supply"); break
      case "newRequest": navigate("/admin/requests"); break
      case "myTrips": navigate("/admin/matches"); break
    }
  }

  // Enrich camps with urgency level for map
  const enrichedCamps = camps.map(c => {
    const campRequests = requests.filter(r => r.campId === c.id)
    const urgentUnmet = campRequests.some(r => r.urgency === "critical" && ["submitted", "verified", "unmatched"].includes(r.status))
    const partialMet = campRequests.some(r => r.status === "partially_matched")
    return {
      ...c,
      urgencyLevel: urgentUnmet ? "urgent" : partialMet ? "partial" : "met",
    }
  })

  // ─── Role-filtered map data ───
  const showLayers = MAP_LAYERS[userRole] || MAP_LAYERS.admin1
  const filterCfg = DASHBOARD_FILTERS[userRole] || DASHBOARD_FILTERS.admin1
  const panelCfg = DASHBOARD_PANELS[userRole] || DASHBOARD_PANELS.admin1

  const mapCamps = (() => {
    if (userRole === "incharge" && userCampId) return enrichedCamps.filter(c => c.id === userCampId)
    if (userRole === "admin2") return enrichedCamps.filter(c => c.urgencyLevel === "urgent" || c.urgencyLevel === "partial")
    if (userRole === "logistics") return []
    return enrichedCamps // admin1
  })()

  const mapSupplies = (() => {
    if (userRole === "incharge" && userCampId) {
      const matchedSupplyIds = new Set(matches.map(m => m.supplyId))
      return supplies.filter(s => matchedSupplyIds.has(s.id))
    }
    if (userRole === "logistics") return []
    return supplies // admin1, admin2
  })()

  const mapShipments = (() => {
    if (userRole === "incharge" && userCampId) return shipments.filter(s => s.campId === userCampId)
    if (userRole === "admin2") return []
    if (userRole === "logistics") return shipments // already filtered by driverUid in listener
    return shipments // admin1
  })()

  const mapMatches = (() => {
    if (userRole === "logistics") {
      const shipMatchIds = new Set(shipments.flatMap(s => s.matchIds || []))
      return matches.filter(m => shipMatchIds.has(m.id))
    }
    return matches
  })()

  // Urgent shortages list
  const urgentShortages = requests
    .filter(r => r.urgency === "critical" && ["submitted", "verified", "unmatched", "partially_matched"].includes(r.status))
    .slice(0, 8)

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Command Center" />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {filterCfg.item && (
                <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                  <span className="material-symbols-outlined text-[#74777e] text-sm">filter_list</span>
                  <span>Item:</span>
                  <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}
                    className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer">
                    <option value="All">All Items</option>
                    <option value="water">Water</option>
                    <option value="food">Food</option>
                    <option value="medicine">Medicine</option>
                    <option value="blankets">Blankets</option>
                    <option value="tents">Tents</option>
                  </select>
                </div>
              )}

              {filterCfg.camp && (
                <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                  <span className="material-symbols-outlined text-[#74777e] text-sm">location_on</span>
                  <span>Camp:</span>
                  <select value={selectedCamp} onChange={(e) => setSelectedCamp(e.target.value)}
                    className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer">
                    <option value="All">All Camps</option>
                    {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {filterCfg.urgency && (
                <div className="flex items-center gap-2 bg-[#FFFDF9] border border-[#E7DED2] rounded-lg px-3 py-1.5 shadow-sm text-xs font-semibold text-[#1c1c18]">
                  <span className="material-symbols-outlined text-[#74777e] text-sm">priority_high</span>
                  <span>Urgency:</span>
                  <select value={selectedUrgency} onChange={(e) => setSelectedUrgency(e.target.value)}
                    className="bg-transparent border-none font-bold text-[#001d36] focus:outline-none cursor-pointer">
                    <option value="All">All Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleCta}
              disabled={runningMatch}
              className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#17324d] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">{cta.icon}</span>
              {runningMatch ? "Running..." : cta.label}
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={kpi.key} className={`bg-[#FFFDF9] border border-[#E7DED2] ${i > 0 ? `border-l-4 ${kpi.borderColor}` : ''} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex justify-between items-center text-[#74777e] text-xs font-semibold uppercase tracking-wider">
                  <span>{kpi.label}</span>
                  <span className="material-symbols-outlined text-[#001d36]">{kpi.icon}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${kpi.key === "urgentShortages" || kpi.key === "urgentDelayed" ? "text-red-600" : "text-[#001d36]"}`}>
                    {kpi.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid: Map + Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
            {/* Map */}
            <div className="lg:col-span-8 bg-[#FFFDF9] border border-[#E7DED2] rounded-xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[#E7DED2] flex justify-between items-center bg-[#F1ECE4]">
                <h2 className="font-bold text-[#001d36] text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">public</span>
                  Relief Operations Map
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold bg-white border border-[#E7DED2] px-2 py-0.5 rounded text-[#001d36]">
                    LIVE &bull; {camps.length} CAMPS &bull; {supplies.length} SUPPLY
                  </span>
                </div>
              </div>
              <div className="flex-1 relative bg-[#121d27] p-2 flex flex-col justify-center">
                <ReliefMap
                  camps={mapCamps}
                  supplies={mapSupplies}
                  shipments={mapShipments}
                  matches={mapMatches}
                  height="440px"
                  showLayers={showLayers}
                  onSelectCamp={(c) => navigate("/admin/requests")}
                />
              </div>
            </div>

            {/* Right Panels */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* Urgent Shortages */}
              {panelCfg.urgentShortages && (
                <div className="bg-[#FFFDF9] border border-red-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-red-100">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-red-600">campaign</span>
                      Urgent Shortages
                    </h3>
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{urgentShortages.length}</span>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {urgentShortages.length > 0 ? urgentShortages.map((r) => (
                      <div key={r.id} className="p-2 border border-red-100 rounded-lg bg-red-50/50 text-xs cursor-pointer hover:border-red-300 transition-colors" onClick={() => navigate("/admin/requests")}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#001d36]">{r.itemKey}</span>
                          <span className="text-red-700 font-mono font-bold">×{r.qtyRequested - (r.qtyMatched || 0)}</span>
                        </div>
                        <div className="text-[10px] text-[#74777e] mt-0.5">{r.campName || r.campId}</div>
                      </div>
                    )) : (
                      <p className="text-xs text-[#74777e] text-center py-4">No urgent shortages</p>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Feed */}
              {panelCfg.activity && (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 flex-1 flex flex-col shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED2]">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#001d36]">Activity & Alerts</h3>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
                    {activity.length > 0 ? activity.map((a) => {
                      const severityColors = {
                        success: "border-l-green-500",
                        warning: "border-l-amber-500",
                        error: "border-l-red-500",
                        info: "border-l-blue-500",
                      }
                      return (
                        <div key={a.id} className={`p-2 border border-[#E7DED2] border-l-4 ${severityColors[a.severity] || "border-l-blue-500"} rounded-lg bg-white text-xs`}>
                          <p className="font-medium text-[#001d36]">{a.message}</p>
                          <p className="text-[10px] text-[#74777e] mt-0.5">
                            {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleTimeString() : "Just now"}
                          </p>
                        </div>
                      )
                    }) : (
                      <p className="text-xs text-[#74777e] text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Row (admin1 only) */}
              {panelCfg.stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-3 shadow-sm text-center">
                    <div className="text-[10px] text-[#74777e] uppercase font-bold tracking-wider">Fulfillment Rate</div>
                    <div className="text-lg font-bold text-[#001d36] font-mono mt-1">
                      {requests.length > 0 ? Math.round(requests.filter(r => r.status === "fulfilled" || r.status === "delivered").length / requests.length * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-3 shadow-sm text-center">
                    <div className="text-[10px] text-[#74777e] uppercase font-bold tracking-wider">Avg Delivery</div>
                    <div className="text-lg font-bold text-[#001d36] font-mono mt-1">~4.2h</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
export default Dashboard
