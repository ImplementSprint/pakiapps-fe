import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ScanBarcode, Search, LogOut, CheckCircle2, Clock, AlertCircle,
  Calendar, MapPin, Car, User, Hash, ChevronRight, RefreshCw,
  XCircle, CheckCheck, Timer, Ticket, Menu, X, Bell, Shield,
  Activity, DollarSign, Receipt, ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import logo from "../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png";
import mascotLogout from "../../assets/3ab94b49d340bf5c808a76004d2bebbd7166a97f.png";
import mascotChecklist from "../../assets/6ba55cecd5b7106e37c71ca0e89f4f80eb706edd.png";
import { bookingService, Booking } from "../services/bookingService";
import { authService } from "../services/authService";
import { toast } from "sonner";

// ── Billing constants (mirrors backend) ───────────────────────────────────────
const RATE_PER_HOUR        = 15;  // ₱15 per overtime hour
const FREE_HOURS           = 2;   // first 2 hours are FREE
const REFRESH_MS           = 30_000;
const CHECKIN_GRACE_MINS   = 15;  // allow check-in up to 15 min before slot start

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return d.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}
function toDateStr(d: Date) { return d.toISOString().split("T")[0]; }
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

/**
 * Parse a timeSlot string like "12:00 - 13:00" combined with a date string
 * "2026-03-29" into concrete start/end Date objects in LOCAL time.
 */
function parseSlotWindow(date: string, timeSlot: string): { start: Date; end: Date } | null {
  const m = timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, sh, sm, eh, em] = m;
  const start = new Date(`${date}T${sh.padStart(2, '0')}:${sm}:00+08:00`);
  const end   = new Date(`${date}T${eh.padStart(2, '0')}:${em}:00+08:00`);
  return { start, end };
}

/**
 * Determine whether check-in is currently allowed for a given booking.
 * Allows CHECKIN_GRACE_MINS minutes before the slot starts.
 * Returns { allowed, label } so the UI can show helpful messaging.
 */
function getCheckInState(
  date: string, timeSlot: string, now: Date
): { allowed: boolean; label: string; state: 'open' | 'early' | 'expired' | 'unknown' } {
  const slot = parseSlotWindow(date, timeSlot);
  if (!slot) return { allowed: true, label: 'Check In', state: 'unknown' };

  const graceStart = new Date(slot.start.getTime() - CHECKIN_GRACE_MINS * 60_000);

  if (now < graceStart) {
    // Too early — show countdown
    const diffMs   = graceStart.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60_000);
    const diffHrs  = Math.floor(diffMins / 60);
    const remMins  = diffMins % 60;
    const countdownLabel = diffHrs > 0
      ? `Opens in ${diffHrs}h ${remMins}m`
      : `Opens in ${diffMins}m`;
    return { allowed: false, label: countdownLabel, state: 'early' };
  }
  if (now > slot.end) {
    return { allowed: false, label: 'Slot Expired', state: 'expired' };
  }
  return { allowed: true, label: 'Check In', state: 'open' };
}

/** Live clock hook — re-renders consumers every minute so check-in states update automatically. */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Billing preview — first FREE_HOURS are included at no charge.
 * Every hour (or part thereof) beyond the free window: ₱RATE_PER_HOUR.
 * Example: 2h 5min → 5 min overtime → ceil(0.083) = 1 hr → ₱15
 */
