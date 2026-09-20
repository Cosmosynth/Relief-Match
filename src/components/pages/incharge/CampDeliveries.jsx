import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { listenToRequests } from '../../../services/requestService';

export const CampDeliveries = () => {
  const navigate = useNavigate();
  const campId = "CAMP-001"; // Hardcoded for demo
  
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const unsub = listenToRequests(setRequests, { campId });
    return () => unsub();
  }, []);

  const filters = ["All", "submitted", "verified", "in_transit", "delivered", "rejected"];

  const filteredRequests = activeFilter === "All" 
    ? requests 
    : requests.filter(r => r.status === activeFilter);

  // Helper for status colors
  const getStatusStyle = (status) => {
    switch(status) {
      case "submitted": return "bg-gray-100 text-gray-800 border-gray-200";
      case "verified": return "bg-blue-100 text-blue-800 border-blue-200";
      case "matched": return "bg-purple-100 text-purple-800 border-purple-200";
      case "in_transit": return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Deliveries & Requests" />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                  activeFilter === f 
                    ? "bg-[#001d36] text-white border-[#001d36]" 
                    : "bg-[#FFFDF9] text-[#74777e] border-[#E7DED2] hover:bg-[#F7F3EC] hover:text-[#001d36]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Request Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map(r => (
              <div key={r.id} className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">Request ID</div>
                    <div className="font-mono font-bold text-[#001d36] text-lg">{r.id}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusStyle(r.status)}`}>
                    {r.status}
                  </span>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Requested Item</div>
                    <div className="text-sm font-medium text-[#1c1c18] flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1">
                          <span className="font-mono text-[#D98B3A]">{r.qtyRequested}</span>
                          <span className="capitalize">{r.itemKey?.replace(/_/g, " ")}</span>
                        </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs border-t border-[#E7DED2] pt-4 mt-4">
                    <div>
                      <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">Required By</div>
                      <div className="font-medium text-[#001d36]">{new Date(r.requiredBy).toLocaleDateString()}</div>
                    </div>
                    {r.priority === "Critical" && (
                      <div className="flex items-center gap-1 text-red-600 font-bold uppercase tracking-wider text-[10px] bg-red-50 px-2 py-1 rounded">
                        <span className="material-symbols-outlined text-[14px]">warning</span> Critical
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/incharge/deliveries/${r.id}`)}
                  className="mt-6 w-full bg-[#F7F3EC] text-[#001d36] border border-[#E7DED2] rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#E7DED2] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  View Tracking
                </button>
              </div>
            ))}
            
            {filteredRequests.length === 0 && (
              <div className="col-span-full py-12 text-center text-[#74777e]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span>
                <p className="font-medium">No requests found matching this filter.</p>
              </div>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
};
