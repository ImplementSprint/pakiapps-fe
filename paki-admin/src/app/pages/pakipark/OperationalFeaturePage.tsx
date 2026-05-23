import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  LogOut,
  MapPin,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  XCircle,
  Zap,
  Loader2,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import { useAuth } from '../../contexts/AuthContext';

type PakiParkFeature = 'parking-areas' | 'live-monitor' | 'analytics' | 'user-acceptance';

interface OperationalFeaturePageProps {
  feature: PakiParkFeature;
}

const featureCopy = {
  'parking-areas': {
    title: 'Parking Areas',
    subtitle: 'Manage PakiPark hubs, slot capacity, operator coverage, and facility health.',
    search: 'Search parking areas, hubs, or operators...',
    icon: MapPin,
  },
  'live-monitor': {
    title: 'Live Monitor',
    subtitle: 'Track active reservations, entry flow, exit queues, and facility incidents in real time.',
    search: 'Search live sessions, plates, or hubs...',
    icon: Activity,
  },
  analytics: {
    title: 'Parking Analytics',
    subtitle: 'Review occupancy, revenue, conversion, vehicle mix, and operational performance.',
    search: 'Search parking analytics...',
    icon: BarChart3,
  },
  'user-acceptance': {
    title: 'User Acceptance',
    subtitle: 'Review parking operator applications, customer account requests, and verification documents.',
    search: 'Search applicants, operators, or documents...',
    icon: ShieldCheck,
  },
};

