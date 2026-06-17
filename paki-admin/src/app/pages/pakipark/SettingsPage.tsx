import { useState, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Settings,
  LogOut,
  User,
  Search,
  ChevronDown,
  CheckCircle2,
  Users,
  UserCheck,
  X,
  UserPlus,
  Edit3,
  UserMinus,
  LockKeyhole,
} from 'lucide-react';
import { Card, CardTitle, CardContent, CardHeader, CardDescription } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { NotificationMenuButton } from '../../components/settings/NotificationMenuButton';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import { NotificationPreferencesPanel } from '../../components/settings/NotificationPreferencesPanel';
import { TwoFactorAuthPanel } from '../../components/settings/TwoFactorAuthPanel';

interface UserRecord {
  email: string;
  id: number;
  name: string;
  role: string;
  status: 'Active' | 'Inactive';
}

interface EditableUser {
  email: string;
  name: string;
  role: string;
}

type SettingsTab = 'team' | 'requests' | 'security';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface AdminRequestRecord {
  email: string;
  id: string;
  name: string;
  rejectedReason?: string;
  requestDate: string;
  requestedRole: string;
  status: RequestStatus;
}

const INITIAL_ADMIN_REQUESTS: AdminRequestRecord[] = [
  {
    id: 'REQ-301',
    name: 'Nicole Ramos',
    email: 'nicole.ramos@pakiadmin.ph',
    requestedRole: 'Full Access',
    requestDate: '2026-05-10',
    status: 'pending',
  },
  {
    id: 'REQ-302',
    name: 'Paolo Santos',
    email: 'paolo.santos@pakiadmin.ph',
    requestedRole: 'View Only',
    requestDate: '2026-05-11',
    status: 'pending',
  },
  {
    id: 'REQ-303',
    name: 'Jasmine Cruz',
    email: 'jasmine.cruz@pakiadmin.ph',
    requestedRole: 'Limited Access',
    requestDate: '2026-05-12',
    status: 'pending',
  },
];

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super-admin';

  // --- STATE LOGIC ---
  const [activeTab, setActiveTab] = useState<SettingsTab>(isSuperAdmin ? 'team' : 'security');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

  // Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // User Management States
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [newUser, setNewUser] = useState<EditableUser>({ name: "", email: "", role: "View Only" });
  const [adminRequests, setAdminRequests] = useState<AdminRequestRecord[]>(INITIAL_ADMIN_REQUESTS);
  const [requestToReject, setRequestToReject] = useState<AdminRequestRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const roleOptions = ["No Access", "View Only", "Limited Access", "Full Access", "Super Admin"];
  const displayName = (user?.name || 'Admin');

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true);
      const { supabase } = await import('../../lib/supabase');
      // Fetch admin team from account.profiles joined with admin_accounts via RPC
      const { data, error } = await supabase.schema('account').rpc('get_staff_accounts');
      if (!error && data) {
        const mappedUsers = (data as any[]).map((u: any) => ({
          id: u.id,
          name: u.full_name || 'Unknown',
          email: u.email || 'N/A',
          role: u.role === 'business_partner' ? 'Business Partner' : u.role === 'teller' ? 'Teller' : 'Staff',
          status: (u.is_verified ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
        }));
        setUsers(mappedUsers);
      }
      setIsLoading(false);
    };
    fetchMembers();
  }, []);

  // --- ACTIONS ---
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenNotificationPreferences = () => {
    setIsNotificationMenuOpen(false);
    setIsUserMenuOpen(false);
    document.getElementById('pakipark-notification-preferences')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const deactivateUser = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
    triggerSuccess("Staff access status updated.");
  };

  const openEditModal = (user: UserRecord) => {
    setCurrentUser({ ...user });
    setShowEditUserModal(true);
  };

  const handleAddUser = () => {
    const id = users.length + 1;
    setUsers([...users, { ...newUser, id, status: "Active" }]);
    triggerSuccess(`${newUser.name} added to facility staff.`);
    setShowAddUserModal(false);
    setNewUser({ name: "", email: "", role: "View Only" });
  };

  const handleUpdateUser = () => {
    if (!currentUser) {
      return;
    }

    setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
    triggerSuccess(`Staff profile updated.`);
    setShowEditUserModal(false);
  };

  const pendingAdminRequests = adminRequests.filter((request) => request.status === 'pending');

  const handleApproveRequest = (requestId: string) => {
    setAdminRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: 'approved',
            }
          : request,
      ),
    );
    triggerSuccess('Admin request approved.');
  };

  const handleOpenRejectModal = (request: AdminRequestRecord) => {
    setRequestToReject(request);
    setRejectionReason('');
  };

  const handleCloseRejectModal = () => {
    setRequestToReject(null);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!requestToReject || !rejectionReason.trim()) {
      return;
    }

    setAdminRequests((prev) =>
      prev.map((request) =>
        request.id === requestToReject.id
          ? {
              ...request,
              status: 'rejected',
              rejectedReason: rejectionReason.trim(),
            }
          : request,
      ),
    );
    triggerSuccess('Admin request rejected with reason.');
    handleCloseRejectModal();
  };

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a] relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3d5a20; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ee6b2040; }
      `}} />

      <PakiParkSidebar activeTab="settings" />

      {/* --- ADD/EDIT MODALS --- */}
      {(showAddUserModal || showEditUserModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e3d5a]/40 backdrop-blur-sm" onClick={() => { setShowAddUserModal(false); setShowEditUserModal(false); }}></div>
          <Card className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1e3d5a]">{showAddUserModal ? "Add Facility Staff" : "Edit Staff Profile"}</h3>
                <button onClick={() => { setShowAddUserModal(false); setShowEditUserModal(false); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase ml-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold" value={showAddUserModal ? newUser.name : currentUser?.name} onChange={(e) => showAddUserModal ? setNewUser({...newUser, name: e.target.value}) : setCurrentUser(currentUser ? {...currentUser, name: e.target.value} : null)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase ml-1">Work Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold" value={showAddUserModal ? newUser.email : currentUser?.email} onChange={(e) => showAddUserModal ? setNewUser({...newUser, email: e.target.value}) : setCurrentUser(currentUser ? {...currentUser, email: e.target.value} : null)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase ml-1">System Role</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-[#1e3d5a]/10 bg-[#f4f7fa] outline-none focus:bg-white transition-all font-bold appearance-none" value={showAddUserModal ? newUser.role : currentUser?.role} onChange={(e) => showAddUserModal ? setNewUser({...newUser, role: e.target.value}) : setCurrentUser(currentUser ? {...currentUser, role: e.target.value} : null)}>
                    {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <Button onClick={showAddUserModal ? handleAddUser : handleUpdateUser} className="w-full bg-[#ee6b20] hover:bg-[#ff7a2e] text-white rounded-xl py-6 font-bold mt-4 uppercase text-[10px] tracking-widest shadow-lg">
                  {showAddUserModal ? "Grant Access" : "Update Permissions"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {requestToReject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1e3d5a]/50 backdrop-blur-sm"
            onClick={handleCloseRejectModal}
          ></div>
          <Card className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">Reject Admin Request</h3>
                  <p className="text-sm text-[#1e3d5a]/60 font-medium mt-1">
                    Enter a rejection reason before declining {requestToReject.name}&apos;s admin signup request.
                  </p>
                </div>
                <button
                  onClick={handleCloseRejectModal}
                  className="p-2 hover:bg-[#f4f7fa] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-[#1e3d5a]/50 uppercase tracking-widest ml-1">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request cannot be approved..."
                  className="w-full min-h-32 rounded-2xl border border-[#1e3d5a]/15 bg-[#f4f7fa] px-4 py-3 outline-none focus:bg-white focus:border-[#ee6b20] transition-all text-sm font-medium resize-none"
                />
                <p className="text-xs text-[#1e3d5a]/55 font-medium">
                  A rejection reason is required before the Super-Admin can confirm this action.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseRejectModal}
                  className="rounded-xl border-[#1e3d5a]/15 text-[#1e3d5a]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReject}
                  disabled={!rejectionReason.trim()}
                  className="rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
              <Search className="w-4 h-4 text-[#1e3d5a]/60" />
              <input type="text" placeholder="Search system settings..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#1e3d5a]/10"></div>
            <NotificationMenuButton
              menuOpen={isNotificationMenuOpen}
              onToggle={() => {
                setIsUserMenuOpen(false);
                setIsNotificationMenuOpen((current) => !current);
              }}
              onManagePreferences={handleOpenNotificationPreferences}
              badgeCount={2}
              previewTitle="Important Alerts Only"
              previewDescription="Push is trimmed to urgent events, while in-app keeps your team updated on shift."
              previewItems={[
                { label: 'Push', note: 'Security incidents and urgent capacity spikes only', status: 'ON' },
                { label: 'In-App', note: 'Live facility alerts for on-shift admins', status: 'ON' },
              ]}
              label="Open notification center"
              status="ON"
              theme={{
                buttonClassName: 'border-[#1e3d5a]/10 bg-[#f4f7fa] text-[#1e3d5a] hover:border-[#ee6b20]/25 hover:bg-white',
                badgeClassName: 'bg-[#ee6b20] text-white shadow-lg shadow-[#ee6b20]/20',
                badgeDotClassName: 'bg-[#fff4ec]',
                labelClassName: 'text-[#1e3d5a]',
                statusPillClassName: 'rounded-full bg-[#ee6b20] px-2.5 py-1 text-white',
                panelClassName: 'border-[#1e3d5a]/10 bg-white',
                panelTitleClassName: 'text-[#1e3d5a]',
                panelBodyClassName: 'text-[#1e3d5a]/65',
                panelRowClassName: 'border-[#1e3d5a]/10 bg-[#f4f7fa]',
                panelActionClassName: 'bg-[#1e3d5a] text-white hover:bg-[#2a5373]',
              }}
            />
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationMenuOpen(false);
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#1e3d5a] leading-tight whitespace-nowrap">{displayName}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
                  <button className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <User className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Profile</span>
                  </button>
                  <button onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <Settings className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Settings</span>
                  </button>
                  <div className="border-t border-[#1e3d5a]/10"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black font-bold text-[#1e3d5a] tracking-tight">Admin Settings</h1>
              <p className="text-[#1e3d5a] opacity-60 font-medium italic mt-1">Manage facility staff, access control, parking alerts, and authenticator-based sign-in security.</p>
            </div>
            {showSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-bold">{successMessage}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                    activeTab === 'team'
                      ? 'bg-[#1e3d5a] text-white shadow-lg shadow-blue-900/20'
                      : 'bg-white text-[#1e3d5a] border border-[#1e3d5a]/10 hover:bg-[#f4f7fa]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Team Management
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                    activeTab === 'requests'
                      ? 'bg-[#1e3d5a] text-white shadow-lg shadow-blue-900/20'
                      : 'bg-white text-[#1e3d5a] border border-[#1e3d5a]/10 hover:bg-[#f4f7fa]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Admin Requests
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {pendingAdminRequests.length}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('security')}
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-[#1e3d5a] text-white shadow-lg shadow-blue-900/20'
                  : 'bg-white text-[#1e3d5a] border border-[#1e3d5a]/10 hover:bg-[#f4f7fa]'
              }`}
            >
              <LockKeyhole className="w-4 h-4" />
              Security
            </button>
          </div>

          {isSuperAdmin && activeTab === 'team' ? (
            <div className="grid grid-cols-1 gap-8">
              <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden flex flex-col h-[500px]">
                <CardHeader className="p-8 border-b border-[#f4f7fa] bg-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#f4f7fa] rounded-2xl text-[#ee6b20]"><Users size={24} /></div>
                      <div>
                        <CardTitle className="text-xl font-bold text-[#1e3d5a]">Team Management</CardTitle>
                        <CardDescription className="text-xs font-medium text-gray-400">Add, edit or deactivate system users</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setShowAddUserModal(true)} className="bg-[#1e3d5a] hover:bg-[#2a5373] text-white rounded-xl font-bold h-12 px-5 transition-all shadow-lg">
                      <UserPlus className="w-4 h-4 mr-2" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f4f7fa] border-b border-[#1e3d5a]/5 text-[10px] uppercase font-bold text-[#1e3d5a]/40 sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-4">User</th>
                        <th className="px-8 py-4">Role</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e3d5a]/5">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#f4f7fa]/50 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="font-bold text-sm text-[#1e3d5a]">{u.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{u.email}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[10px] font-bold px-3 py-1 bg-white border rounded-lg uppercase tracking-wider ${
                              u.role === 'Super Admin' ? 'border-[#ee6b20] text-[#ee6b20]' : 'border-[#1e3d5a]/20 text-[#1e3d5a]'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-1.5 text-xs font-bold ${u.status === 'Active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                {u.status}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditModal(u)} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-[#ee6b20] transition-all"><Edit3 size={16} /></button>
                              <button onClick={() => deactivateUser(u.id)} className={`p-2 hover:bg-white rounded-lg transition-all ${u.status === 'Active' ? 'text-red-400 hover:text-red-500' : 'text-emerald-400'}`}>
                                  {u.status === 'Active' ? <UserMinus size={16} /> : <UserPlus size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <NotificationPreferencesPanel
                sectionId="pakipark-notification-preferences"
                copy={{
                  badge: 'PakiPark Alerts',
                  title: 'Notification Preferences',
                  description:
                    'Decide how occupancy alerts, security notices, and daily operations updates should reach your PakiPark admin team.',
                  emailDescription:
                    'Send scheduled summaries, parking reports, and operational notifications to your preferred admin inbox.',
                  pushDescription:
                    'Only deliver urgent occupancy spikes, security incidents, and major facility disruptions to mobile and desktop devices.',
                  inAppDescription:
                    'Keep live alerts inside the PakiPark dashboard so on-shift admins can react without leaving the platform.',
                  successMessage: 'PakiPark notification preferences saved.',
                  successDescription: 'Your preferred alert channels are now active.',
                }}
                theme={{
                  panelClassName: 'border-[#1e3d5a]/5 bg-white',
                  haloClassName:
                    'bg-[radial-gradient(circle_at_top_right,_rgba(238,107,32,0.14),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(30,61,90,0.08),_transparent_30%)]',
                  badgeClassName: 'border-[#ee6b20]/20 bg-[#fff4ec] text-[#1e3d5a]',
                  titleClassName: 'text-[#1e3d5a]',
                  bodyClassName: 'text-[#1e3d5a]/70',
                  summaryClassName: 'border-[#1e3d5a]/10 bg-[#f4f7fa]',
                  summaryValueClassName: 'text-[#1e3d5a]',
                  summaryLabelClassName: 'text-[#ee6b20]',
                  channelCardClassName: 'border-[#1e3d5a]/10 bg-white hover:border-[#ee6b20]/25',
                  iconWrapClassName: 'border-[#1e3d5a]/10 bg-[#fff4ec]',
                  iconClassName: 'text-[#ee6b20]',
                  switchClassName: 'data-[state=checked]:bg-[#ee6b20]',
                  statusEnabledClassName: 'bg-[#ee6b20] text-white',
                  statusDisabledClassName: 'bg-[#1e3d5a]/8 text-[#1e3d5a]/60',
                  footerClassName: 'border-[#1e3d5a]/10 bg-[#f4f7fa]',
                  footerTitleClassName: 'text-[#1e3d5a]',
                  footerBodyClassName: 'text-[#1e3d5a]/70',
                  buttonClassName: 'bg-[#1e3d5a] text-white hover:bg-[#2a5373]',
                }}
              />
            </div>
          ) : isSuperAdmin && activeTab === 'requests' ? (
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden">
              <CardHeader className="p-8 border-b border-[#f4f7fa] bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#f4f7fa] rounded-2xl text-[#ee6b20]">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-[#1e3d5a]">Admin Requests</CardTitle>
                    <CardDescription className="text-xs font-medium text-gray-400">
                      Review pending admin signup requests and decide whether to approve or reject them.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingAdminRequests.length === 0 ? (
                  <div className="px-8 py-16 text-center">
                    <p className="text-lg font-bold text-[#1e3d5a]">No pending admin requests</p>
                    <p className="mt-2 text-sm text-[#1e3d5a]/60 font-medium">
                      New admin signup requests will appear here for Super-Admin review.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#f4f7fa] border-b border-[#1e3d5a]/5 text-[10px] uppercase font-bold text-[#1e3d5a]/40">
                        <tr>
                          <th className="px-8 py-4">Applicant</th>
                          <th className="px-8 py-4">Requested Role</th>
                          <th className="px-8 py-4">Request Date</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e3d5a]/5">
                        {pendingAdminRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-[#f4f7fa]/50 transition-colors">
                            <td className="px-8 py-5">
                              <p className="font-bold text-sm text-[#1e3d5a]">{request.name}</p>
                              <p className="text-xs text-gray-400 font-medium">{request.email}</p>
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex rounded-lg border border-[#1e3d5a]/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1e3d5a]">
                                {request.requestedRole}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-sm font-semibold text-[#1e3d5a]">
                              {request.requestDate}
                            </td>
                            <td className="px-8 py-5">
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                Pending
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex justify-end gap-3">
                                <Button
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-10 px-4"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal(request)}
                                  className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <TwoFactorAuthPanel platform="pakipark" />
          )}
        </main>
      </div>
    </div>
  );
}

