import { useState } from 'react';
import { useNavigate } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';

export interface UserRecord {
  email: string;
  id: number;
  name: string;
  role: string;
  status: 'Active' | 'Inactive';
}

export interface EditableUser {
  email: string;
  name: string;
  role: string;
}

export type SettingsTab = 'team' | 'requests' | 'security';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdminRequestRecord {
  email: string;
  id: string;
  name: string;
  rejectedReason?: string;
  requestDate: string;
  requestedRole: string;
  status: RequestStatus;
}

export const ROLE_OPTIONS = ['No Access', 'View Only', 'Limited Access', 'Full Access', 'Super Admin'];

interface AdminTeamConfig {
  initialUsers: UserRecord[];
  initialRequests: AdminRequestRecord[];
  /** Success toast shown after a user is added (copy differs per app). */
  addUserSuccess: (name: string) => string;
}

/**
 * Shared state + handlers for the admin "Team Management" / "Admin Requests" settings.
 * Both PakiPark and PakiShip settings pages consume this so the logic lives in one place.
 */
export function useAdminTeamSettings(config: AdminTeamConfig) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super-admin';

  const [activeTab, setActiveTab] = useState<SettingsTab>(isSuperAdmin ? 'team' : 'security');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [newUser, setNewUser] = useState<EditableUser>({ name: '', email: '', role: 'View Only' });
  const [users, setUsers] = useState<UserRecord[]>(config.initialUsers);
  const [adminRequests, setAdminRequests] = useState<AdminRequestRecord[]>(config.initialRequests);
  const [requestToReject, setRequestToReject] = useState<AdminRequestRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const deactivateUser = (id: number) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u)));
    triggerSuccess('Staff access status updated.');
  };

  const openEditModal = (member: UserRecord) => {
    setCurrentUser({ ...member });
    setShowEditUserModal(true);
  };

  const handleAddUser = () => {
    setUsers((prev) => [...prev, { ...newUser, id: prev.length + 1, status: 'Active' }]);
    triggerSuccess(config.addUserSuccess(newUser.name));
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: 'View Only' });
  };

  const handleUpdateUser = () => {
    if (!currentUser) {
      return;
    }

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? currentUser : u)));
    triggerSuccess('Staff profile updated.');
    setShowEditUserModal(false);
  };

  const pendingAdminRequests = adminRequests.filter((request) => request.status === 'pending');

  const handleApproveRequest = (requestId: string) => {
    setAdminRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: 'approved' } : request)),
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
          ? { ...request, status: 'rejected', rejectedReason: rejectionReason.trim() }
          : request,
      ),
    );
    triggerSuccess('Admin request rejected with reason.');
    handleCloseRejectModal();
  };

  return {
    user,
    navigate,
    isSuperAdmin,
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
    roleOptions: ROLE_OPTIONS,
    users,
    setUsers,
    adminRequests,
    setAdminRequests,
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
  };
}
