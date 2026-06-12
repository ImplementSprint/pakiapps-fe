import { X, MapPin, Calendar, Car, CreditCard, Download, Share2,
         Navigation, Phone, Clock, CheckCircle, AlertTriangle, Banknote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

// ── Refund policy helper (same rules as backend + MyBookings) ─────────────────
const CANCEL_PARTIAL_CUTOFF_MIN = 30;

function computeRefundPreview(rawDate: string, rawTimeSlot: string, amount: number) {
  if (!rawDate || !rawTimeSlot) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  }
  const match = rawTimeSlot.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  }
  const startMin   = parseInt(match[1]) * 60 + parseInt(match[2]);
  const todayStr   = new Date().toISOString().split('T')[0];
  if (rawDate !== todayStr) {
    return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  }
  const now        = new Date();
  const nowMin     = now.getHours() * 60 + now.getMinutes();
  const minUntil   = startMin - nowMin;

  if (minUntil <= 0) {
    return { refundPct: 0, refundAmount: 0, label: 'No Refund (Slot Started)', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (minUntil < CANCEL_PARTIAL_CUTOFF_MIN) {
    return { refundPct: 50, refundAmount: Math.floor(amount * 0.5), label: '50% Refund', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  }
  return { refundPct: 100, refundAmount: amount, label: 'Full Refund (100%)', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
}

interface BookingDetailsProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: (bookingId: string) => void;
}

export function BookingDetails({ booking, isOpen, onClose, onCancel }: BookingDetailsProps) {
  if (!isOpen || !booking) return null;

  const handleDownloadReceipt = () => toast.success('📄 Receipt downloaded!');
  const handleShare           = () => toast.success('🔗 Booking link copied to clipboard!');
  const handleGetDirections   = () => toast.info('🗺️ Opening maps...');
  const handleContactSupport  = () => toast.info('📞 Connecting to support...');

  const isUpcoming  = booking.status === 'upcoming';
  const isCancelled = booking.status === 'cancelled';
  const refundPreview = isUpcoming
    ? computeRefundPreview(booking.rawDate || '', booking.rawTimeSlot || booking.time || '', booking.amount)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1e3d5a]/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-black text-[#1e3d5a]">Booking Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X className="size-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* Status banner */}
          <div className={`rounded-2xl p-5 shadow-sm ${
            isUpcoming    ? 'bg-gradient-to-r from-green-500 to-green-600' :
            booking.status === 'completed' ? 'bg-gradient-to-r from-[#1e3d5a] to-[#2a5373]' :
            booking.status === 'active'    ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                            'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Status</p>
                <p className="text-xl font-black capitalize">{booking.status}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Ref No.</p>
                <p className="text-lg font-mono font-bold">{booking.reference}</p>
              </div>
            </div>
          </div>

          {/* Location card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1e3d5a]">{booking.location}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{booking.address}</p>
              </div>
              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-orange-50 text-[#ee6b20]">{booking.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Spot Number</p>
                <p className="font-black text-[#ee6b20]">{booking.spot}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Schedule</p>
                <p className="font-bold text-[#1e3d5a] text-xs">{booking.date} · {booking.time}</p>
              </div>
            </div>
          </div>

          {/* Vehicle + Payment */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                <Car size={14} className="text-[#ee6b20]" /> Vehicle
              </h4>
              <p className="text-lg font-black text-[#1e3d5a] font-mono tracking-wider">{booking.licensePlate}</p>
              <p className="text-xs text-gray-500 capitalize">{booking.vehicleType}</p>
            </div>
            <div className="bg-[#1e3d5a] rounded-2xl p-5 shadow-md text-white">
              <h4 className="text-[10px] font-bold opacity-60 uppercase mb-3 flex items-center gap-2">
                <CreditCard size={14} /> Amount Paid
              </h4>
              <p className="text-2xl font-black">₱{booking.amount}</p>
              {isCancelled && booking.paymentStatus === 'refunded' && (
                <p className="text-[10px] text-green-400 font-bold uppercase mt-1 tracking-widest">Full Refund Issued</p>
              )}
              {isCancelled && booking.paymentStatus === 'partial' && (
                <p className="text-[10px] text-amber-400 font-bold uppercase mt-1 tracking-widest">50% Partial Refund</p>
              )}
              {isCancelled && booking.paymentStatus === 'paid' && (
                <p className="text-[10px] text-red-400 font-bold uppercase mt-1 tracking-widest">Non-Refundable</p>
              )}
              {!isCancelled && (
                <p className="text-[10px] text-green-400 font-bold uppercase mt-1 tracking-widest">Transaction Success</p>
              )}
            </div>
          </div>

          {/* ── Cancellation Policy — only for upcoming bookings ──────────────── */}
          {isUpcoming && refundPreview && (
            <div className={`rounded-2xl border p-5 ${refundPreview.bg} ${refundPreview.border}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                Current Cancellation Policy
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">If you cancel now</span>
                  <span className={`font-black ${refundPreview.color}`}>{refundPreview.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Refund Amount</span>
                  <span className={`font-black text-lg ${refundPreview.color}`}>₱{refundPreview.refundAmount}</span>
                </div>
              </div>

              {/* Tier explanation */}
              <div className="mt-4 space-y-1.5">
                {[
                  { icon: <CheckCircle className="size-3 text-green-600" />, text: '≥ 30 min before slot — Full refund (100%)' },
                  { icon: <Clock className="size-3 text-amber-500" />,       text: '< 30 min before slot — 50% refund only'   },
                  { icon: <AlertTriangle className="size-3 text-red-500" />, text: 'No-show — Non-refundable (0%)'             },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                    {row.icon}<span>{row.text}</span>
                  </div>
                ))}
              </div>

              {refundPreview.refundAmount > 0 && (
                <div className="mt-3 flex items-start gap-2 bg-white/70 rounded-xl px-3 py-2">
                  <Banknote className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-700">
                    Refunds are returned to your original payment method within 3–5 business days.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Entry pass barcode */}
          <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-200 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest">Digital Entry Pass</p>
            <div className="inline-block bg-white p-4 border rounded-xl shadow-sm mb-4">
              <div className="text-4xl font-mono tracking-tighter text-black">||| || ||| ||| | ||</div>
              <p className="text-[10px] text-gray-400 mt-1 font-mono">{booking.reference}</p>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-[250px] mx-auto">
              Scan this barcode at the parking kiosk or present it to the security personnel.
            </p>
          </div>

          {/* Action buttons */}
          <div className={`grid gap-2 ${isUpcoming ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
            <ActionButton icon={<Download size={14} />}   label="Receipt"    onClick={handleDownloadReceipt} />
            <ActionButton icon={<Share2 size={14} />}     label="Share"      onClick={handleShare} />
            <ActionButton icon={<Navigation size={14} />} label="Maps"       onClick={handleGetDirections} isPrimary />
            <ActionButton icon={<Phone size={14} />}      label="Support"    onClick={handleContactSupport} />
          </div>

          {/* Cancel button — only for upcoming */}
          {isUpcoming && onCancel && (
            <Button
              onClick={() => { onClose(); setTimeout(() => onCancel(booking.id), 150); }}
              variant="outline"
              className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
            >
              Cancel This Booking
              {refundPreview && (
                <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  refundPreview.refundPct === 100 ? 'bg-green-100 text-green-700' :
                  refundPreview.refundPct === 50  ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {refundPreview.refundPct === 100 ? '100% Refund' :
                   refundPreview.refundPct === 50  ? '50% Refund'  : 'No Refund'}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, isPrimary = false }: { icon: any; label: string; onClick: () => void; isPrimary?: boolean }) {
  return (
    <Button
      onClick={onClick}
      className={`h-10 text-[11px] font-bold rounded-xl gap-2 shadow-sm ${
        isPrimary
          ? 'bg-[#ee6b20] hover:bg-[#d55f1c] text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}{label}
    </Button>
  );
}
