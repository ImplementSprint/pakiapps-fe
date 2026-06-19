import { X, QrCode, MapPin, Clock, Package } from "lucide-react";

interface DropOffQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: any;
}

export default function DropOffQRModal({ isOpen, onClose, bookingData }: DropOffQRModalProps) {
  if (!isOpen) return null;

  const trackingNumber = bookingData?.trackingNumber || "PKS-2026-1234";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-[#041614]">Drop-off QR Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#041614] transition-colors p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-gray-500 font-medium mb-4">
            Show this QR code at the drop-off point to complete your booking
          </p>

          {/* QR Code placeholder */}
          <div className="w-64 h-64 mx-auto bg-white border-4 border-[#39B5A8] rounded-2xl p-4 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
          </div>

          <div className="bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Tracking Number</p>
            <p className="text-xl font-black text-[#39B5A8]">{trackingNumber}</p>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-[#39B5A8]" />
              <span className="font-medium">Drop-off within 24 hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4 text-[#39B5A8]" />
              <span className="font-medium">Bring your package to the selected hub</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-[#39B5A8]" />
              <span className="font-medium">QR code valid for 7 days</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#39B5A8] hover:bg-[#2D8F85] text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
