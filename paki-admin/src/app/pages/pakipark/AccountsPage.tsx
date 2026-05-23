'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import {
  UserPlus,
  Users,
  Search,
  ChevronDown,
  X,
  User,
  Settings,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  HardHat,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

interface StaffAccount {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  location_id: string | null;
  location_name: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

// Only show teller and business_partner roles
const TELLER_ROLES = ['teller'];
const PARTNER_ROLES = ['business_partner'];
const ALL_STAFF_ROLES = ['teller', 'business_partner'];

const getRoleLabel = (role: string) => {
  if (role === 'teller') return 'Teller';
  if (role === 'business_partner') return 'Business Partner';
  return role;
};

const isPartnerRole = (role: string) => role === 'business_partner';

type RoleFilter = 'all' | 'partner' | 'teller';

export default function AccountsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || 'Admin';

  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<StaffAccount | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [newAccount, setNewAccount] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'teller' as string,
    location_id: '',
  });
  const [assignLocationId, setAssignLocationId] = useState('');

  const fetchAccounts = async () => {
    setIsLoading(true);
    // Use RPC because account/parking_lot schemas are not exposed via PostgREST API directly
    const { data, error } = await supabase.schema('account').rpc('get_staff_accounts');

    if (!error && data) {
      setAccounts(data as StaffAccount[]);
    } else if (error) {
      console.error('Error fetching accounts:', error.message);
    }
    setIsLoading(false);
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase.schema('parking_lot').rpc('get_parking_locations');
    if (!error && data) setLocations(data as Location[]);
    else if (error) console.error('Error fetching locations:', error.message);
  };

  useEffect(() => {
    fetchAccounts();
    fetchLocations();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = async () => {
    if (!newAccount.full_name || !newAccount.email || !newAccount.password) return;
    setActionLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccount.full_name,
          email: newAccount.email,
          password: newAccount.password,
          phone: newAccount.phone || null,
          role: newAccount.role,
          location_id: newAccount.location_id || null,
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create account');
      }

      setActionLoading(false);
      setShowCreateModal(false);
      setNewAccount({ full_name: '', email: '', phone: '', password: '', role: 'teller', location_id: '' });
      triggerSuccess(`${newAccount.full_name} account created successfully.`);
      fetchAccounts();

    } catch (err: any) {
      console.error('Account create error:', err.message);
      setActionLoading(false);
      triggerSuccess(`Error: ${err.message}`);
    }
  };

  const handleAssignLocation = async () => {
    if (!selectedAccount || !assignLocationId) return;
    setActionLoading(true);

    const { error } = await supabase.schema('account').rpc('assign_staff_location', {
      p_profile_id: selectedAccount.id,
      p_location_id: assignLocationId,
      p_role: selectedAccount.role,
    });

    if (error) console.error('Assign location error:', error.message);

    setActionLoading(false);
    setShowAssignModal(false);
    setSelectedAccount(null);
    setAssignLocationId('');
    triggerSuccess('Location assigned successfully.');
    fetchAccounts();
  };

  const handleToggleStatus = async (account: StaffAccount) => {
    const newStatus = !account.is_verified;
    const { error } = await supabase.schema('account').rpc('set_profile_verified', {
      p_profile_id: account.id,
      p_verified: newStatus,
    });
    if (error) console.error('Toggle status error:', error.message);
    triggerSuccess(`${account.full_name} is now ${newStatus ? 'Active' : 'Inactive'}.`);
    fetchAccounts();
  };

  const filtered = accounts.filter(a => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'partner' ? isPartnerRole(a.role) :
      TELLER_ROLES.includes(a.role);
    const q = search.toLowerCase();
    const matchesSearch = !q || a.full_name.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a] relative">
      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:#1e3d5a20;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:#ee6b2040}` }} />

      <PakiParkSidebar activeTab="accounts" />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e3d5a]/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <Card className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1e3d5a]">Create Account</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Juan Dela Cruz' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'juan@pakipark.ph' },
                  { label: 'Phone Number', key: 'phone', type: 'text', placeholder: '09XX XXX XXXX' },
                  { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest ml-1">{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder} value={(newAccount as any)[field.key]} onChange={e => setNewAccount({ ...newAccount, [field.key]: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold text-sm" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest ml-1">Role</label>
                  <select value={newAccount.role} onChange={e => setNewAccount({ ...newAccount, role: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold text-sm appearance-none">
                    <option value="teller">Teller</option>
                    <option value="business_partner">Business Partner</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest ml-1">Assign Location (optional)</label>
                  <select value={newAccount.location_id} onChange={e => setNewAccount({ ...newAccount, location_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold text-sm appearance-none">
                    <option value="">— No Location —</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <Button disabled={!newAccount.full_name || !newAccount.email || !newAccount.password || actionLoading} onClick={handleCreate} className="w-full bg-[#ee6b20] hover:bg-[#ff7a2e] text-white rounded-xl py-6 font-bold mt-2 uppercase text-[10px] tracking-widest shadow-lg disabled:opacity-50">
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Location Modal */}
      {showAssignModal && selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e3d5a]/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
          <Card className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#1e3d5a]">Assign Location</h3>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
              </div>
              <p className="text-sm text-[#1e3d5a]/60 font-medium mb-4">Assigning a parking lot to <span className="font-bold text-[#1e3d5a]">{selectedAccount.full_name}</span>.</p>
              <select value={assignLocationId} onChange={e => setAssignLocationId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold text-sm appearance-none mb-4">
                <option value="">— Select Location —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <Button disabled={!assignLocationId || actionLoading} onClick={handleAssignLocation} className="w-full bg-[#1e3d5a] hover:bg-[#2a5373] text-white rounded-xl py-4 font-bold uppercase text-[10px] tracking-widest disabled:opacity-50">
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-80">
            <Search className="w-4 h-4 text-[#1e3d5a]/60" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]" />
          </div>
          <div className="flex items-center gap-4">
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /><span className="text-sm font-bold">{successMsg}</span>
              </div>
            )}
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">{displayName.charAt(0).toUpperCase()}</div>
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
              <h1 className="text-4xl font-black text-[#1e3d5a] tracking-tight">Account Management</h1>
              <p className="text-[#1e3d5a] opacity-60 font-medium italic mt-1">Create and manage teller and business partner accounts.</p>
            </div>
            <div className="flex items-center gap-3">
              {(['all', 'teller', 'partner'] as RoleFilter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-[#1e3d5a] text-white shadow-lg' : 'bg-white text-[#1e3d5a] border border-[#1e3d5a]/10 hover:bg-[#f4f7fa]'}`}>{f}</button>
              ))}
              <Button onClick={() => setShowCreateModal(true)} className="bg-[#ee6b20] hover:bg-[#ff7a2e] text-white rounded-xl font-bold h-10 px-5 shadow-lg">
                <UserPlus className="w-4 h-4 mr-2" /> New Account
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Total Staff', value: accounts.length, icon: Users, color: '#1e3d5a' },
              { label: 'Tellers', value: accounts.filter(a => TELLER_ROLES.includes(a.role)).length, icon: HardHat, color: '#ee6b20' },
              { label: 'Business Partners', value: accounts.filter(a => isPartnerRole(a.role)).length, icon: Briefcase, color: '#8b5cf6' },
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
                <div className="p-3 bg-[#f4f7fa] rounded-2xl text-[#ee6b20]"><Users size={22} /></div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#1e3d5a]">Staff Accounts</CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-400">{filtered.length} accounts</CardDescription>
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
                  <p className="font-bold text-[#1e3d5a]/50">No accounts found</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f4f7fa] border-b border-[#1e3d5a]/5 text-[10px] uppercase font-bold text-[#1e3d5a]/40 sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4">Staff</th>
                      <th className="px-8 py-4">Role</th>
                      <th className="px-8 py-4">Assigned Location</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e3d5a]/5">
                    {filtered.map(a => (
                      <tr key={a.id} className="hover:bg-[#f4f7fa]/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-sm text-[#1e3d5a]">{a.full_name}</p>
                          <p className="text-xs text-gray-400">{a.email}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider border ${
                            isPartnerRole(a.role)
                              ? 'border-purple-200 text-purple-600 bg-purple-50'
                              : 'border-[#ee6b20]/30 text-[#ee6b20] bg-orange-50'
                          }`}>
                            {getRoleLabel(a.role)}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {a.location_name ? (
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3d5a]">
                              <MapPin size={13} className="text-[#ee6b20]" />{a.location_name}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">— Not assigned</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className={`flex items-center gap-1.5 text-xs font-bold ${a.is_verified ? 'text-emerald-500' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${a.is_verified ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {a.is_verified ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setSelectedAccount(a); setAssignLocationId(a.location_id || ''); setShowAssignModal(true); }}
                              className="p-2 hover:bg-[#f4f7fa] rounded-lg text-gray-400 hover:text-[#1e3d5a] transition-all"
                              title="Assign Location"
                            >
                              <MapPin size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(a)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                a.is_verified
                                  ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                                  : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                              title={a.is_verified ? 'Deactivate account' : 'Activate account'}
                            >
                              {a.is_verified
                                ? <><ToggleRight size={14} /> Deactivate</>
                                : <><ToggleLeft size={14} /> Activate</>}
                            </button>
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

