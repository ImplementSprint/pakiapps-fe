import { useState, useEffect } from 'react';
import {
  Settings,
  LogOut,
  User,
  Search,
  ChevronDown,
  CheckCircle2,
  Users,
  UserCheck,
  LockKeyhole,
} from 'lucide-react';
import { NotificationMenuButton } from '../../components/settings/NotificationMenuButton';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import { NotificationPreferencesPanel } from '../../components/settings/NotificationPreferencesPanel';
import { TwoFactorAuthPanel } from '../../components/settings/TwoFactorAuthPanel';
import { useAdminTeamSettings, type AdminRequestRecord } from '../../components/settings/adminTeam';
import {
  AddEditUserModal,
  RejectRequestModal,
  TeamManagementCard,
  AdminRequestsCard,
  type SettingsTheme,
} from '../../components/settings/AdminTeamPanels';

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

const theme: SettingsTheme = {
  modalOverlay: 'bg-[#1e3d5a]/40',
  rejectOverlay: 'bg-[#1e3d5a]/50',
  rejectZ: 'z-[110]',
  titleStrong: 'text-[#1e3d5a]',
  bodyText: 'text-[#1e3d5a]',
  mutedText60: 'text-[#1e3d5a]/60',
  mutedText55: 'text-[#1e3d5a]/55',
  fieldLabel: 'text-[#1e3d5a]/40',
  fieldLabel50: 'text-[#1e3d5a]/50',
  fieldInput: 'border-[#1e3d5a]/10 bg-[#f4f7fa]',
  rejectTextarea: 'border-[#1e3d5a]/15 bg-[#f4f7fa] focus:bg-white focus:border-[#ee6b20]',
  primaryButton: 'bg-[#ee6b20] hover:bg-[#ff7a2e]',
  cancelButton: 'border-[#1e3d5a]/15 text-[#1e3d5a]',
  closeHoverPlain: 'hover:bg-gray-100',
  closeHoverSoft: 'hover:bg-[#f4f7fa]',
  card: 'border-none',
  cardHeaderBorder: 'border-[#f4f7fa]',
  iconWrap: 'bg-[#f4f7fa]',
  accentText: 'text-[#ee6b20]',
  cardDescription: 'text-gray-400',
  tableHead: 'bg-[#f4f7fa] border-[#1e3d5a]/5 text-[#1e3d5a]/40',
  tableDivide: 'divide-[#1e3d5a]/5',
  rowHover: 'hover:bg-[#f4f7fa]/50',
  roleBadge: 'border-[#1e3d5a]/10 text-[#1e3d5a]',
  roleBadgeSuper: 'border-[#ee6b20] text-[#ee6b20]',
  roleBadgeDefault: 'border-[#1e3d5a]/20 text-[#1e3d5a]',
  addUserButton: 'bg-[#1e3d5a] hover:bg-[#2a5373]',
  editHover: 'hover:text-[#ee6b20]',
};

export default function SettingsPage() {
  const settings = useAdminTeamSettings({
    initialUsers: [],
    initialRequests: INITIAL_ADMIN_REQUESTS,
    addUserSuccess: (name) => `${name} added to facility staff.`,
  });
  const {
    user,
    isSuperAdmin,
    activeTab,
    setActiveTab,
    showSuccess,
    successMessage,
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
    setUsers,
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
  } = settings;

  const displayName = user?.name || 'Admin';
  const [, setIsLoading] = useState(true);

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
  }, [setUsers]);

  const handleOpenNotificationPreferences = () => {
    setIsNotificationMenuOpen(false);
    setIsUserMenuOpen(false);
    document.getElementById('pakipark-notification-preferences')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
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
        copy={{ addTitle: 'Add Facility Staff', addButton: 'Grant Access' }}
      />

      <RejectRequestModal
        request={requestToReject}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onClose={handleCloseRejectModal}
        onConfirm={handleConfirmReject}
        theme={theme}
        copy={{
          description: (name) => `Enter a rejection reason before declining ${name}'s admin signup request.`,
          placeholder: 'Explain why this request cannot be approved...',
          helper: 'A rejection reason is required before the Super-Admin can confirm this action.',
        }}
      />

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
              <TeamManagementCard
                users={users}
                onAddUser={() => setShowAddUserModal(true)}
                onEditUser={openEditModal}
                onToggleStatus={deactivateUser}
                theme={theme}
              />

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
            <AdminRequestsCard
              requests={pendingAdminRequests}
              onApprove={handleApproveRequest}
              onReject={handleOpenRejectModal}
              theme={theme}
              copy={{ emptyDescription: 'New admin signup requests will appear here for Super-Admin review.' }}
            />
          ) : (
            <TwoFactorAuthPanel platform="pakipark" />
          )}
        </main>
      </div>
    </div>
  );
}
