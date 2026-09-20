import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../common/Sidebar';
import { Header } from '../../common/Header';

export const CampRequestSupplies = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([{ name: "", qty: "", unit: "Litres" }]);
  const [priority, setPriority] = useState("Medium");
  const [requiredBy, setRequiredBy] = useState("");
  const [instructions, setInstructions] = useState("");
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const addItem = () => {
    setItems([...items, { name: "", qty: "", unit: "Litres" }]);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setShowToast(true);
      
      // Hide toast and redirect after 2s
      setTimeout(() => {
        setShowToast(false);
        navigate("/incharge/dashboard");
      }, 2000);
    }, 1000);
  };

  const commonUnits = ["Litres", "Kg", "Pieces", "Kits", "Boxes", "Units"];
  const commonItems = ["Water", "Rice", "Blankets", "Medicines", "Tents", "First Aid", "Flashlights"];

  return (
    <div className="bg-[#F7F3EC] text-[#1c1c18] font-sans flex h-screen overflow-hidden antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-[260px] min-h-screen relative overflow-hidden">
        <Header title="New Supply Request" />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Requested Items Section */}
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">format_list_bulleted_add</span>
                Requested Items
              </h3>
              
              <div className="space-y-3 mb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-start">
                    <div className="flex-1 min-w-[200px]">
                      <select 
                        required
                        value={item.name} 
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#001d36] font-bold focus:outline-none focus:border-[#D98B3A]"
                      >
                        <option value="" disabled>Select Item...</option>
                        {commonItems.map(ci => <option key={ci} value={ci}>{ci}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        required
                        placeholder="Qty" 
                        value={item.qty} 
                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                        className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-2 text-sm font-mono text-[#001d36] font-bold focus:outline-none focus:border-[#D98B3A]"
                      />
                    </div>
                    <div className="w-32">
                      <select 
                        value={item.unit} 
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#001d36] font-bold focus:outline-none focus:border-[#D98B3A]"
                      >
                        {commonUnits.map(cu => <option key={cu} value={cu}>{cu}</option>)}
                      </select>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <button type="button" onClick={addItem} className="text-xs font-bold text-[#D98B3A] hover:bg-[#F7F3EC] px-3 py-1.5 rounded-lg border border-[#D98B3A] uppercase tracking-wider flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add Another Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority & Deadline */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm space-y-5">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">event_note</span>
                  Priority & Deadline
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-[#74777e] uppercase tracking-wider mb-2">Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#001d36] font-bold focus:outline-none focus:border-[#D98B3A]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-[#74777e] uppercase tracking-wider mb-2">Required By</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={requiredBy} 
                    onChange={(e) => setRequiredBy(e.target.value)}
                    className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#001d36] font-bold focus:outline-none focus:border-[#D98B3A]"
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D98B3A]">add_a_photo</span>
                  Area / Situation Photos
                </h3>
                
                <div className="border-2 border-dashed border-[#E7DED2] bg-[#F7F3EC] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#D98B3A] transition-colors">
                  <span className="material-symbols-outlined text-[#74777e] text-3xl mb-2">cloud_upload</span>
                  <span className="text-sm font-bold text-[#001d36]">Click to upload photos</span>
                  <span className="text-[10px] text-[#74777e] mt-1">JPEG, PNG (Max 5MB)</span>
                </div>
                {/* Mock photo preview */}
                {photos.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {/* Placeholder for uploaded photos */}
                  </div>
                )}
              </div>
            </div>

            {/* Situation Instructions */}
            <div className="bg-[#FFFDF9] border border-[#E7DED2] rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#001d36] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#D98B3A]">info</span>
                Situation / Delivery Instructions
              </h3>
              <textarea 
                required
                rows="4"
                placeholder="Explain the physical situation around the camp. E.g., 'The main road is flooded. Approach from the eastern road and unload near the school building.'"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full bg-[#F7F3EC] border border-[#E7DED2] rounded-lg px-4 py-3 text-sm text-[#001d36] focus:outline-none focus:border-[#D98B3A] resize-none"
              ></textarea>
            </div>
            
            {/* Submit */}
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#001d36] text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#17324d] shadow-md flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined">{isSubmitting ? 'hourglass_empty' : 'send'}</span>
                {isSubmitting ? 'Submitting...' : 'Submit Supply Request'}
              </button>
            </div>
          </form>

        </main>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-[#001d36] text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in z-50">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <div>
            <div className="font-bold text-sm">Request Submitted</div>
            <div className="text-[10px] text-white/70">Request ID: REQ-{Math.floor(Math.random() * 9000) + 1000} created successfully.</div>
          </div>
        </div>
      )}
    </div>
  );
};