function computeBillingPreview(checkInAt: string) {
  const ms       = Math.max(0, Date.now() - new Date(checkInAt).getTime());
  const hrs      = ms / (1000 * 60 * 60);
  const mins     = Math.round(ms / 60000);
  const ovHrs    = Math.max(0, hrs - FREE_HOURS);
  const billable = Math.ceil(ovHrs);
  const amount   = billable * RATE_PER_HOUR;
  const ovMins   = Math.max(0, mins - FREE_HOURS * 60);
  return {
    durationMins:  mins,
    durationLabel: mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`,
    overtimeMins:  ovMins,
    overtimeLabel: ovMins <= 0 ? "None"
      : ovMins < 60  ? `${ovMins} min`
      : `${Math.floor(ovMins / 60)}h ${ovMins % 60}m`,
    billableHours: billable,
    finalAmount:   amount,
  };
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    upcoming:  { label: "Upcoming",  cls: "bg-blue-50 text-blue-700 border-blue-200",    icon: <Clock className="size-3" /> },
    active:    { label: "Active",    cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="size-3" /> },
    completed: { label: "Completed", cls: "bg-gray-50 text-gray-600 border-gray-200",    icon: <CheckCheck className="size-3" /> },
    cancelled: { label: "Forfeited", cls: "bg-red-50 text-red-600 border-red-200",       icon: <XCircle className="size-3" /> },
    no_show:   { label: "No-Show",   cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertCircle className="size-3" /> },
  };
  const cfg = map[status] ?? map.upcoming;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Live duration ticker ──────────────────────────────────────────────────────
function LiveDurationBadge({ checkInAt }: { checkInAt: string }) {
  const [p, setP] = useState(() => computeBillingPreview(checkInAt));
  useEffect(() => {
    const id = setInterval(() => setP(computeBillingPreview(checkInAt)), 30_000);
    return () => clearInterval(id);
  }, [checkInAt]);
  const free = p.finalAmount === 0;
  return (
    <span className={`inline-flex items-center gap-1.5 border text-[10px] font-bold px-2.5 py-1 rounded-full ${
      free ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-amber-50 border-amber-200 text-amber-700"
    }`}>
      <Timer className="size-3 animate-pulse" />
      {p.durationLabel}{free ? " · FREE" : ` · ₱${p.finalAmount}`}
    </span>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
interface CheckoutModalProps {
  booking: Booking;
  onConfirm: () => void;
  onCancel:  () => void;
  isLoading: boolean;
}
function CheckoutModal({ booking, onConfirm, onCancel, isLoading }: CheckoutModalProps) {
  const ciAt = booking.checkInAt ?? new Date().toISOString();
  const [p, setP] = useState(() => computeBillingPreview(ciAt));
  useEffect(() => {
    const id = setInterval(() => setP(computeBillingPreview(ciAt)), 10_000);
    return () => clearInterval(id);
  }, [ciAt]);

  const isFree = p.finalAmount === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">

        <div className="size-16 rounded-2xl bg-[#ee6b20]/10 flex items-center justify-center mx-auto mb-5">
          <Receipt className="size-8 text-[#ee6b20]" />
        </div>
        <h3 className="text-2xl font-black text-center text-[#1e3d5a] mb-1">Check-Out Summary</h3>
        <p className="text-sm text-center text-gray-400 mb-6">
          <span className="font-bold text-[#ee6b20]">{booking.reference}</span> · {(booking.userId as any)?.name || "Customer"}
        </p>

        {/* Billing breakdown card */}
        <div className="bg-[#f8fafc] rounded-2xl border border-gray-100 p-5 space-y-3 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Billing Breakdown</p>

          {/* Time grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: "Check-In",        value: fmtTime(ciAt) },
              { label: "Check-Out (Now)", value: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) },
              { label: "Total Duration",  value: p.durationLabel },
              { label: "Free Window",     value: `${FREE_HOURS}h 00m` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <p className="font-bold text-[#1e3d5a] text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Overtime row */}
          <div className={`rounded-xl px-4 py-3 border flex items-center justify-between ${
            isFree ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
          }`}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Overtime</p>
              <p className={`font-bold text-sm ${isFree ? "text-green-600" : "text-amber-700"}`}>
                {p.overtimeLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Charge</p>
              <p className={`font-bold text-sm ${isFree ? "text-green-600" : "text-amber-700"}`}>
                {isFree ? "N/A" : `${p.billableHours} hr × ₱${RATE_PER_HOUR}`}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-bold text-[#1e3d5a] text-sm">Total Amount Due</span>
            {isFree
              ? <span className="text-3xl font-black text-green-600">FREE</span>
              : <span className="text-3xl font-black text-[#ee6b20]">₱{p.finalAmount}</span>
            }
          </div>
          <p className="text-[10px] text-right text-gray-400 font-medium">
            {isFree
              ? `Within ${FREE_HOURS}-hour free window`
              : `First ${FREE_HOURS} hrs free · ₱${RATE_PER_HOUR}/hr after`}
          </p>
        </div>

        {/* Spot info */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
          <MapPin className="size-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            Spot <strong>{booking.spot}</strong> will be released after checkout
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1 rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl font-bold text-white ${
              isFree ? "bg-green-600 hover:bg-green-700" : "bg-[#ee6b20] hover:bg-[#d95a10]"
            }`}
          >
            {isLoading ? (
              <><RefreshCw className="size-4 mr-2 animate-spin" />Processing…</>
            ) : isFree ? (
              <>Confirm Check-Out · FREE</>
            ) : (
              <>Confirm Check-Out · ₱{p.finalAmount}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Booking row card ──────────────────────────────────────────────────────────
interface BookingRowProps {
  booking:    Booking;
  onCheckIn:  (b: Booking) => void;
  onCheckOut: (b: Booking) => void;
  actionId:   string | null;
  now:        Date;           // injected from parent's useNow()
}
function BookingRow({ booking, onCheckIn, onCheckOut, actionId, now }: BookingRowProps) {
  const isUpcoming  = booking.status === "upcoming";
  const canCheckOut = booking.status === "active";
  const isBusy      = actionId === booking._id;

  // Real-time check-in window validation
  const ciState = isUpcoming
    ? getCheckInState(booking.date, booking.timeSlot, now)
    : { allowed: false, label: '', state: 'unknown' as const };
  const canCheckIn = isUpcoming && ciState.allowed;

  const borderCls =
    canCheckIn  ? "border-[#ee6b20]/30 bg-orange-50/20 hover:border-[#ee6b20]/60" :
    isUpcoming  ? "border-gray-100 hover:border-gray-200" :   // upcoming but outside window
    canCheckOut ? "border-green-200 bg-green-50/30 hover:border-green-400" :
    "border-gray-100";

  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:shadow-md ${borderCls}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          canCheckOut ? "bg-green-100" :
          canCheckIn  ? "bg-[#ee6b20]/10" :
          isUpcoming  ? "bg-gray-50" : "bg-gray-50"
        }`}>
          <Ticket className={`size-5 ${
            canCheckOut ? "text-green-600" :
            canCheckIn  ? "text-[#ee6b20]" : "text-gray-400"
          }`} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#1e3d5a] text-sm truncate">{booking.reference}</p>
          <p className="text-xs text-gray-500 truncate">
            {(booking.userId as any)?.name || "Customer"} · {(booking.vehicleId as any)?.plateNumber || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium flex-shrink-0">
        <Clock className="size-3.5 text-[#ee6b20]" />
        <span>{booking.timeSlot}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium flex-shrink-0">
        <MapPin className="size-3.5 text-[#1e3d5a]" />
        <span>Spot {booking.spot}</span>
      </div>

      {canCheckOut && booking.checkInAt
        ? <LiveDurationBadge checkInAt={booking.checkInAt} />
        : <StatusBadge status={booking.status} />
      }

      {/* Window state chip for upcoming bookings */}
      {isUpcoming && (
        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          ciState.state === 'open'
            ? 'bg-green-50 text-green-700 border-green-200'
            : ciState.state === 'early'
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          {ciState.state === 'open'    && <CheckCircle2 className="size-3" />}
          {ciState.state === 'early'   && <Clock className="size-3" />}
          {ciState.state === 'expired' && <XCircle className="size-3" />}
          {ciState.state === 'open' ? 'Window Open' : ciState.label}
        </span>
      )}

      <div className="flex gap-2 flex-shrink-0">
        {isUpcoming && (
          <Button
            size="sm"
            disabled={isBusy || !canCheckIn}
            onClick={() => canCheckIn && onCheckIn(booking)}
            title={!canCheckIn ? ciState.label : 'Confirm check-in'}
            className={`rounded-xl text-xs font-bold px-3 transition-all ${
              canCheckIn
                ? "bg-[#1e3d5a] hover:bg-[#2a5373] text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isBusy
              ? <RefreshCw className="size-3.5 animate-spin" />
              : canCheckIn
                ? <><CheckCircle2 className="size-3.5 mr-1" />Check In</>
                : ciState.state === 'early'
                  ? <><Clock className="size-3.5 mr-1" />Check In</>
                  : <><XCircle className="size-3.5 mr-1" />Check In</>
            }
          </Button>
        )}
        {canCheckOut && (
          <Button size="sm" disabled={isBusy} onClick={() => onCheckOut(booking)}
            className="bg-[#ee6b20] hover:bg-[#d95a10] text-white rounded-xl text-xs font-bold px-3">
            {isBusy
              ? <RefreshCw className="size-3.5 animate-spin" />
              : <><DollarSign className="size-3.5 mr-1" />Check Out</>
            }
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
type NavPage    = "checkin" | "reservations" | "activity";
type BookingTab = "all" | "upcoming" | "active" | "completed" | "cancelled";

// ─────────────────────────────────────────────────────────────────────────────
// Main TellerHome
// ─────────────────────────────────────────────────────────────────────────────
export function TellerHome() {
  const navigate   = useNavigate();
  const tellerName = localStorage.getItem("userName") || "Teller";

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [activePage,        setActivePage]         = useState<NavPage>("checkin");
  const [activeTab,         setActiveTab]          = useState<BookingTab>("all");
  const [bookings,          setBookings]           = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings]  = useState(true);
  const [isOffline,         setIsOffline]          = useState(false);
  const [showLogout,        setShowLogout]         = useState(false);

  // Date navigation
  const today                              = toDateStr(new Date());
  const [selectedDate, setSelectedDate]    = useState(today);

  // Scanner / lookup
  const [scanInput,     setScanInput]      = useState("");
  const [scannedBooking,setScannedBooking] = useState<Booking | null>(null);
  const [isLookingUp,   setIsLookingUp]    = useState(false);
  const [lookupError,   setLookupError]    = useState("");

  // Actions
  const [actionId,       setActionId]      = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget]= useState<Booking | null>(null);
  const [isCheckingOut,  setIsCheckingOut] = useState(false);

  const now        = useNow(30_000); // real-time clock — updates every 30s
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load bookings ──────────────────────────────────────────────────────────
  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingBookings(true);
    try {
      const result = await bookingService.getAllBookings({ date: selectedDate });
      setBookings(result.bookings ?? []);
      setIsOffline(false);
    } catch {
      if (!silent) setIsOffline(true);
    } finally {
      if (!silent) setIsLoadingBookings(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadBookings(false); }, [loadBookings]);

  // Real-time polling
  useEffect(() => {
    refreshRef.current = setInterval(() => loadBookings(true), REFRESH_MS);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [loadBookings]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:     bookings.length,
    upcoming:  bookings.filter(b => b.status === "upcoming").length,
    active:    bookings.filter(b => b.status === "active").length,
    completed: bookings.filter(b => b.status === "completed").length,
    forfeited: bookings.filter(b => b.status === "cancelled" || (b.status as string) === "no_show").length,
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter(b => {
        if (activeTab === "cancelled") return b.status === "cancelled" || (b.status as string) === "no_show";
        return b.status === activeTab;
      });

  // ── Lookup ─────────────────────────────────────────────────────────────────
  const handleLookup = async () => {
    if (!scanInput.trim()) return;
    setIsLookingUp(true);
    setLookupError("");
    setScannedBooking(null);
    try {
      const norm = scanInput.trim().toUpperCase().replace(/^PKP(\d+)$/, "PKP-$1");
      const result = await bookingService.getAllBookings({ search: norm });
      const found  = (result.bookings ?? []).find(b =>
        b.reference?.toUpperCase() === norm ||
        b.barcode?.toUpperCase()   === scanInput.trim().toUpperCase()
      );
      if (found) setScannedBooking(found);
      else       setLookupError(`No booking found for "${scanInput}"`);
    } catch {
      setLookupError("Could not reach server. Check your connection.");
    } finally {
      setIsLookingUp(false);
    }
  };

  // ── Check In ───────────────────────────────────────────────────────────────
  const doCheckIn = async (booking: Booking) => {
    setActionId(booking._id);
    try {
      await bookingService.updateBookingStatus(booking._id, "active");
      const now = new Date().toISOString();
      toast.success(`✅ Checked in! Spot ${booking.spot} is now active.`);
      const patch = (b: Booking) => b._id === booking._id ? { ...b, status: "active" as const, checkInAt: now } : b;
      setBookings(prev => prev.map(patch));
      setScannedBooking(prev => prev?._id === booking._id ? { ...prev, status: "active", checkInAt: now } : prev);
    } catch (err: any) {
      toast.error(err?.message || "Check-in failed.");
    } finally {
      setActionId(null);
    }
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const confirmCheckOut = async () => {
    if (!checkoutTarget) return;
    setIsCheckingOut(true);
    try {
      const res     = await bookingService.checkOut(checkoutTarget._id);
      const billing = res.billing;
      const msg = billing.finalAmount === 0
        ? `✅ Checked out! Duration: ${billing.durationLabel} — FREE (within ${FREE_HOURS}-hr window)`
        : `✅ Checked out! ${billing.durationLabel} · Overtime: ${(billing as any).overtimeLabel ?? ''} · Total: ₱${billing.finalAmount}`;
      toast.success(msg, { duration: 6000 });
      const now = new Date().toISOString();
      const patch = (b: Booking) => b._id === checkoutTarget._id ? { ...b, status: "completed" as const, checkOutAt: now } : b;
      setBookings(prev => prev.map(patch));
      setScannedBooking(prev => prev?._id === checkoutTarget._id ? { ...prev, status: "completed", checkOutAt: now } : prev);
      setCheckoutTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Check-out failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ── Day options (today + 6 more) ───────────────────────────────────────────
  const todayDate = new Date();
  const dayOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayDate, i);
    return { str: toDateStr(d), d };
  });

  // ── Sidebar nav ────────────────────────────────────────────────────────────
  const navItems: { key: NavPage; icon: React.ReactNode; label: string }[] = [
    { key: "checkin",      icon: <ScanBarcode className="size-5" />, label: "Check-In Station" },
    { key: "reservations", icon: <Calendar    className="size-5" />, label: "Reservations"     },
    { key: "activity",     icon: <Activity    className="size-5" />, label: "Activity Log"     },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex font-sans">

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1e3d5a] flex flex-col transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static lg:w-64 xl:w-72`}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <img src={logo} alt="PakiPark" className="h-8 object-contain" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {/* Teller badge */}
        <div className="px-6 py-4">
          <div className="bg-[#ee6b20]/20 border border-[#ee6b20]/40 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-[#ee6b20]/30 rounded-xl flex items-center justify-center">
                <ScanBarcode className="size-5 text-[#ee6b20]" />
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Role</p>
                <p className="text-white font-bold text-sm">Parking Teller</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/80 text-sm font-medium truncate">{tellerName}</p>
              <p className="text-white/40 text-xs">{new Date().toLocaleDateString("en-PH", { dateStyle: "medium" })}</p>
            </div>
          </div>
        </div>

        {/* Rate info */}
        <div className="px-6 pb-2">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-[#ee6b20]" />
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Overtime Rate</p>
            </div>
            <p className="text-white font-bold text-sm">₱{RATE_PER_HOUR}/hr after {FREE_HOURS}h free</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map(item => (
            <button key={item.key}
              onClick={() => { setActivePage(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activePage === item.key
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <button onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="size-5" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#1e3d5a]">Teller Station</h1>
              <p className="text-xs text-gray-400 font-medium">{fmtDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOffline && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                <AlertCircle className="size-3.5" /> Demo Mode
              </span>
            )}
            <button onClick={() => loadBookings(false)} title="Refresh"
              className="p-2 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-xl transition-all">
              <RefreshCw className={`size-5 ${isLoadingBookings ? "animate-spin text-[#ee6b20]" : ""}`} />
            </button>
            <button className="p-2 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-xl relative">
              <Bell className="size-5" />
              {stats.upcoming > 0 && <span className="absolute top-1 right-1 size-2 bg-[#ee6b20] rounded-full" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total",     value: stats.total,     icon: <Ticket />,       color: "text-[#1e3d5a]", bg: "bg-blue-50",  border: "border-blue-100"  },
              { label: "Upcoming",  value: stats.upcoming,  icon: <Clock />,        color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100"  },
              { label: "Active",    value: stats.active,    icon: <CheckCircle2 />, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
              { label: "Completed", value: stats.completed, icon: <CheckCheck />,   color: "text-gray-600",  bg: "bg-gray-50",  border: "border-gray-100"  },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-5 flex items-center gap-4`}>
                <div className={`size-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-[#1e3d5a]">{s.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── PAGE: Check-In Station ───────────────────────────────────── */}
          {activePage === "checkin" && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

              {/* Scanner */}
              <div className="xl:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-10 bg-[#ee6b20]/10 rounded-xl flex items-center justify-center">
                      <ScanBarcode className="size-5 text-[#ee6b20]" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[#1e3d5a]">Scan / Look Up</h2>
                      <p className="text-xs text-gray-400">Enter reference or barcode</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        placeholder="PKP-00000001"
                        value={scanInput}
                        onChange={e => {
                          setScanInput(e.target.value.toUpperCase());
                          setLookupError("");
                          if (!e.target.value) setScannedBooking(null);
                        }}
                        onKeyDown={e => e.key === "Enter" && handleLookup()}
                        className="h-12 pl-10 bg-[#f8fafc] border-[#e2e8f0] rounded-xl font-mono text-sm"
                      />
                    </div>
                    <Button onClick={handleLookup} disabled={!scanInput.trim() || isLookingUp}
                      className="h-12 px-4 bg-[#1e3d5a] hover:bg-[#2a5373] rounded-xl font-bold">
                      {isLookingUp ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
                    </Button>
                  </div>

                  {lookupError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium p-3 rounded-xl mt-3">
                      <XCircle className="size-4 shrink-0" />{lookupError}
                    </div>
                  )}

                  {scannedBooking && (
                    <div className="mt-5 border-t border-dashed border-gray-200 pt-5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Booking Found</p>
                        <StatusBadge status={scannedBooking.status} />
                      </div>

                      <div className="bg-[#f8fafc] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
                            <Ticket className="size-5 text-[#1e3d5a]" />
                          </div>
                          <div>
                            <p className="font-bold text-[#1e3d5a] text-sm">{scannedBooking.reference}</p>
                            <p className="text-xs text-gray-400 font-mono">{scannedBooking.barcode}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { icon: <User className="size-3.5" />,   label: "Customer", value: (scannedBooking.userId as any)?.name || "—" },
                            { icon: <Car className="size-3.5" />,    label: "Plate",    value: (scannedBooking.vehicleId as any)?.plateNumber || "—" },
                            { icon: <Clock className="size-3.5" />,  label: "Time",     value: scannedBooking.timeSlot },
                            { icon: <MapPin className="size-3.5" />, label: "Spot",     value: `Spot ${scannedBooking.spot}` },
                          ].map(r => (
                            <div key={r.label} className="bg-white rounded-xl p-2.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                {r.icon}<span className="font-bold uppercase tracking-widest text-[9px]">{r.label}</span>
                              </div>
                              <p className="font-bold text-[#1e3d5a] truncate">{r.value}</p>
                            </div>
                          ))}
                        </div>

                        {scannedBooking.status === "active" && scannedBooking.checkInAt && (
                          <LiveDurationBadge checkInAt={scannedBooking.checkInAt} />
                        )}
                      </div>

                      {scannedBooking.status === "upcoming" && (
                        <Button onClick={() => doCheckIn(scannedBooking)} disabled={actionId === scannedBooking._id}
                          className="w-full h-12 bg-[#ee6b20] hover:bg-[#d95a10] text-white rounded-xl font-bold uppercase tracking-wider shadow-lg">
                          {actionId === scannedBooking._id
                            ? <><RefreshCw className="size-4 animate-spin mr-2" />Processing…</>
                            : <><CheckCircle2 className="size-4 mr-2" />Confirm Check-In</>}
                        </Button>
                      )}
                      {scannedBooking.status === "active" && (
                        <Button onClick={() => setCheckoutTarget(scannedBooking)}
                          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg">
                          <DollarSign className="size-4 mr-2" />Proceed to Check-Out
                        </Button>
                      )}
                      {scannedBooking.status === "completed" && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold p-3.5 rounded-xl">
                          <CheckCheck className="size-5" />
                          Session completed{scannedBooking.checkOutAt ? ` · ${fmtTime(scannedBooking.checkOutAt)}` : ""}
                        </div>
                      )}
                      {(scannedBooking.status === "cancelled" || (scannedBooking.status as string) === "no_show") && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-3.5 rounded-xl">
                          <XCircle className="size-5" />Booking forfeited / cancelled
                        </div>
                      )}
                    </div>
                  )}

                  {!scannedBooking && !lookupError && (
                    <div className="mt-5 text-center py-6">
                      <ScanBarcode className="size-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm font-medium text-gray-400">Enter a reference to look up a booking</p>
                      <p className="text-xs text-gray-300 mt-1">Format: PKP-00000001</p>
                    </div>
                  )}
                </div>

                {/* Rate info box */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="size-4 text-[#ee6b20]" />
                    <p className="text-xs font-bold text-[#1e3d5a] uppercase tracking-widest">Parking Fee Structure</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { range: `0 – ${FREE_HOURS} hours`, fee: "FREE",      cls: "text-green-600" },
                      { range: `After ${FREE_HOURS} hours`, fee: `₱${RATE_PER_HOUR}/hr`, cls: "text-[#ee6b20]" },
                    ].map(r => (
                      <div key={r.range} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{r.range}</span>
                        <span className={`font-bold text-sm ${r.cls}`}>{r.fee}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 pt-1 border-t">Overtime billed in full hours (ceiling)</p>
                  </div>
                </div>

                {/* Guidelines */}
                <div className="bg-[#1e3d5a]/5 rounded-2xl border border-[#1e3d5a]/10 p-4">
                  <p className="text-xs font-bold text-[#1e3d5a] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield className="size-3.5" /> Teller Guidelines
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Verify customer ID matches booking name",
                      "Check in only during the reserved time slot",
                      `First ${FREE_HOURS} hours are free of charge`,
                      `₱${RATE_PER_HOUR}/hr billed for every hour beyond the free window`,
                      "Overtime is rounded up to the next full hour",
                      "Contact admin for disputes or overrides",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                        <ChevronRight className="size-3 mt-0.5 text-[#ee6b20] shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reservation list column */}
              <div className="xl:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <ReservationPanel
                  filtered={filtered} activeTab={activeTab} setActiveTab={setActiveTab}
                  stats={stats} isLoading={isLoadingBookings}
                  selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                  dayOptions={dayOptions} today={today}
                  onCheckIn={doCheckIn} onCheckOut={b => setCheckoutTarget(b)}
                  actionId={actionId} now={now}
                />
              </div>
            </div>
          )}

          {/* ── PAGE: Reservations ──────────────────────────────────────── */}
          {activePage === "reservations" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-[#1e3d5a] text-lg mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-[#ee6b20]" />Reservations
              </h2>
              <ReservationPanel
                filtered={filtered} activeTab={activeTab} setActiveTab={setActiveTab}
                stats={stats} isLoading={isLoadingBookings}
                selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                dayOptions={dayOptions} today={today}
                onCheckIn={doCheckIn} onCheckOut={b => setCheckoutTarget(b)}
                actionId={actionId} now={now}
              />
            </div>
          )}

          {/* ── PAGE: Activity Log ──────────────────────────────────────── */}
          {activePage === "activity" && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-[#1e3d5a] text-lg mb-1 flex items-center gap-2">
                <Activity className="size-5 text-[#ee6b20]" />Activity Log
              </h2>
              <p className="text-xs text-gray-400 mb-6">Recent check-in / check-out actions by this teller</p>
              <div className="text-center py-16">
                <Activity className="size-12 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 font-medium">No activity yet for today</p>
              </div>
              <div className="mt-8 flex justify-center opacity-40">
                <img src={mascotChecklist} alt="" className="h-28 object-contain" />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Checkout Modal ───────────────────────────────────────────────────── */}
      {checkoutTarget && (
        <CheckoutModal
          booking={checkoutTarget}
          onConfirm={confirmCheckOut}
          onCancel={() => setCheckoutTarget(null)}
          isLoading={isCheckingOut}
        />
      )}

      {/* ── Logout Modal ─────────────────────────────────────────────────────── */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 pt-20 relative animate-in fade-in zoom-in duration-300">
            <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-52 drop-shadow-2xl">
              <img src={mascotLogout} alt="Mascot" className="w-full h-auto" />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-[#1e3d5a]">End Teller Session?</h3>
              <p className="text-gray-500 font-medium text-sm">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={() => { setShowLogout(false); authService.logout(); }}
                className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white py-3.5 rounded-2xl font-black text-lg shadow-lg transition-all hover:scale-[1.02]">
                Yes, Log Me Out
              </button>
              <button onClick={() => setShowLogout(false)}
                className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-50 transition-colors">
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reservation Panel ─────────────────────────────────────────────────────────
interface ReservationPanelProps {
  filtered:        Booking[];
  activeTab:       BookingTab;
  setActiveTab:    (t: BookingTab) => void;
  stats:           Record<string, number>;
  isLoading:       boolean;
  selectedDate:    string;
  setSelectedDate: (d: string) => void;
  dayOptions:      { str: string; d: Date }[];
  today:           string;
  onCheckIn:       (b: Booking) => void;
  onCheckOut:      (b: Booking) => void;
  actionId:        string | null;
  now:             Date;    // for real-time check-in window evaluation
}
function ReservationPanel({
  filtered, activeTab, setActiveTab, stats, isLoading,
  selectedDate, setSelectedDate, dayOptions, today,
  onCheckIn, onCheckOut, actionId, now,
}: ReservationPanelProps) {
  const tabs: BookingTab[] = ["all", "upcoming", "active", "completed", "cancelled"];
  const labels: Record<BookingTab, string> = {
    all: "All", upcoming: "Upcoming", active: "Active", completed: "Done", cancelled: "Forfeited",
  };
  const counts: Record<BookingTab, number> = {
    all: stats.total, upcoming: stats.upcoming,
    active: stats.active, completed: stats.completed, cancelled: stats.forfeited,
  };

  return (
    <>
      {/* Day selector */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Calendar className="size-4 text-[#ee6b20] shrink-0" />
        {dayOptions.map(({ str, d }) => {
          const isToday    = str === today;
          const isSelected = str === selectedDate;
          return (
            <button key={str} onClick={() => setSelectedDate(str)}
              className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                isSelected
                  ? "bg-[#1e3d5a] text-white border-[#1e3d5a] shadow-md"
                  : "bg-white border-gray-100 text-gray-500 hover:border-[#ee6b20]/40"
              }`}>
              <span className="text-[9px] uppercase tracking-widest opacity-70">
                {isToday ? "Today" : d.toLocaleDateString("en-PH", { weekday: "short" })}
              </span>
              <span className="text-base leading-tight">{d.getDate()}</span>
              <span className="text-[9px] opacity-60">{d.toLocaleDateString("en-PH", { month: "short" })}</span>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-[#1e3d5a]">
            {selectedDate === today
              ? "Today's"
              : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric" })+"'s"
            } Reservations
          </h2>
          <p className="text-xs text-gray-400">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PH", { dateStyle: "full" })}
          </p>
        </div>
        <span className="bg-[#ee6b20]/10 text-[#ee6b20] border border-[#ee6b20]/20 px-3 py-1 rounded-full text-xs font-bold">
          {filtered.length} records
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab ? "bg-[#1e3d5a] text-white shadow" : "text-gray-400 hover:text-gray-600"
            }`}>
            {labels[tab]} <span className={`ml-1 ${activeTab === tab ? "text-white/70" : "text-gray-300"}`}>({counts[tab]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-460px)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <RefreshCw className="size-6 text-[#ee6b20] animate-spin" />
            <span className="text-gray-400 font-medium text-sm">Loading reservations…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="size-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">
              No {activeTab !== "all" ? activeTab : ""} reservations
            </p>
          </div>
        ) : (
          filtered.map(b => (
            <BookingRow key={b._id} booking={b} onCheckIn={onCheckIn} onCheckOut={onCheckOut} actionId={actionId} now={now} />
          ))
        )}
      </div>
    </>
  );
}
