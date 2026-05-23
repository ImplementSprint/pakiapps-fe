import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useNavigate } from "../../lib/router";
import {
  User,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  UserCog,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Eye,
  Filter,
  Download,
  DollarSign,
  PackageCheck,
  TrendingUp,
  X,
} from "lucide-react";

import { pakiAdminLogo, pakiShipLogo, pakiParkLogo } from '../../lib/assets';
import { useAuth } from "../../contexts/AuthContext";


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

// Mock data for pending admin requests
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
    name: 'Carlos Reyes',
    email: 'carlos.reyes@pakiadmin.ph',
    role: 'Analyst',
    applicationDate: '2026-05-11',
    status: 'pending',
    emailVerified: true,
  },
  {
    id: 'REQ-003',
    name: 'Ana Garcia',
    email: 'ana.garcia@pakiadmin.ph',
    role: 'Support',
    applicationDate: '2026-05-11',
    status: 'pending',
    emailVerified: false,
  },
  {
    id: 'REQ-004',
    name: 'Roberto Tan',
    email: 'roberto.tan@pakiadmin.ph',
    role: 'Moderator',
    applicationDate: '2026-05-09',
    status: 'approved',
    emailVerified: true,
    approvedBy: 'Juan Dela Cruz',
    approvedDate: '2026-05-10',
  },
  {
    id: 'REQ-005',
    name: 'Lisa Wong',
    email: 'lisa.wong@pakiadmin.ph',
    role: 'Developer',
    applicationDate: '2026-05-08',
    status: 'rejected',
    emailVerified: true,
    rejectionReason: 'Incomplete credentials verification',
    rejectedBy: 'Juan Dela Cruz',
    rejectedDate: '2026-05-09',
  },
];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>(MOCK_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState('Overview');
  const [selectedRange, setSelectedRange] = useState('7 Days');
  const [customStartDate, setCustomStartDate] = useState('2026-05-01');
  const [customEndDate, setCustomEndDate] = useState('2026-05-15');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAppSelectorModal, setShowAppSelectorModal] = useState(false);

  const placeholderName = user?.name || "Super Admin";

  const handleLogout = () => {
    navigate('/pakiadmin/login');
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const platformMetrics = [
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Platform Revenue',
      value: 'PHP 1.83M',
      detail: '+14.2% vs last month',
      tone: 'bg-gradient-to-br from-[#300066]/12 to-[#6a16b8]/18 text-[#300066] border-[#300066]/20',
    },
    {
      icon: <PackageCheck className="w-5 h-5" />,
      label: 'Total Active Users',
      value: '12,840',
      detail: '+8.7% across all products',
      tone: 'bg-gradient-to-br from-[#300066]/10 to-[#4b008f]/18 text-[#300066] border-[#300066]/20',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'API Uptime (30D)',
      value: '99.6%',
      detail: 'On track this month',
      tone: 'bg-gradient-to-br from-[#f5ebff] to-[#300066]/16 text-[#300066] border-[#300066]/20',
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'Incidents (MTD)',
      value: '2',
      detail: '1 unresolved incident',
      tone: 'bg-gradient-to-br from-[#300066]/12 to-[#8a38d4]/18 text-[#300066] border-[#300066]/20',
    },
  ];
  const auditLogs = [
    { action: '2FA policy checked', actor: placeholderName, time: '6 mins ago' },
    { action: 'Admin request queue reviewed', actor: placeholderName, time: '18 mins ago' },
    { action: 'Revenue report exported', actor: 'System Monitor', time: '42 mins ago' },
  ];
  const productRevenue = [
    { product: 'PakiShip', amount: 'PHP 1,120,000', share: '61%', detail: '9,210 shipments', width: '61%', tone: 'from-[#300066] to-[#6a16b8]' },
    { product: 'PakiPark', amount: 'PHP 710,000', share: '39%', detail: '4,380 sessions', width: '39%', tone: 'from-[#6a16b8] to-[#b184df]' },
  ];
  const systemHealth = [
    { service: 'PakiShip API', latency: '84ms', status: 'Healthy', tone: 'bg-[#300066]' },
    { service: 'PakiPark API', latency: '112ms', status: 'Healthy', tone: 'bg-[#4b008f]' },
    { service: 'Auth / 2FA Service', latency: '67ms', status: 'Healthy', tone: 'bg-[#300066]' },
    { service: 'Payment Gateway', latency: '340ms', status: 'Degraded', tone: 'bg-[#b184df]' },
    { service: 'Database (primary)', latency: '18ms', status: 'Healthy', tone: 'bg-[#300066]' },
    { service: 'Notification Service', latency: '55ms', status: 'Healthy', tone: 'bg-[#4b008f]' },
  ];
  const recentApiLogs = [
    { time: '10:41:52', method: 'POST', endpoint: '/pakiship/v1/quotes', code: '200' },
    { time: '10:41:49', method: 'GET', endpoint: '/pakipark/v1/lots/QC-04', code: '200' },
    { time: '10:41:33', method: 'POST', endpoint: '/auth/v1/verify-otp', code: '200' },
    { time: '10:40:17', method: 'GET', endpoint: '/pakiship/v1/tracking/SH8821', code: '404' },
    { time: '10:39:58', method: 'POST', endpoint: '/pakipark/v1/payments', code: '503' },
    { time: '10:38:04', method: 'DEL', endpoint: '/admin/v1/users/USR-0042', code: '204' },
  ];
  const adminAccounts = [
    { initials: 'EA', name: 'Euch A.', email: 'euch@pakiapps.ph', role: 'Superadmin' },
    { initials: 'JR', name: 'Juan R.', email: 'juan@pakiapps.ph', role: 'PakiShip Admin' },
    { initials: 'ML', name: 'Maria L.', email: 'maria@pakiapps.ph', role: 'PakiPark Admin' },
  ];
  const permissionRows = [
    { feature: 'Revenue', pakiship: 'Own only', pakipark: 'Own only' },
    { feature: 'API Logs', pakiship: 'X', pakipark: 'X' },
    { feature: 'Sys Health', pakiship: 'X', pakipark: 'X' },
    { feature: 'User Mgmt', pakiship: 'X', pakipark: 'X' },
  ];
  const dashboardTabs = ['Overview', 'API Logs', 'System Health', 'Users & Roles', 'Audit Trail', 'Settings'];
  const dashboardTabInfo: Record<string, { title: string; description: string; stats: string[] }> = {
    Overview: {
      title: 'Operations overview',
      description: 'Month-to-date revenue, users, uptime, and incident signals across PakiShip and PakiPark.',
      stats: ['PHP 1.83M revenue', '99.6% API uptime', '2 incidents tracked'],
    },
    'API Logs': {
      title: 'API activity monitor',
      description: 'Latest gateway traffic, endpoint responses, and failure codes from shared platform services.',
      stats: ['6 recent events', '2 attention codes', 'Auth, park, and ship routes'],
    },
    'System Health': {
      title: 'System health center',
      description: 'Live service status, latency readings, degraded dependencies, and recovery watch points.',
      stats: ['5 healthy services', '1 degraded gateway', '18ms database latency'],
    },
    'Users & Roles': {
      title: 'Users and roles',
      description: 'Administrator account visibility with product-level permissions and superadmin access boundaries.',
      stats: ['3 admin profiles', '2 product admins', 'Full superadmin access'],
    },
    'Audit Trail': {
      title: 'Audit readiness',
      description: 'Security-relevant actions, exports, account changes, and review activity for compliance checks.',
      stats: ['2FA activity', 'Request reviews', 'Report exports'],
    },
    Settings: {
      title: 'Platform settings',
      description: 'Central controls for notification rules, access policy, data retention, and operational defaults.',
      stats: ['Access policy', 'Alert routing', 'Data retention'],
    },
  };
  const filterOptions = ['Today', '7 Days', '30 Days', 'Custom Range'];
  const activeTabInfo = dashboardTabInfo[activeDashboardTab];
  const formatDateLabel = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(year, month - 1, day));
  };
  const customRangeLabel = `${formatDateLabel(customStartDate)} - ${formatDateLabel(customEndDate)}`;
  const handleRangeOptionClick = (option: string) => {
    if (option === 'Custom Range') {
      setIsCustomRangeOpen(true);
      return;
    }

    setSelectedRange(option);
    setIsCustomRangeOpen(false);
    setIsDashboardMenuOpen(false);
  };
  const applyCustomRange = () => {
    if (!customStartDate || !customEndDate) return;

    setSelectedRange(customRangeLabel);
    setIsCustomRangeOpen(false);
    setIsDashboardMenuOpen(false);
  };
  const renderDashboardContent = () => {
    if (activeDashboardTab === 'API Logs') {
      return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">API Request Stream</h2>
              <span className="rounded-full bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] px-4 py-2 text-xs font-black text-[#300066]">
                {selectedRange}
              </span>
            </div>
            <div className="mt-6 divide-y divide-[#300066]/10">
              {recentApiLogs.map((log) => (
                <div key={`${log.time}-${log.endpoint}`} className="grid grid-cols-[86px_72px_1fr_auto] items-center gap-3 py-4">
                  <span className="font-mono text-sm font-bold text-[#300066]/55">{log.time}</span>
                  <span className="rounded-lg bg-white px-2.5 py-1 text-center text-xs font-black text-[#300066] shadow-sm">
                    {log.method}
                  </span>
                  <span className="truncate font-mono text-sm font-bold text-[#2c0735]/75">{log.endpoint}</span>
                  <span className={`font-black ${log.code.startsWith('5') || log.code.startsWith('4') ? 'text-[#7b2cbf]' : 'text-[#300066]'}`}>
                    {log.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Successful Calls', value: '18,420', detail: '97.8% success rate' },
              { label: 'Failed Calls', value: '412', detail: '404 and 503 responses' },
              { label: 'Avg Response', value: '116ms', detail: 'Across all gateways' },
            ].map((item) => (
              <article key={item.label} className="rounded-[1.5rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#300066]/55">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-[#300066]">{item.value}</p>
                <p className="mt-2 text-sm font-bold text-[#300066]/65">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeDashboardTab === 'System Health') {
      return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Live Service Health</h2>
            <div className="mt-6 divide-y divide-[#300066]/10">
              {systemHealth.map((service) => (
                <div key={service.service} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${service.tone}`}></span>
                    <span className="font-black text-[#2c0735]">{service.service}</span>
                  </div>
                  <span className="text-sm font-black text-[#300066]">{service.latency}</span>
                  <span className="text-sm font-bold text-[#300066]/65">{service.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Incident Watch</h2>
            <div className="mt-6 space-y-4">
              {[
                { title: 'Payment Gateway latency', status: 'Degraded', detail: '340ms average response; watching retries.' },
                { title: 'Tracking API queue', status: 'Stable', detail: 'No unresolved queue buildup in the last hour.' },
                { title: 'Database primary', status: 'Healthy', detail: '18ms reads, backups completed successfully.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[#2c0735]">{item.title}</p>
                    <span className="rounded-full bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] px-3 py-1 text-xs font-black text-[#300066]">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#300066]/60">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeDashboardTab === 'Users & Roles') {
      return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Admin Accounts</h2>
            <div className="mt-6 divide-y divide-[#300066]/10">
              {adminAccounts.map((account) => (
                <div key={account.email} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f7efff] to-[#d9b8ff] text-sm font-black text-[#300066]">
                      {account.initials}
                    </div>
                    <div>
                      <p className="font-black text-[#2c0735]">{account.name}</p>
                      <p className="text-sm font-bold text-[#300066]/60">{account.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] px-4 py-1.5 text-xs font-black text-[#300066]">
                    {account.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Role Permissions</h2>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm font-bold">
              <div className="rounded-xl bg-[#300066]/10 px-3 py-3 text-[#300066]">Feature</div>
              <div className="rounded-xl bg-[#300066]/15 px-3 py-3 text-[#300066]">PakiShip</div>
              <div className="rounded-xl bg-[#300066]/15 px-3 py-3 text-[#300066]">PakiPark</div>
              {permissionRows.map((row) => (
                <div key={row.feature} className="contents">
                  <div className="rounded-xl bg-white/75 px-3 py-3 text-[#2c0735]">{row.feature}</div>
                  <div className="rounded-xl bg-white/75 px-3 py-3 text-[#300066]">{row.pakiship}</div>
                  <div className="rounded-xl bg-white/75 px-3 py-3 text-[#300066]">{row.pakipark}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold text-[#300066]/55">Superadmin has full access to all rows above.</p>
          </div>
        </section>
      );
    }

    if (activeDashboardTab === 'Audit Trail') {
      return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Audit Events</h2>
            <div className="mt-6 space-y-4">
              {auditLogs.concat([
                { action: 'Permission matrix reviewed', actor: 'Compliance Monitor', time: '1 hr ago' },
                { action: 'Failed API burst flagged', actor: 'System Monitor', time: '2 hrs ago' },
              ]).map((log) => (
                <div key={`${log.action}-${log.time}`} className="flex items-center justify-between rounded-2xl bg-white/75 px-5 py-4">
                  <div>
                    <p className="font-black text-[#2c0735]">{log.action}</p>
                    <p className="text-sm font-bold text-[#300066]/55">{log.actor}</p>
                  </div>
                  <span className="text-sm font-black text-[#300066]/65">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Review Summary</h2>
            <div className="mt-6 space-y-4">
              <SummaryCard icon={<Clock className="w-6 h-6" />} label="Pending Review" value={pendingCount} color="amber" />
              <SummaryCard icon={<CheckCircle className="w-6 h-6" />} label="Approved" value={approvedCount} color="green" />
              <SummaryCard icon={<XCircle className="w-6 h-6" />} label="Rejected" value={rejectedCount} color="red" />
            </div>
          </div>
        </section>
      );
    }

    if (activeDashboardTab === 'Settings') {
      return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {[
            { title: 'Access Policy', value: '2FA required', detail: 'Superadmin approval required for new admin accounts.' },
            { title: 'Alert Routing', value: 'Ops + Admin', detail: 'Critical incidents notify platform leads and product admins.' },
            { title: 'Data Retention', value: '180 days', detail: 'API logs and audit events are retained for review windows.' },
            { title: 'Export Controls', value: 'Enabled', detail: 'Revenue and audit exports require authenticated sessions.' },
            { title: 'Maintenance Mode', value: 'Off', detail: 'PakiShip and PakiPark remain operational.' },
            { title: 'Default Range', value: selectedRange, detail: 'Dashboard cards follow the selected date filter.' },
          ].map((setting) => (
            <article key={setting.title} className="rounded-[1.5rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#300066]/55">{setting.title}</p>
              <p className="mt-2 text-2xl font-black text-[#300066]">{setting.value}</p>
              <p className="mt-3 text-sm font-bold leading-6 text-[#300066]/65">{setting.detail}</p>
            </article>
          ))}
        </section>
      );
    }

    return (
      <>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformMetrics.map((metric) => (
            <article key={metric.label} className="rounded-[1.5rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-6 shadow-sm">
              <div className={`mb-5 inline-flex rounded-2xl border p-3 ${metric.tone}`}>{metric.icon}</div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#300066]/55">{metric.label}</p>
              <p className="mt-2 text-4xl font-black text-[#300066]">{metric.value}</p>
              <p className="mt-3 text-sm font-bold text-[#300066]/70">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">Revenue by Product</h2>
            <div className="mt-7 space-y-7">
              {productRevenue.map((item) => (
                <div key={item.product}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <span className="rounded-full bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] px-4 py-1.5 text-sm font-black text-[#300066]">
                      {item.product}
                    </span>
                    <span className="text-lg font-black text-[#300066]">{item.amount}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-[#300066]/10">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: item.width }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#300066]/60">
                    {item.share} of total · {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-[#300066]/15 pt-5 text-base font-black text-[#300066]">
              <span>May 2026 · Month-to-date</span>
              <span>PHP 1,830,000 total</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-7 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-[0.12em] text-[#300066]/75">System Health</h2>
            <div className="mt-6 divide-y divide-[#300066]/10">
              {systemHealth.map((service) => (
                <div key={service.service} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${service.tone}`}></span>
                    <span className="font-black text-[#2c0735]">{service.service}</span>
                  </div>
                  <span className="text-sm font-black text-[#300066]">{service.latency}</span>
                  <span className="text-sm font-bold text-[#300066]/65">{service.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  };

  const handleApprove = (request: AdminRequest) => {
    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setRequests(requests.map(req =>
        req.id === request.id
          ? {
              ...req,
              status: 'approved',
              approvedBy: placeholderName,
              approvedDate: new Date().toISOString().split('T')[0]
            }
          : req
      ));
      setSelectedRequest(null);
      setIsProcessing(false);

      // In production: Send approval email to user
      console.log('Approval email sent to:', request.email);
    }, 1000);
  };

  const handleReject = (request: AdminRequest) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      setRequests(requests.map(req =>
        req.id === request.id
          ? {
              ...req,
              status: 'rejected',
              rejectionReason: rejectionReason,
              rejectedBy: placeholderName,
              rejectedDate: new Date().toISOString().split('T')[0]
            }
          : req
      ));
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setIsProcessing(false);

      // In production: Send rejection email to user
      console.log('Rejection email sent to:', request.email, 'Reason:', rejectionReason);
    }, 1000);
  };

  const openRejectModal = (request: AdminRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  return (
    <div className="flex h-screen bg-[radial-gradient(circle_at_top_left,#fbf7ff_0%,#efe0ff_38%,#ddc2ff_100%)] font-sans text-[#300066]">
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #efe0ff; }
        ::-webkit-scrollbar-thumb { background: #30006688; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #300066cc; }
      `}} />

      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-white via-[#f4e9ff] to-[#e8d2ff] border-r border-[#300066]/15 flex flex-col shadow-xl">
        <div className="px-8 py-6">
          <div className="mx-auto flex h-28 w-44 items-center justify-center overflow-hidden">
            <img src={pakiAdminLogo} alt="PakiAdmin Logo" className="h-40 w-40 max-w-none object-contain" />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="px-4 py-2">
            <span className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest opacity-60">
              Super Admin Panel
            </span>
          </div>

          <NavButton
            active={true}
            onClick={() => {}}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Platform Overview"
          />
          <NavButton
            active={false}
            onClick={() => setShowAppSelectorModal(true)}
            icon={<User className="w-5 h-5" />}
            label="Operational Dashboard"
          />
          <NavButton
            active={false}
            onClick={() => navigate('/pakiadmin/settings')}
            icon={<Settings className="w-5 h-5" />}
            label="Admin Accounts"
          />
        </nav>

        <div className="p-6 border-t border-[#300066]/15">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#300066] hover:bg-[#300066]/10 transition-all font-semibold text-sm group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#300066]/15 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-gradient-to-r from-white to-[#efe0ff] px-4 py-2 rounded-xl border border-[#300066]/15 w-96">
              <Search className="w-4 h-4 text-[#2c0735]/60" />
              <input
                type="text"
                placeholder="Search systems, users, API logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#2c0735]/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#300066]/15"></div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-[#300066]/10 px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#300066] via-[#4b008f] to-[#6a16b8] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#2c0735] leading-tight whitespace-nowrap">{placeholderName}</p>
                  <p className="text-xs font-semibold text-[#2c0735]/60">Super Administrator</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#2c0735] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#300066]/15 overflow-hidden z-20">
                  <button onClick={() => { setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#300066]/10 transition-colors text-left">
                    <User className="w-4 h-4 text-[#2c0735]" />
                    <span className="font-semibold text-[#2c0735]">Profile</span>
                  </button>
                  <button onClick={() => { setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#300066]/10 transition-colors text-left">
                    <Settings className="w-4 h-4 text-[#2c0735]" />
                    <span className="font-semibold text-[#2c0735]">Settings</span>
                  </button>
                  <div className="border-t border-[#300066]/15"></div>
                  <button onClick={() => { setIsUserMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#300066]/10 transition-colors text-left">
                    <LogOut className="w-4 h-4 text-[#300066]" />
                    <span className="font-semibold text-[#300066]">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-10 space-y-7">
          <section className="overflow-hidden rounded-[2rem] border border-[#300066]/20 bg-gradient-to-r from-[#300066] via-[#4b008f] to-[#1d003e] text-white shadow-xl shadow-[#300066]/25">
            <div className="flex flex-col gap-5 px-8 py-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">pakiApps Superadmin</h1>
                  <span className="rounded-full bg-white/15 px-4 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
                    Superadmin
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm font-bold text-white/80 sm:flex-row sm:items-center sm:gap-8 lg:text-right">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#b184df] shadow-[0_0_18px_rgba(177,132,223,0.9)]"></span>
                  All systems operational
                </span>
                <span>May 16, 2026 · 10:42 PHT</span>
              </div>
            </div>
            <div className="flex overflow-x-auto border-t border-white/10 px-8">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDashboardTab(tab)}
                  className={`min-w-max px-6 py-4 text-sm font-black transition-colors ${
                    activeDashboardTab === tab
                      ? 'border-b-4 border-white bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 rounded-[1.5rem] border border-[#300066]/15 bg-gradient-to-br from-white to-[#f1e3ff] p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#300066]/55">
                {activeDashboardTab}
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#300066]">{activeTabInfo.title}</h2>
              <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-[#300066]/65">{activeTabInfo.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeTabInfo.stats.map((stat) => (
                  <span key={stat} className="rounded-full bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] px-4 py-2 text-xs font-black text-[#300066]">
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <button
                onClick={() => {
                  setIsDashboardMenuOpen(!isDashboardMenuOpen);
                  if (!isDashboardMenuOpen && selectedRange.includes(' - ')) {
                    setIsCustomRangeOpen(true);
                  }
                }}
                className="flex w-full items-center justify-between rounded-[1.25rem] border border-[#300066]/20 bg-white/95 px-5 py-4 text-[#2c0735] shadow-sm transition-all hover:bg-[#f7efff]"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-full bg-gradient-to-br from-[#f7efff] to-[#e8d2ff] p-2">
                    <CalendarDays className="h-4 w-4 text-[#6a16b8]" />
                  </span>
                  <span className="font-black">{selectedRange}</span>
                </span>
                <Filter className="h-4 w-4 text-[#6a16b8]" />
              </button>

              {isDashboardMenuOpen && (
                <div className="absolute right-0 z-20 mt-4 w-full overflow-hidden rounded-[1.75rem] border border-[#300066]/15 bg-white shadow-2xl shadow-[#300066]/20">
                  {filterOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleRangeOptionClick(option)}
                      className={`mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors first:mt-5 last:mb-4 ${
                        selectedRange === option || (option === 'Custom Range' && (isCustomRangeOpen || selectedRange.includes(' - ')))
                          ? 'bg-gradient-to-r from-[#300066] to-[#5b0aa0] text-white shadow-sm'
                          : 'text-[#300066] hover:bg-[#300066]/10'
                      }`}
                    >
                      {option}
                    </button>
                  ))}

                  {isCustomRangeOpen && (
                    <div className="border-t border-[#300066]/15 bg-gradient-to-br from-[#fbf7ff] to-[#efe0ff] px-5 py-5">
                      <label className="block text-xs font-black uppercase tracking-[0.14em] text-[#6a16b8]">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-[#300066]/20 bg-white px-4 text-sm font-black text-[#2c0735] outline-none transition focus:border-[#6a16b8] focus:ring-2 focus:ring-[#6a16b8]/20"
                      />

                      <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em] text-[#6a16b8]">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        min={customStartDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-[#300066]/20 bg-white px-4 text-sm font-black text-[#2c0735] outline-none transition focus:border-[#6a16b8] focus:ring-2 focus:ring-[#6a16b8]/20"
                      />

                      <button
                        onClick={applyCustomRange}
                        disabled={!customStartDate || !customEndDate}
                        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#300066] to-[#5b0aa0] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:shadow-lg hover:shadow-[#300066]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {renderDashboardContent()}

        </main>
      </div>

      {/* Review Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-[#300066]/15 p-8 flex items-center justify-between rounded-t-[2.5rem] z-10">
              <div>
                <h2 className="text-2xl font-bold text-[#2c0735]">Review Request</h2>
                <p className="text-sm text-[#2c0735]/60 font-medium">{selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl hover:bg-[#300066]/10 transition-colors"
              >
                <X className="w-6 h-6 text-[#2c0735]" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Applicant Info */}
              <section>
                <h3 className="text-lg font-bold text-[#2c0735] mb-4">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={<User className="w-4 h-4" />} label="Full Name" value={selectedRequest.name} />
                  <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={selectedRequest.email} />
                  <InfoItem icon={<UserCog className="w-4 h-4" />} label="Requested Role" value={selectedRequest.role} />
                  <InfoItem icon={<Calendar className="w-4 h-4" />} label="Application Date" value={new Date(selectedRequest.applicationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                </div>
              </section>

              {/* Email Verification Status */}
              <section className={`p-4 rounded-xl border ${selectedRequest.emailVerified ? 'bg-gradient-to-r from-[#f7efff] to-[#e8d2ff] border-[#300066]/20' : 'bg-gradient-to-r from-[#fbf7ff] to-[#efe0ff] border-[#300066]/15'}`}>
                <div className="flex items-center gap-3">
                  {selectedRequest.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-[#300066]" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-[#4b008f]" />
                  )}
                  <div>
                    <p className={`font-bold text-sm ${selectedRequest.emailVerified ? 'text-[#4c1d95]' : 'text-[#581c87]'}`}>
                      Email {selectedRequest.emailVerified ? 'Verified' : 'Not Verified'}
                    </p>
                    <p className={`text-xs font-semibold ${selectedRequest.emailVerified ? 'text-[#300066]' : 'text-[#4b008f]'}`}>
                      {selectedRequest.emailVerified
                        ? 'Email address has been confirmed'
                        : 'User has not verified their email yet'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Status Info */}
              {selectedRequest.status !== 'pending' && (
                <section className="p-4 rounded-xl border border-[#300066]/15 bg-gradient-to-r from-[#f7efff] to-[#e8d2ff]">
                  <h4 className="font-bold text-[#2c0735] mb-2">Request Status</h4>
                  <div className="space-y-2">
                    {selectedRequest.status === 'approved' && (
                      <>
                        <p className="text-sm font-semibold text-[#300066]">✓ Approved</p>
                        <p className="text-xs font-semibold text-[#2c0735]/60">Approved by: {selectedRequest.approvedBy}</p>
                        <p className="text-xs font-semibold text-[#2c0735]/60">Date: {selectedRequest.approvedDate}</p>
                      </>
                    )}
                    {selectedRequest.status === 'rejected' && (
                      <>
                        <p className="text-sm font-semibold text-[#4b008f]">✗ Rejected</p>
                        <p className="text-xs font-semibold text-[#2c0735]/60">Rejected by: {selectedRequest.rejectedBy}</p>
                        <p className="text-xs font-semibold text-[#2c0735]/60">Date: {selectedRequest.rejectedDate}</p>
                        <p className="text-xs font-bold text-[#2c0735] mt-2">Reason: {selectedRequest.rejectionReason}</p>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isProcessing || !selectedRequest.emailVerified}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#300066] to-[#5b0aa0] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#300066]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {isProcessing ? 'Processing...' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => openRejectModal(selectedRequest)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#6a16b8] to-[#300066] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#300066]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full shadow-2xl">
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-[#f7efff] to-[#e8d2ff] rounded-2xl">
                  <AlertTriangle className="w-6 h-6 text-[#4b008f]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[#2c0735]">Reject Request</h2>
                  <p className="text-sm text-[#2c0735]/60 font-medium mt-1">
                    Provide a reason for rejecting {selectedRequest.name}'s application.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="p-2 rounded-xl hover:bg-[#300066]/10 transition-colors"
                >
                  <X className="w-5 h-5 text-[#2c0735]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#2c0735] uppercase tracking-wider mb-2 block">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    rows={4}
                    className="w-full bg-gradient-to-r from-[#fbf7ff] to-[#efe0ff] border border-[#300066]/15 rounded-xl px-4 py-3 text-[#2c0735] focus:border-[#300066] outline-none transition-all text-sm font-medium resize-none"
                    required
                  />
                  <p className="text-xs font-semibold text-[#2c0735]/60 mt-2">
                    This reason will be sent to the applicant via email.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-[#2c0735] rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6a16b8] to-[#300066] text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── App Selector Modal ─────────────────────────────────────────────── */}
      {showAppSelectorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1d003e]/70 backdrop-blur-md"
            onClick={() => setShowAppSelectorModal(false)}
          />

          {/* Modal card */}
          <div className="relative bg-white rounded-[3rem] shadow-2xl shadow-[#300066]/40 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top gradient strip */}
            <div className="h-2 bg-gradient-to-r from-[#300066] via-[#6a16b8] to-[#300066]" />

            <div className="p-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#300066]/50">
                    Super Admin
                  </span>
                  <h2 className="text-3xl font-black text-[#2c0735] mt-1 tracking-tight">
                    Select Operational Dashboard
                  </h2>
                  <p className="text-sm font-medium text-[#300066]/60 mt-1">
                    Choose a product system to manage and monitor.
                  </p>
                </div>
                <button
                  onClick={() => setShowAppSelectorModal(false)}
                  className="p-2.5 rounded-2xl hover:bg-[#300066]/10 transition-colors text-[#300066]/50 hover:text-[#300066]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* App cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                {/* PakiShip */}
                <Link
                  href="/pakiship/dashboard"
                  className="group relative flex flex-col items-start text-left p-7 rounded-[2rem] border-2 border-[#300066]/10 bg-gradient-to-br from-white to-[#f4f9ff] hover:border-[#0f766e]/40 hover:from-[#ecfffb] hover:to-[#d0f8f2] hover:shadow-xl hover:shadow-[#14b8a6]/20 transition-all duration-300 overflow-hidden"
                >
                  {/* bg glyph */}
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-[#14b8a6]/8 group-hover:bg-[#14b8a6]/15 transition-colors" />

                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="h-12 flex items-center">
                      <img
                        src={pakiShipLogo}
                        alt="PakiShip"
                        className="h-10 w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[#14b8a6]/10 text-[#0f766e] group-hover:bg-[#14b8a6]/20 transition-colors">
                      Logistics
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#06322e] mb-2">PakiShip Admin</h3>
                  <p className="text-sm font-medium text-[#0f766e]/70 leading-6 mb-5">
                    Manage shipments, drivers, drop-off operators, tracking and lost parcel cases.
                  </p>

                  <div className="flex items-center gap-2 text-xs font-black text-[#0f766e] group-hover:gap-3 transition-all">
                    <span>Enter Dashboard</span>
                    <span className="text-lg leading-none">→</span>
                  </div>
                </Link>

                {/* PakiPark */}
                <Link
                  href="/pakipark/dashboard"
                  className="group relative flex flex-col items-start text-left p-7 rounded-[2rem] border-2 border-[#300066]/10 bg-gradient-to-br from-white to-[#fdf4ff] hover:border-[#7b2cbf]/30 hover:from-[#fbf5ff] hover:to-[#f0e0ff] hover:shadow-xl hover:shadow-[#6a16b8]/15 transition-all duration-300 overflow-hidden"
                >
                  {/* bg glyph */}
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-[#6a16b8]/8 group-hover:bg-[#6a16b8]/12 transition-colors" />

                  <div className="flex items-center justify-between w-full mb-5">
                    <div className="h-12 flex items-center">
                      <img
                        src={pakiParkLogo}
                        alt="PakiPark"
                        className="h-10 w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-[#6a16b8]/10 text-[#4b008f] group-hover:bg-[#6a16b8]/20 transition-colors">
                      Parking
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#2c0735] mb-2">PakiPark Admin</h3>
                  <p className="text-sm font-medium text-[#4b008f]/70 leading-6 mb-5">
                    Oversee parking areas, reservations, bookings, live monitoring and revenue reports.
                  </p>

                  <div className="flex items-center gap-2 text-xs font-black text-[#4b008f] group-hover:gap-3 transition-all">
                    <span>Enter Dashboard</span>
                    <span className="text-lg leading-none">→</span>
                  </div>
                </Link>
              </div>

              {/* Footer note */}
              <p className="text-center text-[11px] font-bold text-[#300066]/40 mt-6">
                Logged in as <span className="text-[#300066]/70">{placeholderName}</span> · Super Administrator · All systems accessible
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

interface NavButtonProps {
  active: boolean;
  badge?: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function NavButton({ active, onClick, icon, label, badge }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-[1.25rem] transition-all font-bold text-sm ${
        active
          ? 'bg-gradient-to-r from-[#300066] to-[#5b0aa0] text-white shadow-lg shadow-[#300066]/20'
          : 'text-[#300066]/70 hover:text-[#300066] hover:bg-[#300066]/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? 'text-white' : 'text-[#300066]/65'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-bold min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

interface SummaryCardProps {
  color: 'amber' | 'green' | 'red';
  icon: ReactNode;
  label: string;
  value: number;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  const colors = {
    amber: 'bg-gradient-to-br from-[#f7efff] to-[#e8d2ff] text-[#300066]',
    green: 'bg-gradient-to-br from-[#efe0ff] to-[#d9b8ff] text-[#300066]',
    red: 'bg-gradient-to-br from-[#e8d2ff] to-[#cfa3ff] text-[#300066]',
  };

  return (
    <div className="bg-gradient-to-br from-white to-[#f1e3ff] p-6 rounded-[2rem] border border-[#300066]/15 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-3xl font-black text-[#2c0735]">{value}</span>
      </div>
      <p className="text-xs font-bold text-[#2c0735] uppercase tracking-wider">{label}</p>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  color?: 'amber' | 'green' | 'red';
  count: number;
  label: string;
  onClick: () => void;
}

function FilterButton({ active, onClick, label, count, color }: FilterButtonProps) {
  const colors = {
    amber: 'bg-[#6a16b8]',
    green: 'bg-[#4b008f]',
    red: 'bg-[#300066]',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-[#300066] to-[#5b0aa0] text-white shadow-lg shadow-[#300066]/25'
          : 'bg-gradient-to-r from-[#fbf7ff] to-[#efe0ff] text-[#300066] hover:bg-[#300066]/10'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        active ? 'bg-white/20 text-white' : `${color ? colors[color] : 'bg-[#300066]'} text-white`
      }`}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status, emailVerified }: { status: RequestStatus; emailVerified: boolean }) {
  const statusConfig = {
    pending: {
      bg: 'bg-[#f7efff]',
      text: 'text-[#300066]',
      border: 'border-[#300066]/20',
      label: 'Pending Review',
    },
    approved: {
      bg: 'bg-[#efe0ff]',
      text: 'text-[#300066]',
      border: 'border-[#300066]/20',
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-[#e8d2ff]',
      text: 'text-[#300066]',
      border: 'border-[#300066]/20',
      label: 'Rejected',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-block whitespace-nowrap text-xs font-bold px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
      {status === 'pending' && (
        <span className={`text-xs font-semibold ${emailVerified ? 'text-[#300066]' : 'text-[#4b008f]'}`}>
          {emailVerified ? '✓ Email Verified' : '⏱ Email Pending'}
        </span>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div className="p-4 bg-gradient-to-r from-[#fbf7ff] to-[#efe0ff] rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#2c0735]/60">{icon}</span>
        <span className="text-xs font-bold text-[#2c0735]/60 uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-bold text-[#2c0735]">{value}</p>
    </div>
  );
}
