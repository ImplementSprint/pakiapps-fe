'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  ChevronDown,
  X,
  User,
  Settings,
  LogOut,
  AlertCircle,
  Clock,
  ShieldCheck,
  Car,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

interface VehicleDoc {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  plate_number: string;
  type: string | null;
  color: string | null;
  or_doc: string | null;
  cr_doc: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
}

type DocFilter = 'all' | 'pending' | 'verified';

export default function DocumentsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const displayName = (user?.name || 'Admin');

  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<DocFilter>('all');
  const [search, setSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDoc | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setIsLoading(true);
    // Use RPC because teller schema is not exposed via PostgREST API directly
    const { data, error } = await supabase.schema('teller').rpc('get_vehicles_with_profiles');

    if (!error && data) {
      setVehicles(data as VehicleDoc[]);
    } else if (error) {
      console.error('Error fetching vehicles:', error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApprove = async (vehicle: VehicleDoc) => {
    setActionLoading(true);
    // Insert doc verification record using the vehicle owner's user_id as profile_id
    await supabase.schema('account').rpc('log_document_verification', {
      p_profile_id: vehicle.user_id,
      p_doc_type: 'or_cr',
      p_file_url: vehicle.or_doc || vehicle.cr_doc || '',
      p_status: 'approved',
      p_reason: null,
      p_reviewed_by: user?.id || null,
    });

    // Set profile as verified using stored user_id
    await supabase.schema('account').rpc('set_profile_verified', { p_profile_id: vehicle.user_id, p_verified: true });

    setActionLoading(false);
    setSelectedVehicle(null);
    triggerSuccess(`${vehicle.plate_number} approved — owner verified.`);
    fetchVehicles();
  };

  const handleReject = async () => {
    if (!selectedVehicle || !rejectReason.trim()) return;
    setActionLoading(true);

    await supabase.schema('account').rpc('log_document_verification', {
      p_profile_id: selectedVehicle.user_id,
      p_doc_type: 'or_cr',
      p_file_url: selectedVehicle.or_doc || selectedVehicle.cr_doc || '',
      p_status: 'rejected',
      p_reason: rejectReason.trim(),
      p_reviewed_by: user?.id || null,
    });

    setActionLoading(false);
    setShowRejectModal(false);
    setSelectedVehicle(null);
    setRejectReason('');
    triggerSuccess(`${selectedVehicle.plate_number} rejected.`);
    fetchVehicles();
  };

  const filtered = vehicles.filter(v => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'verified' ? v.is_verified :
      !v.is_verified;
    const q = search.toLowerCase();
    const matchesSearch = !q || v.plate_number.toLowerCase().includes(q) ||
      v.full_name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a] relative">
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#1e3d5a20;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#ee6b2040}` }} />

      <PakiParkSidebar activeTab="documents" />

      {/* ── Document Viewer Overlay ───────────────────────── */}
      {viewingDocUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingDocUrl(null)} />
          <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-[#1e3d5a]/10 flex-shrink-0">
              <p className="text-sm font-bold text-[#1e3d5a]">Document Viewer</p>
              <div className="flex items-center gap-3">
                <a
                  href={viewingDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#ee6b20] hover:underline flex items-center gap-1"
                >
                  <Eye size={13} /> Open in new tab
                </a>
                <button
                  onClick={() => setViewingDocUrl(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
            {/* Viewer body */}
            <div className="flex-1 overflow-hidden bg-[#f4f7fa]">
              {viewingDocUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <img
                    src={viewingDocUrl}
                    alt="Document"
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={viewingDocUrl}
                  title="Document Viewer"
                  className="w-full h-full border-0"
                  allow="fullscreen"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedVehicle && !showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e3d5a]/40 backdrop-blur-sm" onClick={() => setSelectedVehicle(null)} />
          <Card className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">Vehicle Documents</h3>
                  <p className="text-sm text-gray-400 font-medium mt-0.5">{selectedVehicle.brand} {selectedVehicle.model} — {selectedVehicle.plate_number}</p>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f4f7fa] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mb-1">Owner</p>
                  <p className="font-bold text-[#1e3d5a]">{selectedVehicle.full_name}</p>
                  <p className="text-xs text-gray-400">{selectedVehicle.email}</p>
                </div>
                <div className="bg-[#f4f7fa] rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mb-1">Verification</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${selectedVehicle.is_verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {selectedVehicle.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedVehicle.or_doc && (
                  <div className="border border-[#1e3d5a]/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mb-2">OR Document</p>
                    <button onClick={() => setViewingDocUrl(selectedVehicle.or_doc!)} className="text-sm font-bold text-[#ee6b20] hover:underline flex items-center gap-1"><Eye size={14} /> View Document</button>
                  </div>
                )}
                {selectedVehicle.cr_doc && (
                  <div className="border border-[#1e3d5a]/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mb-2">CR Document</p>
                    <button onClick={() => setViewingDocUrl(selectedVehicle.cr_doc!)} className="text-sm font-bold text-[#ee6b20] hover:underline flex items-center gap-1"><Eye size={14} /> View Document</button>
                  </div>
                )}
              </div>

              {!selectedVehicle.is_verified && (
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setShowRejectModal(true); }} className="rounded-xl border-red-200 text-red-500 hover:bg-red-50">Reject</Button>
                  <Button disabled={actionLoading} onClick={() => handleApprove(selectedVehicle)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white">
                    {actionLoading ? 'Processing...' : 'Approve & Verify'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVehicle && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e3d5a]/50 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <Card className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#1e3d5a]">Reject Document</h3>
                <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
              </div>
              <p className="text-sm text-[#1e3d5a]/60 font-medium mb-4">Provide a rejection reason for <span className="font-bold text-[#1e3d5a]">{selectedVehicle.full_name}</span>.</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Document image is blurry or illegible..." className="w-full min-h-28 rounded-2xl border border-[#1e3d5a]/15 bg-[#f4f7fa] px-4 py-3 outline-none focus:bg-white focus:border-[#ee6b20] transition-all text-sm font-medium resize-none mb-4" />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowRejectModal(false)} className="rounded-xl">Cancel</Button>
                <Button disabled={!rejectReason.trim() || actionLoading} onClick={handleReject} className="rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50">
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-80">
            <Search className="w-4 h-4 text-[#1e3d5a]/60" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plate, owner, brand..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]" />
          </div>
          <div className="flex items-center gap-4">
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /><span className="text-sm font-bold">{successMsg}</span>
              </div>
            )}
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-[#1e3d5a] hidden md:block">{displayName}</span>
                <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"><User className="w-4 h-4 text-[#ee6b20]" /><span className="font-semibold text-[#1e3d5a]">Profile</span></button>
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"><Settings className="w-4 h-4 text-[#ee6b20]" /><span className="font-semibold text-[#1e3d5a]">Settings</span></button>
                  <div className="border-t border-[#1e3d5a]/10" />
                  <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left"><LogOut className="w-4 h-4 text-red-500" /><span className="font-semibold text-red-500">Logout</span></button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-[#1e3d5a] tracking-tight">Document Review</h1>
              <p className="text-[#1e3d5a] opacity-60 font-medium italic mt-1">Review and approve customer vehicle OR/CR documents.</p>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'verified'] as DocFilter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-[#1e3d5a] text-white shadow-lg' : 'bg-white text-[#1e3d5a] border border-[#1e3d5a]/10 hover:bg-[#f4f7fa]'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Total Documents', value: vehicles.length, icon: FileCheck, color: '#1e3d5a' },
              { label: 'Pending Review', value: vehicles.filter(v => !v.is_verified).length, icon: Clock, color: '#f59e0b' },
              { label: 'Verified', value: vehicles.filter(v => v.is_verified).length, icon: ShieldCheck, color: '#10b981' },
            ].map(stat => (
              <Card key={stat.label} className="bg-white rounded-[2rem] border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <stat.icon size={22} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-[#1e3d5a]">{stat.value}</p>
                    <p className="text-xs font-bold text-[#1e3d5a]/50 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-[#f4f7fa]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#f4f7fa] rounded-2xl text-[#ee6b20]"><Car size={22} /></div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#1e3d5a]">Vehicle Documents</CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-400">{filtered.length} records found</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-[#1e3d5a]/20 border-t-[#ee6b20] rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <AlertCircle className="w-10 h-10 text-[#1e3d5a]/20 mx-auto mb-3" />
                  <p className="font-bold text-[#1e3d5a]/50">No documents found</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f4f7fa] border-b border-[#1e3d5a]/5 text-[10px] uppercase font-bold text-[#1e3d5a]/40 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4">Owner</th>
                      <th className="px-8 py-4">Vehicle</th>
                      <th className="px-8 py-4">Plate</th>
                      <th className="px-8 py-4">Documents</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3d5a]/5">
                    {filtered.map(v => (
                      <tr key={v.id} className="hover:bg-[#f4f7fa]/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-sm text-[#1e3d5a]">{v.full_name}</p>
                          <p className="text-xs text-gray-400">{v.email}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-semibold text-[#1e3d5a]">{v.brand} {v.model}</td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold px-2 py-1 bg-[#f4f7fa] border border-[#1e3d5a]/10 rounded-lg text-[#1e3d5a]">{v.plate_number}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2">
                            {v.or_doc && <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">OR</span>}
                            {v.cr_doc && <span className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">CR</span>}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${v.is_verified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${v.is_verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {v.is_verified ? 'Verified' : 'Pending'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setSelectedVehicle(v)} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#1e3d5a] transition-all"><Eye size={16} /></button>
                            {!v.is_verified && (
                              <>
                                <button onClick={() => handleApprove(v)} className="p-2 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-500 transition-all"><CheckCircle2 size={16} /></button>
                                <button onClick={() => { setSelectedVehicle(v); setShowRejectModal(true); }} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"><XCircle size={16} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

