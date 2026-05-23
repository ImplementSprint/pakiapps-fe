import { useState } from 'react';
import {
  Users,
  UserCheck,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Shield,
  LockKeyhole,
  AlertCircle,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import { TwoFactorAuthPanel } from '../../components/settings/TwoFactorAuthPanel';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface AdminRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  applicationDate: string;
  status: RequestStatus;
  emailVerified: boolean;
  rejectionReason?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  avatar?: string;
}

// Mock data for admin requests
const MOCK_REQUESTS: AdminRequest[] = [
  {
    id: 'REQ-001',
    name: 'Maria Santos',
    email: 'maria.santos@pakiadmin.ph',
    role: 'Administrator',
    applicationDate: '2026-05-10',
    status: 'pending',
    emailVerified: true,
  },
  {
    id: 'REQ-002',
    name: 'Pedro Reyes',
    email: 'pedro.reyes@pakiadmin.ph',
    role: 'Moderator',
    applicationDate: '2026-05-09',
    status: 'pending',
    emailVerified: false,
  },
  {
    id: 'REQ-003',
    name: 'Ana Garcia',
    email: 'ana.garcia@pakiadmin.ph',
    role: 'Analyst',
    applicationDate: '2026-05-08',
    status: 'approved',
    emailVerified: true,
    approvedBy: 'Super Admin',
    approvedDate: '2026-05-09',
  },
  {
    id: 'REQ-004',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@pakiadmin.ph',
    role: 'Support',
    applicationDate: '2026-05-07',
    status: 'rejected',
    emailVerified: true,
    rejectedBy: 'Super Admin',
    rejectedDate: '2026-05-08',
    rejectionReason: 'Insufficient qualifications for the requested role.',
  },
];

