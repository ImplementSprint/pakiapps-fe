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

  // Tariff & Policy Configurator state
  const [baseRate, setBaseRate] = useState(50);
  const [isSurgeEnabled, setIsSurgeEnabled] = useState(true);
  const [surgeThreshold, setSurgeThreshold] = useState(85);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [isEscrowEnabled, setIsEscrowEnabled] = useState(true);
  const [gracePeriod, setGracePeriod] = useState(30);
  const [forfeitureFee, setForfeitureFee] = useState(50);

  // Simulator state
  const [simulatedOccupancy, setSimulatedOccupancy] = useState(80);

  // Derived simulator values
  const currentMultiplier = React.useMemo(() => {
    if (!isSurgeEnabled) return 1.0;
    return simulatedOccupancy >= surgeThreshold ? surgeMultiplier : 1.0;
  }, [isSurgeEnabled, simulatedOccupancy, surgeThreshold, surgeMultiplier]);

  const currentRate = React.useMemo(() => {
    return baseRate * currentMultiplier;
  }, [baseRate, currentMultiplier]);

  const simulatedSeverity = React.useMemo(() => {
    if (simulatedOccupancy >= 85) return 'CRITICAL';
    if (simulatedOccupancy >= 70) return 'WARNING';
    return 'STABLE';
  }, [simulatedOccupancy]);

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
            /* TARIFF & POLICY CONFIGURATOR REDESIGN */
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Panel: Tariff Settings */}
                <Card className="bg-white rounded-[2.5rem] border-none shadow-sm p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3d5a] flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#ee6b20]" /> Dynamic Tariff Rules
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Configure base rate tariffs and trigger parameters for occupancy-based surges.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Base Rate Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <label className="text-[#1e3d5a]">Base Hourly Rate</label>
                        <span className="text-[#ee6b20] font-black">₱{baseRate} / hr</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="150" 
                        step="5"
                        value={baseRate}
                        onChange={(e) => setBaseRate(Number(e.target.value))}
                        className="w-full accent-[#ee6b20] bg-gray-100 h-2 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Dynamic Surge Switch */}
                    <div className="flex items-center justify-between p-4 bg-[#f4f7fa] rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-[#1e3d5a]">Dynamic Occupancy Surcharges</p>
                        <p className="text-[10px] text-gray-400 font-medium">Auto-scale pricing during peak demand spikes</p>
                      </div>
                      <button 
                        onClick={() => setIsSurgeEnabled(!isSurgeEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isSurgeEnabled ? 'bg-[#ee6b20]' : 'bg-gray-200'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${isSurgeEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {isSurgeEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-[#f4f7fa] rounded-3xl animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Trigger Threshold</span>
                            <span className="text-[#1e3d5a]">{surgeThreshold}% occupancy</span>
                          </div>
                          <input 
                            type="range" 
                            min="60" 
                            max="95" 
                            value={surgeThreshold}
                            onChange={(e) => setSurgeThreshold(Number(e.target.value))}
                            className="w-full accent-[#ee6b20]"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Surge Multiplier</span>
                            <span className="text-[#ee6b20]">{surgeMultiplier}×</span>
                          </div>
                          <input 
                            type="range" 
                            min="1.1" 
                            max="2.5" 
                            step="0.1"
                            value={surgeMultiplier}
                            onChange={(e) => setSurgeMultiplier(Number(e.target.value))}
                            className="w-full accent-[#ee6b20]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Right Panel: Escrow Settings */}
                <Card className="bg-white rounded-[2.5rem] border-none shadow-sm p-8 space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3d5a] flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" /> Escrow & Violation Rules
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Configure penalty rates and enforcement parameters for booking violations.</p>
                  </div>

                  <div className="space-y-6">
                    {/* Escrow Toggle */}
                    <div className="flex items-center justify-between p-4 bg-[#f4f7fa] rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-[#1e3d5a]">Escrow Forfeiture Policy</p>
                        <p className="text-[10px] text-gray-400 font-medium">Forfeit reservation deposits on overstays or no-shows</p>
                      </div>
                      <button 
                        onClick={() => setIsEscrowEnabled(!isEscrowEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isEscrowEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${isEscrowEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {isEscrowEnabled && (
                      <div className="space-y-6 p-6 border border-[#f4f7fa] rounded-3xl animate-in slide-in-from-top-2 duration-300">
                        {/* Grace Period */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Violation Grace Period</span>
                            <span className="text-emerald-600">{gracePeriod} minutes</span>
                          </div>
                          <input 
                            type="range" 
                            min="5" 
                            max="60" 
                            step="5"
                            value={gracePeriod}
                            onChange={(e) => setGracePeriod(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </div>

                        {/* Penalty Fee */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Forfeiture Penalty Fee</span>
                            <span className="text-emerald-600">{forfeitureFee}% of deposit</span>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="5"
                            value={forfeitureFee}
                            onChange={(e) => setForfeitureFee(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Bottom Section: Interactive Policy Simulator */}
              <Card className="bg-white rounded-[2.5rem] border-none shadow-sm p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" /> Interactive Policy Simulator
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Simulate parking occupancy load to test dynamic rate actions and enforcement alerts.</p>
                </div>

                <div className="space-y-6 p-6 bg-[#f4f7fa] rounded-3xl">
                  {/* Simulator Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-black">
                      <span className="text-gray-400 uppercase tracking-widest text-[10px]">Simulated Occupancy</span>
                      <span className={`text-lg ${
                        simulatedOccupancy >= 85 ? 'text-red-500' : simulatedOccupancy >= 70 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>{simulatedOccupancy}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={simulatedOccupancy}
                      onChange={(e) => setSimulatedOccupancy(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                    />
                  </div>

                  {/* Simulator Results Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1e3d5a]/5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Surge Multiplier</p>
                      <p className="text-lg font-black text-[#1e3d5a] mt-1">{currentMultiplier.toFixed(1)}×</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1e3d5a]/5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hourly Tariff</p>
                      <p className="text-lg font-black text-[#ee6b20] mt-1">₱{currentRate.toFixed(0)} / hr</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1e3d5a]/5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alert Level</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        simulatedSeverity === 'CRITICAL' ? 'bg-red-50 text-red-600 border border-red-100' :
                        simulatedSeverity === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {simulatedSeverity}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1e3d5a]/5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enforcement Engine</p>
                      <p className={`text-xs font-bold mt-1.5 ${
                        simulatedOccupancy >= 85 ? 'text-red-500' : simulatedOccupancy >= 70 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {simulatedOccupancy >= 85 ? 'Trigger Surge Surcharges' : 
                         simulatedOccupancy >= 70 ? 'Escrow Forfeiture Armed' : 
                         'No Surcharges Active'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
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

