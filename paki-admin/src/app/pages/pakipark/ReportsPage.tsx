import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ChevronDown,
  Search,
  User,
  Settings,
  LogOut,
  Map,
  Filter,
  Clock,
  Ban,
  CircleCheck,
  Car,
  Zap,
  Bike,
  Truck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';

type DateRange = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Year to Date';

export default function ReportsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('Year to Date');

  const displayName = (user?.name || 'Admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // --- DATA MAPPING ---
  // --- DATA MAPPING ---
  const [dataMap, setDataMap] = useState<any>({
    "Today": { revenue: "₱0", bookings: "0", active: "0", cancelled: "0", chartData: [] },
    "Last 7 Days": { revenue: "₱0", bookings: "0", active: "0", cancelled: "0", chartData: [] },
    "Last 30 Days": { revenue: "₱0", bookings: "0", active: "0", cancelled: "0", chartData: [] },
    "Year to Date": { revenue: "₱0", bookings: "0", active: "0", cancelled: "0", chartData: [] }
  });

  const [vehicleDistribution, setVehicleDistribution] = useState([
    { type: 'Sedans', percentage: 0, icon: <Car className="w-5 h-5" />, color: '#1e3d5a', sub: 'Standard Slots' },
    { type: 'SUVs', percentage: 0, icon: <Truck className="w-5 h-5" />, color: '#ee6b20', sub: 'Large Slots' },
    { type: 'Motorcycles', percentage: 0, icon: <Bike className="w-5 h-5" />, color: '#2a5373', sub: 'Compact Slots' },
    { type: 'Electric (EV)', percentage: 0, icon: <Zap className="w-5 h-5" />, color: '#10b981', sub: 'Charging Slots' },
  ]);

  const [topHubs, setTopHubs] = useState<any[]>([]);

  React.useEffect(() => {
    async function fetchReports() {
      const { supabase } = await import('../../lib/supabase');
      const { data: bookings } = await supabase.schema('reservation').rpc('get_bookings_with_users');
      const { data: locs } = await supabase.schema('parking_lot').rpc('get_locations_with_stats');

      if (bookings) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last7 = new Date();
        last7.setDate(last7.getDate() - 7);

        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);

        const ytd = new Date();
        ytd.setMonth(0, 1);
        ytd.setHours(0,0,0,0);

        const processData = (startDate: Date) => {
          const filtered = bookings.filter((b: any) => new Date(b.createdAt) >= startDate);
          return {
            revenue: `₱${filtered.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0).toLocaleString()}`,
            bookings: filtered.length.toString(),
            active: filtered.filter((b: any) => b.status === 'active' || b.status === 'ongoing').length.toString(),
            cancelled: filtered.filter((b: any) => b.status === 'cancelled').length.toString(),
            chartData: [
              { label: 'Current', revenue: filtered.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0) },
              { label: 'Previous', revenue: 0 } // simplified
            ]
          };
        };

        setDataMap({
          "Today": processData(today),
          "Last 7 Days": processData(last7),
          "Last 30 Days": processData(last30),
          "Year to Date": processData(ytd)
        });

        // Vehicles
        let sedans = 0, suvs = 0, motors = 0, evs = 0;
        bookings.forEach((b: any) => {
          const t = b.vehicleType?.toLowerCase() || '';
          if (t.includes('suv') || t.includes('van') || t.includes('truck')) suvs++;
          else if (t.includes('motor') || t.includes('bike')) motors++;
          else if (t.includes('ev') || t.includes('electric')) evs++;
          else sedans++;
        });
        const total = sedans + suvs + motors + evs || 1;
        
        setVehicleDistribution([
          { type: 'Sedans', percentage: Math.round((sedans/total)*100), icon: <Car className="w-5 h-5" />, color: '#1e3d5a', sub: 'Standard Slots' },
          { type: 'SUVs', percentage: Math.round((suvs/total)*100), icon: <Truck className="w-5 h-5" />, color: '#ee6b20', sub: 'Large Slots' },
          { type: 'Motorcycles', percentage: Math.round((motors/total)*100), icon: <Bike className="w-5 h-5" />, color: '#2a5373', sub: 'Compact Slots' },
          { type: 'Electric (EV)', percentage: Math.round((evs/total)*100), icon: <Zap className="w-5 h-5" />, color: '#10b981', sub: 'Charging Slots' },
        ]);

        if (locs) {
          const hubs = locs.map((l: any) => {
            const locBookings = bookings.filter((b: any) => b.location_id === l.id);
            const rev = locBookings.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
            return {
              hub: l.name,
              bookings: locBookings.length,
              revenue: `₱${rev.toLocaleString()}`,
              growth: '+0%',
              percentage: l.total_spots > 0 ? Math.round(((l.total_spots - (l.available_spots || 0)) / l.total_spots) * 100) : 0,
              rawRev: rev
            };
          }).sort((a: any, b: any) => b.rawRev - a.rawRev).slice(0, 3);
          setTopHubs(hubs);
        }
      }
    }
    fetchReports();
  }, []);

  const activeData = dataMap[dateRange] || dataMap["Year to Date"];
  const dateRanges = Object.keys(dataMap) as DateRange[];
  const maxRevenue = useMemo(() => {
    if (!activeData.chartData || activeData.chartData.length === 0) return 1;
    return Math.max(...activeData.chartData.map((d: any) => d.revenue));
  }, [activeData]);

  const handleExport = () => {
    const headers = ["Period", "Revenue (PHP)"];
    const rows = activeData.chartData.map((d: any) => [d.label, d.revenue]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PakiPark_${dateRange.replace(/ /g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans text-[#1e3d5a] overflow-hidden">
      <PakiParkSidebar activeTab="reports" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- NAVBAR --- */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
              <Search className="w-4 h-4 text-[#1e3d5a]/60" />
              <input
                type="text"
                placeholder="Search parking analytics..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#1e3d5a]/10"></div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                  <button onClick={() => navigate('/pakipark/profile')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] transition-colors text-left font-semibold">
                    <User className="w-4 h-4 text-[#ee6b20]" /> Profile
                  </button>
                  <button onClick={() => navigate('/pakipark/settings')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] transition-colors text-left font-semibold">
                    <Settings className="w-4 h-4 text-[#ee6b20]" /> Settings
                  </button>
                  <div className="border-t border-[#1e3d5a]/10"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left font-semibold text-red-500">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          {/* Header Section */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-black text-[#1e3d5a] tracking-tight">System Reports</h1>
              <p className="text-[#1e3d5a] opacity-60 font-medium italic">Comprehensive parking reservation performance metrics.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Button 
                  variant="outline"
                  className="bg-white border-[#1e3d5a]/20 text-[#1e3d5a] rounded-xl font-bold hover:bg-[#f4f7fa] min-w-[160px] justify-between h-11"
                >
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-[#ee6b20]" />
                    {dateRange}
                  </div>
                  <Filter className="w-3 h-3 ml-2 opacity-50" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#1e3d5a]/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
                  {dateRanges.map((range) => (
                    <button 
                      key={range} 
                      onClick={() => setDateRange(range)}
                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${dateRange === range ? 'bg-[#ee6b20] text-white' : 'hover:bg-[#f4f7fa] text-[#1e3d5a]'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleExport}
                className="bg-[#ee6b20] hover:bg-[#ff7a2e] text-white rounded-xl shadow-lg shadow-orange-900/10 h-11 px-6 uppercase text-[10px] tracking-widest font-bold"
              >
                <Download className="w-4 h-4 mr-2" /> Export Data
              </Button>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Total Revenue" value={activeData.revenue} trend="+14.2%" trendUp={true} icon={<DollarSign className="w-4 h-4" />} />
            <StatCard label="Total Bookings" value={activeData.bookings} trend="+9.5%" trendUp={true} icon={<CircleCheck className="w-4 h-4" />} />
            <StatCard label="Active Parking" value={activeData.active} trend="-4.1%" trendUp={true} icon={<Clock className="w-4 h-4" />} />
            <StatCard label="Cancelled" value={activeData.cancelled} trend="+0.5%" trendUp={false} icon={<Ban className="w-4 h-4" />} />
          </div>

          {/* Revenue Bar Chart */}
          <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden border border-[#1e3d5a]/5">
            <CardHeader className="p-8 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-[#1e3d5a]">Revenue Analysis ({dateRange})</CardTitle>
                  <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mt-1">Financial Data Stream</p>
                </div>
                <div className="bg-[#f4f7fa] px-4 py-1.5 rounded-full border border-[#1e3d5a]/10">
                  <span className="text-[10px] font-black text-[#ee6b20] uppercase tracking-widest">Total: {activeData.revenue}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-end justify-between gap-3 h-72 px-2 pt-10">
                {activeData.chartData.map((data: any, index: number) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-4 h-full group relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e3d5a] text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-10 font-bold shadow-xl">
                      ₱{data.revenue >= 1000000 ? `${(data.revenue / 1000000).toFixed(1)}M` : `${(data.revenue / 1000).toFixed(0)}K`}
                    </div>
                    <div className="w-full flex flex-col justify-end h-full relative">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out hover:scale-x-105 cursor-pointer shadow-sm bg-gradient-to-t from-[#1e3d5a] to-[#2a5373] group-hover:from-[#ee6b20] group-hover:to-[#ff7a2e]`}
                        style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                      >
                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"></div>
                      </div>
                    </div>
                    <p className="text-[9px] font-black text-[#1e3d5a]/60 tracking-tighter uppercase group-hover:text-[#ee6b20] transition-colors">{data.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Secondary Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
            {/* Hub Efficiency (Fixed Height 400px) */}
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden border border-[#1e3d5a]/5 flex flex-col h-[400px]">
              <CardHeader className="p-8 pb-4 shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-[#1e3d5a] flex items-center gap-2">
                    <Map className="w-5 h-5 text-[#ee6b20]" /> Top Performing Areas
                  </CardTitle>
                  <span className="text-[10px] font-black text-[#ee6b20] bg-orange-50 px-2 py-1 rounded-lg uppercase tracking-wider">Live Metrics</span>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                {topHubs.map((hub, index) => (
                  <div key={index} className="group cursor-pointer pr-2">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-[#f4f7fa] flex items-center justify-center text-[#1e3d5a] font-bold text-sm border border-[#1e3d5a]/10 group-hover:bg-[#ee6b20] group-hover:text-white transition-all">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1e3d5a] group-hover:text-[#ee6b20] transition-colors">{hub.hub}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{hub.growth} growth vs last month</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-[#1e3d5a]">{hub.revenue}</p>
                        <p className="text-[9px] font-bold text-[#ee6b20]">{hub.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#ee6b20]">Occupancy Rate</span>
                        <span className="text-[10px] font-black text-[#1e3d5a]">{hub.percentage}%</span>
                      </div>
                      <div className="overflow-hidden h-1.5 flex rounded-full bg-[#f4f7fa]">
                        <div 
                          style={{ width: `${hub.percentage}%` }}
                          className="bg-gradient-to-r from-[#ee6b20] to-[#1e3d5a] transition-all duration-1000"
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Vehicle Type Distribution (Matched Height 400px, Non-Scrollable) */}
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden border border-[#1e3d5a]/5 flex flex-col h-[400px]">
              <CardHeader className="p-8 pb-4 shrink-0">
                <CardTitle className="text-xl font-bold text-[#1e3d5a]">Vehicle Distribution</CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8 flex-1 -mt-8">
                {/* grid-cols-2 and h-full ensures cards fill the 400px height without scrolling */}
                <div className="grid grid-cols-2 gap-4 w-full h-full">
                  {vehicleDistribution.map((item, index) => (
                    <div key={index} className="group flex flex-col gap-2 p-4 rounded-[2rem] bg-[#f4f7fa]/80 border border-[#1e3d5a]/10 items-center text-center hover:bg-white hover:shadow-xl transition-all duration-500 justify-center">
                      <div className="w-14 h-14 rounded-full border-4 border-white shadow-sm flex items-center justify-center relative shrink-0"
                           style={{ background: `conic-gradient(${item.color} ${item.percentage}%, #e2e8f0 0)` }}>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1e3d5a]">
                          {item.icon}
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-center gap-1.5">
                            <p className="text-xs font-black text-[#1e3d5a] leading-tight">{item.type}</p>
                            <span className="text-[10px] font-black text-[#ee6b20]">{item.percentage}%</span>
                        </div>
                        <p className="font-bold text-gray-400 text-[8px] uppercase tracking-widest mt-0.5">{item.sub}</p>
                      </div>
                      <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-1">
                        <div 
                            className="h-full transition-all duration-1000" 
                            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f7fa;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ee6b20;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-all border border-[#1e3d5a]/5">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-2 bg-[#f4f7fa] rounded-lg text-[#ee6b20]">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#1e3d5a]">{value}</p>
      </div>
      <div className="absolute -bottom-2 -right-2 text-[#ee6b20] opacity-[0.03] scale-[2.5] transition-transform group-hover:scale-[3]">
        {icon}
      </div>
    </div>
  );
}

