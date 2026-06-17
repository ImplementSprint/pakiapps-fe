import { useState } from "react";
import {
  Search,
  Package,
  Phone,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  XCircle,
  PhoneOff,
  User,
  Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router";
import { CustomerPageHeader } from "../components/CustomerPageHeader";
import MapPreview from "../components/MapPreview";
import { apiFetch } from "@/lib/api-client";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

export function TrackPackagePage() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] =
    useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);

  const fetchTrackingData = async (id: string) => {
    setIsSearching(true);
    setError(null);
    setTrackingResult(null);

    try {
      const response = await apiFetch(
        `/api/parcel-drafts/track/${encodeURIComponent(id.trim())}`,
      );
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            "Parcel Not Found: We couldn't find a package with that number.",
        );
        return;
      }

      setTrackingResult(result);
    } catch {
      setError("Unable to load tracking details right now.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      fetchTrackingData(trackingNumber);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] selection:bg-[#39B5A8]/20 font-sans relative">
      <CustomerPageHeader
        title="Track Parcel"
        subtitle="Get real-time updates on your delivery"
        icon={Package}
        logo={logoImg}
        onBack={() => navigate("/customer/home")}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search Form */}
        <form onSubmit={handleTrack} className="mb-6 sm:mb-8">
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-[#1A5D56]/5 border border-[#39B5A8]/20 p-5 sm:p-8">
            <label className="block text-[10px] sm:text-xs font-bold mb-3 text-[#1A5D56] uppercase tracking-[0.15em]">
              Enter Tracking Number
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A5D56]/40" />
                <input
                  type="text"
                  placeholder="e.g., PKS-2024-001"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full pl-12 h-14 rounded-xl sm:rounded-2xl border-2 transition-all text-[#1A5D56] font-bold placeholder:text-slate-300 focus:outline-none ${
                    error
                      ? "border-red-200 bg-red-50/50 focus:border-red-400"
                      : "border-slate-100 bg-slate-50/50 focus:border-[#39B5A8] focus:bg-white"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !trackingNumber}
                className="h-14 px-10 rounded-xl sm:rounded-2xl bg-[#39B5A8] hover:bg-[#1A5D56] text-white font-bold transition-all shadow-lg shadow-[#39B5A8]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-full sm:min-w-[160px]"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Track Now"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 sm:mt-6 flex items-start sm:items-center gap-3 sm:gap-4 bg-red-50 border border-red-100 p-4 rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="w-10 h-10 rounded-lg sm:rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-200">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-900 font-bold text-xs sm:text-sm">
                    Oops! Something's wrong
                  </h4>
                  <p className="text-red-600/80 text-[10px] sm:text-xs font-semibold">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-1 sm:p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-300 hover:text-red-500" />
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Tracking Result */}
        {trackingResult ? (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-lg border border-[#39B5A8]/20 p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#39B5A8]/10 flex items-center justify-center">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 text-[#39B5A8]" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                      Tracking #{trackingResult.trackingNumber}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[#1A5D56]">
                      {trackingResult.status}
                    </div>
                  </div>
                </div>
                <div className="self-start sm:self-center px-4 py-2 bg-[#F0F9F8] rounded-full border border-[#39B5A8]/20">
                  <span className="text-[#39B5A8] font-bold text-xs sm:text-sm">
                    ETA: {trackingResult.estimatedDelivery}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Origin
                    </div>
                    <div className="font-bold text-[#1A5D56] text-xs sm:text-sm">
                      {trackingResult.origin}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#39B5A8]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Destination
                    </div>
                    <div className="font-bold text-[#1A5D56] text-xs sm:text-sm">
                      {trackingResult.destination}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Map Tracking */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-[#39B5A8]/20 overflow-hidden">
              <div className="px-5 sm:px-8 py-4 bg-[#F0F9F8]/50 border-b border-[#39B5A8]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#39B5A8] animate-ping" />
                  <span className="text-[10px] font-black text-[#1A5D56] uppercase tracking-[0.2em]">
                    Live Location
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  GPS Live
                </div>
              </div>
              <div className="h-[700px] relative">
                <MapPreview
                  pickupAddress={trackingResult.origin}
                  deliveryAddress={trackingResult.destination}
                  driverName={trackingResult.driver.name}
                  driverPhone={trackingResult.driver.phone}
                  trackingNumber={trackingResult.trackingNumber}
                  showDriverInfo={true}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-lg border border-[#39B5A8]/20 p-5 sm:p-8">
              <h3 className="font-bold text-base sm:text-lg mb-6 sm:mb-8 text-[#1A5D56] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#39B5A8]" />
                Delivery Timeline
              </h3>
              <div className="space-y-0">
                {trackingResult.timeline.map(
                  (event: any, index: number) => (
                    <div
                      key={index}
                      className="flex gap-4 sm:gap-6"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                            event.completed
                              ? "bg-[#39B5A8] text-white"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          {event.completed ? "✓" : index + 1}
                        </div>
                        {index <
                          trackingResult.timeline.length -
                            1 && (
                          <div
                            className={`w-0.5 h-12 sm:h-16 ${event.completed ? "bg-[#39B5A8]" : "bg-slate-100"}`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-8 sm:pb-10">
                        <div
                          className={`font-bold text-base sm:text-lg leading-tight ${event.completed ? "text-[#1A5D56]" : "text-slate-300"}`}
                        >
                          {event.status}
                        </div>
                        <div
                          className={`text-xs sm:text-sm font-medium mt-1 ${event.completed ? "text-slate-500" : "text-slate-200"}`}
                        >
                          {event.location}
                        </div>
                        <div
                          className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${event.completed ? "text-[#39B5A8]" : "text-slate-200"}`}
                        >
                          {event.timestamp}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Driver Contact Card */}
            <div className="bg-[#1A5D56] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 text-white shadow-xl shadow-[#1A5D56]/20 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <Phone className="w-48 h-48 sm:w-64 sm:h-64" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                    <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-[#39B5A8]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.2em] mb-1">
                      Your Rider
                    </div>
                    <div className="font-bold text-lg sm:text-xl mb-1">
                      {trackingResult.driver.name}
                    </div>
                    <div className="text-xs sm:text-sm text-white/60 font-medium">
                      {trackingResult.driver.vehicleType} •{" "}
                      {trackingResult.driver.plateNumber}
                    </div>
                  </div>
                </div>
                <button
                  className="bg-[#39B5A8] hover:bg-white hover:text-[#39B5A8] text-white rounded-xl sm:rounded-2xl h-14 sm:h-16 px-6 flex items-center justify-center transition-all shadow-lg active:scale-95 group font-bold gap-3 w-full sm:w-auto"
                  onClick={() => setIsCalling(true)}
                >
                  <Phone className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Call Rider</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-10 sm:p-20 shadow-xl shadow-[#1A5D56]/5 border border-[#39B5A8]/10 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F0F9F8] rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-[#39B5A8]/20">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#39B5A8]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-[#1A5D56]">
              Ready to track?
            </h3>
            <p className="text-slate-500 max-w-md mx-auto font-medium text-sm sm:text-base leading-relaxed">
              Enter your tracking number above to get real-time
              updates on your PakiShip parcel.
            </p>
          </div>
        )}
      </main>

      {/* CALLING POPUP */}
      {isCalling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#1A5D56]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="p-6 sm:p-8 text-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-[#39B5A8]/20 rounded-full animate-ping" />
                <div className="relative w-full h-full bg-[#39B5A8] rounded-full flex items-center justify-center shadow-lg shadow-[#39B5A8]/30">
                  <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
                </div>
              </div>

              <h3 className="text-[#1A5D56] font-bold text-xl sm:text-2xl mb-1">
                Calling Rider...
              </h3>
              <p className="text-slate-400 font-medium text-sm mb-6 sm:mb-8">
                Connecting to secure line
              </p>

              <div className="bg-[#F0F9F8] rounded-xl sm:rounded-2xl p-4 mb-6 sm:mb-8 flex items-center gap-4 text-left border border-[#39B5A8]/10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#39B5A8]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-[#1A5D56] text-sm sm:text-base truncate">
                    {trackingResult?.driver.name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    {trackingResult?.driver.phone}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCalling(false)}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-14 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-red-200 active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </button>
            </div>

            <div className="bg-slate-50 px-6 sm:px-8 py-4 text-center">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Protected by PakiShip Security
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}
