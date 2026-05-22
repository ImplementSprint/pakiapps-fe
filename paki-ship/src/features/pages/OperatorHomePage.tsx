import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Package, Users, TrendingUp, Clock, Bell, User, Menu, X,
  CheckCircle2, AlertCircle, Truck, ArrowUpRight, ArrowDownLeft,
  QrCode, Smartphone, Star, ChevronRight, Calendar, HelpCircle,
  ArrowRight, ArrowLeft, LogOut, Search,
  AlertTriangle, RefreshCw, Gift,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { clearClientSession, getTutorialStorageKey } from "@/lib/client-auth";
import {
  fetchOperatorDashboard,
  fetchOperatorNotifications,
  fetchOperatorParcels,
  fetchOperatorRelayBookings,
  fetchOperatorReports,
  markAllOperatorNotificationsAsRead,
  markOperatorNotificationAsRead,
  type OperatorRelayBooking,
  submitOperatorManualEntry,
  submitLostParcelReport,
  updateOperatorParcelStatus,
} from "@/lib/operator-dashboard";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const sadMascotImg = "https://i.imgur.com/6bx4yV2.png";
const mascotWavingImg = "https://i.imgur.com/G4RbCRo.png";
const mascotWinkingImg = "https://i.imgur.com/0RM52cS.png";
const mascotChecklistImg = "https://i.imgur.com/HHNarFY.png";
const sendParcelIcon = "https://i.imgur.com/a6gHhtu.png";
const rateReviewIcon = "https://i.imgur.com/pvzfoIz.png";
const mascotThinkingImg = "https://i.imgur.com/gDo17NY.png";

// ── Shared storage keys (must match OperatorProfilePage) ─────────────────────
const STORAGE_KEY_NAME  = "operatorName";
const STORAGE_KEY_EMAIL = "operatorEmail";
const STORAGE_KEY_PHONE = "operatorPhone";
const STORAGE_KEY_PHOTO = "operatorProfilePicture";

type ParcelStatus = "incoming" | "stored" | "picked-up" | "dispatched";
interface Parcel {
  id: string; trackingNumber: string; sender: string; recipient: string;
  status: ParcelStatus; arrivalTime?: string; pickupTime?: string; storageLocation?: string;
}

type RelayQrBooking = Pick<
  OperatorRelayBooking,
  "draftId" | "trackingNumber" | "qrCodePayload" | "receiverName" | "status" | "totalParcels"
>;

const mockParcels: Parcel[] = [];
type OperatorNotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "star";
  read: boolean;
};

const initialNotifications: OperatorNotificationItem[] = [];

const initialDashboardMetrics = {
  kpis: {
    incomingToday: 0,
    currentlyStored: 0,
    pickedUpToday: 0,
    customersServed: 0,
  },
  earnings: {
    totalEarned: 0,
    weeklyIncrease: 0,
    incentives: 0,
    bonusesEarned: 0,
  },
};

const DELIVERY_BIN_CAPACITY_PARCELS = 20;

