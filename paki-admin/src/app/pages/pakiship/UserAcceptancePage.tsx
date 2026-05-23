import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Search,
  User,
  ChevronDown,
  Settings,
  LogOut,
  X,
  FileText,
  Mail,
  Phone,
  Calendar,
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Users,
  Briefcase,
  Store,
  MapPin,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { pakiParkLogo, pakiShipLogo } from '../../lib/assets';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';
import {
  fetchDriverApplications, fetchBusinessApplications, fetchDropOffApplications,
  approveApplication, rejectApplication,
  type DriverApplicationRow, type BusinessApplicationRow, type DropOffApplicationRow,
} from '../../lib/supabaseSchema';

type ApplicantType = 'driver' | 'business';
type AcceptanceTab = ApplicantType | 'dropoff';
type StatusType = 'pending' | 'approved' | 'rejected';

type Applicant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  applicationDate: string;
  documentCount: number;
  status: 'pending' | 'approved' | 'rejected';
  accountStatus: 'active' | 'inactive';
  activatedDate?: string;
  vehicleType?: string;
  plateNumber?: string;
  businessName?: string;
  businessType?: string;
  documents: Array<{ name: string; size: string; uploadDate: string; url: string }>;
  type: ApplicantType;
};
type DropOffApplication = DropOffApplicationRow;




