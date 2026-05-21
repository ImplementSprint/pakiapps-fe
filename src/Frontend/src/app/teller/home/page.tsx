'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ScanBarcode, Search, LogOut, CheckCircle2, Clock, AlertCircle,
  Calendar, MapPin, Car, User, Hash, ChevronRight, RefreshCw,
  XCircle, CheckCheck, Timer, Ticket, Menu, X, Bell, Shield,
  Activity, DollarSign, Receipt, ArrowRight, TrendingUp, Zap, Video, VideoOff, Camera,
} from 'lucide-react';
import { bookingService, type Booking } from '@/services/bookingService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

// ── Constants ──────────────────────────────────────────────────────────────────
const RATE_PER_HOUR      = 15;
const FREE_HOURS         = 2;
const REFRESH_MS         = 30_000;
const CHECKIN_GRACE_MINS = 15;

// ── Assets (public folder) ─────────────────────────────────────────────────────
const LOGO_SRC          = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
const MASCOT_LOGOUT_SRC = '/assets/3ab94b49d340bf5c808a76004d2bebbd7166a97f.png';
const MASCOT_CHECK_SRC  = '/assets/6ba55cecd5b7106e37c71ca0e89f4f80eb706edd.png';
const MASCOT_WAVE_SRC   = '/assets/49e0d16aae0cfb13df1b2acdc4fbd4b2ab68795e.png';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function parseSlotWindow(date: string, timeSlot: string): { start: Date; end: Date } | null {
  const m = timeSlot.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, sh, sm, eh, em] = m;
  const start = new Date(`${date}T${sh.padStart(2, '0')}:${sm}:00+08:00`);
  const end   = new Date(`${date}T${eh.padStart(2, '0')}:${em}:00+08:00`);
  return { start, end };
}

function getCheckInState(date: string, timeSlot: string, now: Date): { allowed: boolean; label: string; state: 'open' | 'early' | 'expired' | 'unknown' } {
  const slot = parseSlotWindow(date, timeSlot);
  if (!slot) return { allowed: true, label: 'Check In', state: 'unknown' };
  const graceStart = new Date(slot.start.getTime() - CHECKIN_GRACE_MINS * 60_000);
  if (now < graceStart) {
    const diffMs = graceStart.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60_000);
    const diffHrs  = Math.floor(diffMins / 60);
    const remMins  = diffMins % 60;
    const label = diffHrs > 0 ? `Opens in ${diffHrs}h ${remMins}m` : `Opens in ${diffMins}m`;
    return { allowed: false, label, state: 'early' };
  }
  if (now > slot.end) return { allowed: false, label: 'Slot Expired', state: 'expired' };
  return { allowed: true, label: 'Check In', state: 'open' };
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

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
    overtimeLabel: ovMins <= 0 ? 'None' : ovMins < 60 ? `${ovMins} min` : `${Math.floor(ovMins / 60)}h ${ovMins % 60}m`,
    billableHours: billable,
    finalAmount:   amount,
  };
}

// ── Live Barcode Scanner Modal ─────────────────────────────────────────────────
function BarcodeScannerModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const readerRef  = useRef<any>(null);
  const [error, setError]       = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let codeReader: any = null;
    let stopped = false;

    (async () => {
      try {
        setScanning(true);
        setError('');
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError('No camera found on this device.');
          setScanning(false);
          return;
        }

        const deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId; // prefer back camera
        if (videoRef.current && !stopped) {
          await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result: any, err: any) => {
            if (result) {
              const text = result.getText();
              onScan(text);
            }
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Camera access denied. Please allow camera permissions.');
        setScanning(false);
      }
    })();

    return () => {
      stopped = true;
      try { readerRef.current?.reset(); } catch (_) {}
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e3d5a] rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-[#ee6b20] rounded-xl flex items-center justify-center">
              <ScanBarcode className="size-5 text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Live Barcode Scanner</p>
              <p className="text-[10px] text-white/40">Point camera at the E-Pass barcode</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X className="size-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />

          {/* Scanner overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Darkened corners */}
            <div className="absolute inset-0 bg-black/30" />
            {/* Scan box */}
            <div className="relative z-10 w-52 h-32">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-[#ee6b20] rounded-tl-md" style={{ borderTopWidth: 3, borderLeftWidth: 3 }} />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-[#ee6b20] rounded-tr-md" style={{ borderTopWidth: 3, borderRightWidth: 3 }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-[#ee6b20] rounded-bl-md" style={{ borderBottomWidth: 3, borderLeftWidth: 3 }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-[#ee6b20] rounded-br-md" style={{ borderBottomWidth: 3, borderRightWidth: 3 }} />
              {/* Scan line animation */}
              <div className="absolute left-1 right-1 h-0.5 bg-[#ee6b20]/80 animate-bounce" style={{ top: '50%', boxShadow: '0 0 8px #ee6b20' }} />
            </div>
          </div>

          {scanning && !error && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <div className="size-1.5 bg-[#ee6b20] rounded-full animate-pulse" />
                Scanning…
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-3 flex items-center gap-2 bg-red-900/30 border-t border-red-800/30">
            <AlertCircle className="size-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium">{error}</p>
          </div>
        )}

        <div className="px-5 py-3 flex justify-center">
          <button onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    upcoming:  { label: 'Upcoming',  cls: 'bg-blue-50 text-blue-700 border-blue-200',    icon: <Clock className="size-3" /> },
    active:    { label: 'Active',    cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="size-3" /> },
    completed: { label: 'Completed', cls: 'bg-gray-50 text-gray-600 border-gray-200',    icon: <CheckCheck className="size-3" /> },
    cancelled: { label: 'Forfeited', cls: 'bg-red-50 text-red-600 border-red-200',       icon: <XCircle className="size-3" /> },
    no_show:   { label: 'No-Show',   cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="size-3" /> },
  };
  const cfg = map[status] ?? map.upcoming;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Live duration ticker ───────────────────────────────────────────────────────