function formatNotificationTime(value: string | null) {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function RelayQrImage({ value, className = "" }: { value: string; className?: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`;
  return <img src={qrUrl} alt={`QR code for ${value}`} className={className} />;
}

function RelayQrModal({
  booking,
  onClose,
}: {
  booking: RelayQrBooking;
  onClose: () => void;
}) {
  const trackingNumber = booking.trackingNumber || booking.qrCodePayload;
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#041614]">Parcel QR</h2>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Relay Economy booking</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center text-center">
          <div className="rounded-3xl border border-[#39B5A8]/20 bg-white p-4 shadow-sm">
            <RelayQrImage value={booking.qrCodePayload} className="h-56 w-56" />
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">PKS Tracking ID</p>
          <p className="mt-1 text-xl font-black text-[#041614]">{trackingNumber}</p>
          <p className="mt-2 text-sm font-bold text-gray-400">
            {booking.receiverName ? `Receiver: ${booking.receiverName}` : "Show this code for relay parcel handoff."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileScanNoticeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#F0F9F8] rounded-full flex items-center justify-center mb-5 shadow-lg">
            <Smartphone className="w-10 h-10 text-[#39B5A8]" />
          </div>
          <h2 className="text-2xl font-black text-[#041614] mb-2">Scan in Mobile</h2>
          <p className="text-gray-500 text-sm font-medium mb-6">
            Parcel scanning is only available on mobile devices. Please open the operator dashboard on your phone to use this feature.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── QR Scan Modal ────────────────────────────────────────────────────────────
function QRScanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (trackingNo: string) => Promise<void> | void;
}) {
  const [phase, setPhase] = useState<"scanning" | "success">("scanning");
  const [scannedCode] = useState("PKS-2026-001241");
  const [dots, setDots] = useState(".");
  useEffect(() => {
    if (phase !== "scanning") return;
    const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    const scanTimeout = setTimeout(() => setPhase("success"), 2800);
    return () => { clearInterval(dotInterval); clearTimeout(scanTimeout); };
  }, [phase]);
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {phase === "scanning" ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative w-48 h-48 mb-6">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#39B5A8] rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#39B5A8] rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#39B5A8] rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#39B5A8] rounded-br-lg"></div>
              <div className="absolute inset-2 overflow-hidden rounded-lg bg-[#F0F9F8]">
                <div className="w-full h-0.5 bg-[#39B5A8] shadow-lg shadow-[#39B5A8]/50"
                  style={{ animation: "scanLine 1.5s ease-in-out infinite" }}></div>
                <div className="absolute inset-4 grid grid-cols-5 grid-rows-5 gap-0.5 opacity-20">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-[#041614]' : 'bg-transparent'}`}></div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#39B5A8] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-black text-[#041614] mb-2">Scanning QR Code{dots}</h2>
            <p className="text-gray-400 text-sm font-medium mb-6">Please hold the customer's QR code in front of the camera</p>
            <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#041614] hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3 mb-2">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1">Scanned Tracking Number</p>
              <p className="text-lg font-black text-[#041614]">{scannedCode}</p>
            </div>
            <h2 className="text-xl font-black text-green-600 mb-1 mt-3">QR Scanned Successfully!</h2>
            <p className="text-gray-400 text-sm font-medium mb-6">Parcel has been received and logged into the system.</p>
            <button onClick={() => void onSuccess(scannedCode)}
              className="w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95">
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(160px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Manual Entry Modal ───────────────────────────────────────────────────────
function ManualEntryModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (trackingNumber: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onSuccess(value.trim());
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to register this parcel right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
        {!submitted ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-[#041614]">Manual Entry</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Enter the tracking number below</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. PKS-2026-001234"
                  className="w-full bg-[#F0F9F8] rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 ring-[#39B5A8] outline-none placeholder:font-normal placeholder:text-gray-300" autoFocus />
              </div>
              <button type="submit" disabled={!value.trim() || isSubmitting}
                className="w-full py-4 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                {isSubmitting ? "Registering..." : "Confirm Entry"}
              </button>
              <button type="button" onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#041614] transition-colors">Cancel</button>
            </form>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-black text-green-600 mb-1">Entry Confirmed!</h2>
            <p className="text-gray-400 text-sm font-medium">{value} has been logged.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Update Status Modal ──────────────────────────────────────────────────────
function UpdateStatusModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const statuses = [
    { label: "Incoming", color: "bg-blue-50 text-blue-600 border-blue-200" },
    { label: "Stored", color: "bg-[#F0F9F8] text-[#39B5A8] border-[#39B5A8]/30" },
    { label: "Picked Up", color: "bg-green-50 text-green-600 border-green-200" },
    { label: "Dispatched", color: "bg-orange-50 text-orange-600 border-orange-200" },
  ];
  if (done) return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-black text-green-600 mb-1">Status Updated!</h2>
        <p className="text-gray-400 text-sm font-medium mb-6">Parcel marked as <span className="font-black text-[#041614]">{selected}</span>.</p>
        <button onClick={onClose} className="w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95">Done</button>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#041614]">Update Status</h2>
            <p className="text-xs text-gray-400 font-bold mt-0.5">Select new parcel status</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          {statuses.map(s => (
            <button key={s.label} onClick={() => setSelected(s.label)}
              className={`w-full px-4 py-3.5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-between ${
                selected === s.label ? s.color + ' scale-[1.02]' : 'border-gray-100 text-gray-400 hover:border-gray-200'
              }`}>
              {s.label}
              {selected === s.label && <CheckCircle2 className="w-4 h-4" />}
            </button>
          ))}
          <button onClick={() => selected && setDone(true)} disabled={!selected}
            className="w-full mt-2 py-4 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            Confirm Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lost Parcel Modal ────────────────────────────────────────────────────────
function LostParcelModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (trackingNumber: string, details: string) => Promise<void>;
}) {
  const [trackingNo, setTrackingNo] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNo.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(trackingNo.trim(), details.trim());
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the report right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {!submitted ? (
          <>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#041614]">Report Lost Parcel</h2>
                    <p className="text-xs text-gray-400 font-bold">Fill in the details below</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest ml-1">Tracking Number</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={trackingNo} onChange={e => setTrackingNo(e.target.value)}
                    placeholder="PKS-2026-XXXXXX"
                    className="w-full bg-[#F0F9F8] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 ring-[#39B5A8] outline-none placeholder:font-normal placeholder:text-gray-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest ml-1">Additional Details</label>
                <textarea value={details} onChange={e => setDetails(e.target.value)}
                  placeholder="Describe when and where the parcel was last seen..."
                  rows={3}
                  className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 ring-[#39B5A8] outline-none resize-none placeholder:text-gray-300" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-3.5 font-bold text-gray-400 hover:text-gray-600 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={!trackingNo.trim() || isSubmitting}
                  className="flex-1 py-3.5 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-40">
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-5">
              <AlertTriangle className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-xl font-black text-[#041614] mb-1">Report Submitted</h2>
            <p className="text-gray-400 text-sm font-medium mb-2">Tracking: <span className="font-black text-[#041614]">{trackingNo}</span></p>
            <p className="text-gray-400 text-xs mb-6">Our team has been notified and will investigate shortly.</p>
            <button onClick={onClose} className="w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Process Pickup Modal ─────────────────────────────────────────────────────
function ProcessPickupModal({
  parcel,
  onClose,
  onSuccess,
}: {
  parcel: Parcel;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}) {
  const [phase, setPhase] = useState<"scanning" | "verifying" | "success">("scanning");
  const [dots, setDots] = useState(".");
  const [customerName, setCustomerName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    if (phase === "scanning") {
      const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
      const scanTimeout = setTimeout(() => {
        setCustomerName(parcel.recipient);
        setPhase("verifying");
      }, 2500);
      return () => { clearInterval(dotInterval); clearTimeout(scanTimeout); };
    }
  }, [phase, parcel.recipient]);

  const handleVerify = () => {
    if (verificationCode.length === 4) {
      setPhase("success");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#041614]/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        {phase === "scanning" ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative w-48 h-48 mb-6">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#39B5A8] rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#39B5A8] rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#39B5A8] rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#39B5A8] rounded-br-lg"></div>
              <div className="absolute inset-2 overflow-hidden rounded-lg bg-[#F0F9F8]">
                <div className="w-full h-0.5 bg-[#39B5A8] shadow-lg shadow-[#39B5A8]/50"
                  style={{ animation: "scanLine 1.5s ease-in-out infinite" }}></div>
                <div className="absolute inset-4 grid grid-cols-5 grid-rows-5 gap-0.5 opacity-20">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-[#041614]' : 'bg-transparent'}`}></div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#39B5A8] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3 mb-4">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1">Parcel Details</p>
              <p className="text-sm font-black text-[#041614]">{parcel.trackingNumber}</p>
              <p className="text-xs text-gray-400 font-bold mt-0.5">Recipient: {parcel.recipient}</p>
            </div>
            <h2 className="text-xl font-black text-[#041614] mb-2">Scanning Customer QR{dots}</h2>
            <p className="text-gray-400 text-sm font-medium mb-6">Ask the customer to show their pickup QR code</p>
            <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#041614] hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
          </div>
        ) : phase === "verifying" ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-[#041614]">Verify Pickup</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Enter the 4-digit verification code</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="bg-[#F0F9F8] rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#39B5A8] flex items-center justify-center text-white font-black text-lg">
                  {customerName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-[#041614]">{customerName}</p>
                  <p className="text-xs text-gray-400 font-bold">{parcel.trackingNumber}</p>
                </div>
              </div>
              {parcel.storageLocation && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#39B5A8] bg-white rounded-lg px-3 py-2">
                  <Package className="w-4 h-4" />
                  <span>Located at Shelf: {parcel.storageLocation}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest ml-1 mb-2 block">Verification Code</label>
                <input
                  type="text"
                  maxLength={4}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-widest focus:ring-2 ring-[#39B5A8] outline-none placeholder:text-gray-300"
                  autoFocus
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 4}
                className="w-full py-4 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                Confirm Pickup
              </button>
              <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#041614] transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-black text-green-600 mb-1">Pickup Successful!</h2>
            <div className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3 mb-2 mt-4">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1">Tracking Number</p>
              <p className="text-lg font-black text-[#041614]">{parcel.trackingNumber}</p>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-2">Handed to: <span className="font-black text-[#041614]">{customerName}</span></p>
            <p className="text-gray-400 text-xs mb-6">The parcel has been successfully picked up and logged.</p>
            <button onClick={() => void onSuccess()}
              className="w-full py-3.5 bg-[#39B5A8] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95">
              Done
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(160px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OperatorHomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "incoming" | "stored">("all");
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMobileScanNotice, setShowMobileScanNotice] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [parcels, setParcels] = useState(mockParcels);
  const [reports, setReports] = useState<Array<{
    id: string;
    trackingNumber: string;
    status: string;
    details: string;
    reportedAt?: string | null;
  }>>([]);
  const [relayQrBookings, setRelayQrBookings] = useState<RelayQrBooking[]>([]);
  const [selectedRelayQrBooking, setSelectedRelayQrBooking] = useState<RelayQrBooking | null>(null);
  const [scanningParcelId, setScanningParcelId] = useState<string | null>(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupParcel, setPickupParcel] = useState<Parcel | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState(initialDashboardMetrics);

  // ── Profile state — read from shared localStorage keys ──────────────────────
  const [userName,     setUserName]     = useState("Operator");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const notificationRef   = useRef<HTMLDivElement>(null);
  const quickActionsRef   = useRef<HTMLDivElement>(null);
  const statsCardsRef     = useRef<HTMLDivElement>(null);
  const parcelsSectionRef = useRef<HTMLDivElement>(null);
  const performanceCardRef = useRef<HTMLDivElement>(null);
  const guideButtonRef    = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const storedParcelCount = dashboardMetrics.kpis.currentlyStored;
  const binCapacity = Math.min(
    100,
    Math.round((storedParcelCount / DELIVERY_BIN_CAPACITY_PARCELS) * 100),
  );
  const totalEarnings = dashboardMetrics.earnings.totalEarned;
  const incentives = dashboardMetrics.earnings.incentives;
  const [isDriverEnRoute] = useState(true);

  const handleSecureLogout = () => {
    clearClientSession();
    navigate('/');
  };

  const refreshOperatorNotifications = async () => {
    const result = await fetchOperatorNotifications();
    setNotifications(
      result.notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: formatNotificationTime(notification.createdAt),
        type:
          notification.type === "delivery"
            ? "info"
            : notification.type === "promo"
              ? "star"
              : "warning",
        read: notification.isRead,
      })),
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    void markAllOperatorNotificationsAsRead().catch(() => {});
  };
  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    void markOperatorNotificationAsRead(id).catch(() => {});
  };

  const refreshOperatorDashboard = async () => {
    const result = await fetchOperatorDashboard();
    setDashboardMetrics({
      kpis: result.kpis,
      earnings: result.earnings,
    });
  };

  const refreshOperatorParcels = async () => {
    const result = await fetchOperatorParcels();
    setParcels(
      result.parcels.map((parcel) => ({
        id: parcel.id,
        trackingNumber: parcel.trackingNumber,
        sender: parcel.sender,
        recipient: parcel.recipient,
        status: parcel.status,
        arrivalTime: parcel.arrivalTime,
        pickupTime: parcel.pickupTime,
        storageLocation: parcel.storageLocation ?? undefined,
      })),
    );
  };

  const refreshOperatorReports = async () => {
    const result = await fetchOperatorReports();
    setReports(result.reports);
  };

  const refreshRelayQrBookings = async () => {
    const result = await fetchOperatorRelayBookings();
    setRelayQrBookings(
      result.bookings
        .filter((booking) =>
          (booking.serviceId === "pakishare" || booking.deliveryMode === "relay") &&
          booking.status === "submitted" &&
          Boolean(booking.trackingNumber),
        )
        .map((booking) => ({
          draftId: booking.draftId,
          trackingNumber: booking.trackingNumber,
          qrCodePayload: booking.qrCodePayload,
          receiverName: booking.receiverName,
          status: booking.status,
          totalParcels: booking.totalParcels,
        })),
    );
  };

  const refreshOperatorData = async () => {
    await Promise.all([
      refreshOperatorDashboard(),
      refreshOperatorParcels(),
      refreshOperatorReports(),
      refreshOperatorNotifications(),
      refreshRelayQrBookings(),
    ]);
  };

  const handleScanReceive = (parcelId: string) => {
    setScanningParcelId(parcelId);
    setShowQRModal(true);
  };
  const handleScanSuccess = async () => {
    if (!scanningParcelId) return;

    await updateOperatorParcelStatus(scanningParcelId, "stored");
    await refreshOperatorData();
    setScanningParcelId(null);
    setShowQRModal(false);
  };

  const handleProcessPickup = (parcel: Parcel) => {
    setPickupParcel(parcel);
    setShowPickupModal(true);
  };

  const handlePickupSuccess = async () => {
    if (!pickupParcel) return;

    await updateOperatorParcelStatus(pickupParcel.id, "picked-up");
    await refreshOperatorData();
    setPickupParcel(null);
    setShowPickupModal(false);
  };

  const handleManualEntrySuccess = async (trackingNumber: string) => {
    const result = await submitOperatorManualEntry(trackingNumber);

    setParcels((prev) => {
      const nextParcel = {
        id: result.parcel.id,
        trackingNumber: result.parcel.trackingNumber,
        sender: result.parcel.sender,
        recipient: result.parcel.recipient,
        status: result.parcel.status,
        arrivalTime: result.parcel.arrivalTime,
        storageLocation: result.parcel.storageLocation ?? undefined,
      } satisfies Parcel;

      const existingIndex = prev.findIndex((parcel) => parcel.id === nextParcel.id);
      if (existingIndex === -1) {
        return [nextParcel, ...prev];
      }

      const updated = [...prev];
      updated[existingIndex] = nextParcel;
      return updated;
    });

    await refreshOperatorData();
  };

  const handleLostParcelSubmit = async (trackingNumber: string, details: string) => {
    await submitLostParcelReport(trackingNumber, details);
    await refreshOperatorData();
  };

  // Load profile from localStorage on mount
  useEffect(() => {
    const storedName  = localStorage.getItem(STORAGE_KEY_NAME) || localStorage.getItem("userName");
    const storedPhoto = localStorage.getItem(STORAGE_KEY_PHOTO);
    if (storedName)  setUserName(storedName);
    if (storedPhoto) setProfileImage(storedPhoto);

    const hasShownTutorial = localStorage.getItem(getTutorialStorageKey("operator"));
    if (hasShownTutorial) setShowTutorial(false);
  }, []);

  // Re-sync profile when returning from profile page (storage event)
  useEffect(() => {
    const handleStorage = () => {
      const storedName  = localStorage.getItem(STORAGE_KEY_NAME) || localStorage.getItem("userName");
      const storedPhoto = localStorage.getItem(STORAGE_KEY_PHOTO);
      if (storedName)  setUserName(storedName);
      if (storedPhoto) setProfileImage(storedPhoto);
      else             setProfileImage(null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node))
        setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [dashboardResult, parcelsResult, reportsResult, notificationsResult, relayBookingsResult] = await Promise.all([
          fetchOperatorDashboard(),
          fetchOperatorParcels(),
          fetchOperatorReports(),
          fetchOperatorNotifications(),
          fetchOperatorRelayBookings(),
        ]);
        if (isMounted) {
          setDashboardMetrics({
            kpis: dashboardResult.kpis,
            earnings: dashboardResult.earnings,
          });
          setParcels(
            parcelsResult.parcels.map((parcel) => ({
              id: parcel.id,
              trackingNumber: parcel.trackingNumber,
              sender: parcel.sender,
              recipient: parcel.recipient,
              status: parcel.status,
              arrivalTime: parcel.arrivalTime,
              pickupTime: parcel.pickupTime,
              storageLocation: parcel.storageLocation ?? undefined,
            })),
          );
          setReports(reportsResult.reports);
          setRelayQrBookings(
            relayBookingsResult.bookings
              .filter((booking) =>
                (booking.serviceId === "pakishare" || booking.deliveryMode === "relay") &&
                booking.status === "submitted" &&
                Boolean(booking.trackingNumber),
              )
              .map((booking) => ({
                draftId: booking.draftId,
                trackingNumber: booking.trackingNumber,
                qrCodePayload: booking.qrCodePayload,
                receiverName: booking.receiverName,
                status: booking.status,
                totalParcels: booking.totalParcels,
              })),
          );
          setNotifications(
            notificationsResult.notifications.map((notification) => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              time: formatNotificationTime(notification.createdAt),
              type:
                notification.type === "delivery"
                  ? "info"
                  : notification.type === "promo"
                    ? "star"
                    : "warning",
              read: notification.isRead,
            })),
          );
        }
      } catch {
        // Keep zero-state values if dashboard metrics are unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshOperatorNotifications().catch(() => {});
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const binColor = binCapacity >= 90 ? "bg-red-500" : binCapacity >= 70 ? "bg-orange-400" : "bg-[#39B5A8]";
  const binTextColor = binCapacity >= 90 ? "text-red-500" : binCapacity >= 70 ? "text-orange-400" : "text-[#39B5A8]";

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] font-sans">
      {showTutorial && (
        <Tutorial step={tutorialStep}
          onNext={() => setTutorialStep(tutorialStep + 1)}
          onPrev={() => setTutorialStep(tutorialStep - 1)}
          onClose={() => { setShowTutorial(false); setTutorialStep(0); localStorage.setItem(getTutorialStorageKey("operator"), "true"); }}
          quickActionsRef={quickActionsRef} statsCardsRef={statsCardsRef}
          parcelsSectionRef={parcelsSectionRef} performanceCardRef={performanceCardRef} guideButtonRef={guideButtonRef} />
      )}
      {showMobileScanNotice && <MobileScanNoticeModal onClose={() => setShowMobileScanNotice(false)} />}
      {showQRModal && <QRScanModal onClose={() => { setShowQRModal(false); setScanningParcelId(null); }} onSuccess={handleScanSuccess} />}
      {showManualModal && <ManualEntryModal onClose={() => setShowManualModal(false)} onSuccess={handleManualEntrySuccess} />}
      {showUpdateModal && <UpdateStatusModal onClose={() => setShowUpdateModal(false)} />}
      {showLostModal && <LostParcelModal onClose={() => setShowLostModal(false)} onSubmit={handleLostParcelSubmit} />}
      {showPickupModal && pickupParcel && <ProcessPickupModal parcel={pickupParcel} onClose={() => { setShowPickupModal(false); setPickupParcel(null); }} onSuccess={handlePickupSuccess} />}
      {selectedRelayQrBooking && (
        <RelayQrModal
          booking={selectedRelayQrBooking}
          onClose={() => setSelectedRelayQrBooking(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <img src={logoImg} alt="PakiSHIP Logo" className="h-10" />
          <nav className="hidden md:flex items-center gap-8">
          </nav>
          <div className="flex items-center gap-3">
            <button ref={guideButtonRef} onClick={() => { setShowTutorial(true); setTutorialStep(0); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#39B5A8]/5 rounded-full transition-colors text-[#39B5A8] font-bold text-sm">
              <HelpCircle className="w-4 h-4" /><span className="hidden md:inline">Guide</span>
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-[#39B5A8]/5 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-[#39B5A8]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white px-0.5">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-[#39B5A8]/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-[#041614]">Notifications</h3>
                      {unreadCount > 0 && <p className="text-xs text-[#39B5A8] font-bold mt-0.5">{unreadCount} unread</p>}
                    </div>
                    {unreadCount > 0 && <button onClick={markAllRead} className="text-xs font-black text-[#39B5A8] hover:underline px-2 py-1 hover:bg-[#39B5A8]/5 rounded-lg transition-colors">Mark all read</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-6 text-sm font-bold text-gray-400 text-center">
                        No notifications yet.
                      </div>
                    ) : notifications.map(n => (
                      <button key={n.id} onClick={() => markRead(n.id)}
                        className={`w-full px-5 py-4 hover:bg-[#F0F9F8] transition-colors flex items-start gap-3 text-left ${!n.read ? 'bg-[#F0F9F8]/60' : ''}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'info' ? 'bg-blue-50' : n.type === 'success' ? 'bg-green-50' : n.type === 'warning' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                          {n.type === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                          {n.type === 'star' && <Star className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-[#041614] truncate">{n.title}</h4>
                            {!n.read && <span className="w-2 h-2 bg-[#39B5A8] rounded-full shrink-0"></span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-gray-400 font-bold mt-1 block">{n.time}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile — navigates to /operator/profile (same pattern as driver) */}
            <ProfileDropdown
              userName={userName}
              profileImage={profileImage}
              onProfileClick={() => navigate("/operator/profile")}
              onSettingsClick={() => navigate("/operator/settings")}
              onLogoutClick={() => setShowLogoutModal(true)}
            />

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-[#39B5A8]/5 rounded-full transition-colors">
              {menuOpen ? <X className="w-5 h-5 text-[#39B5A8]" /> : <Menu className="w-5 h-5 text-[#39B5A8]" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#39B5A8]/10 bg-white/90 backdrop-blur-md">
            <nav className="flex flex-col p-4 gap-2">
              <MobileNavLink href="#" active>Dashboard</MobileNavLink>
              <MobileNavLink href="#">Parcels</MobileNavLink>
              <MobileNavLink href="#">Inventory</MobileNavLink>
              <MobileNavLink href="#">Reports</MobileNavLink>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#041614] mb-2">Good Afternoon, {userName}!</h1>
          <p className="text-[#39B5A8] font-medium">Drop-off Point: BGC Central Hub</p>
        </div>

        {/* ── Actions (3 buttons) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" ref={quickActionsRef}>
          <div className="lg:col-span-2">
            <ActionButton icon={<QrCode className="w-6 h-6" />} label="Scan Parcel" sub="Register via QR code" color="primary" onClick={() => setShowMobileScanNotice(true)} />
          </div>
          <div className="lg:col-span-2">
            <ActionButton icon={<Smartphone className="w-6 h-6" />} label="Manual Entry" sub="Type tracking number" color="secondary" onClick={() => setShowManualModal(true)} />
          </div>
        </div>

        <div className="mb-8 bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-xl font-black text-[#041614] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#39B5A8]" />
                Relay Economy QR Generator
              </h2>
              <p className="text-xs text-gray-400 font-bold mt-1">
                PKS IDs from booked PakiShare parcels are generated as QR codes for operator handoff.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshRelayQrBookings().catch(() => {})}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#39B5A8]/20 px-4 py-3 text-xs font-black text-[#39B5A8] hover:bg-[#F0F9F8] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          {relayQrBookings.length === 0 ? (
            <div className="rounded-2xl bg-[#F0F9F8] px-4 py-5 text-sm font-bold text-gray-500">
              No Relay Economy bookings with PKS IDs yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relayQrBookings.slice(0, 6).map((booking) => {
                const trackingNumber = booking.trackingNumber || booking.qrCodePayload;
                return (
                  <button
                    key={booking.draftId}
                    type="button"
                    onClick={() => setSelectedRelayQrBooking(booking)}
                    className="group rounded-2xl border border-[#39B5A8]/10 bg-white p-4 text-left shadow-sm transition-all hover:border-[#39B5A8]/40 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 rounded-2xl border border-[#39B5A8]/10 bg-white p-2">
                        <RelayQrImage value={booking.qrCodePayload} className="h-20 w-20" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#041614]">{trackingNumber}</p>
                        <p className="mt-1 truncate text-xs font-bold text-gray-400">
                          {booking.receiverName || "Relay Economy parcel"}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-[#F0F9F8] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">
                            {booking.status || "ready"}
                          </span>
                          {booking.totalParcels > 0 && (
                            <span className="text-[10px] font-black text-gray-400">
                              {booking.totalParcels} parcel{booking.totalParcels === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 transition-colors group-hover:text-[#39B5A8]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" ref={statsCardsRef}>
          <StatCard icon={<ArrowDownLeft className="w-5 h-5" />} label="Incoming Today" value={String(dashboardMetrics.kpis.incomingToday)} trend="Submitted today" color="incoming" />
          <StatCard icon={<Package className="w-5 h-5" />} label="Currently Stored" value={String(dashboardMetrics.kpis.currentlyStored)} trend="Month to date" />
          <StatCard icon={<ArrowUpRight className="w-5 h-5" />} label="Picked Up Today" value={String(dashboardMetrics.kpis.pickedUpToday)} trend="Updated today" color="success" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Customers Served" value={String(dashboardMetrics.kpis.customersServed)} trend="Unique senders today" />
        </div>

        {/* ── Bin Capacity + Earnings Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Delivery Bin Tracker */}
          <div className="bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F0F9F8] rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#39B5A8]" />
                </div>
                <div>
                  <h3 className="font-black text-[#041614] text-sm">Delivery Bin Capacity</h3>
                  <p className="text-xs text-gray-400 font-bold">
                    BGC Central Hub — Bin A • {storedParcelCount}/{DELIVERY_BIN_CAPACITY_PARCELS} parcels
                  </p>
                </div>
              </div>
              <span className={`text-2xl font-black ${binTextColor}`}>{binCapacity}%</span>
            </div>
            <div className="relative mb-3 mt-8">
              <div
                className="absolute transition-all duration-700 ease-in-out z-10"
                style={{ left: `clamp(0px, calc(${binCapacity}% - 50px), calc(100% - 64px))`, bottom: "100%", marginBottom: "-20px" }}
              >
                <img src="https://i.imgur.com/JCkCd6c.png" alt="PakiSHIP Mascot" className="w-16 h-16 object-contain" style={{ mixBlendMode: "multiply" }} />
              </div>
              <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${binColor}`} style={{ width: `${binCapacity}%` }}></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold mt-1">
              <span className="text-gray-400">0%</span>
              <span className={`flex items-center gap-1 ${binTextColor}`}>
                {binCapacity >= 90 ? <><AlertTriangle className="w-3 h-3" /> Almost Full!</> :
                 binCapacity >= 70 ? <><AlertCircle className="w-3 h-3" /> Getting Full</> :
                 <><CheckCircle2 className="w-3 h-3" /> Good Capacity</>}
              </span>
              <span className="text-gray-400">100%</span>
            </div>
          </div>

          {/* Earnings & Incentives */}
          <div className="bg-gradient-to-br from-[#041614] to-[#123E3A] rounded-3xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#39B5A8]/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#39B5A8]/20 rounded-xl flex items-center justify-center">
                  <span className="text-[#39B5A8] font-black text-base">₱</span>
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Earnings & Incentives</h3>
                  <p className="text-xs text-white/50 font-bold">This month</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Total Earned</p>
                  <p className="text-2xl font-black text-white">₱{totalEarnings.toLocaleString()}</p>
                  <p className="text-[10px] text-[#39B5A8] font-bold mt-1">+₱{dashboardMetrics.earnings.weeklyIncrease.toLocaleString()} this week</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Incentives</p>
                  <p className="text-2xl font-black text-yellow-400">₱{incentives}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Gift className="w-3 h-3 text-yellow-400" />
                    <p className="text-[10px] text-yellow-400 font-bold">{dashboardMetrics.earnings.bonusesEarned} bonuses earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Lost Parcel Button ── */}
        <div className="mb-8">
          <button onClick={() => setShowLostModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-orange-200 text-orange-500 rounded-2xl font-black text-sm hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm active:scale-95">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            Report Lost Parcel
          </button>
        </div>

        <div className="mb-8 bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-[#041614]">Recent Reports</h2>
              <p className="text-xs text-gray-400 font-bold mt-1">Saved from the operator dashboard into Supabase-backed tracking data</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-500 text-xs font-black uppercase tracking-widest">
              {reports.length} logged
            </span>
          </div>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="rounded-2xl bg-[#F0F9F8] px-4 py-5 text-sm font-bold text-gray-500">
                No reports submitted yet.
              </div>
            ) : (
              reports.slice(0, 5).map((report) => (
                <div key={report.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-[#041614]">{report.trackingNumber}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#1A5D56]">{report.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Parcel Management + Sidebar ── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm" ref={parcelsSectionRef}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-black text-[#041614]">Parcel Management</h2>
                <div className="flex bg-[#F0F9F8] p-1 rounded-xl border border-[#39B5A8]/10">
                  {(["all", "incoming", "stored"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${activeTab === tab ? "bg-white text-[#39B5A8] shadow-sm" : "text-gray-400 hover:text-[#39B5A8]"}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {parcels.filter(p => activeTab === "all" ? true : p.status === activeTab).map(parcel => (
                  <ParcelCard key={parcel.id} parcel={parcel} onScanReceive={() => handleScanReceive(parcel.id)} onProcessPickup={() => handleProcessPickup(parcel)} />
                ))}
                {parcels.filter(p => activeTab === "all" ? true : p.status === activeTab).length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm">No {activeTab} parcels</p>
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/operator/receive-parcel')}
                className="mt-6 w-full py-3.5 border-2 border-dashed border-[#39B5A8]/30 text-[#39B5A8] rounded-2xl font-black text-sm hover:border-[#39B5A8] hover:bg-[#F0F9F8] transition-all flex items-center justify-center gap-2">
                <Package className="w-4 h-4" /> View Receive Parcel Page
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#39B5A8] to-[#2D8F85] rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-[#39B5A8]/20" ref={performanceCardRef}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">4.9</div>
                    <div className="text-xs text-white/70">Rating</div>
                  </div>
                </div>
                <h3 className="text-lg font-black text-white mb-2">Excellent Performance</h3>
                <p className="text-sm text-white/80 mb-4 font-medium">Your drop-off point is one of the top-rated facilities this month!</p>
                <div className="flex items-center gap-2 text-xs text-white/90 font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+0.3 from last month</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#39B5A8]" />This Week
              </h3>
              <div className="space-y-4">
                <QuickStatItem label="Total Parcels" value="156" />
                <QuickStatItem label="Avg. Processing Time" value="3.2 min" />
                <QuickStatItem label="Customer Visits" value="203" />
                <QuickStatItem label="Revenue Generated" value="₱12,450" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 overflow-visible pt-28 pb-8 px-8 border border-[#39B5A8]/10">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none drop-shadow-2xl">
              <img src={isDriverEnRoute ? mascotThinkingImg : sadMascotImg} alt="Mascot" className="w-full h-full object-contain" />
            </div>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-[#041614] p-2 hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setShowLogoutModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-black text-[#041614] mb-2 leading-tight">
                {isDriverEnRoute ? "Driver is En Route!" : "Closing up for the day?"}
              </h2>
              {isDriverEnRoute ? (
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mt-4">
                  <div className="flex items-center gap-2 justify-center mb-2 text-orange-600">
                    <Truck className="w-5 h-5" />
                    <span className="font-black text-xs uppercase tracking-widest">Active Pickup</span>
                  </div>
                  <p className="text-orange-800 text-xs leading-relaxed font-bold">
                    A PUV driver is currently heading to your hub! Logging out now may cause delays in the parcel handover process.
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  There are still parcels waiting to be processed. Make sure everything's in order before you go! 📋
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all text-white ${
                  isDriverEnRoute ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={handleSecureLogout}
              >
                <LogOut className="w-4 h-4" />
                {isDriverEnRoute ? "Logout Anyway" : "Yes, End My Shift"}
              </button>
              <button className="w-full py-3.5 font-bold text-[#39B5A8] hover:bg-[#39B5A8]/5 rounded-2xl transition-all text-sm" onClick={() => setShowLogoutModal(false)}>
                Back to the Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionButton({ icon, label, sub, color, onClick }: { icon: React.ReactNode; label: string; sub: string; color: "primary" | "secondary"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left shadow-sm w-full ${
      color === "primary" ? "bg-[#39B5A8] border-[#39B5A8] text-white hover:bg-[#2D8F85]" : "bg-white border-[#39B5A8]/10 hover:border-[#39B5A8]/40"
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color === "primary" ? "bg-black/10" : "bg-[#F0F9F8]"}`}>
        <div className={color === "primary" ? "text-white" : "text-[#39B5A8]"}>{icon}</div>
      </div>
      <h3 className={`font-black mb-1 ${color === "primary" ? "text-white" : "text-[#041614]"}`}>{label}</h3>
      <p className={`text-sm font-medium ${color === "primary" ? "text-white/80" : "text-gray-500"}`}>{sub}</p>
    </button>
  );
}
function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return <a href={href} className={`text-sm font-black transition-colors ${active ? "text-[#39B5A8]" : "text-gray-400 hover:text-[#39B5A8]"}`}>{children}</a>;
}
function MobileNavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return <a href={href} className={`px-4 py-3 text-sm font-black rounded-xl transition-colors ${active ? "bg-[#F0F9F8] text-[#39B5A8]" : "text-gray-500 hover:bg-gray-50"}`}>{children}</a>;
}
function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode; label: string; value: string; trend: string; color?: "incoming" | "success" }) {
  const colorClass = color === "incoming" ? "bg-blue-50 text-blue-500" : color === "success" ? "bg-green-50 text-green-500" : "bg-[#F0F9F8] text-[#39B5A8]";
  return (
    <div className="bg-white border border-[#39B5A8]/10 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
        <TrendingUp className="w-4 h-4 text-[#39B5A8]" />
      </div>
      <div className="text-5xl font-black text-[#041614] mb-1">{value}</div>
      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[10px] text-[#39B5A8] font-bold">{trend}</div>
    </div>
  );
}
function ParcelCard({ parcel, onScanReceive, onProcessPickup }: { parcel: Parcel; onScanReceive: () => void; onProcessPickup?: () => void }) {
  const statusConfig = {
    incoming: { icon: <ArrowDownLeft className="w-5 h-5" />, text: "Incoming", color: "text-blue-500", bg: "bg-blue-50" },
    stored: { icon: <Package className="w-5 h-5" />, text: "Stored", color: "text-[#39B5A8]", bg: "bg-[#F0F9F8]" },
    "picked-up": { icon: <CheckCircle2 className="w-5 h-5" />, text: "Picked Up", color: "text-green-500", bg: "bg-green-50" },
    dispatched: { icon: <Truck className="w-5 h-5" />, text: "Dispatched", color: "text-orange-500", bg: "bg-orange-50" },
  };
  const status = statusConfig[parcel.status];
  return (
    <div className="bg-white border border-[#39B5A8]/10 rounded-2xl p-5 hover:border-[#39B5A8]/40 transition-all shadow-sm">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg">{parcel.trackingNumber}</span>
            {parcel.storageLocation && <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2.5 py-1 rounded-full uppercase">Shelf: {parcel.storageLocation}</span>}
          </div>
          <div className="space-y-1 mb-3">
            <div className="text-sm"><span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">From:</span><span className="text-[#041614] font-black ml-2">{parcel.sender}</span></div>
            <div className="text-sm"><span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">To:</span><span className="text-[#041614] font-black ml-2">{parcel.recipient}</span></div>
          </div>
          {(parcel.arrivalTime || parcel.pickupTime) && (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{parcel.arrivalTime ? `Arrived: ${parcel.arrivalTime}` : `Picked up: ${parcel.pickupTime}`}</span>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${status.bg}`}>
          <div className={status.color}>{status.icon}</div>
          <span className={`text-xs font-black ${status.color}`}>{status.text}</span>
        </div>
      </div>
      {parcel.status === "incoming" && (
        <button onClick={onScanReceive} className="w-full bg-[#39B5A8] text-white font-black py-3.5 rounded-xl hover:bg-[#2D8F85] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#39B5A8]/10 active:scale-[0.98]">
          <QrCode className="w-4 h-4" /> Scan & Receive <ChevronRight className="w-4 h-4" />
        </button>
      )}
      {parcel.status === "stored" && (
        <button onClick={onProcessPickup} className="w-full bg-white border-2 border-[#39B5A8] text-[#39B5A8] font-black py-3 rounded-xl hover:bg-[#F0F9F8] transition-all flex items-center justify-center gap-2">
          Process Pickup <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
function QuickStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-black text-[#041614]">{value}</span>
    </div>
  );
}
function Tutorial({ step, onNext, onPrev, onClose, quickActionsRef, statsCardsRef, parcelsSectionRef, performanceCardRef, guideButtonRef }: any) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const steps = [
    { title: "Welcome to Operator Dashboard!", content: "Hi Rosa! I'm your PakiSHIP guide. Let me walk you through your dashboard.", image: mascotWavingImg, targetRef: null },
    { title: "Quick Actions", content: "Scan parcels, do manual entry, or update statuses right from here!", image: mascotWinkingImg, targetRef: quickActionsRef },
    { title: "Statistics Overview", content: "Track incoming, stored, and picked-up parcels in real time.", image: mascotChecklistImg, targetRef: statsCardsRef },
    { title: "Parcel Management", content: "Manage all parcels. Use 'Scan & Receive' to receive incoming ones!", image: sendParcelIcon, targetRef: parcelsSectionRef },
    { title: "Performance Rating", content: "Your drop-off rating lives here. Keep up the great work!", image: rateReviewIcon, targetRef: performanceCardRef },
    { title: "Need Help Again?", content: "Click 'Guide' anytime. PakiSHIP - Hatid Agad!", image: mascotThinkingImg, targetRef: guideButtonRef },
  ];
  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  useEffect(() => {
    const targetRef = currentStep.targetRef;
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightRect(targetRef.current!.getBoundingClientRect()), 350);
    } else setHighlightRect(null);
  }, [step]);
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[59]">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask-operator">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && <rect x={highlightRect.left - 12} y={highlightRect.top - 12} width={highlightRect.width + 24} height={highlightRect.height + 24} rx="32" fill="black" />}
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(4, 22, 20, 0.5)" mask="url(#spotlight-mask-operator)" />
        </svg>
        {highlightRect && <div className="absolute border-4 border-[#39B5A8] rounded-[2rem] shadow-2xl animate-pulse"
          style={{ left: highlightRect.left - 12, top: highlightRect.top - 12, width: highlightRect.width + 24, height: highlightRect.height + 24 }} />}
      </div>
      <div className="fixed bottom-6 right-6 z-[60] w-[380px] pointer-events-auto">
        <div className="flex justify-center mb-0">
          <div className="w-28 h-28 drop-shadow-2xl pointer-events-none">
            <img key={currentStep.image} src={currentStep.image} alt="Guide" className="w-full h-full object-contain animate-in zoom-in-75 duration-300" style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>
        <div className="bg-white text-[#1A5D56] p-6 rounded-[2rem] shadow-2xl -mt-6 pt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="px-3 py-1 bg-[#39B5A8]/10 rounded-full text-[#39B5A8] text-xs font-black">Step {step + 1} of {steps.length}</div>
            <button className="text-gray-400 hover:text-[#041614] p-2 hover:bg-gray-100 rounded-xl" onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          <h2 className="text-lg font-black text-[#041614] mb-3">{currentStep.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6">{currentStep.content}</p>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 px-4 py-2 text-[#39B5A8] font-bold disabled:opacity-30 text-sm" onClick={onPrev} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#39B5A8] text-white rounded-xl font-black shadow-lg hover:bg-[#2D8F85] text-sm" onClick={isLastStep ? onClose : onNext}>
              {isLastStep ? "Got it, thanks!" : "Next"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
