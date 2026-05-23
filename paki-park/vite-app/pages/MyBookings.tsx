import { useState, useEffect } from 'react';
import {
  MapPin, Search, Filter, X, AlertTriangle,
  CheckCircle, Clock, Banknote, RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { BookingDetails } from './BookingDetails';
import { bookingService } from '../services/bookingService';

type BookingStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

// ── Refund policy helper (mirrors backend computeRefundPolicy exactly) ─────────
const CANCEL_PARTIAL_CUTOFF_MIN = 30;

function computeRefundPreview(rawDate: string, rawTimeSlot: string, amount: number) {
  if (!rawDate || !rawTimeSlot) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  }

  // Parse start hour from "HH:MM - HH:MM"
  const match = rawTimeSlot.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  }

  const startMin  = parseInt(match[1]) * 60 + parseInt(match[2]);
  const todayStr  = new Date().toISOString().split('T')[0];

  // Future date → always full refund
  if (rawDate !== todayStr) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
  }

  const now   = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const minutesUntilStart = startMin - nowMin;

  if (minutesUntilStart <= 0) {
    return { refundPct: 0, refundAmount: 0, label: 'No Refund (Slot Started)', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
  }

  if (minutesUntilStart < CANCEL_PARTIAL_CUTOFF_MIN) {
    const refundAmount = Math.floor(amount * 0.5);
    return {
      refundPct: 50, refundAmount,
      label: `50% Refund (₱${refundAmount} of ₱${amount})`,
      color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200',
    };
  }

  return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
}

