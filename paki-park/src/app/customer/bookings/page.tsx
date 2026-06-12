'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Search, Filter, AlertTriangle, CheckCircle, Clock, Banknote, Navigation, Download, Phone, CreditCard, X, Car, Share2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { bookingService } from '@/services/bookingService';
import { authService } from '@/services/authService';


const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

// ── Shared Refund Logic ───────────────────────────────────────────────────────
const CANCEL_PARTIAL_CUTOFF_MIN = 30;

function computeRefundPreview(rawDate: string, rawTimeSlot: string, amount: number) {
  if (!rawDate || !rawTimeSlot) return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  const match = rawTimeSlot.match(/(\d{1,2}):(\d{2})/);
  if (!match) return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  
  const startMin  = parseInt(match[1]) * 60 + parseInt(match[2]);
  const todayStr  = new Date().toISOString().split('T')[0];
  if (rawDate !== todayStr) return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const minutesUntilStart = startMin - nowMin;

  if (minutesUntilStart <= 0) return { refundPct: 0, refundAmount: 0, label: 'No Refund (Slot Started)', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  if (minutesUntilStart < CANCEL_PARTIAL_CUTOFF_MIN) return { refundPct: 50, refundAmount: Math.floor(amount * 0.5), label: `50% Refund (₱${Math.floor(amount * 0.5)} of ₱${amount})`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
}

function RefundBadge({ rawDate, rawTimeSlot, amount }: { rawDate: string; rawTimeSlot: string; amount: number }) {
  const p = computeRefundPreview(rawDate, rawTimeSlot, amount);
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.bg} ${p.color}`}>{p.refundPct === 100 ? '✓ Full Refund' : p.refundPct === 50 ? '⚠ 50% Refund' : '✕ No Refund'}</span>;
}

// ── Components ────────────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [allBookings, setAllBookings]   = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [cancelTarget, setCancelTarget]       = useState<any>(null);
  const [cancelling, setCancelling]           = useState(false);

  useEffect(() => {
    bookingService.getMyBookings({ status: activeFilter === 'all' ? undefined : activeFilter, search: searchQuery || undefined })
      .then((data) => {
        if (data?.bookings) {
          setAllBookings(data.bookings.map((b: any) => ({
            id:           b._id,
            reference:    b.reference || `PKP-${b._id?.slice(-8)?.toUpperCase()}`,
            location:     b.locationId?.name    || 'Parking Location',
            address:      b.locationId?.address || '',
            spot:         b.spot,
            date:         new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            rawDate:      b.date,
            time:         b.timeSlot || '',
            rawTimeSlot:  b.timeSlot || '',
            status:       b.status,
            type:         b.type || '1-Hour Slot',
            amount:       b.amount,
            vehicleType:  b.vehicleId?.type        || 'Sedan',
            licensePlate: b.vehicleId?.plateNumber || '',
            paymentStatus: b.paymentStatus,
            refundAmount:  b.refundAmount,
          })));
        }
      }).catch(() => {});
  }, [activeFilter, searchQuery]);

  const filteredBookings = allBookings;

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await bookingService.cancelBooking(cancelTarget.id, 'Customer requested cancellation') as any;
      const refund  = result?.refundAmount ?? cancelTarget._refundPreview?.refundAmount ?? 0;
      if (refund > 0) toast.success(`Cancelled. ₱${refund} returned to your payment method.`);
      else toast.info('Cancelled. No refund applies.');
      
      setAllBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b));
      setCancelTarget(null);
      setIsModalOpen(false);
    } catch (err: any) { toast.error(err?.message || 'Failed to cancel'); }
    finally { setCancelling(false); }
  };

  const statusStyle: Record<string, string> = {
    upcoming:  'bg-green-100 text-green-700 border-green-200',
    active:    'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customer/home')} className="gap-2 text-gray-500"><ArrowLeft className="size-4" /> Back</Button>
          <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 object-contain" unoptimized />
          <h1 className="text-lg font-bold text-[#1e3d5a] ml-auto">My Bookings</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => authService.logout()}
            className="gap-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 ml-2"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <Input type="search" placeholder="Search by location or reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 border-gray-200 focus:ring-[#ee6b20]" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-5 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'upcoming', 'completed', 'cancelled'].map(f => (
                <Button key={f} variant={activeFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(f)}
                  className={activeFilter === f ? 'bg-[#ee6b20] text-white' : 'text-gray-600 capitalize'}>{f}</Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MapPin className="size-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1e3d5a]">No bookings found</h3>
            </div>
          ) : (
            filteredBookings.map(b => (
              <div key={b.id} onClick={() => { setSelectedBooking(b); setIsModalOpen(true); }} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-[#ee6b20]/30 transition-all cursor-pointer group">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#1e3d5a] group-hover:text-[#ee6b20] transition-colors">{b.location}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-50 text-[#ee6b20]">{b.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyle[b.status] || statusStyle.cancelled}`}>{b.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-4"><MapPin className="size-3.5" /> {b.address}</p>
                    <div className="flex gap-6 text-sm font-bold text-[#1e3d5a]">
                      <div><p className="text-[10px] text-gray-400 uppercase">Spot</p>{b.spot}</div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Date</p>{b.date}</div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Time</p>{b.time}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Total Paid</p>
                      <p className="text-2xl font-black text-[#ee6b20]">₱{b.amount}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {b.status === 'upcoming' && <RefundBadge rawDate={b.rawDate} rawTimeSlot={b.rawTimeSlot} amount={b.amount} />}
                      <Button variant="outline" size="sm" className="border-[#1e3d5a] text-[#1e3d5a]">Details</Button>
                      {b.status === 'upcoming' && (
                        <Button onClick={(e) => { e.stopPropagation(); setCancelTarget({ ...b, _refundPreview: computeRefundPreview(b.rawDate, b.rawTimeSlot, b.amount) }); }} variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 border border-red-200">Cancel</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Cancel Confirm Modal ────────────────────────────────────────── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            <h3 className="text-xl font-bold text-center text-[#1e3d5a] mb-1">Cancel Booking?</h3>
            <p className="text-sm text-center text-gray-500 mb-6"><span className="font-bold text-[#ee6b20]">{cancelTarget.reference}</span> · {cancelTarget.location}</p>
            <div className={`rounded-2xl border p-5 mb-6 space-y-3 ${cancelTarget._refundPreview.bg}`}>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Refund Amount</span><span className={`text-xl font-black ${cancelTarget._refundPreview.color}`}>₱{cancelTarget._refundPreview.refundAmount}</span></div>
              <p className="text-xs">{cancelTarget._refundPreview.label}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCancelTarget(null)} className="flex-1 rounded-xl">Keep</Button>
              <Button onClick={confirmCancel} disabled={cancelling} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">{cancelling ? 'Cancelling...' : 'Confirm'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Details Modal ────────────────────────────────────────── */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#1e3d5a]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-gray-50 rounded-3xl overflow-hidden shadow-2xl z-10">
            <div className="bg-white px-6 py-4 border-b flex items-center justify-between"><h2 className="text-xl font-black text-[#1e3d5a]">Booking Details</h2><button onClick={() => setIsModalOpen(false)}><X className="size-6 text-gray-400" /></button></div>
            <div className="p-6 space-y-5">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white flex justify-between">
                <div><p className="text-[10px] uppercase font-bold">Status</p><p className="text-xl font-black capitalize">{selectedBooking.status}</p></div>
                <div className="text-right"><p className="text-[10px] uppercase font-bold">Ref No.</p><p className="text-lg font-mono font-bold">{selectedBooking.reference}</p></div>
              </div>
              <div className="bg-white rounded-2xl p-5 border shadow-sm">
                <h3 className="text-lg font-bold text-[#1e3d5a] mb-3">{selectedBooking.location}</h3>
                <div className="flex justify-between bg-gray-50 p-3 rounded-xl"><p className="text-[10px] text-gray-400">Spot</p><p className="font-black text-[#ee6b20]">{selectedBooking.spot}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