// Mock data for team members
const MOCK_TEAM: TeamMember[] = [
  {
    id: 'TM-001',
    name: 'Juan Dela Cruz',
    email: 'juan@pakiadmin.ph',
    role: 'Super Admin',
    status: 'active',
    joinedDate: '2026-01-15',
  },
  {
    id: 'TM-002',
    name: 'Ana Garcia',
    email: 'ana.garcia@pakiadmin.ph',
    role: 'Analyst',
    status: 'active',
    joinedDate: '2026-05-09',
  },
  {
    id: 'TM-003',
    name: 'Robert Tan',
    email: 'robert.tan@pakiadmin.ph',
    role: 'Developer',
    status: 'active',
    joinedDate: '2026-03-20',
  },
  {
    id: 'TM-004',
    name: 'Lisa Wong',
    email: 'lisa.wong@pakiadmin.ph',
    role: 'Moderator',
    status: 'inactive',
    joinedDate: '2026-02-10',
  },
];

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentAdminName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');
  const [activeTab, setActiveTab] = useState<'team' | 'requests' | 'security'>('team');
  const [requests, setRequests] = useState<AdminRequest[]>(MOCK_REQUESTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    MOCK_TEAM.map((member, index) =>
      index === 0
        ? {
            ...member,
            name: currentAdminName,
            email: user?.email || member.email,
          }
        : member,
    ),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', email: '', role: 'PakiShip Admin' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name || !newMemberData.email) return;
    
    setIsProcessing(true);
    // Simulate API provisioning call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newMember: TeamMember = {
      id: `TM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newMemberData.name,
      email: newMemberData.email,
      role: newMemberData.role,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    
    setTeamMembers(prev => [...prev, newMember]);
    setIsProcessing(false);
    setShowAddMemberModal(false);
    setNewMemberData({ name: '', email: '', role: 'PakiShip Admin' });
  };

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Count requests by status
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: 'approved' as RequestStatus,
              approvedBy: 'Super Admin',
              approvedDate: new Date().toISOString().split('T')[0],
            }
          : req
      )
    );

    console.log(`✅ Approved: ${selectedRequest.name} (${selectedRequest.email})`);
    console.log('📧 Approval email sent to:', selectedRequest.email);

    setIsProcessing(false);
    setShowReviewModal(false);
    setSelectedRequest(null);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;

    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: 'rejected' as RequestStatus,
              rejectedBy: 'Super Admin',
              rejectedDate: new Date().toISOString().split('T')[0],
              rejectionReason: rejectionReason,
            }
          : req
      )
    );

    console.log(`❌ Rejected: ${selectedRequest.name} (${selectedRequest.email})`);
    console.log('📧 Rejection email sent to:', selectedRequest.email);
    console.log('📝 Reason:', rejectionReason);

    setIsProcessing(false);
    setShowRejectModal(false);
    setShowReviewModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const openReviewModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'Administrator': 'bg-purple-100 text-purple-800 border-purple-300',
      'Moderator': 'bg-blue-100 text-blue-800 border-blue-300',
      'Analyst': 'bg-green-100 text-green-800 border-green-300',
      'Support': 'bg-amber-100 text-amber-800 border-amber-300',
      'Developer': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Super Admin': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusBadge = (status: RequestStatus | string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending</span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">Rejected</span>;
      case 'active':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">Active</span>;
      case 'inactive':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">Inactive</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-[#2c0735] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/pakiadmin/super-admin')}
            className="flex items-center gap-2 text-[#dec0f1] hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#dec0f1]/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#dec0f1]" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Admin Settings</h1>
              <p className="text-[#dec0f1] text-sm mt-1">Manage team members, review admin requests, and secure admin access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-[2rem] shadow-lg p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-bold text-sm transition-all ${
              activeTab === 'team'
                ? 'bg-[#2c0735] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Team Management
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-bold text-sm transition-all relative ${
              activeTab === 'requests'
                ? 'bg-[#2c0735] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Admin Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-bold text-sm transition-all ${
              activeTab === 'security'
                ? 'bg-[#2c0735] text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LockKeyhole className="w-5 h-5" />
            Security
          </button>
        </div>

        {/* Team Management Tab */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-[2rem] shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[#2c0735]">Team Members</h2>
              <button 
                onClick={() => setShowAddMemberModal(true)}
                className="px-6 py-3 bg-[#2c0735] text-white rounded-xl font-bold text-sm hover:bg-[#3d0a47] transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Member</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#dec0f1] flex items-center justify-center text-[#2c0735] font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(member.status)}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{member.joinedDate}</td>
                      <td className="py-4 px-4">
                        <button className="text-[#2c0735] hover:text-[#3d0a47] font-bold text-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-[2rem] shadow-lg p-6 border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Pending</p>
                    <p className="text-4xl font-black text-amber-600 mt-2">{pendingCount}</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Approved</p>
                    <p className="text-4xl font-black text-green-600 mt-2">{approvedCount}</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-lg p-6 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Rejected</p>
                    <p className="text-4xl font-black text-red-600 mt-2">{rejectedCount}</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="w-7 h-7 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-[2rem] shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c0735] focus:outline-none font-semibold"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-[#2c0735] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({requests.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      filterStatus === 'pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('approved')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      filterStatus === 'approved'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Approved ({approvedCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                      filterStatus === 'rejected'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Rejected ({rejectedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-[2rem] shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#2c0735] text-white">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Request ID</th>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Applicant</th>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Role</th>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                          No requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-mono text-sm font-bold text-gray-600">{request.id}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#dec0f1] flex items-center justify-center text-[#2c0735] font-bold">
                                {request.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{request.name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {request.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(request.role)}`}>
                              {request.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{request.applicationDate}</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(request.status)}
                              {request.emailVerified ? (
                                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Email Verified
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Email Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => openReviewModal(request)}
                              className="px-4 py-2 bg-[#2c0735] text-white rounded-lg font-bold text-sm hover:bg-[#3d0a47] transition-colors"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && <TwoFactorAuthPanel />}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#2c0735]">Review Admin Request</h3>
                  <p className="text-sm text-gray-600 mt-1">Request ID: {selectedRequest.id}</p>
                </div>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Applicant Info */}
              <div className="bg-purple-50 rounded-[1.5rem] p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="font-bold text-gray-900">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email</p>
                    <p className="font-bold text-gray-900">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Requested Role</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(selectedRequest.role)}`}>
                      {selectedRequest.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Application Date</p>
                    <p className="font-bold text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedRequest.applicationDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Verification Status */}
              <div className={`rounded-[1.5rem] p-6 mb-6 ${
                selectedRequest.emailVerified ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedRequest.emailVerified ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Email Verified</p>
                        <p className="text-sm text-green-700">This user has confirmed their email address</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="font-bold text-amber-900">Email Not Verified</p>
                        <p className="text-sm text-amber-700">Waiting for user to verify their email address</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Current Status */}
              {selectedRequest.status !== 'pending' && (
                <div className="bg-gray-50 rounded-[1.5rem] p-6 mb-6">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Current Status</p>
                  <div className="space-y-2">
                    {getStatusBadge(selectedRequest.status)}
                    {selectedRequest.approvedBy && (
                      <p className="text-sm text-gray-600">
                        Approved by <span className="font-bold">{selectedRequest.approvedBy}</span> on {selectedRequest.approvedDate}
                      </p>
                    )}
                    {selectedRequest.rejectedBy && (
                      <>
                        <p className="text-sm text-gray-600">
                          Rejected by <span className="font-bold">{selectedRequest.rejectedBy}</span> on {selectedRequest.rejectedDate}
                        </p>
                        <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-200">
                          <p className="text-xs font-bold text-red-900 uppercase tracking-wide mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-800">{selectedRequest.rejectionReason}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={!selectedRequest.emailVerified || isProcessing}
                    className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Approve Request
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </div>
              )}

              {!selectedRequest.emailVerified && selectedRequest.status === 'pending' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    You cannot approve this request until the user verifies their email address.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full">
            <div className="p-8">
              <h3 className="text-2xl font-black text-[#2c0735] mb-2">Reject Request</h3>
              <p className="text-sm text-gray-600 mb-6">
                Please provide a reason for rejecting <span className="font-bold">{selectedRequest.name}'s</span> request.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-[#2c0735] focus:outline-none font-semibold resize-none"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-[#2c0735]">Provision Account</h3>
                  <p className="text-sm text-gray-600 mt-1">Create and assign roles to a new administrator.</p>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberData.name}
                    onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c0735] focus:outline-none font-semibold"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c0735] focus:outline-none font-semibold"
                    placeholder="name@pakiadmin.ph"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Role Assignment</label>
                  <select
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c0735] focus:outline-none font-semibold bg-white"
                  >
                    <option value="PakiShip Admin">PakiShip Admin</option>
                    <option value="PakiPark Admin">PakiPark Admin</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Support">Support</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-3 bg-[#2c0735] text-white rounded-xl font-bold hover:bg-[#3d0a47] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Provisioning...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
