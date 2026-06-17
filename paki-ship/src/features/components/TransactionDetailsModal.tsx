import { X, Package, MapPin, Calendar, Clock, User, Phone, Truck, CheckCircle2, ArrowRight } from "lucide-react";
import type { HistoryDetailsResponse } from "@/lib/history";

interface TransactionDetailsModalProps {
  transaction: HistoryDetailsResponse | null;
  onClose: () => void;
}

export function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  if (!transaction) return null;
  const summary = transaction.transaction;
  const details = transaction.details;
  const payment = details.payment;

  return (
    <>
      <style>{`
        .scrollbar-pretty::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-pretty::-webkit-scrollbar-track {
          background: transparent;
          margin-top: 100px; /* Aligns with header height */
          margin-bottom: 100px; /* Aligns with footer height */
        }
        .scrollbar-pretty::-webkit-scrollbar-thumb {
          background: #39B5A840;
          border-radius: 20px;
          border: 2px solid white;
        }
        .scrollbar-pretty::-webkit-scrollbar-thumb:hover {
          background: #39B5A8;
        }
      `}</style>

      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 scrollbar-pretty"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-slate-100 px-8 py-6 rounded-t-[2rem] z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-3 rounded-xl ${summary.isLive ? 'bg-[#39B5A8]/10' : 'bg-slate-100'}`}>
                    <Package className={`w-6 h-6 ${summary.isLive ? 'text-[#39B5A8]' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1A5D56]">{summary.id}</h2>
                    <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-wider">{summary.type}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-3 mt-4">
              <span className={`text-[10px] font-bold uppercase px-4 py-2 rounded-xl ${
                summary.isLive 
                  ? 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {summary.status}
              </span>
              {summary.isLive && (
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  LIVE TRACKING
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6">
            {/* Sender & Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sender</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-bold text-slate-700">{details.sender.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500 font-medium">{details.sender.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="text-sm text-slate-600 font-medium">{details.sender.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Receiver</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-bold text-slate-700">{details.receiver.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500 font-medium">{details.receiver.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 mt-3">
                    <MapPin className="w-4 h-4 text-[#39B5A8] mt-0.5" />
                    <span className="text-sm text-slate-600 font-medium">{details.receiver.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcel Information */}
            <div className="bg-[#F0F9F8] rounded-2xl p-6 border border-[#39B5A8]/20">
              <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest mb-4">Parcel Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Weight</p>
                  <p className="font-bold text-slate-700">{details.parcel.weight}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Dimensions</p>
                  <p className="font-bold text-slate-700">{details.parcel.dimensions}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Description</p>
                  <p className="font-bold text-slate-700">{details.parcel.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Special Instructions</p>
                  <p className="text-sm text-slate-600 font-medium">{details.parcel.specialInstructions}</p>
                </div>
              </div>
            </div>

            {/* Driver Info (if live) */}
            {details.driver && (
              <div className="bg-[#1A5D56] rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 translate-x-1/4 -translate-y-1/4">
                  <Truck className="w-32 h-32" />
                </div>
                <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest mb-4 relative z-10">Assigned Driver</p>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      <Truck className="w-6 h-6 text-[#39B5A8]" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{details.driver.name}</p>
                      <p className="text-sm text-white/60 font-medium">{details.driver.vehicle}</p>
                      <p className="text-xs text-white/50 mt-1">{details.driver.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60 font-bold mb-1 uppercase">Rating</p>
                    <p className="text-2xl font-bold text-[#39B5A8]">
                      {details.driver.rating ? `★ ${details.driver.rating}` : "TBD"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Delivery Timeline</p>
              <div className="space-y-0">
                {details.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                          event.completed
                            ? "bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20"
                            : "bg-slate-100 text-slate-300"
                        }`}
                      >
                        {event.completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </div>
                      {index < details.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-16 ${
                            event.completed ? "bg-[#39B5A8]" : "bg-slate-100"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-10">
                      <div className={`font-bold text-base ${event.completed ? "text-[#1A5D56]" : "text-slate-300"}`}>
                        {event.status}
                      </div>
                      <div className={`text-sm font-medium mt-1 ${event.completed ? "text-slate-500" : "text-slate-300"}`}>
                        {event.location}
                      </div>
                      <div className={`text-xs mt-2 font-bold ${event.completed ? "text-[#39B5A8]" : "text-slate-300"}`}>
                        {event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Delivery Fee</span>
                  <span className="font-bold text-slate-700">{payment?.deliveryFee || summary.amount || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Payment Method</span>
                  <span className="font-bold text-slate-700 capitalize">{payment?.method || "Not available"}</span>
                </div>
                {payment?.responsibility ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">Payment By</span>
                    <span className="font-bold text-slate-700 capitalize">{payment.responsibility}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Date</span>
                  <span className="font-bold text-slate-700">{summary.date}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#1A5D56]">Total Amount</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#39B5A8]">{payment?.totalAmount || summary.amount || "Pending"}</span>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                        {payment?.serviceId ? `${payment.serviceId} service` : "Service not available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-slate-100 px-8 py-6 rounded-b-[2rem] z-10">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
              >
                Close
              </button>
              {summary.isLive && (
                <button
                  className="flex-1 py-4 bg-[#39B5A8] text-white rounded-2xl font-bold hover:bg-[#1A5D56] transition-all shadow-lg shadow-[#39B5A8]/20 flex items-center justify-center gap-2 active:scale-95"
                  onClick={() => {
                    onClose();
                    window.location.href = "/customer/track-package";
                  }}
                >
                  Track Live
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
