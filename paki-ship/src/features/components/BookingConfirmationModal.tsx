import { X, CheckCircle, Package, MapPin, Clock, ArrowRight, ShieldCheck, Hash } from "lucide-react";
import { createPortal } from "react-dom";

interface BookingDetails {
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  totalParcels: number;
  distance: string;
  duration: string;
  totalCost: number;
  selectedService?: string;
  dropOffPoint?: {
    name?: string | null;
    address?: string | null;
  } | null;
  dropOffInstructions?: string[];
  dropOffDeadlineAt?: string | null;
  dropOffDeadlineLabel?: string | null;
}

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: BookingDetails;
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  bookingDetails,
}: BookingConfirmationModalProps) {
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const isRelayBooking = bookingDetails.selectedService === "pakishare";

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-slate-900/60 p-4 backdrop-blur-md"
      style={{ zIndex: 10000 }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{ maxHeight: "82dvh" }}
      >
        
        {/* Top Decorative Banner */}
        <div className="bg-[#39B5A8] h-2 w-full" />

        <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(82dvh - 0.5rem)" }}>
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-[#39B5A8]/10 flex items-center justify-center rotate-3 group">
                <CheckCircle className="w-10 h-10 text-[#39B5A8] -rotate-3 transition-transform group-hover:scale-110" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-[#39B5A8]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Successful</h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Transaction Completed</p>
          </div>

          {/* Tracking ID Badge */}
          <div className="flex items-center justify-center gap-2 mb-8 bg-slate-50 border border-slate-100 py-3 px-4 rounded-2xl border-dashed">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Waybill No:</span>
            <span className="text-sm font-black text-slate-900">{bookingDetails.trackingNumber}</span>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payload</p>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-slate-800">{bookingDetails.totalParcels} Items</span>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Est. Transit</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-slate-800">{bookingDetails.duration}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Route Distance</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-slate-800">{bookingDetails.distance}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Amount Paid</p>
                <span className="text-xl font-black text-[#39B5A8]">₱{bookingDetails.totalCost}.00</span>
              </div>
            </div>
          </div>

          {isRelayBooking && bookingDetails.dropOffPoint ? (
            <div className="mb-8 bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-2xl p-4">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-2">Drop-off Instructions</p>
              <div className="mb-3">
                <p className="text-sm font-black text-slate-900">{bookingDetails.dropOffPoint.name}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">{bookingDetails.dropOffPoint.address}</p>
              </div>
              {bookingDetails.dropOffDeadlineLabel ? (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800">
                  <Clock className="h-4 w-4 text-[#39B5A8]" />
                  <span>Drop off by {bookingDetails.dropOffDeadlineLabel}</span>
                </div>
              ) : null}
              <div className="space-y-2">
                {(bookingDetails.dropOffInstructions ?? []).map((instruction, index) => (
                  <div key={instruction} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#39B5A8]">{index + 1}</span>
                    <span>{instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Notification Footer */}
          <p className="text-[11px] text-slate-400 font-bold text-center mb-8 px-6 leading-relaxed">
            {isRelayBooking
              ? "Your relay booking is confirmed. Follow the drop-off instructions above so the hub can process your parcel."
              : <>A confirmation receipt and real-time tracking link have been dispatched to <span className="text-slate-900">{bookingDetails.receiverName}</span>.</>}
          </p>

          {/* Primary Action */}
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-[#39B5A8] text-white font-black py-4 rounded-[1.25rem] transition-all active:scale-[0.98] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group"
          >
            Back to Home
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