function LiveDurationBadge({ checkInAt }: { checkInAt: string }) {
  const [p, setP] = useState(() => computeBillingPreview(checkInAt));
  useEffect(() => {
    const id = setInterval(() => setP(computeBillingPreview(checkInAt)), 30_000);
    return () => clearInterval(id);
  }, [checkInAt]);
  const free = p.finalAmount === 0;
  return (
    <span className={`inline-flex items-center gap-1.5 border text-[10px] font-bold px-2.5 py-1 rounded-full ${
      free ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-amber-50 border-amber-200 text-amber-700'
    }`}>
      <Timer className="size-3 animate-pulse" />
      {p.durationLabel}{free ? ' · FREE' : ` · ₱${p.finalAmount}`}
    </span>
  );
}

// ── Checkout Modal ─────────────────────────────────────────────────────────────
function CheckoutModal({ booking, onConfirm, onCancel, isLoading }: {
  booking: Booking; onConfirm: () => void; onCancel: () => void; isLoading: boolean;
}) {
  const ciAt = booking.checkInAt ?? new Date().toISOString();
  const [p, setP] = useState(() => computeBillingPreview(ciAt));
  useEffect(() => {
    const id = setInterval(() => setP(computeBillingPreview(ciAt)), 10_000);
    return () => clearInterval(id);
  }, [ciAt]);
  const isFree = p.finalAmount === 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header band */}
        <div className="bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] px-8 pt-8 pb-12 text-center relative">
          <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Receipt className="size-8 text-white" />
          </div>
          <h3 className="text-2xl font-black text-white">Check-Out Summary</h3>
          <p className="text-white/60 text-sm mt-1">
            <span className="font-bold text-[#ee6b20]">{booking.reference}</span> · {booking.userName || (booking.userId as any)?.name || 'Customer'}
          </p>
        </div>

        <div className="px-8 -mt-6 pb-8">
          {/* Amount pill */}
          <div className={`rounded-2xl px-6 py-4 mb-5 text-center shadow-lg border-4 border-white ${isFree ? 'bg-green-500' : 'bg-[#ee6b20]'}`}>
            {isFree
              ? <p className="text-4xl font-black text-white">FREE</p>
              : <p className="text-4xl font-black text-white">₱{p.finalAmount}</p>
            }
            <p className="text-xs font-bold text-white/80 mt-0.5">
              {isFree ? `Within ${FREE_HOURS}-hour free window` : `First ${FREE_HOURS} hrs free · ₱${RATE_PER_HOUR}/hr after`}
            </p>
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Check-In',        value: fmtTime(ciAt) },
              { label: 'Check-Out (Now)', value: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) },
              { label: 'Total Duration',  value: p.durationLabel },
              { label: 'Overtime',        value: p.overtimeLabel },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                <p className="font-bold text-[#1e3d5a] text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Spot info */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
            <MapPin className="size-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">Spot <strong>{booking.spot}</strong> will be released after checkout</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={isLoading}
              className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={isLoading}
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-lg ${
                isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-[#ee6b20] hover:bg-[#d95a10]'
              }`}>
              {isLoading
                ? <span className="flex items-center justify-center gap-2"><RefreshCw className="size-4 animate-spin" />Processing…</span>
                : isFree ? 'Confirm Check-Out · FREE' : `Confirm · ₱${p.finalAmount}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Booking row card ───────────────────────────────────────────────────────────
function BookingRow({ booking, onCheckIn, onCheckOut, actionId, now }: {
  booking: Booking; onCheckIn: (b: Booking) => void; onCheckOut: (b: Booking) => void;
  actionId: string | null; now: Date;
}) {
  const isUpcoming  = booking.status === 'upcoming';
  const canCheckOut = booking.status === 'active';
  const isBusy      = actionId === booking._id;
  const ciState     = isUpcoming ? getCheckInState(booking.date, booking.timeSlot, now) : { allowed: false, label: '', state: 'unknown' as const };
  const canCheckIn  = isUpcoming && ciState.allowed;

  const borderCls = canCheckIn  ? 'border-[#ee6b20]/30 bg-orange-50/20 hover:border-[#ee6b20]/60' :
                    isUpcoming  ? 'border-gray-100 hover:border-gray-200' :
                    canCheckOut ? 'border-green-200 bg-green-50/30 hover:border-green-400' : 'border-gray-100';

  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all hover:shadow-md ${borderCls}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          canCheckOut ? 'bg-green-100' : canCheckIn ? 'bg-[#ee6b20]/10' : 'bg-gray-50'
        }`}>
          <Ticket className={`size-5 ${canCheckOut ? 'text-green-600' : canCheckIn ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#1e3d5a] text-sm truncate">{booking.reference}</p>
          <p className="text-xs text-gray-500 truncate">
            {booking.userName || (booking.userId as any)?.name || 'Customer'} · {booking.vehiclePlate || (booking.vehicleId as any)?.plateNumber || '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium flex-shrink-0">
        <Clock className="size-3.5 text-[#ee6b20]" /><span>{booking.timeSlot}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium flex-shrink-0">
        <MapPin className="size-3.5 text-[#1e3d5a]" /><span>Spot {booking.spot}</span>
      </div>

      {canCheckOut && booking.checkInAt
        ? <LiveDurationBadge checkInAt={booking.checkInAt} />
        : <StatusBadge status={booking.status} />
      }

      {isUpcoming && (
        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
          ciState.state === 'open'    ? 'bg-green-50 text-green-700 border-green-200' :
          ciState.state === 'early'   ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-red-50 text-red-600 border-red-200'
        }`}>
          {ciState.state === 'open'    && <CheckCircle2 className="size-3" />}
          {ciState.state === 'early'   && <Clock className="size-3" />}
          {ciState.state === 'expired' && <XCircle className="size-3" />}
          {ciState.state === 'open' ? 'Window Open' : ciState.label}
        </span>
      )}

      <div className="flex gap-2 flex-shrink-0">
        {isUpcoming && (
          <button disabled={isBusy || !canCheckIn} onClick={() => canCheckIn && onCheckIn(booking)}
            title={!canCheckIn ? ciState.label : 'Confirm check-in'}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              canCheckIn
                ? 'bg-[#1e3d5a] hover:bg-[#2a5373] text-white shadow-sm hover:shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            {isBusy ? <RefreshCw className="size-3.5 animate-spin" /> :
             canCheckIn ? <><CheckCircle2 className="size-3.5" />Check In</> :
             ciState.state === 'early' ? <><Clock className="size-3.5" />Check In</> :
             <><XCircle className="size-3.5" />Check In</>}
          </button>
        )}
        {canCheckOut && (
          <button disabled={isBusy} onClick={() => onCheckOut(booking)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#ee6b20] hover:bg-[#d95a10] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md">
            {isBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <><DollarSign className="size-3.5" />Check Out</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
type NavPage    = 'checkin' | 'reservations' | 'activity';
type BookingTab = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled';

// ── Main TellerHome ────────────────────────────────────────────────────────────
export default function TellerHomePage() {
  const router     = useRouter();
  const tellerName = typeof window !== 'undefined' ? (localStorage.getItem('userName') ?? 'Teller') : 'Teller';

  // Auto-refresh token on mount so role claims are current
  useEffect(() => {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refresh) return;
    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.data?.token) {
          localStorage.setItem('authToken', data.data.token);
          if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
        }
      })
      .catch(() => { /* silent — will fall back to stored token */ });
  }, []);

  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [activePage,        setActivePage]         = useState<NavPage>('checkin');
  const [activeTab,         setActiveTab]          = useState<BookingTab>('all');
  const [bookings,          setBookings]           = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings]  = useState(true);
  const [isOffline,         setIsOffline]          = useState(false);
  const [authError,         setAuthError]          = useState('');
  const [showLogout,        setShowLogout]         = useState(false);

  const today                              = toDateStr(new Date());
  const [selectedDate, setSelectedDate]   = useState(today);

  const [scanInput,      setScanInput]     = useState('');
  const [scannedBooking, setScannedBooking]= useState<Booking | null>(null);
  const [isLookingUp,    setIsLookingUp]  = useState(false);
  const [lookupError,    setLookupError]  = useState('');
  const [showScanner,    setShowScanner]  = useState(false);

  const [actionId,        setActionId]      = useState<string | null>(null);
  const [checkoutTarget,  setCheckoutTarget]= useState<Booking | null>(null);
  const [isCheckingOut,   setIsCheckingOut] = useState(false);

  const now        = useNow(30_000);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load bookings ────────────────────────────────────────────────────────────
  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingBookings(true);
    try {
      const result = await bookingService.getAllBookings({ date: selectedDate });
      setBookings(result.bookings ?? []);
      setIsOffline(false);
      setAuthError('');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('403') || msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('privileges')) {
        setAuthError('Session role mismatch — please log out and log in again.');
        setIsOffline(false);
      } else {
        if (!silent) setIsOffline(true);
      }
    } finally {
      if (!silent) setIsLoadingBookings(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadBookings(false); }, [loadBookings]);
  useEffect(() => {
    refreshRef.current = setInterval(() => loadBookings(true), REFRESH_MS);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [loadBookings]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total:     bookings.length,
    upcoming:  bookings.filter(b => b.status === 'upcoming').length,
    active:    bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    forfeited: bookings.filter(b => b.status === 'cancelled' || (b.status as string) === 'no_show').length,
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => {
    if (activeTab === 'cancelled') return b.status === 'cancelled' || (b.status as string) === 'no_show';
    return b.status === activeTab;
  });

  // ── Lookup ───────────────────────────────────────────────────────────────────
  const handleLookup = useCallback(async (rawInput?: string) => {
    const raw = (rawInput ?? scanInput).trim();
    if (!raw) return;
    if (rawInput) setScanInput(rawInput.toUpperCase());
    setIsLookingUp(true);
    setLookupError('');
    setScannedBooking(null);
    try {
      // Normalize: PKP00000001 → PKP-00000001, PKP-00000001 → PKP-00000001
      const norm = raw.toUpperCase()
        .replace(/^PKP(\d+)$/, 'PKP-$1')
        .replace(/^PAKIPARK-?/i, 'PKP-');
      const result = await bookingService.getAllBookings({ search: norm });
      const bookingList = result.bookings ?? [];
      const found = bookingList.find(b =>
        b.reference?.toUpperCase() === norm ||
        b.barcode?.toUpperCase() === raw.toUpperCase() ||
        b.barcode?.toUpperCase() === norm
      ) ?? (bookingList.length === 1 ? bookingList[0] : null);
      if (found) {
        setScannedBooking(found);
        setLookupError('');
      } else if (bookingList.length > 0) {
        setScannedBooking(bookingList[0]);
      } else {
        setLookupError(`No booking found for "${raw}"`);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('reach') || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        setLookupError('Cannot connect to server. Please check that the backend is running.');
      } else if (msg.toLowerCase().includes('403') || msg.toLowerCase().includes('forbidden')) {
        setLookupError('Access denied. Teller is not assigned to a location.');
      } else {
        setLookupError(msg || 'Lookup failed. Please try again.');
      }
    } finally {
      setIsLookingUp(false);
    }
  }, [scanInput]);

  const handleScanResult = useCallback((code: string) => {
    setShowScanner(false);
    toast.success(`Barcode detected: ${code}`);
    handleLookup(code);
  }, [handleLookup]);

  // ── Check In ─────────────────────────────────────────────────────────────────
  const doCheckIn = async (booking: Booking) => {
    setActionId(booking._id);
    try {
      const updated = await bookingService.checkIn(booking._id);
      const at = updated.checkInAt ?? new Date().toISOString();
      toast.success(`✅ Checked in! Spot ${booking.spot} is now active.`);
      const patch = (b: Booking) => b._id === booking._id ? { ...b, status: 'active' as const, checkInAt: at } : b;
      setBookings(prev => prev.map(patch));
      setScannedBooking(prev => prev?._id === booking._id ? { ...prev, status: 'active', checkInAt: at } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Check-in failed.');
    } finally {
      setActionId(null);
    }
  };

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const confirmCheckOut = async () => {
    if (!checkoutTarget) return;
    setIsCheckingOut(true);
    try {
      const res     = await bookingService.checkOut(checkoutTarget._id);
      const billing = res.billing;
      const msg = billing.finalAmount === 0
        ? `✅ Checked out! Duration: ${billing.durationLabel} — FREE`
        : `✅ Checked out! ${billing.durationLabel} · Total: ₱${billing.finalAmount}`;
      toast.success(msg, { duration: 6000 });
      const at = new Date().toISOString();
      const patch = (b: Booking) => b._id === checkoutTarget._id ? { ...b, status: 'completed' as const, checkOutAt: at } : b;
      setBookings(prev => prev.map(patch));
      setScannedBooking(prev => prev?._id === checkoutTarget._id ? { ...prev, status: 'completed', checkOutAt: at } : prev);
      setCheckoutTarget(null);
    } catch (err: any) {
      toast.error(err?.message || 'Check-out failed.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const todayDate = new Date();
  const dayOptions = Array.from({ length: 7 }, (_, i) => { const d = addDays(todayDate, i); return { str: toDateStr(d), d }; });

  const tabs: BookingTab[] = ['all', 'upcoming', 'active', 'completed', 'cancelled'];
  const tabLabels: Record<BookingTab, string> = { all: 'All', upcoming: 'Upcoming', active: 'Active', completed: 'Done', cancelled: 'Forfeited' };
  const tabCounts: Record<BookingTab, number> = { all: stats.total, upcoming: stats.upcoming, active: stats.active, completed: stats.completed, cancelled: stats.forfeited };

  const navItems: { key: NavPage; icon: React.ReactNode; label: string }[] = [
    { key: 'checkin',      icon: <ScanBarcode className="size-5" />, label: 'Check-In Station' },
    { key: 'reservations', icon: <Calendar    className="size-5" />, label: 'Reservations'     },
    { key: 'activity',     icon: <Activity    className="size-5" />, label: 'Activity Log'     },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex font-sans">

      {/* ── SIDEBAR ───────────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1e3d5a] flex flex-col transition-transform duration-300 shadow-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:w-64 xl:w-72`}>

        {/* Logo header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Image src={LOGO_SRC} alt="PakiPark" width={120} height={32} className="object-contain" priority unoptimized />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {/* Mascot + teller badge */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative bg-gradient-to-br from-[#ee6b20]/20 to-[#ee6b20]/5 border border-[#ee6b20]/30 rounded-2xl p-4 overflow-hidden">
            {/* Mascot watermark */}
            <div className="absolute -right-3 -top-3 w-20 h-20 opacity-20 pointer-events-none">
              <Image src={MASCOT_WAVE_SRC} alt="" width={80} height={80} className="object-contain" unoptimized />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Active Session</p>
              <p className="text-white font-black text-base truncate">{tellerName}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="size-2 rounded-full bg-[#ee6b20] animate-pulse" />
                <p className="text-[#ee6b20] text-xs font-bold">Parking Teller</p>
              </div>
              <p className="text-white/40 text-xs mt-2">{new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}</p>
            </div>
          </div>
        </div>

        {/* Rate card */}
        <div className="px-6 pb-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#ee6b20]" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Overtime Rate</span>
              </div>
              <span className="text-[#ee6b20] font-black text-sm">₱{RATE_PER_HOUR}/hr</span>
            </div>
            <p className="text-white/40 text-[10px] mt-1">First {FREE_HOURS} hours FREE · Ceiling billing</p>
          </div>
        </div>

        {/* Stats mini row */}
        <div className="px-6 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Active', value: stats.active,   color: 'text-green-400' },
              { label: 'Coming', value: stats.upcoming, color: 'text-blue-400'  },
              { label: 'Done',   value: stats.completed,color: 'text-gray-400'  },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-xl px-2 py-2 text-center border border-white/10">
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map(item => (
            <button key={item.key}
              onClick={() => { setActivePage(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activePage === item.key
                  ? 'bg-[#ee6b20] text-white shadow-lg shadow-[#ee6b20]/30'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
              {item.icon} {item.label}
              {activePage === item.key && <div className="ml-auto size-1.5 rounded-full bg-white opacity-80" />}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <button onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all group">
            <LogOut className="size-5 group-hover:rotate-12 transition-transform" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── MAIN ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl">
              <Menu className="size-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-[#1e3d5a]">Teller Station</h1>
              <p className="text-xs text-gray-400 font-medium">{fmtDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {authError && (
              <span className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 max-w-xs">
                <AlertCircle className="size-3.5 shrink-0" />
                <span className="truncate">Session expired</span>
                <button
                  onClick={() => { authService.logout(); }}
                  className="underline ml-1 whitespace-nowrap hover:text-red-900"
                >Re-login</button>
              </span>
            )}
            {isOffline && !authError && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                <AlertCircle className="size-3.5" /> Demo Mode
              </span>
            )}

            <button onClick={() => loadBookings(false)} title="Refresh"
              className="p-2 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-xl transition-all">
              <RefreshCw className={`size-5 ${isLoadingBookings ? 'animate-spin text-[#ee6b20]' : ''}`} />
            </button>
            <button className="p-2 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-xl relative">
              <Bell className="size-5" />
              {stats.upcoming > 0 && <span className="absolute top-1 right-1 size-2.5 bg-[#ee6b20] rounded-full border-2 border-white animate-pulse" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: stats.total,     icon: <Ticket />,       color: 'text-[#1e3d5a]', bg: 'bg-blue-50',  border: 'border-blue-100',  glow: '' },
              { label: 'Upcoming',       value: stats.upcoming,  icon: <Clock />,        color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-100',  glow: '' },
              { label: 'Active Now',     value: stats.active,    icon: <CheckCircle2 />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', glow: stats.active > 0 ? 'ring-2 ring-green-200' : '' },
              { label: 'Completed',      value: stats.completed, icon: <CheckCheck />,   color: 'text-gray-600',  bg: 'bg-gray-50',  border: 'border-gray-100',  glow: '' },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl border ${s.border} ${s.glow} p-5 flex items-center gap-4 transition-all hover:shadow-md`}>
                <div className={`size-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                  {React.cloneElement(s.icon, { className: 'size-6' })}
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1e3d5a]">{s.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── PAGE: Check-In Station ────────────────────────────────────────── */}
          {activePage === 'checkin' && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

              {/* Scanner column */}
              <div className="xl:col-span-2 space-y-4">
                {/* Scanner card */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  {/* Scanner header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-12 bg-[#1e3d5a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1e3d5a]/20">
                      <ScanBarcode className="size-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-[#1e3d5a]">Scan Terminal</h2>
                      <p className="text-xs text-gray-400">Enter reference or barcode</p>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        placeholder="PKP-00000001"
                        value={scanInput}
                        onChange={e => { setScanInput(e.target.value.toUpperCase()); setLookupError(''); if (!e.target.value) setScannedBooking(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                        className="h-12 w-full pl-10 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30 focus:border-[#ee6b20]"
                      />
                    </div>
                    {/* Camera scanner button */}
                    <button
                      onClick={() => setShowScanner(true)}
                      title="Scan barcode with camera"
                      className="h-12 w-12 bg-[#1e3d5a] hover:bg-[#2a5373] rounded-xl flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md shrink-0">
                      <Camera className="size-4" />
                    </button>
                    <button onClick={() => handleLookup()} disabled={!scanInput.trim() || isLookingUp}
                      className="h-12 w-12 bg-[#ee6b20] hover:bg-[#d95a10] disabled:opacity-50 rounded-xl flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md shrink-0">
                      {isLookingUp ? <RefreshCw className="size-4 animate-spin" /> : <Search className="size-4" />}
                    </button>
                  </div>

                  {lookupError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium p-3 rounded-xl mt-3">
                      <XCircle className="size-4 shrink-0" />{lookupError}
                    </div>
                  )}

                  {scannedBooking && (
                    <div className="mt-5 border-t border-dashed border-gray-200 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Booking Found</p>
                        <StatusBadge status={scannedBooking.status} />
                      </div>

                      <div className="bg-gradient-to-br from-[#f8fafc] to-[#f0f4f8] rounded-2xl p-4 space-y-3 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
                            <Ticket className="size-5 text-[#1e3d5a]" />
                          </div>
                          <div>
                            <p className="font-black text-[#1e3d5a] text-sm">{scannedBooking.reference}</p>
                            <p className="text-xs text-gray-400 font-mono">{scannedBooking.barcode}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { icon: <User className="size-3.5" />,   label: 'Customer', value: scannedBooking.userName || (scannedBooking.userId as any)?.name || '—' },
                            { icon: <Car className="size-3.5" />,    label: 'Plate',    value: scannedBooking.vehiclePlate || (scannedBooking.vehicleId as any)?.plateNumber || '—' },
                            { icon: <Clock className="size-3.5" />,  label: 'Time',     value: scannedBooking.timeSlot },
                            { icon: <MapPin className="size-3.5" />, label: 'Spot',     value: `Spot ${scannedBooking.spot}` },
                            ...(scannedBooking.userPhone ? [{ icon: <User className="size-3.5" />, label: 'Phone', value: scannedBooking.userPhone }] : []),
                            ...(scannedBooking.locationName ? [{ icon: <MapPin className="size-3.5" />, label: 'Location', value: scannedBooking.locationName }] : []),
                          ].map(r => (
                            <div key={r.label} className="bg-white rounded-xl p-2.5 border border-gray-100">
                              <div className="flex items-center gap-1.5 text-gray-400 mb-1">{r.icon}<span className="font-bold uppercase tracking-widest text-[9px]">{r.label}</span></div>
                              <p className="font-bold text-[#1e3d5a] truncate">{r.value}</p>
                            </div>
                          ))}
                        </div>

                        {scannedBooking.status === 'active' && scannedBooking.checkInAt && (
                          <LiveDurationBadge checkInAt={scannedBooking.checkInAt} />
                        )}
                      </div>

                      {scannedBooking.status === 'upcoming' && (
                        <button onClick={() => doCheckIn(scannedBooking)} disabled={actionId === scannedBooking._id}
                          className="w-full h-12 bg-[#ee6b20] hover:bg-[#d95a10] text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all">
                          {actionId === scannedBooking._id
                            ? <span className="flex items-center justify-center gap-2"><RefreshCw className="size-4 animate-spin" />Processing…</span>
                            : <span className="flex items-center justify-center gap-2"><CheckCircle2 className="size-5" />Confirm Check-In</span>}
                        </button>
                      )}
                      {scannedBooking.status === 'active' && (
                        <button onClick={() => setCheckoutTarget(scannedBooking)}
                          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all">
                          <span className="flex items-center justify-center gap-2"><DollarSign className="size-5" />Proceed to Check-Out</span>
                        </button>
                      )}
                      {scannedBooking.status === 'completed' && (
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold p-3.5 rounded-xl">
                          <CheckCheck className="size-5" />
                          Session completed{scannedBooking.checkOutAt ? ` · ${fmtTime(scannedBooking.checkOutAt)}` : ''}
                        </div>
                      )}
                      {(scannedBooking.status === 'cancelled' || (scannedBooking.status as string) === 'no_show') && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm font-bold p-3.5 rounded-xl">
                          <XCircle className="size-5" />Booking forfeited / cancelled
                        </div>
                      )}
                    </div>
                  )}

                  {!scannedBooking && !lookupError && (
                    <div className="mt-5 text-center py-8">
                      <div className="w-20 h-20 mx-auto mb-4 opacity-20">
                        <Image src={MASCOT_CHECK_SRC} alt="" width={80} height={80} className="w-full h-auto object-contain" unoptimized />
                      </div>
                      <p className="text-sm font-bold text-gray-400">Enter a reference to look up</p>
                      <p className="text-xs text-gray-300 mt-1">Format: PKP-00000001</p>
                    </div>
                  )}
                </div>

                {/* Rate info box */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-8 bg-[#ee6b20]/10 rounded-xl flex items-center justify-center">
                      <DollarSign className="size-4 text-[#ee6b20]" />
                    </div>
                    <p className="text-xs font-black text-[#1e3d5a] uppercase tracking-widest">Parking Fee Structure</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { range: `0 – ${FREE_HOURS} hours`, fee: 'FREE',             cls: 'text-green-600 bg-green-50 border-green-200' },
                      { range: `After ${FREE_HOURS} hours`, fee: `₱${RATE_PER_HOUR}/hr`, cls: 'text-[#ee6b20] bg-orange-50 border-orange-200' },
                    ].map(r => (
                      <div key={r.range} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${r.cls}`}>
                        <span className="text-sm font-medium">{r.range}</span>
                        <span className="font-black text-sm">{r.fee}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 pt-1 text-center font-medium">Overtime billed in full hours (ceiling)</p>
                  </div>
                </div>

                {/* Guidelines */}
                <div className="bg-[#1e3d5a]/5 rounded-2xl border border-[#1e3d5a]/10 p-4">
                  <p className="text-xs font-black text-[#1e3d5a] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Shield className="size-3.5" /> Teller Guidelines
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Verify customer ID matches booking name',
                      'Check in only during the reserved time slot',
                      `First ${FREE_HOURS} hours are free of charge`,
                      `₱${RATE_PER_HOUR}/hr billed for every hour beyond the free window`,
                      'Overtime is rounded up to the next full hour',
                      'Contact admin for disputes or overrides',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                        <ChevronRight className="size-3 mt-0.5 text-[#ee6b20] shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reservation list */}
              <div className="xl:col-span-3 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col">
                <ReservationPanel
                  filtered={filtered} activeTab={activeTab} setActiveTab={setActiveTab}
                  stats={stats} isLoading={isLoadingBookings}
                  selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                  dayOptions={dayOptions} today={today}
                  onCheckIn={doCheckIn} onCheckOut={b => setCheckoutTarget(b)}
                  actionId={actionId} now={now}
                  tabs={tabs} tabLabels={tabLabels} tabCounts={tabCounts}
                />
              </div>
            </div>
          )}

          {/* ── PAGE: Reservations ── */}
          {activePage === 'reservations' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-black text-[#1e3d5a] text-lg mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-[#ee6b20]" />Reservations
              </h2>
              <ReservationPanel
                filtered={filtered} activeTab={activeTab} setActiveTab={setActiveTab}
                stats={stats} isLoading={isLoadingBookings}
                selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                dayOptions={dayOptions} today={today}
                onCheckIn={doCheckIn} onCheckOut={b => setCheckoutTarget(b)}
                actionId={actionId} now={now}
                tabs={tabs} tabLabels={tabLabels} tabCounts={tabCounts}
              />
            </div>
          )}

          {/* ── PAGE: Activity Log ── */}
          {activePage === 'activity' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-black text-[#1e3d5a] text-lg mb-1 flex items-center gap-2">
                <Activity className="size-5 text-[#ee6b20]" />Activity Log
              </h2>
              <p className="text-xs text-gray-400 mb-6">Recent check-in / check-out actions for today</p>
              <div className="text-center py-12">
                <div className="w-36 h-36 mx-auto mb-4 opacity-40">
                  <Image src={MASCOT_CHECK_SRC} alt="Mascot" width={144} height={144} className="w-full h-auto object-contain" unoptimized />
                </div>
                <p className="text-gray-400 font-bold">No activity yet for today</p>
                <p className="text-gray-300 text-sm mt-1">Check-in and check-out events will appear here</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Checkout Modal ─────────────────────────────────────────────────────── */}
      {checkoutTarget && (
        <CheckoutModal
          booking={checkoutTarget}
          onConfirm={confirmCheckOut}
          onCancel={() => setCheckoutTarget(null)}
          isLoading={isCheckingOut}
        />
      )}

      {/* ── Live Barcode Scanner Modal ──────────────────────────────────────────── */}
      {showScanner && (
        <BarcodeScannerModal
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Logout Modal with Mascot ──────────────────────────────────────────── */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 pt-24 relative">
            {/* Mascot peaking from top */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-44 drop-shadow-2xl pointer-events-none">
              <Image src={MASCOT_LOGOUT_SRC} alt="PakiPark mascot" width={176} height={176} className="w-full h-auto object-contain" unoptimized />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-[#1e3d5a]">End Teller Session?</h3>
              <p className="text-gray-500 font-medium text-sm">Are you sure you want to log out?<br/>Make sure all bookings are handled first.</p>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={() => { setShowLogout(false); authService.logout(); }}
                className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white py-3.5 rounded-2xl font-black text-base shadow-lg shadow-[#ee6b20]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
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

// ── Reservation Panel ──────────────────────────────────────────────────────────
function ReservationPanel({
  filtered, activeTab, setActiveTab, stats, isLoading,
  selectedDate, setSelectedDate, dayOptions, today,
  onCheckIn, onCheckOut, actionId, now,
  tabs, tabLabels, tabCounts,
}: {
  filtered: Booking[]; activeTab: BookingTab; setActiveTab: (t: BookingTab) => void;
  stats: Record<string, number>; isLoading: boolean;
  selectedDate: string; setSelectedDate: (d: string) => void;
  dayOptions: { str: string; d: Date }[]; today: string;
  onCheckIn: (b: Booking) => void; onCheckOut: (b: Booking) => void;
  actionId: string | null; now: Date;
  tabs: BookingTab[]; tabLabels: Record<BookingTab, string>; tabCounts: Record<BookingTab, number>;
}) {
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
                  ? 'bg-[#1e3d5a] text-white border-[#1e3d5a] shadow-md'
                  : 'bg-white border-gray-100 text-gray-500 hover:border-[#ee6b20]/40'
              }`}>
              <span className="text-[9px] uppercase tracking-widest opacity-70">
                {isToday ? 'Today' : d.toLocaleDateString('en-PH', { weekday: 'short' })}
              </span>
              <span className="text-base leading-tight">{d.getDate()}</span>
              <span className="text-[9px] opacity-60">{d.toLocaleDateString('en-PH', { month: 'short' })}</span>
            </button>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-[#1e3d5a]">
            {selectedDate === today ? "Today's" : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric' }) + "'s"} Reservations
          </h2>
          <p className="text-xs text-gray-400">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', { dateStyle: 'full' })}</p>
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
              activeTab === tab ? 'bg-[#1e3d5a] text-white shadow' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {tabLabels[tab]} <span className={`ml-1 ${activeTab === tab ? 'text-white/70' : 'text-gray-300'}`}>({tabCounts[tab]})</span>
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
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-3 opacity-20">
              <Image src={MASCOT_CHECK_SRC} alt="" width={96} height={96} className="w-full h-auto object-contain" unoptimized />
            </div>
            <p className="text-gray-400 font-bold">No {activeTab !== 'all' ? activeTab : ''} reservations</p>
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
