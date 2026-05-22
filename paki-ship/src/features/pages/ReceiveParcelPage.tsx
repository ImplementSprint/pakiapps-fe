import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, ArrowLeft, CheckCircle2, Clock, QrCode, ChevronRight,
  ArrowDownLeft, Search, Filter, User, MapPin, Calendar,
} from "lucide-react";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type DropoffStatus = "pending" | "processing" | "received";

interface DropoffParcel {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  expectedArrival: string;
  status: DropoffStatus;
  packageSize: "Small" | "Medium" | "Large";
  origin: string;
  receivedAt?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const pendingParcels: DropoffParcel[] = [
  { id: "p1", trackingNumber: "PKS-2026-001241", sender: "GlobalShop PH", recipient: "Maria Santos", expectedArrival: "2:30 PM", status: "pending", packageSize: "Medium", origin: "Makati City" },
  { id: "p2", trackingNumber: "PKS-2026-001242", sender: "Juan Dela Cruz", recipient: "Pedro Garcia", expectedArrival: "3:00 PM", status: "pending", packageSize: "Small", origin: "Quezon City" },
  { id: "p3", trackingNumber: "PKS-2026-001243", sender: "LazMall", recipient: "Ana Reyes", expectedArrival: "3:45 PM", status: "processing", packageSize: "Large", origin: "Pasig City" },
  { id: "p4", trackingNumber: "PKS-2026-001244", sender: "ShopeeExpress", recipient: "Carlo Mendoza", expectedArrival: "4:00 PM", status: "pending", packageSize: "Small", origin: "Taguig City" },
];

const receivedTodayParcels: DropoffParcel[] = [
  { id: "r1", trackingNumber: "PKS-2026-001230", sender: "GlobalShop PH", recipient: "Lisa Torres", expectedArrival: "9:00 AM", receivedAt: "9:12 AM", status: "received", packageSize: "Small", origin: "Makati City" },
  { id: "r2", trackingNumber: "PKS-2026-001225", sender: "Shopee", recipient: "Ryan Cruz", expectedArrival: "10:00 AM", receivedAt: "10:05 AM", status: "received", packageSize: "Medium", origin: "Mandaluyong" },
  { id: "r3", trackingNumber: "PKS-2026-001218", sender: "Lazada", recipient: "Diana Lim", expectedArrival: "11:30 AM", receivedAt: "11:28 AM", status: "received", packageSize: "Large", origin: "Pasig City" },
  { id: "r4", trackingNumber: "PKS-2026-001210", sender: "Juan Santos", recipient: "Ella Reyes", expectedArrival: "12:00 PM", receivedAt: "12:15 PM", status: "received", packageSize: "Small", origin: "BGC" },
  { id: "r5", trackingNumber: "PKS-2026-001205", sender: "ZaloraPH", recipient: "Mark Garcia", expectedArrival: "1:00 PM", receivedAt: "1:03 PM", status: "received", packageSize: "Medium", origin: "Ortigas" },
];

// ─── QR Scan Modal (inline for this page) ────────────────────────────────────
function ScanModal({ parcel, onClose, onSuccess }: { parcel: DropoffParcel; onClose: () => void; onSuccess: () => void }) {
  const [phase, setPhase] = useState<"scanning" | "success">("scanning");
  const [dots, setDots] = useState(".");

  useState(() => {
    if (phase !== "scanning") return;
    const dotInterval = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    const scanTimeout = setTimeout(() => setPhase("success"), 2800);
    return () => { clearInterval(dotInterval); clearTimeout(scanTimeout); };
  });

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
                <div className="absolute inset-4 grid grid-cols-6 grid-rows-6 gap-0.5 opacity-20">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className={`rounded-[1px] ${[0,1,6,7,5,11,30,31,36,35,24,25].includes(i) || Math.random() > 0.5 ? 'bg-[#041614]' : ''}`}></div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#39B5A8] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3 mb-4">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1">Expecting</p>
              <p className="text-sm font-black text-[#041614]">{parcel.trackingNumber}</p>
              <p className="text-xs text-gray-400 font-bold mt-0.5">For: {parcel.recipient}</p>
            </div>
            <h2 className="text-xl font-black text-[#041614] mb-2">Scanning QR Code{dots}</h2>
            <p className="text-gray-400 text-sm font-medium mb-6">Hold the parcel's QR code in front of the camera</p>
            <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#041614] hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="w-full bg-[#F0F9F8] rounded-2xl px-4 py-3 mb-4">
              <p className="text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1">Scanned Successfully</p>
              <p className="text-lg font-black text-[#041614]">{parcel.trackingNumber}</p>
              <p className="text-xs text-gray-400 font-bold mt-0.5">Recipient: {parcel.recipient}</p>
            </div>
            <h2 className="text-xl font-black text-green-600 mb-1">Parcel Received!</h2>
            <p className="text-gray-400 text-sm font-medium mb-6">
              The parcel has been successfully received and stored in the facility.
            </p>
            <button onClick={onSuccess}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ReceiveParcelPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [pending, setPending] = useState(pendingParcels);
  const [received, setReceived] = useState(receivedTodayParcels);
  const [scanningParcel, setScanningParcel] = useState<DropoffParcel | null>(null);

  const filteredPending = pending.filter(p =>
    p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReceived = received.filter(p =>
    p.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanSuccess = () => {
    if (!scanningParcel) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    const updated: DropoffParcel = { ...scanningParcel, status: "received", receivedAt: timeStr };
    setPending(prev => prev.filter(p => p.id !== scanningParcel.id));
    setReceived(prev => [updated, ...prev]);
    setScanningParcel(null);
  };

  const sizeColor: Record<string, string> = {
    Small: "bg-green-50 text-green-600",
    Medium: "bg-blue-50 text-blue-600",
    Large: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] font-sans">
      {scanningParcel && (
        <ScanModal
          parcel={scanningParcel}
          onClose={() => setScanningParcel(null)}
          onSuccess={handleScanSuccess}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 p-2 hover:bg-[#39B5A8]/5 rounded-xl transition-colors text-[#39B5A8]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={logoImg} alt="PakiSHIP Logo" className="h-10" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#041614]">Receive Parcel</h1>
            <p className="text-xs text-[#39B5A8] font-bold">BGC Central Hub</p>
          </div>
          <div className="w-24" /> {/* spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Pending Drop-offs" value={String(pending.length)} icon={<Clock className="w-5 h-5" />} color="blue" />
          <SummaryCard label="Processing" value={String(pending.filter(p => p.status === "processing").length)} icon={<QrCode className="w-5 h-5" />} color="teal" />
          <SummaryCard label="Received Today" value={String(received.length)} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
          <SummaryCard label="Total Parcels" value={String(pending.length + received.length)} icon={<Package className="w-5 h-5" />} color="default" />
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tracking number, sender, or recipient..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#39B5A8]/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 ring-[#39B5A8] outline-none placeholder:font-normal placeholder:text-gray-300 shadow-sm"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Pending Drop-offs ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#041614]">Pending Drop-offs</h2>
                  <p className="text-xs text-gray-400 font-bold">{filteredPending.length} parcel{filteredPending.length !== 1 ? 's' : ''} awaiting</p>
                </div>
              </div>
              <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">{pending.length} pending</span>
            </div>

            <div className="space-y-3">
              {filteredPending.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#39B5A8]/10 rounded-3xl shadow-sm">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-300" />
                  <p className="font-black text-gray-400 text-sm">All caught up!</p>
                  <p className="text-xs text-gray-300 font-bold mt-1">No pending drop-offs</p>
                </div>
              ) : (
                filteredPending.map(parcel => (
                  <div key={parcel.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                    parcel.status === "processing" ? "border-[#39B5A8]/40 ring-2 ring-[#39B5A8]/10" : "border-[#39B5A8]/10 hover:border-[#39B5A8]/30"
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg">{parcel.trackingNumber}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${sizeColor[parcel.packageSize]}`}>{parcel.packageSize}</span>
                          {parcel.status === "processing" && (
                            <span className="text-[10px] font-black text-[#39B5A8] bg-[#39B5A8]/10 px-2 py-1 rounded-full animate-pulse">Processing...</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 font-bold">To:</span>
                            <span className="font-black text-[#041614] truncate">{parcel.recipient}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 font-bold">From:</span>
                            <span className="font-bold text-gray-500 truncate">{parcel.sender} · {parcel.origin}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="text-blue-500 font-black">Expected: {parcel.expectedArrival}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setScanningParcel(parcel)}
                      className="w-full bg-[#39B5A8] text-white font-black py-3 rounded-xl hover:bg-[#2D8F85] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#39B5A8]/10 active:scale-[0.98] text-sm">
                      <QrCode className="w-4 h-4" /> Scan & Receive <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Received Today ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#041614]">Received Today</h2>
                  <p className="text-xs text-gray-400 font-bold">{filteredReceived.length} parcel{filteredReceived.length !== 1 ? 's' : ''} processed</p>
                </div>
              </div>
              <span className="text-xs font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full">{received.length} received</span>
            </div>

            <div className="space-y-3">
              {filteredReceived.length === 0 ? (
                <div className="text-center py-12 bg-white border border-[#39B5A8]/10 rounded-3xl shadow-sm">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-black text-gray-400 text-sm">Nothing received yet</p>
                  <p className="text-xs text-gray-300 font-bold mt-1">Parcels you scan will appear here</p>
                </div>
              ) : (
                filteredReceived.map(parcel => (
                  <div key={parcel.id} className="bg-white border border-[#39B5A8]/10 rounded-2xl p-5 shadow-sm hover:border-[#39B5A8]/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg">{parcel.trackingNumber}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${sizeColor[parcel.packageSize]}`}>{parcel.packageSize}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 font-bold">To:</span>
                            <span className="font-black text-[#041614] truncate">{parcel.recipient}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400 font-bold">From:</span>
                            <span className="font-bold text-gray-500 truncate">{parcel.sender}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-black text-green-600">Received</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold">{parcel.receivedAt}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Timeline summary */}
            {received.length > 0 && (
              <div className="mt-4 bg-white border border-[#39B5A8]/10 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-black text-[#041614] mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#39B5A8]" /> Today's Timeline
                </h3>
                <div className="relative pl-4">
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#39B5A8]/20 rounded-full"></div>
                  <div className="space-y-3">
                    {received.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#39B5A8] rounded-full absolute -left-[3px]"></div>
                        <span className="text-[10px] font-black text-gray-400 w-14 shrink-0">{p.receivedAt}</span>
                        <span className="text-xs font-black text-[#041614] truncate">{p.trackingNumber}</span>
                        <span className="text-[10px] text-gray-400 font-bold ml-auto shrink-0">{p.recipient.split(' ')[0]}</span>
                      </div>
                    ))}
                    {received.length > 4 && (
                      <p className="text-xs text-[#39B5A8] font-black pl-1">+{received.length - 4} more today</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: "blue" | "teal" | "green" | "default" }) {
  const styles = {
    blue: { card: "border-blue-100", icon: "bg-blue-50 text-blue-500", value: "text-blue-600" },
    teal: { card: "border-[#39B5A8]/20", icon: "bg-[#F0F9F8] text-[#39B5A8]", value: "text-[#39B5A8]" },
    green: { card: "border-green-100", icon: "bg-green-50 text-green-500", value: "text-green-600" },
    default: { card: "border-[#39B5A8]/10", icon: "bg-[#F0F9F8] text-[#39B5A8]", value: "text-[#041614]" },
  }[color];

  return (
    <div className={`bg-white border ${styles.card} rounded-2xl p-5 shadow-sm`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${styles.icon}`}>{icon}</div>
      <div className={`text-2xl font-black mb-1 ${styles.value}`}>{value}</div>
      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider leading-tight">{label}</div>
    </div>
  );
}
