import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { listenCollection } from '../../../services/firestoreService';

export const CampDonations = () => {
  const [donations, setDonations] = useState([]);
  const [needs, setNeeds] = useState([]);

  useEffect(() => {
    const unsubD = listenCollection("donations", setDonations);
    const unsubN = listenCollection("needs", setNeeds);
    return () => { unsubD(); unsubN(); };
  }, []);

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="Public Donations" />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Donations List */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Total Funds Raised</div>
                  <div className="text-3xl font-mono font-bold text-[#001d36]">${totalDonations.toLocaleString()}</div>
                </div>
                <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">volunteer_activism</span>
                </div>
              </div>

              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-[#E7DED2] flex justify-between items-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">receipt_long</span>
                    Recent Donations
                  </h3>
                </div>
                
                <div className="divide-y divide-[#E7DED2]">
                  {donations.map(d => (
                    <div key={d.id} className="p-4 hover:bg-[#F7F3EC]/50 transition-colors flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#E7DED2] rounded-full flex items-center justify-center text-[#74777e] font-bold">
                          {d.donor.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#001d36] text-sm">{d.donor}</div>
                          <div className="text-xs text-[#74777e] flex items-center gap-2">
                            <span>{new Date(d.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{d.source}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg text-green-700">+${d.amount}</div>
                      </div>
                    </div>
                  ))}
                  {donations.length === 0 && (
                    <div className="p-8 text-center text-[#74777e] italic text-sm">No donations recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Public Page Simulation */}
            <div className="lg:col-span-1">
              <div className="bg-white border-4 border-[#E7DED2] rounded-2xl overflow-hidden shadow-lg relative">
                <div className="absolute top-0 right-0 bg-[#001d36] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10">
                  Public View Preview
                </div>
                
                <div className="h-32 bg-[#17324D] relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1547683905-f686c993b45e?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                </div>
                
                <div className="p-6 relative">
                  <div className="w-16 h-16 bg-[#D98B3A] border-4 border-white rounded-xl shadow-md absolute -top-8 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-3xl">home_work</span>
                  </div>
                  
                  <h2 className="mt-8 text-xl font-bold text-[#001d36] leading-tight mb-2">Northridge Evacuation Center</h2>
                  <p className="text-sm text-[#74777e] mb-6 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    Northridge High School
                  </p>
                  
                  <div className="bg-[#F7F3EC] rounded-xl p-4 mb-6">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#001d36] mb-3">Current Critical Needs</h4>
                    <ul className="space-y-2">
                      {needs.map((n, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{n.name}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            n.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                            n.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{n.priority}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="w-full bg-green-600 text-white rounded-lg py-3 font-bold uppercase tracking-wider shadow-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">favorite</span>
                    Donate to this Camp
                  </button>
                  <p className="text-center text-[10px] text-[#74777e] mt-3">100% of funds go directly to verified supply purchases for this location.</p>
                </div>
              </div>
            </div>

          </div>
          
        </main>
      </div>
    </div>
  );
};
