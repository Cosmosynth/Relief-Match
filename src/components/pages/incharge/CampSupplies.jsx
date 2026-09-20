import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { getMockData } from '../../../services/inchargeMockData';

export const CampSupplies = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getMockData());
  }, []);

  if (!data) return null;

  const { supplies } = data;

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Camp Supplies Inventory" />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Consumption Visualization (CSS Bar Chart) */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D98B3A]">bar_chart</span>
              Recent Consumption Trends
            </h3>
            <div className="space-y-4">
              {supplies.map(s => {
                // Mock a trend percentage for visual purposes
                const percentage = Math.min(100, Math.max(5, (s.consumedRecent / (s.qty + s.consumedRecent)) * 100));
                return (
                  <div key={`chart-${s.id}`}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-[#001d36]">{s.name}</span>
                      <span className="text-[#74777e]">{s.consumedRecent} {s.unit} consumed</span>
                    </div>
                    <div className="h-2 w-full bg-[#E7DED2] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${percentage > 50 ? 'bg-red-500' : percentage > 25 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Inventory Table */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E7DED2]">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">inventory</span>
                Detailed Inventory
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F3EC] text-[10px] uppercase font-bold text-[#74777e] tracking-wider border-b border-[#E7DED2]">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Available Qty</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Recently Consumed</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DED2]">
                  {supplies.map(s => (
                    <tr key={s.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#001d36]">{s.name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-lg">{s.qty}</td>
                      <td className="px-6 py-4 text-[#74777e]">{s.unit}</td>
                      <td className="px-6 py-4 font-mono text-[#001d36]">{s.consumedRecent}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          s.status === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                          s.status === 'Low' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};
