import React, { useState, useMemo } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Filter,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardTitle, CardHeader, CardContent } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';

// MODAL IMPORT
import AddNewHub from './components/AddNewHub';

type BookingStatus = 'active' | 'upcoming' | 'completed' | 'cancelled';
type PaymentStatus = 'paid' | 'pending' | 'partial';

interface BookingRecord {
  amount: number;
  date: string;
  duration: string;
  id: string;
  locationName: string;
  paymentStatus: PaymentStatus;
  reference: string;
  status: BookingStatus;
  timeSlot: string;
  userName: string;
  vehiclePlate: string;
}

export default function BookingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // PAKISHIP FILTER LOGIC
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const displayName = (user?.name || 'Admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleExport = () => {
    console.log("Exporting booking records...");
    alert("Exporting booking records to CSV...");
  };

  // --- BOOKINGS TABLE DATA ---
  const [initialBookings, setInitialBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function fetchBookings() {
      setIsLoading(true);
      const { data, error } = await import('../../lib/supabase').then(mod => mod.supabase.schema('reservation').rpc('get_bookings_with_users'));
      
      if (!error && data) {
        const mapped: BookingRecord[] = data.map((b: any) => {
          let duration = 'N/A';
          if (b.checkInAt && b.checkOutAt) {
            const diffMs = new Date(b.checkOutAt).getTime() - new Date(b.checkInAt).getTime();
            const diffHrs = Math.round(diffMs / 3600000);
            duration = `${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`;
          }
          return {
            id: b.id,
            reference: b.reference || 'N/A',
            userName: b.profiles?.full_name || 'Unknown User',
            vehiclePlate: b.vehiclePlate || 'N/A',
            locationName: b.locationName || 'Unknown Location',
            status: (b.status?.toLowerCase() as BookingStatus) || 'upcoming',
            amount: Number(b.amount) || 0,
            timeSlot: b.timeSlot || 'N/A',
            date: b.date || new Date(b.createdAt).toISOString().split('T')[0],
            duration,
            paymentStatus: (b.paymentStatus?.toLowerCase() as PaymentStatus) || 'pending',
          };
        });
        setInitialBookings(mapped);
      }
      setIsLoading(false);
    }
    fetchBookings();
  }, []);

  // PAKISHIP MEMOIZED FILTER LOGIC
  const filteredBookings = useMemo(() => {
    return initialBookings.filter((booking) => {
      const matchesSearch = 
        booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || booking.status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, initialBookings]);

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-100",
      upcoming: "bg-blue-50 text-blue-600 border-blue-100",
      completed: "bg-gray-50 text-gray-600 border-gray-100",
      cancelled: "bg-red-50 text-red-600 border-red-100",
    };
    return <Badge className={`uppercase text-[10px] tracking-widest font-bold ${styles[status]}`}>{status}</Badge>;
  };

  const getPaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs"><CheckCircle2 size={14} /> Paid</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 text-amber-500 font-bold text-xs"><Timer size={14} /> Pending</span>;
      case 'partial':
        return <span className="flex items-center gap-1.5 text-blue-500 font-bold text-xs"><AlertCircle size={14} /> Partial</span>;
      default:
        return <span className="text-[#1e3d5a]/40 text-xs">N/A</span>;
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a]">
      <AddNewHub isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <PakiParkSidebar activeTab="bookings" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- NAVBAR --- */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
              <Search className="w-4 h-4 text-[#1e3d5a]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for reservations, parking slots, or facility locations..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]"
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
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <User className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Profile</span>
                  </button>
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <Settings className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Settings</span>
                  </button>
                  <div className="border-t border-[#1e3d5a]/10"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT BODY --- */}
        <main className="flex-1 overflow-auto p-10">
          <section className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1e3d5a] tracking-tight">Facility Management</h1>
              <p className="text-[#1e3d5a] opacity-70 font-medium italic">Monitor recent booking transactions across your hubs.</p>
            </div>
            {/* --- ACTION BUTTONS (PAKISHIP STYLE) --- */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="bg-white border-[#1e3d5a]/10 text-[#1e3d5a] rounded-xl font-bold h-11 min-w-[160px] justify-between hover:bg-[#f4f7fa]"
                >
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-[#ee6b20]" />
                    {statusFilter === 'All' ? 'Filter Status' : statusFilter}
                  </div>
                  <ChevronDown className={`w-3 h-3 ml-2 opacity-50 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </Button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#1e3d5a]/10 rounded-xl shadow-xl z-30 overflow-hidden">
                    {['All', 'Active', 'Upcoming', 'Completed', 'Cancelled'].map((status) => (
                      <button 
                        key={status} 
                        onClick={() => { setStatusFilter(status); setShowFilterDropdown(false); }} 
                        className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${statusFilter === status ? 'bg-[#1e3d5a] text-white' : 'hover:bg-[#f4f7fa] text-[#1e3d5a]'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleExport}
                className="rounded-xl bg-[#1e3d5a] hover:bg-[#1e3d5a]/90 text-white font-bold h-11 shadow-lg shadow-[#1e3d5a]/20 transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </section>

          {/* --- RECENT BOOKINGS TABLE --- */}
          <section>
            <Card className="bg-white rounded-[2.5rem] border-none shadow-sm overflow-hidden">
              <CardHeader className="p-10 pb-2">
                <CardTitle className="text-2xl font-black font-bold text-[#1e3d5a]">Booking Reservation Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-[#f4f7fa]">
                    <TableRow className="border-none">
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Reference</TableHead>
                      <TableHead className="py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Customer</TableHead>
                      <TableHead className="py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Schedule</TableHead>
                      <TableHead className="py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Duration</TableHead>
                      <TableHead className="py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Amount</TableHead>
                      <TableHead className="py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-[#1e3d5a]/40 uppercase tracking-widest">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-[#1e3d5a]/5 hover:bg-[#f4f7fa]/30 transition-colors">
                          <TableCell className="px-8 py-5 font-bold text-sm text-[#1e3d5a]">{booking.reference}</TableCell>
                          <TableCell className="py-5">
                            <p className="text-sm font-bold text-[#1e3d5a]">{booking.userName}</p>
                            <Badge variant="outline" className="mt-1 text-[9px] border-[#1e3d5a]/10 text-[#1e3d5a] h-4">{booking.vehiclePlate}</Badge>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-[#1e3d5a] flex items-center gap-1">
                                <Calendar size={10} className="text-[#ee6b20]" /> {booking.date}
                              </span>
                              <span className="text-[10px] text-[#1e3d5a]/60 flex items-center gap-1">
                                <Clock size={10} /> {booking.timeSlot}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-sm font-bold text-[#1e3d5a]">
                            {booking.duration}
                          </TableCell>
                          <TableCell className="py-5 font-bold text-[#1e3d5a]">₱{booking.amount}</TableCell>
                          <TableCell className="py-5 text-center">{getStatusBadge(booking.status)}</TableCell>
                          <TableCell className="px-8 py-5">
                            {getPaymentStatus(booking.paymentStatus)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="px-10 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            <Search className="w-8 h-8" />
                            <p className="text-sm text-[#1e3d5a] font-black uppercase tracking-widest">No Records Found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

