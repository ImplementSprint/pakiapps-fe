'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from '../../lib/router';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import {
  ComposedChart, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Legend,
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp, Car, DollarSign,
  MapPin, RefreshCw, ChevronDown, User, Settings, LogOut, Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

interface LocationRow {
  location_id: string;
  location_name: string;
  total_spots: number;
  active_cars: number;
  occupancy_pct: number;
  overstay_count: number;
  revenue_today: number;
  base_rate: number;
  forecast_capacity_pct: number;
  incoming_4h: number;
  prescriptive_action: string;
  severity: 'CRITICAL' | 'WARNING' | 'STABLE';
  avg_network_occupancy_pct: number;
}

const TARGET_OCCUPANCY = 85;

const severityConfig = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700', icon: AlertTriangle, action: 'Apply 1.5× Surge Pricing' },
  WARNING: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: Clock, action: 'Execute Escrow Forfeiture' },
  STABLE: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, action: 'No Action Required' },
};

function SkeletonCard() {
  return <div className="h-36 bg-white rounded-[2rem] border border-[#1e3d5a]/5 animate-pulse" />;
}

function NorthstarCard({ label, value, sub, pct, target, color }: {
  label: string;
  value: string;
  sub: string;
  pct?: number;
  target?: number;
  color: string;
}) {
  return (
    <Card className="bg-white rounded-[2rem] border-none shadow-sm overflow-hidden">
      <CardContent className="p-7">
        <p className="text-[10px] font-black text-[#1e3d5a]/40 uppercase tracking-widest mb-3">{label}</p>
        <p className={`text-4xl font-black tracking-tight ${color}`}>{value}</p>
        <p className="text-xs font-medium text-[#1e3d5a]/50 mt-1">{sub}</p>
        {pct !== undefined && target !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-[#1e3d5a]/40 mb-1">
              <span>0%</span>
              <span className="text-[#ee6b20]">Target {target}%</span>
              <span>100%</span>
            </div>
            <div className="relative h-2 rounded-full bg-[#f4f7fa] overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct >= 90 ? '#ef4444' : pct >= target ? '#10b981' : '#ee6b20',
                }}
              />
              <div className="absolute top-0 h-full w-0.5 bg-[#1e3d5a]/30" style={{ left: `${target}%` }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || 'Admin';

  const [rows, setRows] = useState<LocationRow[]>([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actuating, setActuating] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase.schema('parking_lot').rpc('get_pakipark_dashboard');
    if (!error && data) setRows(data as LocationRow[]);
    else if (error) console.error('Dashboard fetch error:', error.message);

    const { data: vehiclesData, error: vehError } = await supabase
      .schema('teller')
      .rpc('get_vehicles_with_profiles');
    if (!vehError && vehiclesData) {
      setTotalVehicles(vehiclesData.length);
    } else if (vehError) {
      console.error('Failed to fetch total vehicles:', vehError.message);
    }

    setIsLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActuate = async (row: LocationRow) => {
    setActuating(row.location_id);
    await supabase.rpc('log_actuation', {
      p_platform: 'pakipark',
      p_location_id: row.location_id,
      p_threat_detected: row.prescriptive_action,
      p_action_taken: severityConfig[row.severity].action,
    });
    setActuating(null);
    setSuccessMsg(`Action logged for ${row.location_name}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Derived stats
  const avgOccupancy = rows.length ? rows[0].avg_network_occupancy_pct ?? 0 : 0;
  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue_today), 0);
  const totalOverstays = rows.reduce((s, r) => s + Number(r.overstay_count), 0);
  const criticalLoc = rows.find(r => r.severity === 'CRITICAL') ?? rows.find(r => r.severity === 'WARNING');

  // Chart data
  const barData = rows.map(r => ({
    name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14),
    activeCars: Number(r.active_cars),
    totalSlots: Number(r.total_spots),
    surgeMultiplier: r.severity === 'CRITICAL' ? 1.5 : 1.0,
  }));

  const forecastData = rows.map(r => ({
    name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14),
    current: Number(r.active_cars),
    forecast: Number(r.incoming_4h) + Number(r.active_cars),
    capacity: Number(r.total_spots),
  }));

  const revenueData = rows.map(r => ({
    name: r.location_name.replace('PakiPark ', '').replace(' Parking', '').slice(0, 14),
    revenue: Number(r.revenue_today),
  }));

  const deadlockLimit = rows.length ? Math.max(...rows.map(r => r.total_spots)) : 100;

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a]">
      <style dangerouslySetInnerHTML={{ __html: `.csb::-webkit-scrollbar{width:5px}.csb::-webkit-scrollbar-thumb{background:#1e3d5a20;border-radius:8px}` }} />
      <PakiParkSidebar activeTab="dashboard" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#ee6b20]" />
            <span className="text-sm font-bold text-[#1e3d5a]/60">
              Live Ops · last refresh{' '}
              <span className="text-[#1e3d5a]">{lastRefresh.toLocaleTimeString()}</span>
            </span>
            <button
              onClick={fetchData}
              className="p-1.5 hover:bg-[#f4f7fa] rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-[#1e3d5a]/40" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {successMsg && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-[#1e3d5a] hidden md:block">{displayName}</span>
                <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/profile'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"
                  >
                    <User className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold">Profile</span>
                  </button>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/settings'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"
                  >
                    <Settings className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold">Settings</span>
                  </button>
                  <div className="border-t border-[#1e3d5a]/10" />
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8 csb">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-black text-[#1e3d5a] tracking-tight">Operations Dashboard</h1>
            <p className="text-[#1e3d5a]/50 font-medium italic mt-1">
              North Star: Slot Occupancy Rate · Target{' '}
              <span className="text-[#ee6b20] font-bold">85%</span>
            </p>
          </div>

          {/* TOP ROW — Northstar Cards */}
          {isLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <NorthstarCard
                label="Slot Occupancy Rate"
                value={`${avgOccupancy.toFixed(1)}%`}
                sub={`Network average across ${rows.length} locations`}
                pct={avgOccupancy}
                target={TARGET_OCCUPANCY}
                color={avgOccupancy >= 90 ? 'text-red-500' : avgOccupancy >= TARGET_OCCUPANCY ? 'text-emerald-500' : 'text-[#ee6b20]'}
              />
              <NorthstarCard
                label="Real-Time Bypass Alert"
                value={criticalLoc ? `${criticalLoc.forecast_capacity_pct.toFixed(0)}%` : 'No Alert'}
                sub={
                  criticalLoc
                    ? `${criticalLoc.location_name} — 4h Deadlock Forecast`
                    : 'All locations within safe range'
                }
                color={
                  criticalLoc?.severity === 'CRITICAL'
                    ? 'text-red-500'
                    : criticalLoc?.severity === 'WARNING'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                }
              />
              <NorthstarCard
                label="Enforcement Queue"
                value={String(totalOverstays)}
                sub={
                  totalOverstays > 0
                    ? `${totalOverstays} vehicle(s) violating time limits`
                    : 'No active overstay violations'
                }
                color={totalOverstays > 0 ? 'text-red-500' : 'text-emerald-500'}
              />
            </div>
          )}

          {/* Supporting Stats */}
          {!isLoading && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue Today', value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                { label: 'Active Vehicles', value: String(totalVehicles), icon: Car, color: '#ee6b20' },
                { label: 'Incoming (Next 4h)', value: String(rows.reduce((s, r) => s + Number(r.incoming_4h), 0)), icon: TrendingUp, color: '#8b5cf6' },
                { label: 'Active Locations', value: String(rows.length), icon: MapPin, color: '#1e3d5a' },
              ].map(s => (
                <Card key={s.label} className="bg-white rounded-[1.75rem] border-none shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${s.color}18` }}
                    >
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
          )}

          {/* MIDDLE ROW — Charts */}
          <div className="grid grid-cols-2 gap-6">

            {/* Occupancy vs Capacity — Composed Bar + Line */}
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-bold text-[#1e3d5a]">Occupancy vs Capacity</CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Active cars per location with surge multiplier overlay
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                {isLoading ? (
                  <div className="h-52 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ee6b20]" />
                  </div>
                ) : barData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={barData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#8492a6' }} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 2]}
                        tick={{ fontSize: 10, fill: '#8492a6' }}
                        tickFormatter={v => `${v}×`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="activeCars" name="Active Cars" fill="#1e3d5a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar yAxisId="left" dataKey="totalSlots" name="Total Slots" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="surgeMultiplier"
                        name="Surge ×"
                        stroke="#ee6b20"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#ee6b20' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Location — Bar Chart */}
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-bold text-[#1e3d5a]">Revenue by Location</CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Daily revenue generated across the network
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-6">
                {isLoading ? (
                  <div className="h-52 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ee6b20]" />
                  </div>
                ) : revenueData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#8492a6' }}
                        tickFormatter={v => `₱${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="Daily Revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 4h Bypass Lane Forecast — Full Width Area Chart */}
          <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold text-[#1e3d5a]">4h Bypass Lane Forecast</CardTitle>
              <CardDescription className="text-xs text-gray-400">
                Forecasted vehicle volume vs physical capacity limit
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-6">
              {isLoading ? (
                <div className="h-52 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ee6b20]" />
                </div>
              ) : forecastData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-[#1e3d5a]/30 font-bold text-sm">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={forecastData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="gCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3d5a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1e3d5a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ee6b20" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ee6b20" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8492a6', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8492a6' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine
                      y={deadlockLimit}
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      label={{
                        value: '⚠ Deadlock Limit',
                        position: 'insideTopRight',
                        fontSize: 10,
                        fill: '#ef4444',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="current"
                      name="Current"
                      stroke="#1e3d5a"
                      strokeWidth={2}
                      fill="url(#gCurrent)"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast (4h)"
                      stroke="#ee6b20"
                      strokeWidth={2}
                      fill="url(#gForecast)"
                      strokeDasharray="5 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* BOTTOM ROW — Prescriptive Actuations */}
          <Card className="bg-white rounded-[2.5rem] border-none shadow-sm">
            <CardHeader className="p-8 border-b border-[#f4f7fa]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#f4f7fa] rounded-2xl text-[#ee6b20]">
                  <Zap size={22} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#1e3d5a]">Automated Actuations</CardTitle>
                  <CardDescription className="text-xs text-gray-400">
                    Prescriptive actions required across the network
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-[#f4f7fa] rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1e3d5a]/40">No locations detected</p>
                </div>
              ) : (
                rows.map(row => {
                  const cfg = severityConfig[row.severity];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={row.location_id}
                      className={`flex items-start justify-between p-6 rounded-2xl border ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2.5 rounded-xl ${cfg.badge.split(' ')[0]}`}>
                          <Icon size={18} className={cfg.text} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badge} uppercase tracking-widest`}>
                              {row.severity}
                            </span>
                            <span className="font-bold text-sm text-[#1e3d5a]">{row.location_name}</span>
                          </div>
                          <p className="text-xs text-[#1e3d5a]/70 font-medium leading-relaxed mb-2">
                            {row.prescriptive_action}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-wider">
                            <span>🚗 {row.active_cars}/{row.total_spots} slots</span>
                            <span>📈 {row.occupancy_pct.toFixed(0)}% occupancy</span>
                            <span>⏱ {row.overstay_count} overstay{row.overstay_count !== 1 ? 's' : ''}</span>
                            <span>🔮 {row.forecast_capacity_pct.toFixed(0)}% forecast</span>
                          </div>
                        </div>
                      </div>

                      {row.severity !== 'STABLE' && (
                        <Button
                          disabled={actuating === row.location_id}
                          onClick={() => handleActuate(row)}
                          className={`ml-6 shrink-0 rounded-xl font-bold text-xs px-5 py-2.5 shadow-md transition-all ${row.severity === 'CRITICAL'
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-amber-500 hover:bg-amber-600 text-white'
                            } disabled:opacity-50`}
                        >
                          {actuating === row.location_id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : cfg.action
                          }
                        </Button>
                      )}

                      {row.severity === 'STABLE' && (
                        <span className="ml-6 text-[10px] font-bold text-emerald-500 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={14} /> On Target
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}