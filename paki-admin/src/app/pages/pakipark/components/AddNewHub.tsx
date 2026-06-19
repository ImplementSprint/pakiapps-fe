import React, { useState } from 'react';
import { X, MapPin, Car, Info, ShieldCheck, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface AddNewHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddNewHub({ isOpen, onClose }: AddNewHubProps) {
  // --- Functional Logic ---
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    facilityName: '',
    district: 'Makati City',
    address: '',
    totalSpots: '',
    hourlyRate: '50',
    nodeId: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);

    // Simulated API call / Deployment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsDeploying(false);
    setIsSuccess(true);

    // Wait a moment to show success before closing
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e3d5a]/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={!isDeploying ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-[#e2e8f0] flex flex-col">
        
        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex items-center justify-between border-b border-[#f1f5f9] shrink-0">
          <div>
            <h2 className="text-3xl font-black text-[#1e3d5a] tracking-tight">
              {isSuccess ? "Hub Deployed!" : "Add New Hub"}
            </h2>
            <p className="text-[#8492a6] font-medium italic mt-1 text-sm">
              {isSuccess ? "The smart node is now active on the network." : "Deploy a new smart parking node in the network."}
            </p>
          </div>
          {!isDeploying && (
            <button 
              onClick={onClose}
              className="p-3 hover:bg-[#f8fafc] rounded-2xl text-[#8492a6] transition-colors border border-[#e2e8f0]"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="contents">
          <div className={`p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar overflow-x-hidden transition-opacity duration-300 ${isDeploying || isSuccess ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <p className="text-[11px] font-black text-[#ee6b20] uppercase tracking-[0.15em] opacity-70 flex items-center gap-2">
                <Info size={14} strokeWidth={3} /> Basic Information
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e3d5a] ml-1">Facility Name</label>
                  <input 
                    required
                    name="facilityName"
                    value={formData.facilityName}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="e.g. Rockwell Power Plant Mall" 
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl px-6 text-sm font-semibold focus:outline-none focus:border-[#1e3d5a] focus:bg-white transition-all text-[#1e3d5a]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e3d5a] ml-1">Location District</label>
                  <div className="relative">
                    <select 
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl px-6 text-sm font-semibold focus:outline-none focus:border-[#1e3d5a] focus:bg-white transition-all appearance-none text-[#1e3d5a] cursor-pointer"
                    >
                      <option>Makati City</option>
                      <option>Taguig (BGC)</option>
                      <option>Pasay City</option>
                      <option>Quezon City</option>
                      <option>Manila</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8492a6] pointer-events-none" size={16} />
                  </div>
                </div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-[#1e3d5a] ml-1">Full Address</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ee6b20]" size={18} />
                  <input 
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="Enter full street address" 
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl pl-14 pr-6 text-sm font-semibold focus:outline-none focus:border-[#1e3d5a] focus:bg-white transition-all text-[#1e3d5a]"
                  />
                </div>
              </div>
            </div>

            {/* Section: Capacity */}
            <div className="space-y-4">
              <p className="text-[11px] font-black text-[#ee6b20] uppercase tracking-[0.15em] opacity-70 flex items-center gap-2">
                <Car size={14} strokeWidth={3} /> Capacity & Nodes
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e3d5a] ml-1">Total Spots</label>
                  <input 
                    required
                    name="totalSpots"
                    value={formData.totalSpots}
                    onChange={handleInputChange}
                    type="number" 
                    placeholder="0" 
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl px-6 text-sm font-semibold focus:outline-none text-[#1e3d5a]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e3d5a] ml-1">Hourly Rate</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1e3d5a] font-bold">₱</span>
                    <input 
                      required
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      type="number" 
                      placeholder="50" 
                      className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl pl-10 pr-6 text-sm font-semibold focus:outline-none text-[#1e3d5a]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#1e3d5a] ml-1">Node ID</label>
                  <input 
                    required
                    name="nodeId"
                    value={formData.nodeId}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="PP-001" 
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] h-14 rounded-2xl px-6 text-sm font-semibold focus:outline-none text-[#1e3d5a]"
                  />
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[30px] flex gap-4">
              <div className="size-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-50">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-900 tracking-tight">Security Check Required</p>
                <p className="text-xs font-bold text-emerald-700/70 mt-0.5 leading-relaxed">
                  All new facilities must be verified by local operations before they go live on the PakiPark user app.
                </p>
              </div>
            </div>
          </div>

          {/* Success/Loading Overlay */}
          {(isDeploying || isSuccess) && (
            <div className="absolute inset-x-0 top-[180px] flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-300">
              {isDeploying ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#1e3d5a]/10 animate-ping" />
                    <Loader2 className="text-[#1e3d5a] animate-spin mb-4" size={60} strokeWidth={1.5} />
                  </div>
                  <p className="text-[#1e3d5a] font-black uppercase tracking-widest text-xs">Initializing Node...</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="text-emerald-500 mb-4" size={60} strokeWidth={1.5} />
                  <p className="text-emerald-600 font-black uppercase tracking-widest text-xs">Deployment Successful</p>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="p-10 pt-6 flex gap-4 shrink-0 border-t border-[#f1f5f9]">
            <Button 
              type="button"
              disabled={isDeploying || isSuccess}
              onClick={onClose}
              variant="ghost" 
              className="flex-1 h-14 rounded-2xl text-[#8492a6] font-bold hover:bg-[#f8fafc] hover:text-[#1e3d5a] disabled:opacity-0"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isDeploying || isSuccess}
              className="flex-[2] bg-[#1e3d5a] hover:bg-[#152a3d] text-white font-black rounded-2xl h-14 shadow-xl shadow-blue-900/20 border-none uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2"
            >
              {isDeploying ? "Deploying..." : isSuccess ? "Done" : "Deploy New Hub"}
            </Button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; margin: 10px 0; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; border: 1px solid #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8492a6; }
      `}} />
    </div>
  );
}