// ── Refund badge used in the list ─────────────────────────────────────────────
function RefundBadge({ rawDate, rawTimeSlot, amount }: { rawDate: string; rawTimeSlot: string; amount: number }) {
  const p = computeRefundPreview(rawDate, rawTimeSlot, amount);
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.bg} ${p.color}`}>
      {p.refundPct === 100 ? '✓ Full Refund' : p.refundPct === 50 ? '⚠ 50% Refund' : '✕ No Refund'}
    </span>
  );
}

export function MyBookings() {
  const [activeFilter, setActiveFilter] = useState<BookingStatus>('all');
  const [searchQuery, setSearchQuery]   = useState('');

  // Details modal
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen]         = useState(false);

  // Cancel confirmation modal
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelling,   setCancelling]   = useState(false);

  const mockBookings = [
    { id: '1', reference: 'PKP-00001234', location: 'SM City Mall',     address: '123 Main Street, Cebu City',     spot: 'A-12', date: 'Feb 20, 2026', rawDate: new Date().toISOString().split('T')[0], time: '10:00 - 11:00', rawTimeSlot: '10:00 - 11:00', status: 'upcoming',  type: '1-Hour Slot', amount: 50,  vehicleType: 'Sedan',      licensePlate: 'ABC 1234' },
    { id: '2', reference: 'PKP-00001235', location: 'Ayala Center',     address: '456 Business Park, Cebu City',  spot: 'B-05', date: 'Feb 18, 2026', rawDate: '2026-02-18',                           time: '3:00 - 4:00',   rawTimeSlot: '15:00 - 16:00', status: 'completed', type: '1-Hour Slot', amount: 150, vehicleType: 'SUV',        licensePlate: 'XYZ 7890' },
    { id: '3', reference: 'PKP-00001236', location: "Robinson's Place", address: '789 Shopping Ave, Cebu City',   spot: 'C-23', date: 'Feb 15, 2026', rawDate: '2026-02-15',                           time: '9:00 - 10:00',  rawTimeSlot: '09:00 - 10:00', status: 'completed', type: '1-Hour Slot', amount: 180, vehicleType: 'Sedan',      licensePlate: 'GHI 4567' },
    { id: '4', reference: 'PKP-00001237', location: 'IT Park Tower',    address: '321 Tech Hub, Cebu City',       spot: 'D-08', date: 'Feb 22, 2026', rawDate: '2026-02-22',                           time: '8:00 - 9:00',   rawTimeSlot: '08:00 - 09:00', status: 'upcoming',  type: '1-Hour Slot', amount: 50,  vehicleType: 'Van',        licensePlate: 'JKL 0123' },
    { id: '5', reference: 'PKP-00001238', location: 'SM Seaside',       address: '555 Coastal Road, Cebu City',   spot: 'E-15', date: 'Feb 10, 2026', rawDate: '2026-02-10',                           time: '2:00 - 3:00',   rawTimeSlot: '14:00 - 15:00', status: 'cancelled', type: '1-Hour Slot', amount: 50,  vehicleType: 'Motorcycle', licensePlate: 'MNP 5678' },
  ];

  const [allBookings, setAllBookings] = useState(mockBookings as any[]);

  // Fetch real bookings
  useEffect(() => {
    const statusParam = activeFilter === 'all' ? undefined : activeFilter;
    bookingService
      .getMyBookings({ status: statusParam, search: searchQuery || undefined })
      .then((data) => {
        if (data?.bookings && data.bookings.length > 0) {
          setAllBookings(
            data.bookings.map((b: any) => ({
              id:           b._id,
              reference:    b.reference || `PKP-${b._id?.slice(-8)?.toUpperCase()}`,
              location:     b.locationId?.name    || 'Parking Location',
              address:      b.locationId?.address || '',
              spot:         b.spot,
              date:         new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              rawDate:      b.date,          // YYYY-MM-DD for refund calculation
              time:         b.timeSlot || '',
              rawTimeSlot:  b.timeSlot || '',
              status:       b.status,
              type:         b.type || '1-Hour Slot',
              amount:       b.amount,
              vehicleType:  b.vehicleId?.type        || 'Sedan',
              licensePlate: b.vehicleId?.plateNumber || '',
              paymentStatus: b.paymentStatus,
              refundAmount:  b.refundAmount,
            }))
          );
        }
      })
      .catch(() => { /* fallback to mock */ });
  }, [activeFilter, searchQuery]);

  const filteredBookings = allBookings.filter((b) => {
    const matchesFilter = activeFilter === 'all' || b.status === activeFilter;
    const matchesSearch =
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // ── Confirm cancel (after user approves the modal) ────────────────────────
  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await bookingService.cancelBooking(cancelTarget.id, 'Customer requested cancellation') as any;
      const refund  = result?.refundAmount ?? cancelTarget._refundPreview?.refundAmount ?? 0;
      const label   = result?.refundPolicy?.label ?? cancelTarget._refundPreview?.label ?? '';

      if (refund > 0) {
        toast.success(`Booking cancelled. ₱${refund} ${label.includes('50') ? '(50%)' : '(100%)'} will be returned to your payment method.`, { duration: 6000 });
      } else {
        toast.info('Booking cancelled. No refund applies for this cancellation.', { duration: 5000 });
      }

      setAllBookings((prev) =>
        prev.map((b) => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b)
      );
      setCancelTarget(null);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  // ── Open cancel modal (with refund preview pre-computed) ──────────────────
  const openCancelModal = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    const preview = computeRefundPreview(booking.rawDate, booking.rawTimeSlot, booking.amount);
    setCancelTarget({ ...booking, _refundPreview: preview });
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusStyle: Record<string, string> = {
    upcoming:  'bg-green-100 text-green-700 border-green-200',
    active:    'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e3d5a]">My Bookings</h1>
          <p className="text-gray-600">Track and manage your parking reservations</p>
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by location or reference number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:ring-[#ee6b20]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-gray-400" />
              <div className="flex gap-2 flex-wrap">
                {(['all', 'upcoming', 'completed', 'cancelled'] as BookingStatus[]).map((f) => (
                  <Button
                    key={f}
                    variant={activeFilter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(f)}
                    className={activeFilter === f ? 'bg-[#ee6b20] text-white' : 'text-gray-600'}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Refund policy info bar */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 mb-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-medium text-blue-800">
          <span className="font-bold text-blue-900 uppercase tracking-wide">Cancellation Policy</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="size-3.5 text-green-600" /> ≥ 30 min before slot — <strong>100% refund</strong></span>
          <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-amber-500" /> &lt; 30 min before slot — <strong>50% refund</strong></span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-red-500" /> No-show — <strong>no refund</strong></span>
        </div>

        {/* Booking cards */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MapPin className="size-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1e3d5a]">No bookings found</h3>
              <Button onClick={() => { setActiveFilter('all'); setSearchQuery(''); }} className="mt-4 bg-[#ee6b20]">Clear Filters</Button>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => { setSelectedBooking(booking); setIsModalOpen(true); }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-[#ee6b20]/30 transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    {/* Name + type */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-[#1e3d5a] group-hover:text-[#ee6b20] transition-colors">{booking.location}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-50 text-[#ee6b20]">{booking.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusStyle[booking.status] || statusStyle.cancelled}`}>{booking.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                      <MapPin className="size-3.5" /> {booking.address}
                    </p>
                    <div className="flex gap-6 text-sm font-bold text-[#1e3d5a]">
                      <div><p className="text-[10px] text-gray-400 uppercase">Spot</p>{booking.spot}</div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Date</p>{booking.date}</div>
                      <div><p className="text-[10px] text-gray-400 uppercase">Time</p>{booking.time}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase">Total Paid</p>
                      <p className="text-2xl font-black text-[#ee6b20]">₱{booking.amount}</p>
                      {/* Show refund amount on cancelled bookings */}
                      {booking.status === 'cancelled' && booking.paymentStatus === 'refunded' && (
                        <p className="text-[10px] text-green-600 font-bold">Full refund issued</p>
                      )}
                      {booking.status === 'cancelled' && booking.paymentStatus === 'partial' && (
                        <p className="text-[10px] text-amber-600 font-bold">50% partial refund</p>
                      )}
                      {booking.status === 'cancelled' && booking.paymentStatus === 'paid' && (
                        <p className="text-[10px] text-red-500 font-bold">No refund</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {/* Live refund badge for upcoming bookings */}
                      {booking.status === 'upcoming' && (
                        <RefundBadge rawDate={booking.rawDate} rawTimeSlot={booking.rawTimeSlot} amount={booking.amount} />
                      )}
                      <Button
                        variant="outline" size="sm"
                        className="border-[#1e3d5a] text-[#1e3d5a]"
                        onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setIsModalOpen(true); }}
                      >
                        Details
                      </Button>
                      {booking.status === 'upcoming' && (
                        <Button
                          onClick={(e) => openCancelModal(e, booking)}
                          variant="ghost" size="sm"
                          className="text-red-500 hover:bg-red-50 border border-red-200"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Booking Details Modal ────────────────────────────────────────────── */}
      <BookingDetails
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCancel={(bookingId) => {
          const b = allBookings.find(x => x.id === bookingId);
          if (b) openCancelModal({ stopPropagation: () => {} } as any, b);
        }}
      />

      {/* ── Cancel Confirmation Modal ────────────────────────────────────────── */}
      {cancelTarget && (() => {
        const preview = cancelTarget._refundPreview || computeRefundPreview(cancelTarget.rawDate, cancelTarget.rawTimeSlot, cancelTarget.amount);
        return (
          <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">

              {/* Icon */}
              <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                preview.refundPct === 0 ? 'bg-red-100' : preview.refundPct === 50 ? 'bg-amber-100' : 'bg-green-100'
              }`}>
                {preview.refundPct === 0
                  ? <AlertTriangle className="size-8 text-red-600" />
                  : preview.refundPct === 50
                  ? <Clock className="size-8 text-amber-600" />
                  : <CheckCircle className="size-8 text-green-600" />}
              </div>

              <h3 className="text-xl font-bold text-center text-[#1e3d5a] mb-1">Cancel Booking?</h3>
              <p className="text-sm text-center text-gray-500 mb-6">
                <span className="font-bold text-[#ee6b20]">{cancelTarget.reference}</span> · {cancelTarget.location}
              </p>

              {/* Refund summary */}
              <div className={`rounded-2xl border p-5 mb-6 space-y-3 ${preview.bg}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cancellation & Refund Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-bold text-[#1e3d5a]">₱{cancelTarget.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Refund Policy</span>
                  <span className={`font-bold ${preview.color}`}>{preview.label}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-[#1e3d5a]">You will receive</span>
                  <span className={`text-xl font-black ${preview.color}`}>₱{preview.refundAmount}</span>
                </div>
                {preview.refundPct === 50 && (
                  <p className="text-[10px] text-amber-700 bg-amber-100 rounded-xl px-3 py-2 leading-relaxed">
                    ⚠️ You are cancelling within <strong>30 minutes</strong> of your slot start time. Only 50% is refundable per our cancellation policy.
                  </p>
                )}
                {preview.refundPct === 0 && (
                  <p className="text-[10px] text-red-700 bg-red-100 rounded-xl px-3 py-2 leading-relaxed">
                    ✕ Your slot has already started or this is a no-show. No refund applies.
                  </p>
                )}
                {preview.refundPct === 100 && (
                  <p className="text-[10px] text-green-700 bg-green-100 rounded-xl px-3 py-2 leading-relaxed">
                    ✓ You are cancelling well in advance. A full refund will be returned to your payment method.
                  </p>
                )}
              </div>

              {/* Refund will be returned via original payment method */}
              {preview.refundAmount > 0 && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                  <Banknote className="size-4 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700">
                    <strong>₱{preview.refundAmount}</strong> will be returned to your original payment method within 3–5 business days.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 rounded-xl font-bold"
                  disabled={cancelling}
                >
                  Keep Booking
                </Button>
                <Button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className={`flex-1 rounded-xl font-bold text-white ${
                    preview.refundPct === 0
                      ? 'bg-red-600 hover:bg-red-700'
                      : preview.refundPct === 50
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#1e3d5a] hover:bg-[#16304a]'
                  }`}
                >
                  {cancelling ? <><RefreshCw className="size-4 mr-2 animate-spin" />Cancelling…</> : 'Confirm Cancel'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