export default function UserAcceptancePage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AcceptanceTab>('driver');
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [dropOffApplications, setDropOffApplications] = useState<DropOffApplication[]>([]);
  const [selectedDropOffApplication, setSelectedDropOffApplication] = useState<DropOffApplication | null>(null);
  const [showDropOffRejectModal, setShowDropOffRejectModal] = useState(false);
  const [dropOffRejectionReason, setDropOffRejectionReason] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const placeholderName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      fetchDriverApplications(),
      fetchBusinessApplications(),
      fetchDropOffApplications(),
    ]).then(([driverRes, bizRes, dropOffRes]) => {
      if (!isMounted) return;
      const drivers: Applicant[] = (driverRes.status === 'fulfilled' ? driverRes.value : []).map((a) => ({ ...a, type: 'driver' as ApplicantType }));
      const businesses: Applicant[] = (bizRes.status === 'fulfilled' ? bizRes.value : []).map((a) => ({ ...a, type: 'business' as ApplicantType }));
      setApplicants([...drivers, ...businesses]);
      if (dropOffRes.status === 'fulfilled') setDropOffApplications(dropOffRes.value);
      setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredApplicants = applicants.filter(
    (applicant) =>
      applicant.type === activeTab &&
      (statusFilter === 'all' || applicant.status === statusFilter) &&
      (
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        applicant.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        applicant.businessName?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
  );

  const filteredDropOffApplications = dropOffApplications.filter((application) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
    const matchesSearch =
      application.businessName.toLowerCase().includes(query) ||
      application.location.toLowerCase().includes(query) ||
      application.id.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    pending:
      activeTab === 'dropoff'
        ? dropOffApplications.filter((application) => application.status === 'pending').length
        : applicants.filter((a) => a.type === activeTab && a.status === 'pending').length,
    approved:
      activeTab === 'dropoff'
        ? dropOffApplications.filter((application) => application.status === 'approved').length
        : applicants.filter((a) => a.type === activeTab && a.status === 'approved').length,
    rejected:
      activeTab === 'dropoff'
        ? dropOffApplications.filter((application) => application.status === 'rejected').length
        : applicants.filter((a) => a.type === activeTab && a.status === 'rejected').length,
  };

  const handleApprove = async (applicantId: string) => {
    const activatedDate = new Date().toISOString().split('T')[0];
    const applicant = applicants.find((a) => a.id === applicantId);
    if (!applicant) return;
    const table = applicant.type === 'driver' ? 'applications' : 'business_applications';
    await approveApplication('driver', table, applicantId);
    let activatedApplicant: Applicant | null = null;

    setApplicants((current) =>
      current.map((a) => {
        if (a.id !== applicantId) return a;
        activatedApplicant = { ...a, status: 'approved', accountStatus: 'active', activatedDate };
        return activatedApplicant!;
      }),
    );
    if (activatedApplicant) setSelectedApplicant(activatedApplicant);
  };

  const handleReject = async (applicantId: string) => {
    if (!rejectionReason.trim()) { alert('Please provide a written rejection reason.'); return; }
    const applicant = applicants.find((a) => a.id === applicantId);
    if (!applicant) return;
    const table = applicant.type === 'driver' ? 'applications' : 'business_applications';
    await rejectApplication('driver', table, applicantId, rejectionReason);
    setApplicants((current) =>
      current.map((a) => a.id === applicantId ? { ...a, status: 'rejected', accountStatus: 'inactive', activatedDate: undefined } : a),
    );
    setSelectedApplicant(null);
    setRejectionReason('');
  };

  const handleApproveDropOff = async (application: DropOffApplication) => {
    await approveApplication('routing', 'operator_applications', application.id);
    const activatedApplication: DropOffApplication = {
      ...application, status: 'approved', platformStatus: 'active',
      activatedDate: new Date().toISOString().split('T')[0], rejectionReason: undefined,
    };
    setDropOffApplications((current) => current.map((item) => item.id === application.id ? activatedApplication : item));
    setSelectedDropOffApplication(activatedApplication);
  };

  const handleRejectDropOff = async () => {
    if (!selectedDropOffApplication || !dropOffRejectionReason.trim()) return;
    await rejectApplication('routing', 'operator_applications', selectedDropOffApplication.id, dropOffRejectionReason);
    const rejectedApplication: DropOffApplication = {
      ...selectedDropOffApplication, status: 'rejected', platformStatus: 'inactive',
      activatedDate: undefined, rejectionReason: dropOffRejectionReason.trim(),
    };
    setDropOffApplications((current) => current.map((item) => item.id === selectedDropOffApplication.id ? rejectedApplication : item));
    setSelectedDropOffApplication(rejectedApplication);
    setShowDropOffRejectModal(false);
    setDropOffRejectionReason('');
  };

  const selectAcceptanceTab = (tab: AcceptanceTab) => {
    setActiveTab(tab);
    setStatusFilter('all');
    setSearchQuery('');
    setSelectedApplicant(null);
    setSelectedDropOffApplication(null);
  };

  return (
    <div className="flex h-screen bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F0F9F8; }
        ::-webkit-scrollbar-thumb { background: #39B5A833; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #39B5A866; }
      `}} />

      <PakiShipSidebar activeTab="user-acceptance" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- NAVBAR --- */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsDashboardMenuOpen(!isDashboardMenuOpen)}
                className="flex items-center gap-3 bg-[#F0F9F8] px-4 py-2.5 rounded-xl border border-[#39B5A8]/10 hover:bg-[#39B5A8]/5 transition-all"
              >
                <img src={pakiShipLogo} alt="Current" className="h-5 w-auto object-contain" />
                <ChevronDown className={`w-4 h-4 text-[#1A5D56] transition-transform ${isDashboardMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDashboardMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => setIsDashboardMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F0F9F8] transition-colors text-left group"
                    >
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <img src={pakiShipLogo} alt="PakiShip" className="h-6 w-auto" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#041614] text-xs">PakiShip</p>
                        <p className="text-[10px] text-[#39B5A8] font-bold">Logistics</p>
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#39B5A8] rounded-full" />
                    </button>

                    <button
                      onClick={() => {
                        setIsDashboardMenuOpen(false);
                        navigate('/pakipark/dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F0F9F8] transition-colors text-left group"
                    >
                      <div className="p-1.5 bg-white rounded-lg border border-gray-100 group-hover:border-emerald-100 transition-colors">
                        <img src={pakiParkLogo} alt="PakiPark" className="h-6 w-auto" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#041614] text-xs">PakiPark</p>
                        <p className="text-[10px] text-gray-400 font-bold">Parking</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 bg-[#F0F9F8] px-4 py-2 rounded-xl border border-[#39B5A8]/10 w-153">
              <Search className="w-4 h-4 text-[#39B5A8]/60" />
              <input
                type="text"
                placeholder={activeTab === 'dropoff' ? 'Search business, location, or ID...' : 'Search applicants...'}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#39B5A8]/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#39B5A8]/10"></div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakiship/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left">
                    <User className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Profile</span>
                  </button>
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakiship/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left">
                    <Settings className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Settings</span>
                  </button>
                  <div className="border-t border-[#39B5A8]/10"></div>
                  <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section>
            <h1 className="text-3xl font-bold text-[#041614] tracking-tight">User Acceptance</h1>
            <p className="text-[#1A5D56] opacity-70 font-medium italic">Review and approve driver, business owner, and drop-off operator applications.</p>
          </section>

          {/* --- STATUS SUMMARY CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-3xl font-black text-[#041614]">{statusCounts.pending}</span>
              </div>
              <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.15em]">Pending Review</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Awaiting approval decision</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-3xl font-black text-[#041614]">{statusCounts.approved}</span>
              </div>
              <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.15em]">Approved</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Successfully accepted</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
                <span className="text-3xl font-black text-[#041614]">{statusCounts.rejected}</span>
              </div>
              <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.15em]">Rejected</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Applications declined</p>
            </div>
          </div>

          {/* --- TABS AND FILTERS --- */}
          <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => selectAcceptanceTab('driver')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'driver'
                      ? 'bg-[#F0F9F8] text-[#39B5A8] shadow-sm'
                      : 'text-gray-400 hover:text-[#1A5D56] hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Drivers
                </button>
                <button
                  onClick={() => selectAcceptanceTab('business')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'business'
                      ? 'bg-[#F0F9F8] text-[#39B5A8] shadow-sm'
                      : 'text-gray-400 hover:text-[#1A5D56] hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Business Owners
                </button>
                <button
                  onClick={() => selectAcceptanceTab('dropoff')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'dropoff'
                      ? 'bg-[#F0F9F8] text-[#39B5A8] shadow-sm'
                      : 'text-gray-400 hover:text-[#1A5D56] hover:bg-gray-50'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Drop-Off Operators
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] hover:bg-[#39B5A8]/5 transition-all font-semibold text-sm text-[#1A5D56]"
                >
                  Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatusFilterOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                    <button
                      onClick={() => { setStatusFilter('all'); setIsStatusFilterOpen(false); }}
                      className="w-full px-4 py-2.5 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-sm text-[#041614]"
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setStatusFilter('pending'); setIsStatusFilterOpen(false); }}
                      className="w-full px-4 py-2.5 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-sm text-amber-600"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => { setStatusFilter('approved'); setIsStatusFilterOpen(false); }}
                      className="w-full px-4 py-2.5 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-sm text-emerald-600"
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => { setStatusFilter('rejected'); setIsStatusFilterOpen(false); }}
                      className="w-full px-4 py-2.5 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-sm text-red-600"
                    >
                      Rejected
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- APPLICANTS TABLE --- */}
            <div className="overflow-x-auto">
              {activeTab === 'dropoff' ? (
                <DropOffApplicationsTable
                  applications={filteredDropOffApplications}
                  onSelectApplication={setSelectedDropOffApplication}
                />
              ) : (
              <>
              <table className="w-full text-left">
                <thead className="bg-[#F0F9F8]/50 border-b border-[#39B5A8]/5">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Applicant</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Application Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Region</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest text-center">Documents</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#39B5A8]/5">
                  {filteredApplicants.map((applicant) => (
                    <tr
                      key={applicant.id}
                      onClick={() => setSelectedApplicant(applicant)}
                      className="hover:bg-[#F0F9F8]/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold">
                            {applicant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#041614] group-hover:text-[#39B5A8] transition-colors whitespace-nowrap">{applicant.name}</p>
                            <p className="text-xs text-gray-400 font-medium whitespace-nowrap">{applicant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-[#1A5D56]">{new Date(applicant.applicationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-semibold text-[#1A5D56]">{applicant.region}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F9F8] text-[#39B5A8] rounded-full font-bold text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          {applicant.documentCount}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                          applicant.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          applicant.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {applicant.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredApplicants.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-medium">No applicants found</p>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- DETAILED VIEW MODAL --- */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#39B5A8]/10 p-8 flex items-center justify-between rounded-t-[2.5rem] z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#041614]">{selectedApplicant.name}</h2>
                <p className="text-sm text-gray-400 font-medium">{selectedApplicant.id}</p>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 rounded-xl hover:bg-[#F0F9F8] transition-colors"
              >
                <X className="w-6 h-6 text-[#1A5D56]" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Contact Information */}
              <section>
                <h3 className="text-lg font-bold text-[#041614] mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F9F8]">
                      <Mail className="w-4 h-4 text-[#39B5A8]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Email</p>
                      <p className="font-semibold text-[#1A5D56]">{selectedApplicant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F9F8]">
                      <Phone className="w-4 h-4 text-[#39B5A8]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Phone</p>
                      <p className="font-semibold text-[#1A5D56]">{selectedApplicant.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F9F8]">
                      <Calendar className="w-4 h-4 text-[#39B5A8]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Application Date</p>
                      <p className="font-semibold text-[#1A5D56]">{new Date(selectedApplicant.applicationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#F0F9F8]">
                      <MapPin className="w-4 h-4 text-[#39B5A8]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Region</p>
                      <p className="font-semibold text-[#1A5D56]">{selectedApplicant.region}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Driver/Business Details */}
              {selectedApplicant.type === 'driver' ? (
                <section>
                  <h3 className="text-lg font-bold text-[#041614] mb-4">Driver Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F0F9F8]">
                        <Car className="w-4 h-4 text-[#39B5A8]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Vehicle Type</p>
                        <p className="font-semibold text-[#1A5D56]">{selectedApplicant.vehicleType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F0F9F8]">
                        <FileText className="w-4 h-4 text-[#39B5A8]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Plate Number</p>
                        <p className="font-semibold text-[#1A5D56]">{selectedApplicant.plateNumber}</p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="text-lg font-bold text-[#041614] mb-4">Business Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F0F9F8]">
                        <Briefcase className="w-4 h-4 text-[#39B5A8]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Business Name</p>
                        <p className="font-semibold text-[#1A5D56]">{selectedApplicant.businessName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F0F9F8]">
                        <FileText className="w-4 h-4 text-[#39B5A8]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Business Type</p>
                        <p className="font-semibold text-[#1A5D56]">{selectedApplicant.businessType}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Submitted Documents */}
              <section>
                <h3 className="text-lg font-bold text-[#041614] mb-1">Submitted Documents</h3>
                {selectedApplicant.type === 'driver' && (
                  <p className="mb-4 text-sm font-medium text-[#1A5D56]/65">
                    Review the driver&apos;s license, government ID, and vehicle registration before activating the account.
                  </p>
                )}
                <div className="space-y-3">
                  {selectedApplicant.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#F0F9F8] rounded-xl hover:bg-[#39B5A8]/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white">
                          <FileText className="w-5 h-5 text-[#39B5A8]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#041614]">{doc.name}</p>
                          <p className="text-xs text-gray-400 font-medium">{doc.size} • Uploaded {new Date(doc.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-white hover:bg-[#39B5A8]/10 transition-colors">
                          <Eye className="w-4 h-4 text-[#39B5A8]" />
                        </button>
                        <button className="p-2 rounded-lg bg-white hover:bg-[#39B5A8]/10 transition-colors">
                          <Download className="w-4 h-4 text-[#39B5A8]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {selectedApplicant.type === 'driver' && (
                <section className="p-4 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8]">
                  <h4 className="font-bold text-[#041614] mb-3">Driver Eligibility Status</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                      selectedApplicant.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      selectedApplicant.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {selectedApplicant.status}
                    </span>
                    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                      selectedApplicant.accountStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                      Account {selectedApplicant.accountStatus ?? 'inactive'}
                    </span>
                    {selectedApplicant.accountStatus === 'active' && selectedApplicant.activatedDate && (
                      <p className="text-xs font-bold text-emerald-600">
                        Driver can accept jobs as of {formatDate(selectedApplicant.activatedDate, 'short')}.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Action Buttons */}
              {selectedApplicant.status === 'pending' && (
                <div className="space-y-4 pt-4">
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    placeholder="Written rejection reason required before rejecting"
                    className="w-full min-h-24 resize-none rounded-2xl border border-[#39B5A8]/15 bg-[#F0F9F8]/60 px-5 py-4 font-semibold text-[#041614] outline-none placeholder:text-gray-400 focus:border-[#39B5A8]"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedApplicant.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {selectedApplicant.type === 'driver' ? 'Approve & Activate Driver' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApplicant.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedDropOffApplication && !showDropOffRejectModal && (
        <DropOffReviewModal
          application={selectedDropOffApplication}
          onApprove={() => handleApproveDropOff(selectedDropOffApplication)}
          onClose={() => setSelectedDropOffApplication(null)}
          onReject={() => {
            setShowDropOffRejectModal(true);
            setDropOffRejectionReason('');
          }}
        />
      )}

      {selectedDropOffApplication && showDropOffRejectModal && (
        <DropOffRejectModal
          application={selectedDropOffApplication}
          reason={dropOffRejectionReason}
          onCancel={() => {
            setShowDropOffRejectModal(false);
            setDropOffRejectionReason('');
          }}
          onChangeReason={setDropOffRejectionReason}
          onConfirm={handleRejectDropOff}
        />
      )}
    </div>
  );
}

function formatDate(date: string, format: 'short' | 'long') {
  return new Date(date).toLocaleDateString('en-US', {
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DropOffApplicationsTable({
  applications,
  onSelectApplication,
}: {
  applications: DropOffApplication[];
  onSelectApplication: (application: DropOffApplication) => void;
}) {
  return (
    <>
      <table className="w-full text-left">
        <thead className="bg-[#F0F9F8]/50 border-b border-[#39B5A8]/5">
          <tr>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Application ID</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Business Name</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Date Applied</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Location</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Platform</th>
            <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest text-right">Review</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#39B5A8]/5">
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-[#F0F9F8]/30 transition-colors">
              <td className="px-6 py-5 font-bold text-[#041614] text-sm">{application.id}</td>
              <td className="px-6 py-5 min-w-[260px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {application.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[#041614] whitespace-nowrap">{application.businessName}</p>
                    <p className="text-xs text-gray-400 font-medium whitespace-nowrap">{application.ownerName}</p>
                    {application.status === 'rejected' && application.rejectionReason && (
                      <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-red-500">
                        Fix needed: {application.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 whitespace-nowrap">
                <p className="font-semibold text-[#1A5D56]">{formatDate(application.dateApplied, 'short')}</p>
              </td>
              <td className="px-6 py-5 min-w-[240px]">
                <p className="text-sm font-semibold text-[#1A5D56] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#39B5A8]" />
                  {application.location}
                </p>
              </td>
              <td className="px-6 py-5">
                <DropOffStatusBadge status={application.status} />
              </td>
              <td className="px-6 py-5">
                <PlatformStatusBadge status={application.platformStatus} />
              </td>
              <td className="px-6 py-5 text-right">
                <button
                  onClick={() => onSelectApplication(application)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#39B5A8] text-white rounded-xl hover:bg-[#2F9D91] transition-all text-xs font-bold uppercase tracking-wider"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {applications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 font-medium">No drop-off applications found</p>
        </div>
      )}
    </>
  );
}

function DropOffStatusBadge({ status }: { status: StatusType }) {
  const statusConfig = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status]}`}>
      {status}
    </span>
  );
}

function PlatformStatusBadge({ status }: { status: DropOffApplication['platformStatus'] }) {
  const statusConfig = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    inactive: 'bg-gray-50 text-gray-500 border-gray-100',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status]}`}>
      {status}
    </span>
  );
}

function DropOffInfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-[#F0F9F8] rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#39B5A8]">{icon}</span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-bold text-[#1A5D56]">{value}</p>
    </div>
  );
}

function DocumentVerificationBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    submitted: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    needs_review: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${statusConfig[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status === 'submitted' ? 'Submitted' : 'Needs Review'}
    </span>
  );
}

function DropOffReviewModal({
  application,
  onApprove,
  onClose,
  onReject,
}: {
  application: DropOffApplication;
  onApprove: () => void;
  onClose: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-[#39B5A8]/10 p-8 flex items-center justify-between rounded-t-[2.5rem] z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#041614]">Review Drop-Off Operator</h2>
            <p className="text-sm text-gray-400 font-medium">{application.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F0F9F8] transition-colors">
            <X className="w-6 h-6 text-[#1A5D56]" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <section>
            <h3 className="text-lg font-bold text-[#041614] mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DropOffInfoItem icon={<Building2 className="w-4 h-4" />} label="Business Name" value={application.businessName} />
              <DropOffInfoItem icon={<User className="w-4 h-4" />} label="Owner Name" value={application.ownerName} />
              <DropOffInfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={application.email} />
              <DropOffInfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={application.phone} />
              <DropOffInfoItem icon={<MapPin className="w-4 h-4" />} label="Location" value={application.location} />
              <DropOffInfoItem icon={<Calendar className="w-4 h-4" />} label="Date Applied" value={formatDate(application.dateApplied, 'long')} />
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-[#041614] mb-4">Registered Address</h3>
            <div className="p-4 bg-[#F0F9F8] rounded-xl">
              <p className="font-bold text-[#1A5D56]">{application.address}</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-[#041614] mb-4">Business Documents</h3>
            <div className="space-y-3">
              {application.businessDocuments.map((document) => (
                <div key={document.requirement} className="flex items-center justify-between gap-4 p-4 bg-[#F0F9F8] rounded-xl hover:bg-[#39B5A8]/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-white">
                      <FileText className="w-5 h-5 text-[#39B5A8]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#041614]">{document.requirement}</p>
                        <DocumentVerificationBadge status={document.verificationStatus} />
                      </div>
                      <p className="text-xs text-gray-400 font-medium truncate">{document.name}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        {document.size} - Uploaded {formatDate(document.uploadDate, 'short')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" className="p-2 rounded-lg bg-white hover:bg-[#39B5A8]/10 transition-colors" aria-label={`View ${document.requirement}`}>
                      <Eye className="w-4 h-4 text-[#39B5A8]" />
                    </button>
                    <button type="button" className="p-2 rounded-lg bg-white hover:bg-[#39B5A8]/10 transition-colors" aria-label={`Download ${document.requirement}`}>
                      <Download className="w-4 h-4 text-[#39B5A8]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-4 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8]">
            <h4 className="font-bold text-[#041614] mb-3">Application Status</h4>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <DropOffStatusBadge status={application.status} />
                <PlatformStatusBadge status={application.platformStatus} />
                {application.platformStatus === 'active' && (
                  <p className="text-xs font-bold text-emerald-600">
                    Drop-off point is active on PakiShip{application.activatedDate ? ` as of ${formatDate(application.activatedDate, 'short')}` : ''}.
                  </p>
                )}
              </div>
              {application.status === 'rejected' && application.rejectionReason && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Applicant Resubmission Reason</p>
                  <p className="mt-1 text-sm font-semibold text-red-700">{application.rejectionReason}</p>
                </div>
              )}
            </div>
          </section>

          {application.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle className="w-5 h-5" />
                Approve & Activate
              </button>
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DropOffRejectModal({
  application,
  reason,
  onCancel,
  onChangeReason,
  onConfirm,
}: {
  application: DropOffApplication;
  reason: string;
  onCancel: () => void;
  onChangeReason: (reason: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl">
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#041614]">Reject Application</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">
                Provide the reason {application.businessName} should see before resubmitting.
              </p>
            </div>
            <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[#F0F9F8] transition-colors">
              <X className="w-5 h-5 text-[#1A5D56]" />
            </button>
          </div>

          <label className="text-xs font-bold text-[#39B5A8] uppercase tracking-wider mb-2 block">Written Reason for Applicant *</label>
          <textarea
            value={reason}
            onChange={(event) => onChangeReason(event.target.value)}
            placeholder="Enter rejection reason"
            rows={4}
            className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3 text-[#041614] focus:border-[#39B5A8] outline-none transition-all text-sm font-medium resize-none"
            required
          />
          <p className="mt-2 text-xs font-semibold text-gray-400">
            This reason will be saved with the rejected application and shown as the fix needed before resubmission.
          </p>

          <div className="flex gap-3 pt-6">
            <button onClick={onCancel} className="flex-1 px-6 py-3 bg-gray-100 text-[#1A5D56] rounded-xl font-bold hover:bg-gray-200 transition-all">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!reason.trim()}
              className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
