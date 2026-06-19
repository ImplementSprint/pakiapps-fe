import { useState } from 'react';
import {
  Settings,
  LogOut,
  CheckCircle2,
  Users,
  UserCheck,
  User,
  Search,
  ChevronDown,
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  LockKeyhole,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { NotificationMenuButton } from '../../components/settings/NotificationMenuButton';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { NotificationPreferencesPanel } from '../../components/settings/NotificationPreferencesPanel';
import { TwoFactorAuthPanel } from '../../components/settings/TwoFactorAuthPanel';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';
import { useAdminTeamSettings, type AdminRequestRecord, type UserRecord } from '../../components/settings/adminTeam';
import {
  AddEditUserModal,
  RejectRequestModal,
  TeamManagementCard,
  AdminRequestsCard,
  type SettingsTheme,
} from '../../components/settings/AdminTeamPanels';

const INITIAL_ADMIN_REQUESTS: AdminRequestRecord[] = [
  {
    id: 'REQ-201',
    name: 'Marco Villanueva',
    email: 'marco.villanueva@pakiadmin.ph',
    requestedRole: 'Limited Access',
    requestDate: '2026-05-10',
    status: 'pending',
  },
  {
    id: 'REQ-202',
    name: 'Angela Bautista',
    email: 'angela.bautista@pakiadmin.ph',
    requestedRole: 'Full Access',
    requestDate: '2026-05-11',
    status: 'pending',
  },
  {
    id: 'REQ-203',
    name: 'Luis Mendoza',
    email: 'luis.mendoza@pakiadmin.ph',
    requestedRole: 'View Only',
    requestDate: '2026-05-12',
    status: 'pending',
  },
];

const theme: SettingsTheme = {
  modalOverlay: 'bg-[#041614]/40',
  rejectOverlay: 'bg-[#041614]/55',
  rejectZ: 'z-[115]',
  titleStrong: 'text-[#041614]',
  bodyText: 'text-[#1A5D56]',
  mutedText60: 'text-[#1A5D56]/60',
  mutedText55: 'text-[#1A5D56]/55',
  fieldLabel: 'text-[#1A5D56]/40',
  fieldLabel50: 'text-[#1A5D56]/50',
  fieldInput: 'border-[#39B5A8]/10 bg-[#F0F9F8]/30',
  rejectTextarea: 'border-[#39B5A8]/15 bg-[#F0F9F8]/40 focus:bg-white focus:border-[#39B5A8]',
  primaryButton: 'bg-[#39B5A8] hover:bg-[#2F9D91]',
  cancelButton: 'border-[#39B5A8]/15 text-[#1A5D56]',
  closeHoverPlain: 'hover:bg-[#F0F9F8]',
  closeHoverSoft: 'hover:bg-[#F0F9F8]',
  card: 'border-[#39B5A8]/10',
  cardHeaderBorder: 'border-[#39B5A8]/5',
  iconWrap: 'bg-[#F0F9F8]',
  accentText: 'text-[#39B5A8]',
  cardDescription: 'text-[#1A5D56]/60',
  tableHead: 'bg-[#F0F9F8] border-[#39B5A8]/10 text-[#39B5A8]',
  tableDivide: 'divide-[#39B5A8]/5',
  rowHover: 'hover:bg-[#F0F9F8]/50',
  roleBadge: 'border-[#39B5A8]/15 text-[#041614]',
  roleBadgeSuper: 'border-[#39B5A8] text-[#39B5A8]',
  roleBadgeDefault: 'border-[#39B5A8]/20 text-[#041614]',
  addUserButton: 'bg-[#39B5A8] hover:bg-[#2F9D91] shadow-[#39B5A8]/20',
  editHover: 'hover:text-[#39B5A8]',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const placeholderName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');

  const initialUsers: UserRecord[] = [
    { id: 1, name: placeholderName, email: user?.email || 'juandelacruz@pakiadmin.ph', role: 'Super Admin', status: 'Active' },
    { id: 2, name: 'Martha Burgos', email: 'marthaburgos@pakiadmin.ph', role: 'Full Access', status: 'Active' },
    { id: 3, name: 'Rhea Rivera', email: 'rhearivera@pakiadmin.ph', role: 'View Only', status: 'Inactive' },
    { id: 4, name: 'Justin Perez', email: 'justinperez@pakiadmin.ph', role: 'Limited Access', status: 'Active' },
    { id: 5, name: 'Patricia Gonzaga', email: 'patriciagonzaga@pakiadmin.ph', role: 'View Only', status: 'Active' },
    { id: 6, name: 'Raphael Santos', email: 'rapahaelsantos@pakiadmin.ph', role: 'Limited Access', status: 'Active' },
  ];

  const {
    isSuperAdmin,
    navigate,
    activeTab,
    setActiveTab,
    showSuccess,
    successMessage,
    triggerSuccess,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isNotificationMenuOpen,
    setIsNotificationMenuOpen,
    showAddUserModal,
    setShowAddUserModal,
    showEditUserModal,
    setShowEditUserModal,
    currentUser,
    setCurrentUser,
    newUser,
    setNewUser,
    roleOptions,
    users,
    requestToReject,
    rejectionReason,
    setRejectionReason,
    handleLogout,
    deactivateUser,
    openEditModal,
    handleAddUser,
    handleUpdateUser,
    pendingAdminRequests,
    handleApproveRequest,
    handleOpenRejectModal,
    handleCloseRejectModal,
    handleConfirmReject,
  } = useAdminTeamSettings({
    initialUsers,
    initialRequests: INITIAL_ADMIN_REQUESTS,
    addUserSuccess: (name) => `${name} added to the team!`,
  });

  // --- PakiShip-only security/password modal state ---
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleOpenNotificationPreferences = () => {
    setIsNotificationMenuOpen(false);
    setIsUserMenuOpen(false);
    document.getElementById('pakiship-notification-preferences')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleChangePassword = () => {
    setPasswordError('');
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordError('All fields are required for security.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowPasswordModal(false);
      setPasswords({ current: '', next: '', confirm: '' });
      triggerSuccess('Admin credentials secured.');
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56] relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #39B5A840; border-radius: 10px; }
      `}} />

      <PakiShipSidebar activeTab="settings" />

      {/* --- PASSWORD MODAL --- */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#041614]/60 backdrop-blur-md" onClick={() => { setShowPasswordModal(false); setPasswordError(""); }}></div>
          <Card className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95 duration-200">
            <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F0F9F8] rounded-lg"><Lock className="w-5 h-5 text-[#39B5A8]" /></div>
                        <h3 className="text-xl font-bold text-[#041614]">Security Access</h3>
                    </div>
                    <button onClick={() => { setShowPasswordModal(false); setPasswordError(""); }} className="p-2 hover:bg-[#F0F9F8] rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                {passwordError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                    <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" />
                    <p className="text-xs font-bold text-red-600">{passwordError}</p>
                  </div>
                )}

                <div className="space-y-4">
                    <input type={showPass ? "text" : "password"} placeholder="Current Password" className="w-full px-4 py-3 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8]/30 outline-none font-bold" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="New Password" className="w-full px-4 py-3 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8]/30 outline-none font-bold" value={passwords.next} onChange={(e) => setPasswords({...passwords, next: e.target.value})} />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#39B5A8]">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <input type={showPass ? "text" : "password"} placeholder="Confirm New Password" className="w-full px-4 py-3 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8]/30 outline-none font-bold" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                    <Button onClick={handleChangePassword} className="w-full bg-[#39B5A8] hover:bg-[#2F9D91] text-white rounded-xl py-6 font-bold shadow-lg uppercase text-[10px] tracking-widest">
                      {isSaving ? "Authorizing..." : "Update Security Credentials"}
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      )}

      <RejectRequestModal
        request={requestToReject}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
        theme={theme}
        copy={{
          description: (name) => `Provide a rejection reason before declining ${name}'s signup request.`,
          placeholder: 'Explain why this request cannot be approved right now...',
          helper: 'This reason will be shared with the applicant by the Super-Admin.',
        }}
      />

      <AddEditUserModal
        show={showAddUserModal || showEditUserModal}
        isAddMode={showAddUserModal}
        newUser={newUser}
        setNewUser={setNewUser}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        roleOptions={roleOptions}
        onClose={() => {
          setShowAddUserModal(false);
          setShowEditUserModal(false);
        }}
        onSubmit={showAddUserModal ? handleAddUser : handleUpdateUser}
        theme={theme}
        copy={{ addTitle: 'Add Team Member', addButton: 'Invite' }}
      />

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* REPLICATED ANALYTICS HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-[#F0F9F8] px-4 py-2 rounded-xl border border-[#39B5A8]/10 w-180">
              <Search className="w-4 h-4 text-[#39B5A8]/60" />
              <input
                type="text"
                placeholder="Search settings..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#39B5A8]/40 font-medium text-[#1A5D56]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#39B5A8]/10"></div>
            <NotificationMenuButton
              menuOpen={isNotificationMenuOpen}
              onToggle={() => {
                setIsUserMenuOpen(false);
                setIsNotificationMenuOpen((current) => !current);
              }}
              onManagePreferences={handleOpenNotificationPreferences}
              badgeCount={2}
              previewTitle="Important Alerts Only"
              previewDescription="Push is limited to critical events, while in-app keeps live admin visibility."
              previewItems={[
                { label: 'Push', note: 'Critical dispatch and delivery exceptions only', status: 'ON' },
                { label: 'In-App', note: 'Live workspace alerts for active admins', status: 'ON' },
              ]}
              label="Open notification center"
              status="ON"
              theme={{
                buttonClassName: 'border-[#39B5A8]/10 bg-[#F0F9F8] text-[#1A5D56] hover:border-[#39B5A8]/25 hover:bg-white',
                badgeClassName: 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20',
                badgeDotClassName: 'bg-[#F0F9F8]',
                labelClassName: 'text-[#1A5D56]',
                statusPillClassName: 'rounded-full bg-[#39B5A8] px-2.5 py-1 text-white',
                panelClassName: 'border-[#39B5A8]/10 bg-white',
                panelTitleClassName: 'text-[#041614]',
                panelBodyClassName: 'text-[#1A5D56]/65',
                panelRowClassName: 'border-[#39B5A8]/10 bg-[#F0F9F8]/70',
                panelActionClassName: 'bg-[#39B5A8] text-white hover:bg-[#2F9D91]',
              }}
            />
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationMenuOpen(false);
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-3 hover:bg-[#F0F9F8] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#39B5A8]/20">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#041614] leading-tight whitespace-nowrap">{placeholderName}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1A5D56] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                  <button onClick={() => navigate('/pakiship/profile')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-[#041614]">
                    <User className="w-4 h-4 text-[#39B5A8]" /> Profile
                  </button>
                  <button onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-[#041614]">
                    <Settings className="w-4 h-4 text-[#39B5A8]" /> Settings
                  </button>
                  <div className="border-t border-[#39B5A8]/10"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left font-semibold text-red-500">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#041614] tracking-tight">Admin Settings</h1>
              <p className="text-[#1A5D56] opacity-70 font-medium italic">Manage team access, shipment alerts, and authenticator-based sign-in security.</p>
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
                      ? 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20'
                      : 'bg-white text-[#1A5D56] border border-[#39B5A8]/10 hover:bg-[#F0F9F8]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Team Management
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                    activeTab === 'requests'
                      ? 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20'
                      : 'bg-white text-[#1A5D56] border border-[#39B5A8]/10 hover:bg-[#F0F9F8]'
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
                  ? 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20'
                  : 'bg-white text-[#1A5D56] border border-[#39B5A8]/10 hover:bg-[#F0F9F8]'
              }`}
            >
              <LockKeyhole className="w-4 h-4" />
              Security
            </button>
          </div>

          {isSuperAdmin && activeTab === 'team' ? (
            <>
              <TeamManagementCard
                users={users}
                onAddUser={() => setShowAddUserModal(true)}
                onEditUser={openEditModal}
                onToggleStatus={deactivateUser}
                theme={theme}
              />

              <NotificationPreferencesPanel
                sectionId="pakiship-notification-preferences"
                copy={{
                  badge: 'PakiShip Alerts',
                  title: 'Notification Preferences',
                  description:
                    'Choose which channels should carry shipment exceptions, operational notices, and admin alerts so your team only hears what matters.',
                  emailDescription:
                    'Receive shipment summaries, escalations, and audit-friendly alert trails in your registered inbox.',
                  pushDescription:
                    'Only send critical dispatch blockers, urgent delivery exceptions, and major platform incidents to your devices.',
                  inAppDescription:
                    'Keep real-time notifications visible inside the PakiShip admin workspace while you manage operations.',
                  successMessage: 'PakiShip notification preferences saved.',
                  successDescription: 'Your alert channels have been updated successfully.',
                }}
                theme={{
                  panelClassName: 'border-[#39B5A8]/10 bg-white',
                  haloClassName:
                    'bg-[radial-gradient(circle_at_top_right,_rgba(57,181,168,0.14),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(4,22,20,0.06),_transparent_30%)]',
                  badgeClassName: 'border-[#39B5A8]/20 bg-[#F0F9F8] text-[#1A5D56]',
                  titleClassName: 'text-[#041614]',
                  bodyClassName: 'text-[#1A5D56]/70',
                  summaryClassName: 'border-[#39B5A8]/10 bg-[#F0F9F8]/70',
                  summaryValueClassName: 'text-[#041614]',
                  summaryLabelClassName: 'text-[#39B5A8]',
                  channelCardClassName: 'border-[#39B5A8]/10 bg-white/90 hover:border-[#39B5A8]/25',
                  iconWrapClassName: 'border-[#39B5A8]/15 bg-[#F0F9F8]',
                  iconClassName: 'text-[#39B5A8]',
                  switchClassName: 'data-[state=checked]:bg-[#39B5A8]',
                  statusEnabledClassName: 'bg-[#39B5A8] text-white',
                  statusDisabledClassName: 'bg-[#041614]/8 text-[#1A5D56]/60',
                  footerClassName: 'border-[#39B5A8]/10 bg-[#F0F9F8]/65',
                  footerTitleClassName: 'text-[#041614]',
                  footerBodyClassName: 'text-[#1A5D56]/70',
                  buttonClassName: 'bg-[#39B5A8] text-white hover:bg-[#2F9D91]',
                }}
              />
            </>
          ) : isSuperAdmin && activeTab === 'requests' ? (
            <AdminRequestsCard
              requests={pendingAdminRequests}
              onApprove={handleApproveRequest}
              onReject={handleOpenRejectModal}
              theme={theme}
              copy={{ emptyDescription: 'New signup requests will appear here for Super-Admin review.' }}
            />
          ) : (
            <TwoFactorAuthPanel platform="pakiship" />
          )}
        </main>
      </div>
    </div>
  );
}