export default function OperationalFeaturePage({ feature }: OperationalFeaturePageProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const displayName = (user?.name || 'Admin');
  const config = featureCopy[feature];
  const HeaderIcon = config.icon;

  const [metrics, setMetrics] = useState([
    { label: 'Loading...', value: '-', detail: '', icon: <MapPin className="h-5 w-5" />, tone: 'bg-gray-50 text-gray-600' },
    { label: 'Loading...', value: '-', detail: '', icon: <Car className="h-5 w-5" />, tone: 'bg-gray-50 text-gray-600' },
    { label: 'Loading...', value: '-', detail: '', icon: <Zap className="h-5 w-5" />, tone: 'bg-gray-50 text-gray-600' }
  ]);
  const [rows, setRows] = useState<string[][]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<any[]>([]);
  const [vehicleData, setVehicleData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Derived stats for analytics feature
  const avgOccupancy = analyticsRows.length ? analyticsRows[0].avg_network_occupancy_pct ?? 0 : 0;
  const totalRevenue = analyticsRows.reduce((s, r) => s + Number(r.revenue_today), 0);
  const totalOverstays = analyticsRows.reduce((s, r) => s + Number(r.overstay_count), 0);
  const criticalLoc = analyticsRows.find(r => r.severity === 'CRITICAL') ?? analyticsRows.find(r => r.severity === 'WARNING');

  const barData = analyticsRows.map(r => ({
    name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14),
    activeCars: Number(r.active_cars),
    totalSlots: Number(r.total_spots),
    surgeMultiplier: r.severity === 'CRITICAL' ? 1.5 : 1.0,
  }));

  const forecastData = analyticsRows.map(r => ({
    name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14),
    current: Number(r.active_cars),
    forecast: Number(r.incoming_4h) + Number(r.active_cars),
    capacity: Number(r.total_spots),
  }));

  const deadlockLimit = analyticsRows.length ? Math.max(...analyticsRows.map(r => r.total_spots)) : 100;
  const TARGET_OCCUPANCY = 85;

  useEffect(() => {
    async function fetchData() {
      const { supabase } = await import('../../lib/supabase');
      
      // Instantly clear/reset stats to show sleek loading state and avoid stale mixtures
      setMetrics([
        { label: 'Loading...', value: '-', detail: 'Fetching latest operations...', icon: <MapPin className="h-5 w-5 animate-pulse text-[#ee6b20]" />, tone: 'bg-gray-50 text-gray-400' },
        { label: 'Loading...', value: '-', detail: 'Fetching latest operations...', icon: <Car className="h-5 w-5 animate-pulse text-[#ee6b20]" />, tone: 'bg-gray-50 text-gray-400' },
        { label: 'Loading...', value: '-', detail: 'Fetching latest operations...', icon: <Zap className="h-5 w-5 animate-pulse text-[#ee6b20]" />, tone: 'bg-gray-50 text-gray-400' }
      ]);
      setRows([]);
      
      if (feature === 'parking-areas') {
        const { data: locs } = await supabase.schema('parking_lot').rpc('get_locations_with_stats');
        if (locs) {
          const activeHubs = locs.filter((l: any) => l.is_active).length;
          const totalSlots = locs.reduce((sum: number, l: any) => sum + (l.total_spots || 0), 0);
          
          setMetrics([
            { label: 'Active Hubs', value: activeHubs.toString(), detail: `${activeHubs} healthy, ${locs.length - activeHubs} need review`, icon: <MapPin className="h-5 w-5" />, tone: 'bg-blue-50 text-blue-600' },
            { label: 'Total Slots', value: totalSlots.toLocaleString(), detail: 'Across all locations', icon: <Car className="h-5 w-5" />, tone: 'bg-orange-50 text-[#ee6b20]' },
            { label: 'EV Bays', value: '0', detail: 'Charging-ready spaces', icon: <Zap className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600' },
          ]);

          setRows(locs.map((l: any) => [
            l.name || 'Unknown',
            `${l.total_spots || 0} slots`,
            `${l.total_spots > 0 ? Math.round(((l.total_spots - (l.available_spots || 0)) / l.total_spots) * 100) : 0}% occupied`,
            l.status || 'Healthy'
          ]));
        }
      }

      if (feature === 'live-monitor') {
        const { data: bookings } = await supabase.schema('reservation').rpc('get_bookings_with_users');
        const { data: dashboard } = await supabase.schema('parking_lot').rpc('get_pakipark_dashboard');
        if (bookings) {
          const active = bookings.filter((b: any) => b.status === 'active' || b.status === 'ongoing');
          const upcoming = bookings.filter((b: any) => b.status === 'upcoming' || b.status === 'payment_pending');
          const incidents = dashboard ? dashboard.filter((d: any) => d.severity === 'CRITICAL' || d.severity === 'WARNING').length : 0;
          
          setMetrics([
            { label: 'Active Sessions', value: active.length.toString(), detail: 'Currently parked', icon: <Activity className="h-5 w-5 animate-pulse" />, tone: 'bg-blue-50 text-blue-600' },
            { label: 'Entry Queue', value: upcoming.length.toString(), detail: 'Across monitored gates', icon: <Clock className="h-5 w-5 animate-pulse" />, tone: 'bg-amber-50 text-amber-600' },
            { label: 'Open Incidents', value: incidents.toString(), detail: 'Needs operator action', icon: <AlertTriangle className="h-5 w-5 animate-pulse" />, tone: incidents > 0 ? 'bg-red-50 text-red-500 animate-bounce' : 'bg-emerald-50 text-emerald-600' },
          ]);

          setRows(active.map((b: any) => [
            b.reference || 'N/A',
            b.vehiclePlate || 'Unknown',
            b.locationName || 'Unknown Location',
            b.status || 'Active'
          ]));
        }
      }

      if (feature === 'analytics') {
        setIsLoadingAnalytics(true);
        const [dashRes, vehRes, payRes, revRes] = await Promise.all([
          supabase.schema('parking_lot').rpc('get_pakipark_dashboard'),
          supabase.schema('parking_lot').rpc('get_vehicle_distribution'),
          supabase.schema('parking_lot').rpc('get_payment_distribution'),
          supabase.schema('parking_lot').rpc('get_revenue_trend')
        ]);
        
        if (!dashRes.error && dashRes.data) setAnalyticsRows(dashRes.data);
        if (!vehRes.error && vehRes.data) setVehicleData(vehRes.data);
        if (!payRes.error && payRes.data) setPaymentData(payRes.data);
        if (!revRes.error && revRes.data) setRevenueTrend(revRes.data);
        
        if (dashRes.error) console.error('Analytics page fetch error:', dashRes.error.message);
        setIsLoadingAnalytics(false);
      }

      if (feature === 'user-acceptance') {
        const { data: staffData } = await supabase.schema('account').rpc('get_staff_accounts');
        if (staffData) {
          const partners = (staffData as any[]).filter((s: any) => s.role === 'business_partner');
          const tellers = (staffData as any[]).filter((s: any) => s.role === 'teller');
          const active = (staffData as any[]).filter((s: any) => s.is_verified).length;
          setMetrics([
            { label: 'Business Partners', value: partners.length.toString(), detail: `${partners.filter((s: any) => s.is_verified).length} active`, icon: <Users className="h-5 w-5" />, tone: 'bg-purple-50 text-purple-600' },
            { label: 'Tellers', value: tellers.length.toString(), detail: `${tellers.filter((s: any) => s.is_verified).length} active`, icon: <CheckCircle2 className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Active Staff', value: active.toString(), detail: 'Verified accounts', icon: <AlertTriangle className="h-5 w-5" />, tone: 'bg-blue-50 text-blue-600' },
          ]);
          setRows((staffData as any[]).map((s: any) => [
            s.full_name || '—',
            s.role === 'business_partner' ? 'Business Partner' : 'Teller',
            s.location_name || '— Not assigned',
            s.is_verified ? 'Active' : 'Inactive',
          ]));
        } else {
          setMetrics([
            { label: 'Business Partners', value: '0', detail: 'No partners found', icon: <Users className="h-5 w-5" />, tone: 'bg-purple-50 text-purple-600' },
            { label: 'Tellers', value: '0', detail: 'No tellers found', icon: <CheckCircle2 className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600' },
            { label: 'Active Staff', value: '0', detail: 'No verified accounts', icon: <AlertTriangle className="h-5 w-5" />, tone: 'bg-blue-50 text-blue-600' },
          ]);
          setRows([]);
        }
      }
    }
    fetchData();
  }, [feature]);

  const getHeaders = () => {
    if (feature === 'parking-areas') return ['HUB NAME', 'CAPACITY', 'OCCUPANCY', 'HEALTH STATUS'];
    if (feature === 'live-monitor') return ['REFERENCE', 'VEHICLE PLATE', 'LOCATION', 'STATUS'];
    if (feature === 'user-acceptance') return ['FULL NAME', 'ROLE', 'ASSIGNED LOCATION', 'STATUS'];
    return [];
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans text-[#1e3d5a] overflow-hidden">
      <PakiParkSidebar activeTab={feature} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
            <Search className="w-4 h-4 text-[#1e3d5a]/60" />
            <input
              type="text"
              placeholder={config.search}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-bold text-[#1e3d5a] leading-tight whitespace-nowrap">{displayName}</p>
              <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
                <button onClick={() => navigate('/pakipark/profile')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left font-semibold">
                  <User className="w-4 h-4 text-[#ee6b20]" /> Profile
                </button>
                <button onClick={() => navigate('/pakipark/settings')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left font-semibold">
                  <Settings className="w-4 h-4 text-[#ee6b20]" /> Settings
                </button>
                <div className="border-t border-[#1e3d5a]/10" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left font-semibold text-red-500">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section className="flex items-end justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ee6b20] shadow-sm">
                <HeaderIcon className="h-4 w-4" />
                PakiPark Operations
              </div>
              <h1 className="text-4xl font-black tracking-tight">{config.title}</h1>
              <p className="mt-2 text-sm font-medium italic text-[#1e3d5a]/60">{config.subtitle}</p>
            </div>
            <Button className="h-12 rounded-xl bg-[#ee6b20] px-5 font-black text-white hover:bg-[#ff7a2e]">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </section>

          {feature === 'analytics' ? (
            /* ANALYTICS SECTION */
            isLoadingAnalytics ? (
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-36 bg-white rounded-[2rem] border border-[#1e3d5a]/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Top Row - Northstar Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white rounded-[2rem] border-none shadow-sm overflow-hidden">
                    <CardContent className="p-7">
                      <p className="text-[10px] font-black text-[#1e3d5a]/40 uppercase tracking-widest mb-3">Slot Occupancy Rate</p>
                      <p className={`text-4xl font-black tracking-tight ${avgOccupancy >= 90 ? 'text-red-500' : avgOccupancy >= TARGET_OCCUPANCY ? 'text-emerald-500' : 'text-[#ee6b20]'}`}>{avgOccupancy.toFixed(1)}%</p>
                      <p className="text-xs font-medium text-[#1e3d5a]/50 mt-1">Network average across {analyticsRows.length} locations</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] font-bold text-[#1e3d5a]/40 mb-1">
                          <span>0%</span><span className="text-[#ee6b20]">Target {TARGET_OCCUPANCY}%</span><span>100%</span>
                        </div>
                        <div className="relative h-2 rounded-full bg-[#f4f7fa] overflow-hidden">
                          <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(avgOccupancy, 100)}%`, background: avgOccupancy >= 90 ? '#ef4444' : avgOccupancy >= TARGET_OCCUPANCY ? '#10b981' : '#ee6b20' }} />
                          <div className="absolute top-0 h-full w-0.5 bg-[#1e3d5a]/30" style={{ left: `${TARGET_OCCUPANCY}%` }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-[2rem] border-none shadow-sm overflow-hidden">
                    <CardContent className="p-7">
                      <p className="text-[10px] font-black text-[#1e3d5a]/40 uppercase tracking-widest mb-3">Real-Time Bypass Alert</p>
                      <p className={`text-4xl font-black tracking-tight ${criticalLoc?.severity === 'CRITICAL' ? 'text-red-500' : criticalLoc?.severity === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`}>{criticalLoc ? `${criticalLoc.forecast_capacity_pct.toFixed(0)}%` : 'No Alert'}</p>
                      <p className="text-xs font-medium text-[#1e3d5a]/50 mt-1">{criticalLoc ? `${criticalLoc.location_name} — 4h Deadlock Forecast` : 'All locations within safe range'}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white rounded-[2rem] border-none shadow-sm overflow-hidden">
                    <CardContent className="p-7">
                      <p className="text-[10px] font-black text-[#1e3d5a]/40 uppercase tracking-widest mb-3">Enforcement Queue</p>
                      <p className={`text-4xl font-black tracking-tight ${totalOverstays > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalOverstays}</p>
                      <p className="text-xs font-medium text-[#1e3d5a]/50 mt-1">{totalOverstays > 0 ? `${totalOverstays} vehicle(s) violating time limits` : 'No active overstay violations'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Supporting Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue Today', value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                    { label: 'Active Vehicles', value: String(analyticsRows.reduce((s, r) => s + Number(r.active_cars), 0)), icon: Car, color: '#ee6b20' },
                    { label: 'Incoming (Next 4h)', value: String(analyticsRows.reduce((s, r) => s + Number(r.incoming_4h), 0)), icon: TrendingUp, color: '#8b5cf6' },
                    { label: 'Active Locations', value: String(analyticsRows.length), icon: MapPin, color: '#1e3d5a' },
                  ].map(s => (
                    <Card key={s.label} className="bg-white rounded-[1.75rem] border-none shadow-sm">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${s.color}18` }}>
                          <s.icon size={20} style={{ color: s.color }} />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-[#1e3d5a]">{s.value}</p>
                          <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-wider">{s.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Middle Row - Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Descriptive Bar Chart */}
                  <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-lg font-bold text-[#1e3d5a]">Occupancy vs Capacity</CardTitle>
                      <p className="text-xs text-gray-400">Active cars per location with surge multiplier overlay</p>
                    </CardHeader>
                    <CardContent className="px-4 pb-6">
                      {barData.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">No data available</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <ComposedChart data={barData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8492a6' }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 2]} tick={{ fontSize: 10, fill: '#8492a6' }} tickFormatter={v => `${v}×`} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar yAxisId="left" dataKey="activeCars" name="Active Cars" fill="#1e3d5a" radius={[6,6,0,0]} maxBarSize={40} />
                            <Bar yAxisId="left" dataKey="totalSlots" name="Total Slots" fill="#e2e8f0" radius={[6,6,0,0]} maxBarSize={40} />
                            <Line yAxisId="right" type="monotone" dataKey="surgeMultiplier" name="Surge ×" stroke="#ee6b20" strokeWidth={2.5} dot={{ r: 4, fill: '#ee6b20' }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue Bar Chart */}
                  <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-lg font-bold text-[#1e3d5a]">Revenue by Location</CardTitle>
                      <p className="text-xs text-gray-400">Daily revenue generated across the network</p>
                    </CardHeader>
                    <CardContent className="px-4 pb-6">
                      {analyticsRows.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">No data available</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={analyticsRows.map(r => ({ name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14), revenue: Number(r.revenue_today) }))} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 10, fill: '#8492a6' }} tickFormatter={v => `₱${v/1000}k`} />
                            <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="revenue" name="Daily Revenue" fill="#10b981" radius={[6,6,0,0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Descriptive Analytics Row */}
                <div className="mt-8">
                  <h3 className="text-xl font-black text-[#1e3d5a] mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#ee6b20]"/> Descriptive Insights</h3>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Revenue Trend Line Chart */}
                    <Card className="bg-white rounded-[2.5rem] border-none shadow-sm xl:col-span-2">
                      <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-lg font-bold text-[#1e3d5a]">Historical Revenue Trend</CardTitle>
                        <p className="text-xs text-gray-400">Monthly revenue growth (Last 5 Months)</p>
                      </CardHeader>
                      <CardContent className="px-4 pb-6">
                        {revenueTrend.length === 0 ? (
                          <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">No data available</div>
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={revenueTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                              <defs>
                                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: '#8492a6' }} tickFormatter={(v) => `₱${(v/1000)}k`} axisLine={false} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} 
                                formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                              />
                              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#gRevenue)" activeDot={{ r: 6, fill: '#ee6b20', strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Breakdown Donuts */}
                    <div className="grid grid-rows-2 gap-6">
                      <Card className="bg-white rounded-[2rem] border-none shadow-sm">
                        <CardHeader className="px-6 py-4 pb-0">
                          <CardTitle className="text-sm font-bold text-[#1e3d5a]">Vehicle Mix</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-40 relative flex items-center justify-center">
                          {vehicleData.length === 0 ? (
                            <span className="text-[#1e3d5a]/30 font-bold text-xs">No data</span>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={vehicleData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f4f8" />
                                <XAxis dataKey="vehicle_type" tick={{ fontSize: 9, fill: '#8492a6', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#8492a6' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: 11 }} cursor={{ fill: 'rgba(30,61,90,0.05)' }} />
                                <Bar dataKey="count" fill="#ee6b20" radius={[4,4,0,0]} maxBarSize={30}>
                                  {vehicleData.map((e, i) => <Cell key={`cell-${i}`} fill={['#ee6b20', '#1e3d5a', '#10b981', '#8b5cf6'][i % 4]} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-white rounded-[2rem] border-none shadow-sm">
                        <CardHeader className="px-6 py-4 pb-0">
                          <CardTitle className="text-sm font-bold text-[#1e3d5a]">Payment Preferences</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-40 relative flex items-center justify-center">
                          {paymentData.length === 0 ? (
                            <span className="text-[#1e3d5a]/30 font-bold text-xs">No data</span>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={paymentData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f4f8" />
                                <XAxis dataKey="payment_method" tick={{ fontSize: 9, fill: '#8492a6', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#8492a6' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: 11 }} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                                <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} maxBarSize={30}>
                                  {paymentData.map((e, i) => <Cell key={`cell-${i}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i % 4]} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* STANDARD FLOW */
            <>
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {metrics.map((metric) => (
                  <Card key={metric.label} className="rounded-[28px] border-[#1e3d5a]/10 bg-white shadow-sm">
                    <CardContent className="p-7">
                      <div className={`mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${metric.tone}`}>
                        {metric.icon}
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1e3d5a]/70">{metric.label}</p>
                      <h2 className="mt-3 text-4xl font-black tracking-tight">{metric.value}</h2>
                      <p className="mt-2 text-sm font-bold text-[#8492a6]">{metric.detail}</p>
                    </CardContent>
                  </Card>
                ))}
              </section>

              <Card className="rounded-[32px] border-[#1e3d5a]/10 bg-white shadow-sm">
                <CardHeader className="border-b border-[#1e3d5a]/10 px-8 py-6">
                  <CardTitle className="text-xl font-black">{config.title} Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {rows.length > 0 && (
                    <div className="grid grid-cols-4 px-5 mb-4 text-[10px] font-black uppercase tracking-wider text-[#1e3d5a]/40">
                      {getHeaders().map(h => <span key={h}>{h}</span>)}
                    </div>
                  )}
                  <div className="grid gap-4">
                    {rows.map((row) => (
                      <div key={row[0]} className="grid grid-cols-4 items-center gap-4 rounded-2xl border border-[#1e3d5a]/10 bg-[#f8fafc] px-5 py-4">
                        {row.map((cell, index) => (
                          <span key={cell} className={index === 0 ? 'text-sm font-black' : 'text-sm font-bold text-[#1e3d5a]/65'}>
                            {cell}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

