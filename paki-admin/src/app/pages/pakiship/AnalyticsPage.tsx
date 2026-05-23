'use client';

import { useState, useEffect } from 'react';
import { fetchAnalyticsStats, type AnalyticsStats } from '../../lib/supabaseSchema';
import { useNavigate } from '../../lib/router';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Search,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Activity,
  Wallet,
  Truck,
  Bike,
  PackageCheck,
  PackagePlus,
  PackageX,
  AlertTriangle,
  Filter,
  Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';

type AnalyticsRange = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Year to Date';
type RevenueBreakdown = 'Week' | 'Month';

// ─── Colour tokens ──────────────────────────────────────────────────────────
const TEAL = '#39B5A8';
const TEAL_DARK = '#1A5D56';
const TEAL_LIGHT = '#50E3C2';
const BG = '#F0F9F8';

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
  prefix = '',
  suffix = '',
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#39B5A8]/20 rounded-2xl shadow-xl px-4 py-3 text-sm font-bold text-[#1A5D56]">
      <p className="text-xs text-gray-400 font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[#041614]">
          {prefix}
          {typeof p.value === 'number'
            ? p.value >= 1_000_000
              ? `${(p.value / 1_000_000).toFixed(2)}M`
              : p.value >= 1_000
              ? `${(p.value / 1_000).toFixed(1)}K`
              : p.value.toLocaleString()
            : p.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

// ─── Empty chart placeholder ─────────────────────────────────────────────────
function EmptyChart({ label = 'No data yet' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-52 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#F0F9F8] border border-[#39B5A8]/20 flex items-center justify-center">
        <Package className="w-6 h-6 text-[#39B5A8]/40" />
      </div>
      <p className="text-sm font-bold text-gray-300">{label}</p>
      <p className="text-xs text-gray-200 font-medium">Data will appear once parcels are recorded</p>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  trend: string | null;
  trendUp: boolean;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] p-6 group hover:shadow-xl transition-all duration-300 ${
        accent
          ? 'bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] text-white'
          : 'bg-white border border-[#39B5A8]/10 shadow-sm'
      }`}
    >
      {/* bg glyph */}
      <div className="absolute -bottom-3 -right-3 opacity-[0.06] scale-[3] transition-transform group-hover:scale-[3.5]">
        {icon}
      </div>

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className={`p-2.5 rounded-xl ${
            accent ? 'bg-white/20' : 'bg-[#F0F9F8]'
          }`}
        >
          <span className={accent ? 'text-white' : 'text-[#39B5A8]'}>{icon}</span>
        </div>

        {trend !== null ? (
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
              accent
                ? 'bg-white/20 text-white'
                : trendUp
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        ) : (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              accent ? 'bg-white/10 text-white/60' : 'bg-gray-50 text-gray-300'
            }`}
          >
            —
          </span>
        )}
      </div>

      <p
        className={`text-xs font-bold uppercase tracking-widest mb-1 ${
          accent ? 'text-white/60' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      <p className={`text-2xl font-black ${accent ? 'text-white' : 'text-[#041614]'}`}>{value}</p>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-black text-[#041614]">{title}</h2>
        {subtitle && <p className="text-sm font-medium text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── Pill toggle ─────────────────────────────────────────────────────────────
function PillToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl border border-[#39B5A8]/15 bg-[#F0F9F8] p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
            value === opt ? 'bg-[#39B5A8] text-white shadow' : 'text-[#1A5D56] hover:bg-white/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Chart card wrapper ──────────────────────────────────────────────────────
function ChartCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[2rem] border border-[#39B5A8]/10 shadow-sm p-7 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState<AnalyticsRange>('Year to Date');
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown>('Month');
  const [volumeType, setVolumeType] = useState<'Bar' | 'Line'>('Bar');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd] = useState('2026-12-31');
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState<AnalyticsStats>({
    revenue: 0,
    delivered: 0,
    pending: 0,
    cancelled: 0,
    lostReports: 0,
    shipmentVolume: [],
    topDrivers: [],
    totalDrivers: 0,
    onDeliveryDrivers: 0,
    activeNowDrivers: 0,
    changes: {
      revenue: null,
      delivered: null,
      pending: null,
      cancelled: null,
      lostReports: null,
      revenueUp: true,
      deliveredUp: true,
      pendingUp: true,
      cancelledUp: true,
      lostReportsUp: true,
    },
  });

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    fetchAnalyticsStats(dateRange)
      .then((s) => { if (alive) { setStats(s); setIsLoading(false); } })
      .catch(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, [dateRange]);

  const placeholderName = getDisplayNameForEmail(user?.email, 'Admin');

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Derived chart data ───────────────────────────────────────────────────
  const hasVolumeData = stats.shipmentVolume.length > 0 && stats.shipmentVolume.some((d) => d.volume > 0);
  const hasRevenueData = stats.shipmentVolume.length > 0 && stats.shipmentVolume.some((d) => d.revenue > 0);

  const volumeChartData = hasVolumeData
    ? stats.shipmentVolume.map((d) => ({ label: d.month, value: d.volume }))
    : [];

  const revenueChartData = hasRevenueData
    ? stats.shipmentVolume.map((d) => ({ label: d.month, value: d.revenue }))
    : [];

  // Combined overview chart data (revenue + volume together)
  const overviewData = stats.shipmentVolume.map((d) => ({
    label: d.month,
    revenue: d.revenue,
    volume: d.volume,
  }));
  const hasOverviewData = overviewData.some((d) => d.revenue > 0 || d.volume > 0);

  const dateRanges: AnalyticsRange[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'Year to Date'];

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['Period', 'Volume', 'Revenue (PHP)'];
    const rows = stats.shipmentVolume.map((d) => [d.month, d.volume, d.revenue]);
    const csv =
      'data:text/csv;charset=utf-8,' +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csv));
    a.setAttribute('download', `PakiShip_Analytics_${customStart}_to_${customEnd}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Stat cards config ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Revenue',
      value: `₱${stats.revenue.toLocaleString('en-PH')}`,
      trend: stats.changes.revenue,
      trendUp: stats.changes.revenueUp,
      icon: <Wallet className="w-5 h-5" />,
      accent: true,
    },
    {
      label: 'Delivered',
      value: stats.delivered.toLocaleString(),
      trend: stats.changes.delivered,
      trendUp: stats.changes.deliveredUp,
      icon: <PackageCheck className="w-5 h-5" />,
    },
    {
      label: 'Pending',
      value: stats.pending.toLocaleString(),
      trend: stats.changes.pending,
      trendUp: stats.changes.pendingUp,
      icon: <PackagePlus className="w-5 h-5" />,
    },
    {
      label: 'Cancelled',
      value: stats.cancelled.toLocaleString(),
      trend: stats.changes.cancelled,
      trendUp: !stats.changes.cancelledUp,
      icon: <PackageX className="w-5 h-5" />,
    },
    {
      label: 'Lost Reports',
      value: stats.lostReports.toLocaleString(),
      trend: stats.changes.lostReports,
      trendUp: !stats.changes.lostReportsUp,
      icon: <AlertTriangle className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-[#F0F9F8] font-sans text-[#1A5D56] overflow-hidden">
      <PakiShipSidebar activeTab="analytics" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3 bg-[#F0F9F8] px-4 py-2.5 rounded-xl border border-[#39B5A8]/10 w-72">
            <Search className="w-4 h-4 text-[#39B5A8]/50 shrink-0" />
            <input
              type="text"
              placeholder="Search analytics…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-[#39B5A8]/40 font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Date range picker */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white border border-[#39B5A8]/20 text-[#1A5D56] rounded-xl px-4 py-2 text-sm font-bold hover:bg-[#F0F9F8] transition-colors">
                <Calendar className="w-4 h-4 text-[#39B5A8]" />
                {dateRange}
                <Filter className="w-3 h-3 opacity-40 ml-1" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#39B5A8]/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
                {dateRanges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                      dateRange === r ? 'bg-[#39B5A8] text-white' : 'hover:bg-[#F0F9F8] text-[#1A5D56]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-[#39B5A8] hover:bg-[#2F9D91] text-white rounded-xl px-4 py-2 text-sm font-bold shadow-lg shadow-[#39B5A8]/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <div className="w-px h-8 bg-[#39B5A8]/10" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 hover:bg-[#F0F9F8] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#39B5A8]/20">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-bold text-[#041614] whitespace-nowrap">
                  {placeholderName}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#1A5D56]/60 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                  <button onClick={() => navigate('/pakiship/profile')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-[#041614] text-sm">
                    <User className="w-4 h-4 text-[#39B5A8]" /> Profile
                  </button>
                  <button onClick={() => navigate('/pakiship/settings')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left font-semibold text-[#041614] text-sm">
                    <Settings className="w-4 h-4 text-[#39B5A8]" /> Settings
                  </button>
                  <div className="border-t border-[#39B5A8]/10" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left font-semibold text-red-500 text-sm">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8 max-w-[1600px] mx-auto">

            {/* ── Page heading ── */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-[#39B5A8] uppercase tracking-[0.15em] bg-[#39B5A8]/10 px-2.5 py-1 rounded-full">
                    {dateRange}
                  </span>
                  {isLoading && (
                    <span className="text-[10px] font-bold text-gray-400 animate-pulse">Fetching…</span>
                  )}
                </div>
                <h1 className="text-3xl font-black text-[#041614] tracking-tight">Analytics Overview</h1>
                <p className="text-sm text-[#1A5D56]/60 font-medium mt-0.5">
                  Real-time performance across the PakiShip delivery network
                </p>
              </div>

              {/* Custom date range row */}
              <div className="flex items-center gap-2 bg-white border border-[#39B5A8]/10 rounded-2xl px-4 py-2.5 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-[#39B5A8]/60 shrink-0" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="text-xs font-bold text-[#1A5D56] bg-transparent outline-none"
                />
                <span className="text-gray-300 text-xs">→</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="text-xs font-bold text-[#1A5D56] bg-transparent outline-none"
                />
              </div>
            </div>

            {/* ── KPI stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {statCards.map((card, i) => (
                <StatCard key={i} {...card} />
              ))}
            </div>

            {/* ── Overview chart (Area / dual) ── */}
            <ChartCard>
              <SectionHeader
                title={`Performance Overview — ${dateRange}`}
                subtitle="Revenue trajectory and shipment volume combined"
                right={
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <span className="inline-block w-3 h-1 rounded-full bg-[#39B5A8]" /> Revenue
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <span className="inline-block w-3 h-1 rounded-full bg-[#1A5D56]/30" /> Volume
                    </span>
                  </div>
                }
              />
              {hasOverviewData ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={overviewData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TEAL_DARK} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={TEAL_DARK} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#39B5A8" strokeOpacity={0.08} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#1A5D56', opacity: 0.5 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#39B5A8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1_000_000 ? `₱${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `₱${(v / 1_000).toFixed(0)}K` : `₱${v}`
                      }
                      width={60}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#1A5D56', opacity: 0.4 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      content={<CustomTooltip prefix="Revenue: ₱" />}
                      cursor={{ stroke: TEAL, strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      stroke={TEAL}
                      strokeWidth={2.5}
                      fill="url(#gradRevenue)"
                      dot={{ r: 4, fill: '#fff', stroke: TEAL, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: TEAL }}
                    />
                    <Area
                      yAxisId="volume"
                      type="monotone"
                      dataKey="volume"
                      stroke={TEAL_DARK}
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      fill="url(#gradVolume)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="No performance data for this period" />
              )}
            </ChartCard>

            {/* ── Shipment Volume + Revenue Trend row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Shipment Volume */}
              <ChartCard>
                <SectionHeader
                  title="Shipment Volume"
                  subtitle="Number of shipments per period"
                  right={
                    <PillToggle
                      options={['Bar', 'Line'] as const}
                      value={volumeType}
                      onChange={setVolumeType}
                    />
                  }
                />
                {hasVolumeData ? (
                  <ResponsiveContainer width="100%" height={210}>
                    {volumeType === 'Bar' ? (
                      <BarChart data={volumeChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGradVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={TEAL_LIGHT} />
                            <stop offset="100%" stopColor={TEAL} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={TEAL} strokeOpacity={0.07} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.4 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip suffix=" shipments" />} cursor={{ fill: `${TEAL}10` }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={52} fill="url(#barGradVol)" />
                      </BarChart>
                    ) : (
                      <LineChart data={volumeChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={TEAL} strokeOpacity={0.07} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.5 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.4 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip suffix=" shipments" />} cursor={{ stroke: TEAL, strokeDasharray: '4 4' }} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={TEAL}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#fff', stroke: TEAL, strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: TEAL }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No shipment volume data" />
                )}
              </ChartCard>

              {/* Revenue Trend */}
              <ChartCard>
                <SectionHeader
                  title="Revenue Trend"
                  subtitle="Gross revenue earned per period"
                  right={
                    <PillToggle
                      options={['Week', 'Month'] as const}
                      value={revenueBreakdown}
                      onChange={setRevenueBreakdown}
                    />
                  }
                />
                {hasRevenueData ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={revenueChartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TEAL_LIGHT} />
                          <stop offset="100%" stopColor={TEAL} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={TEAL} strokeOpacity={0.07} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.5 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontWeight: 700, fill: TEAL_DARK, opacity: 0.4 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 1_000_000 ? `₱${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `₱${(v / 1_000).toFixed(0)}K` : `₱${v}`
                        }
                        width={54}
                      />
                      <Tooltip content={<CustomTooltip prefix="₱" />} cursor={{ fill: `${TEAL}10` }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={52} fill="url(#revenueBarGrad)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="No revenue data for this period" />
                )}
              </ChartCard>
            </div>

            {/* ── Driver Leaderboard + Driver Count ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Driver Leaderboard */}
              <ChartCard>
                <SectionHeader title="Driver Leaderboard" subtitle="Top performers ranked by acceptance rate" />
                {stats.topDrivers.length === 0 ? (
                  <EmptyChart label="No driver data available" />
                ) : (
                  <div className="space-y-3">
                    {stats.topDrivers.map((driver, idx) => (
                      <div
                        key={driver.name}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F9F8] hover:bg-[#39B5A8]/5 transition-colors group"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-white'
                              : idx === 1
                              ? 'bg-slate-300 text-white'
                              : 'bg-amber-700/50 text-white'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#041614] truncate">{driver.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#39B5A8] to-[#50E3C2] rounded-full transition-all duration-700"
                                style={{ width: driver.completion }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-[#39B5A8] shrink-0">{driver.completion}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-xs font-black text-[#041614]">{driver.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              {/* Driver Workforce Counts */}
              <ChartCard>
                <SectionHeader title="Driver Workforce" subtitle="Overall fleet availability at a glance" />
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    {
                      label: 'Total Drivers',
                      count: stats.totalDrivers,
                      icon: <Truck className="w-6 h-6" />,
                      sub: 'Registered',
                      color: 'from-[#39B5A8] to-[#1A5D56]',
                    },
                    {
                      label: 'On Delivery',
                      count: stats.onDeliveryDrivers,
                      icon: <Bike className="w-6 h-6" />,
                      sub: 'Active Route',
                      color: 'from-blue-400 to-blue-600',
                    },
                    {
                      label: 'Online Now',
                      count: stats.activeNowDrivers,
                      icon: <Activity className="w-6 h-6" />,
                      sub: 'Available',
                      color: 'from-emerald-400 to-emerald-600',
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#F0F9F8] border border-[#39B5A8]/10 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <p className="text-3xl font-black text-[#041614]">{item.count}</p>
                      <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-wider mt-0.5">{item.label}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Mini inline bar showing active % */}
                {stats.totalDrivers > 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-[#F0F9F8] border border-[#39B5A8]/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#1A5D56]/60">Online Rate</span>
                      <span className="text-xs font-black text-[#39B5A8]">
                        {Math.round((stats.activeNowDrivers / stats.totalDrivers) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#39B5A8] to-[#50E3C2] rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.round((stats.activeNowDrivers / Math.max(1, stats.totalDrivers)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>

            {/* ── Summary export banner ── */}
            <div className="bg-gradient-to-r from-[#1A5D56] to-[#39B5A8] rounded-[2rem] p-7 flex items-center justify-between">
              <div>
                <p className="text-white font-black text-lg">Export Your Analytics Report</p>
                <p className="text-white/60 text-sm font-medium mt-0.5">
                  Download a CSV snapshot of the currently filtered data
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Period</p>
                  <p className="text-white font-black text-sm">{dateRange}</p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-white text-[#1A5D56] hover:bg-[#F0F9F8] rounded-xl px-5 py-3 text-sm font-black shadow-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
