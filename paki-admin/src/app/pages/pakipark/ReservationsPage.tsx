import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from '../../lib/router';
import { 
  MapPin, 
  Car,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  Download,
  Plus,
  Eye,
  Search,
  ChevronRight,
  Bell
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';

export default function ReservationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = (user?.name || 'Admin');



  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Today', value: '0', icon: <Calendar />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Active Now', value: '0', icon: <Car />, color: 'text-[#ee6b20]', bg: 'bg-orange-50' },
    { label: 'Upcoming', value: '0', icon: <Clock />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Revenue Today', value: '₱0', icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ]);

  useEffect(() => {
    async function fetchReservations() {
      setIsLoading(true);
      const { data, error } = await supabase.schema('reservation').rpc('get_bookings_with_users');
      
      if (!error && data) {
        const mapped = data.map((b: any) => ({
          id: b.reference || b.id.substring(0, 8),
          customer: b.profiles?.full_name || 'Unknown User',
          location: b.locationName || 'Unknown Location',
          spot: b.spot || 'N/A',
          date: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: b.timeSlot || 'N/A',
          status: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1)) : 'Active',
          amount: `₱${(Number(b.amount) || 0).toLocaleString()}`,
          vehicle: `${b.vehiclePlate || ''} ${b.vehicleType || ''}`.trim() || 'Unknown Vehicle'
        }));
        setReservations(mapped);

        // Stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = data.filter((b: any) => new Date(b.createdAt) >= today);
        const activeNow = data.filter((b: any) => b.status?.toLowerCase() === 'active').length;
        const upcoming = data.filter((b: any) => b.status?.toLowerCase() === 'upcoming').length;
        const revenue = todayBookings.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

        setStats([
          { label: 'Total Today', value: todayBookings.length.toString(), icon: <Calendar />, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Active Now', value: activeNow.toString(), icon: <Car />, color: 'text-[#ee6b20]', bg: 'bg-orange-50' },
          { label: 'Upcoming', value: upcoming.toString(), icon: <Clock />, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Revenue Today', value: `₱${revenue.toLocaleString()}`, icon: <DollarSign />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ]);
      }
      setIsLoading(false);
    }
    fetchReservations();
  }, []);

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden">
      <PakiParkSidebar activeTab="reservations" />

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] flex items-center justify-between px-10 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e3d5a] tracking-tight">Reservations</h1>
            <p className="text-xs font-bold text-[#8492a6] uppercase tracking-widest mt-0.5">Manage node bookings</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl px-4 h-12 w-64 group focus-within:border-[#1e3d5a] transition-all">
              <Search className="w-4 h-4 text-[#8492a6] mr-3" />
              <input type="text" placeholder="Search ID or Customer..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
            </div>
            
            <button className="relative p-3 bg-white border border-[#e2e8f0] rounded-2xl hover:border-[#ee6b20] transition-all">
              <Bell className="w-5 h-5 text-[#1e3d5a]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ee6b20] rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-[#e2e8f0]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1e3d5a] leading-none">{displayName}</p>
                <span className="text-[10px] font-bold text-[#ee6b20] uppercase tracking-tighter">Verified Partner</span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-2xl shadow-md flex items-center justify-center text-white font-black text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-10">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
             <div className="flex items-center gap-3">
              <Button variant="outline" className="border-[#e2e8f0] text-[#1e3d5a] font-bold rounded-xl h-12">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="border-[#e2e8f0] text-[#1e3d5a] font-bold rounded-xl h-12">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <Button className="bg-[#ee6b20] hover:bg-[#ff7a2e] text-white font-black rounded-xl h-12 px-6 uppercase text-[11px] tracking-widest shadow-lg shadow-orange-900/20">
              <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
              New Reservation
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-[#8492a6] uppercase tracking-widest">{stat.label}</p>
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>{stat.icon}</div>
                  </div>
                  <h2 className="text-3xl font-black text-[#1e3d5a] tracking-tight">{stat.value}</h2>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reservations Table */}
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[40px] overflow-hidden bg-white">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-xl font-black text-[#1e3d5a]">Active Bookings</CardTitle>
              <CardDescription className="text-sm text-[#8492a6] font-medium">Real-time terminal reservation logs</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-[#8492a6] text-[10px] font-black uppercase tracking-widest">
                      <th className="px-4 py-3">Reservation ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Location & Spot</th>
                      <th className="px-4 py-3">Time Schedule</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reservations.map((res, index) => (
                      <tr key={index} className="group hover:bg-[#f8fafc] transition-all">
                        <td className="px-4 py-5">
                          <p className="font-black text-[#1e3d5a] text-sm">{res.id}</p>
                          <p className="text-[10px] text-[#8492a6] font-bold mt-0.5">{res.date}</p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="font-bold text-[#1e3d5a] text-sm">{res.customer}</p>
                          <p className="text-xs text-[#8492a6] font-medium">{res.vehicle}</p>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#ee6b20]" />
                            <p className="font-bold text-[#1e3d5a] text-sm">{res.location}</p>
                          </div>
                          <p className="text-[10px] font-black text-[#ee6b20] uppercase ml-5 tracking-tighter">Spot: {res.spot}</p>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-2 text-[#1e3d5a] font-medium text-xs">
                            <Clock size={14} className="text-[#8492a6]" />
                            {res.time}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right font-black text-[#1e3d5a]">
                          {res.amount}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${
                            res.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                            res.status === 'Completed' ? 'bg-gray-100 text-gray-500' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <button className="inline-flex items-center gap-1.5 text-[#ee6b20] hover:text-[#ff7a2e] font-black text-xs uppercase tracking-widest group">
                            <Eye className="w-4 h-4" />
                            View Detail
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

