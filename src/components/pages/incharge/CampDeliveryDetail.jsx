import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';
import { getMockData, mockCamp } from '../../../services/inchargeMockData';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Create custom icons
const createIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
             <span class="material-symbols-outlined" style="font-size: 16px;">${icon}</span>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const truckIcon = createIcon('#ea580c', 'local_shipping');
const campIcon = createIcon('#0284c7', 'home_work');
const sourceIcon = createIcon('#16a34a', 'inventory_2');

export const CampDeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(getMockData());
  }, []);

  if (!data) return null;

  const request = data.requests.find(r => r.id === id);

  if (!request) {
    return (
      <div className="bg-[#F7F3EC] flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 lg:ml-[260px] flex items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-6xl text-[#74777e]">error</span>
          <h2 className="text-xl font-bold text-[#001d36]">Request not found</h2>
          <button onClick={() => navigate("/incharge/deliveries")} className="text-[#D98B3A] font-bold hover:underline">Return to Deliveries</button>
        </div>
      </div>
    );
  }

  const stages = [
    { label: "Submitted", status: ["Pending", "Accepted", "Preparing", "Dispatched", "In Transit", "Delivered"] },
    { label: "Accepted", status: ["Accepted", "Preparing", "Dispatched", "In Transit", "Delivered"] },
    { label: "Preparing", status: ["Preparing", "Dispatched", "In Transit", "Delivered"] },
    { label: "Dispatched", status: ["Dispatched", "In Transit", "Delivered"] },
    { label: "In Transit", status: ["In Transit", "Delivered"] },
    { label: "Delivered", status: ["Delivered"] },
  ];

  const currentStageIndex = stages.findIndex(s => s.label === request.status) > -1 
    ? stages.findIndex(s => s.label === request.status) 
    : stages.findIndex(s => s.status.includes(request.status)); // Fallback

  const showMap = request.status === "In Transit" || request.status === "Dispatched";
  
  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title={`Delivery Detail - ${request.id}`} />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
          
          <button onClick={() => navigate("/incharge/deliveries")} className="mb-6 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#74777e] hover:text-[#001d36] transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Deliveries
          </button>

          {/* Progress Tracker */}
          <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm mb-6 overflow-x-auto">
            <div className="flex justify-between items-center min-w-[600px] px-4 relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#E7DED2] -translate-y-1/2 z-0"></div>
              <div className="absolute top-1/2 left-8 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500" 
                   style={{ width: `calc(${(currentStageIndex / (stages.length - 1)) * 100}% - 3rem)` }}></div>
              
              {stages.map((stage, idx) => {
                const isCompleted = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2 w-24">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${
                      isCompleted ? 'bg-green-500 border-white text-white shadow-md' : 'bg-[#E7DED2] border-white text-transparent'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                      {isCompleted && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${
                      isCompleted ? 'text-[#001d36]' : 'text-[#74777e]'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Request Details */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-4 border-b border-[#E7DED2] pb-2">
                  Request Summary
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Requested Items</div>
                    <ul className="space-y-2">
                      {request.items.map((i, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm border border-[#E7DED2] rounded p-2 bg-[#F7F3EC]/50">
                          <span className="font-medium text-[#001d36]">{i.name}</span>
                          <span className="font-mono font-bold text-[#D98B3A]">{i.qty} <span className="text-[10px]">{i.unit}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Required By</div>
                      <div className="text-sm font-bold text-[#001d36]">{new Date(request.requiredBy).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Priority</div>
                      <div className={`text-sm font-bold ${request.priority === 'Critical' ? 'text-red-600' : 'text-[#001d36]'}`}>{request.priority}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider mb-1">Delivery Instructions</div>
                    <p className="text-sm text-[#1c1c18] bg-[#F7F3EC]/50 p-3 rounded border border-[#E7DED2] italic">
                      "{request.instructions}"
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Placeholder for Receiving */}
              {(request.status === "In Transit" || request.status === "Delivered") && (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm text-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-4 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[#D98B3A]">qr_code_scanner</span>
                    Delivery Confirmation
                  </h3>
                  
                  {request.status === "Delivered" ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 font-bold text-sm flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                      Delivery Confirmed
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-32 h-32 bg-[#E7DED2] border-2 border-dashed border-[#74777e] flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-[#74777e]">qr_code</span>
                      </div>
                      <p className="text-xs text-[#74777e]">Have the logistics driver scan this QR code to confirm physical delivery.</p>
                      <button className="bg-[#001d36] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider w-full hover:bg-[#17324d] transition-colors">
                        Show Full QR
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tracking Map & Driver Info */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              
              {showMap && request.route && (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-1 shadow-sm flex-1 min-h-[400px] relative overflow-hidden flex flex-col">
                  <div className="px-5 py-3 border-b border-[#E7DED2] flex justify-between items-center bg-white z-10">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-600">navigation</span>
                      Live Tracking
                    </h3>
                    {request.deliveryETA && (
                      <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        ETA: {new Date(request.deliveryETA).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-[#E7DED2] relative z-0">
                    <MapContainer 
                      center={[request.driverLocation.lat, request.driverLocation.lng]} 
                      zoom={11} 
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Polyline 
                        positions={[
                          [request.route.pickup.lat, request.route.pickup.lng],
                          [request.route.dest.lat, request.route.dest.lng]
                        ]} 
                        pathOptions={{ color: '#0284c7', weight: 3, dashArray: "5, 10" }} 
                      />
                      <Marker position={[request.route.pickup.lat, request.route.pickup.lng]} icon={sourceIcon}>
                        <Popup>Source Location</Popup>
                      </Marker>
                      <Marker position={[request.route.dest.lat, request.route.dest.lng]} icon={campIcon}>
                        <Popup>Destination: {mockCamp.name}</Popup>
                      </Marker>
                      <Marker position={[request.driverLocation.lat, request.driverLocation.lng]} icon={truckIcon}>
                        <Popup>Logistics Vehicle<br/>{request.driver?.vehicle}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}
              
              {!showMap && (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center text-[#74777e]">
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">map</span>
                  <p className="font-bold text-[#001d36] mb-1">Tracking Map Unavailable</p>
                  <p className="text-sm">Map tracking is only available when the request is dispatched or in transit.</p>
                </div>
              )}

              {request.driver && (
                <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#001d36] text-[#D98B3A] rounded-full flex items-center justify-center text-xl font-bold">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <div className="font-bold text-[#001d36]">{request.driver.name}</div>
                      <div className="text-xs text-[#74777e]">{request.driver.vehicle}</div>
                    </div>
                  </div>
                  <button className="bg-[#F7F3EC] border border-[#E7DED2] text-[#001d36] hover:bg-[#E7DED2] p-3 rounded-full transition-colors flex items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined">call</span>
                  </button>
                </div>
              )}

            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};
