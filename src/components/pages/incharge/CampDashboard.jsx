import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { listenToRequests } from '../../../services/requestService';
import { listenCollection, fetchDoc } from '../../../services/firestoreService';

export const CampDashboard = () => {
  const navigate = useNavigate();
  const campId = "CAMP-001"; // Currently hardcoded for the demo as inchargeMockData was
  
  const [camp, setCamp] = useState(null);
  const [supplies, setSupplies] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch real-time data from static services
    fetchDoc("camps", campId).then(setCamp);
    
    const unsubSupplies = listenCollection("supplies", setSupplies, [{ field: "campId", op: "==", value: campId }]);
    const unsubRequests = listenToRequests(setRequests, { campId });

    return () => {
      unsubSupplies();
      unsubRequests();
    };
  }, []);

  if (!camp) return null;

  // Calculate KPIs
  const totalSupplyItems = supplies.reduce((acc, curr) => acc + curr.qty, 0);
  const lowStockCount = supplies.filter(s => s.status === "Low" || s.status === "Critical").length;
  const pendingRequests = requests.filter(r => r.status === "Accepted" || r.status === "Preparing").length;
  const incomingDeliveries = requests.filter(r => r.status === "Dispatched" || r.status === "In Transit").length;

  const recentRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const activeDeliveries = requests.filter(r => r.status === "Dispatched" || r.status === "In Transit");

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title={`${camp.name} — Dashboard`} />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Supply Units", value: totalSupplyItems, icon: "inventory_2", color: "border-l-blue-500" },
              { label: "Low/Critical Items", value: lowStockCount, icon: "warning", color: "border-l-red-500" },
              { label: "Pending Requests", value: pendingRequests, icon: "hourglass_empty", color: "border-l-orange-500" },
              { label: "Incoming Deliveries", value: incomingDeliveries, icon: "local_shipping", color: "border-l-green-500" },
            ].map((kpi, idx) => (
              <div key={idx} className={`bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-4 shadow-sm ${kpi.color} border-l-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">{kpi.label}</div>
                    <div className="text-2xl font-bold text-[#001d36] font-mono mt-1">{kpi.value}</div>
                  </div>
                  <span className="material-symbols-outlined text-[#D98B3A] opacity-80">{kpi.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Supply Overview */}
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">category</span>
                  Supply Overview
                </h3>
                <button onClick={() => navigate("/incharge/supplies")} className="text-xs font-bold text-[#D98B3A] hover:underline uppercase">View All</button>
              </div>
              <div className="space-y-3">
                {supplies.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 border border-[#E7DED2] rounded-lg bg-[#F7F3EC]/50">
                    <div>
                      <div className="font-bold text-sm text-[#001d36]">{s.name}</div>
                      <div className="text-[10px] text-[#74777e] uppercase tracking-wide">
                        Consumed: {s.consumedRecent} {s.unit} recently
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#001d36]">{s.qty} <span className="text-[10px]">{s.unit}</span></div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        s.status === 'Critical' ? 'bg-red-100 text-red-800' :
                        s.status === 'Low' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              {/* Incoming Deliveries */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600">local_shipping</span>
                    Incoming Deliveries
                  </h3>
                </div>
                <div className="space-y-3">
                  {activeDeliveries.length > 0 ? activeDeliveries.map(r => (
                    <div key={r.id} className="p-3 border border-green-200 rounded-lg bg-green-50/50 cursor-pointer hover:border-green-300 transition-colors" onClick={() => navigate(`/incharge/deliveries/${r.id}`)}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-[#001d36] text-xs">{r.id}</span>
                        <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider bg-green-100 px-2 py-0.5 rounded-full">{r.status}</span>
                      </div>
                      <div className="text-xs text-[#1c1c18] font-medium line-clamp-1 mb-1">
                        {r.qtyRequested} {r.itemKey?.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-[#74777e] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        ETA: {new Date(r.deliveryETA).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-sm text-[#74777e] italic">No active deliveries.</div>
                  )}
                </div>
              </div>

              {/* Recent Requests */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">history</span>
                    Recent Requests
                  </h3>
                  <button onClick={() => navigate("/incharge/request")} className="text-[10px] bg-[#001d36] text-white px-2 py-1 rounded font-bold uppercase hover:bg-[#17324d] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">add</span> New
                  </button>
                </div>
                <div className="space-y-3">
                  {recentRequests.map(r => (
                    <div key={r.id} className="p-3 border border-[#E7DED2] rounded-lg text-sm flex flex-col gap-1 cursor-pointer hover:bg-[#F7F3EC]" onClick={() => navigate(`/incharge/deliveries/${r.id}`)}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-[#001d36] text-xs">{r.id}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.status === 'Delivered' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                        }`}>{r.status}</span>
                      </div>
                      <div className="text-xs text-[#1c1c18] truncate capitalize">
                        {r.itemKey?.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-[#74777e]">
                        Required by: {new Date(r.requiredBy).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};
