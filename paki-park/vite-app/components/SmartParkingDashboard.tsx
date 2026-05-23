import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarIcon, RefreshCw, Settings, X, MapPin, Accessibility, Zap, Crown,
  Shield, Grid3x3, ChevronDown, User, Car, Phone, Clock, CreditCard,
  LogIn, LogOut as LogOutIcon, AlertTriangle, Wifi, WifiOff, Plus,
  Timer, AlarmClock, AlertOctagon, CheckCircle, TrendingUp, Activity,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { AdvancedParkingConfig, type AdvancedParkingConfig as AdvancedParkingConfigType } from './AdvancedParkingConfig';
import { addNotification } from './NotificationCenter';
import { locationService, type Location } from '../services/locationService';
import { parkingSlotService, type DashboardSlot, type BookingTiming } from '../services/parkingSlotService';
import { bookingService } from '../services/bookingService';

// ─── Constants ──────────────────────────────────────────────────────────────
const GRACE_PERIOD_MIN = 30; // must match backend

type SlotCategory = 'regular' | 'pwd' | 'electric' | 'vip' | 'motorcycle' | 'compact';

const typeToCategory: Record<string, SlotCategory> = {
  regular:    'regular',
  handicapped:'pwd',
  ev_charging:'electric',
  vip:        'vip',
  motorcycle: 'motorcycle',
};

const categoryStyles: Record<SlotCategory, { bg: string; border: string; text: string; icon: string }> = {
  regular:    { bg: 'bg-gray-500',   border: 'border-gray-300',   text: 'text-gray-600',   icon: 'text-gray-400' },
  pwd:        { bg: 'bg-blue-500',   border: 'border-blue-300',   text: 'text-blue-700',   icon: 'text-blue-400' },
  electric:   { bg: 'bg-emerald-500',border: 'border-emerald-300',text: 'text-emerald-700',icon: 'text-emerald-400'},
  vip:        { bg: 'bg-purple-500', border: 'border-purple-300', text: 'text-purple-700', icon: 'text-purple-400'},
  motorcycle: { bg: 'bg-orange-500', border: 'border-orange-300', text: 'text-orange-700', icon: 'text-orange-400'},
  compact:    { bg: 'bg-teal-500',   border: 'border-teal-300',   text: 'text-teal-700',   icon: 'text-teal-400' },
};

const categoryIcons: Record<SlotCategory, React.ComponentType<any>> = {
  regular:    Grid3x3,
  pwd:        Accessibility,
  electric:   Zap,
  vip:        Crown,
  motorcycle: Shield,
  compact:    Grid3x3,
};

// ─── Timing helpers (mirrors server-side logic for client-computed states) ──
function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseTimeSlot(ts: string): { startMin: number; endMin: number } {
  const m = ts.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return { startMin: 0, endMin: 0 };
  return { startMin: +m[1] * 60 + +m[2], endMin: +m[3] * 60 + +m[4] };
}

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

/** Recompute timing based on current local time (keeps countdowns live between polls) */
function recomputeTiming(slot: DashboardSlot, today: string): BookingTiming | null {
  if (!slot.booking) return null;
  const { timeSlot, status, timing: t } = slot.booking;
  if (!timeSlot) return t ?? null;
  const { startMin, endMin } = parseTimeSlot(timeSlot);
  const now = nowMinutes();
  const isToday = (slot.booking as any).date === today || !!t?.isToday;
  const minutesUntilStart = startMin - now;
  const minutesPastEnd    = now - endMin;
  const graceExpiry       = startMin + GRACE_PERIOD_MIN;

  const isArrivingSoon  = isToday && status === 'upcoming' && minutesUntilStart > 0 && minutesUntilStart <= 60;
  const isInGracePeriod = isToday && status === 'upcoming' && minutesUntilStart <= 0 && now <= graceExpiry;
  const isNoShow        = isToday && status === 'upcoming' && now > graceExpiry;
  const isOverstay      = isToday && status === 'active'   && minutesPastEnd > 0;

  let timingState: BookingTiming['timingState'] = 'reserved';
  if (status === 'active')   timingState = isOverstay ? 'overstay' : 'occupied';
  else if (status === 'upcoming') {
    if (isNoShow)         timingState = 'no_show';
    else if (isInGracePeriod) timingState = 'in_grace_period';
    else if (isArrivingSoon)  timingState = 'arriving_soon';
    else                      timingState = 'reserved';
  }

  return {
    minutesUntilStart, minutesPastEnd, isToday,
    isArrivingSoon, isInGracePeriod, isNoShow, isOverstay,
    overstayMinutes:     isOverstay ? minutesPastEnd : 0,
    gracePeriodMinLeft:  isInGracePeriod ? graceExpiry - now : 0,
    gracePeriodExpiresAt: minToHHMM(graceExpiry),
    expectedEndAt:       minToHHMM(endMin),
    timingState,
  };
}

// ─── Slot visual state resolver ──────────────────────────────────────────────
type VisualState = 'available' | 'arriving_soon' | 'in_grace_period' | 'no_show' | 'occupied' | 'overstay' | 'maintenance' | 'reserved';

function resolveVisualState(slot: DashboardSlot, timing: BookingTiming | null, walkIn: any): VisualState {
  if (walkIn) return walkIn.status === 'occupied' ? 'occupied' : 'arriving_soon';
  if (slot.status === 'maintenance') return 'maintenance';
  if (!slot.booking) return 'available';
  return (timing?.timingState ?? slot.derivedStatus) as VisualState;
}

const visualConfig: Record<string, { card: string; badge: string; badgeText: string; icon: React.ComponentType<any>; iconColor: string }> = {
  available:       { card: 'bg-white border-gray-200 hover:border-[#ee6b20] hover:shadow-md',   badge: 'bg-green-100 text-green-700',   badgeText: 'Free',    icon: CheckCircle,  iconColor: 'text-green-400' },
  arriving_soon:   { card: 'bg-amber-50 border-amber-300 shadow-sm',                            badge: 'bg-amber-100 text-amber-700',   badgeText: 'Soon',    icon: AlarmClock,   iconColor: 'text-amber-500' },
  in_grace_period: { card: 'bg-orange-50 border-orange-400 shadow-md animate-pulse',            badge: 'bg-orange-100 text-orange-700', badgeText: 'Grace',   icon: Timer,        iconColor: 'text-orange-500' },
  no_show:         { card: 'bg-gray-50 border-dashed border-gray-400',                          badge: 'bg-gray-100 text-gray-500',     badgeText: 'No-show', icon: AlertOctagon, iconColor: 'text-gray-400'  },
  occupied:        { card: 'bg-red-50 border-red-400 shadow-sm',                                badge: 'bg-red-100 text-red-700',       badgeText: 'In',      icon: Car,          iconColor: 'text-red-500'   },
  overstay:        { card: 'bg-rose-50 border-rose-500 border-2 shadow-md',                     badge: 'bg-rose-100 text-rose-700',     badgeText: 'Over',    icon: TrendingUp,   iconColor: 'text-rose-600'  },
  maintenance:     { card: 'bg-gray-50 border-dashed border-gray-300 opacity-50 cursor-not-allowed', badge: 'bg-gray-100 text-gray-400', badgeText: 'Maint.', icon: AlertTriangle, iconColor: 'text-gray-300' },
  // 'reserved' is an alias — treat same as available visually but with upcoming badge
  reserved:        { card: 'bg-amber-50 border-amber-200 hover:shadow-md',                     badge: 'bg-amber-100 text-amber-700',   badgeText: 'Rsvd',   icon: AlarmClock,   iconColor: 'text-amber-400' },
};

/** Safe accessor — never returns undefined even for unknown states */
function getVisualConfig(visual: string) {
  return visualConfig[visual] ?? visualConfig['available'];
}

// ─── Slot label parser ────────────────────────────────────────────────────────
function parseLabel(label: string): { row: string; number: number } {
  if (label.match(/^F\d+-[A-Z]\d+$/)) {
    const part = label.split('-')[1];
    return { row: part.charAt(0), number: parseInt(part.substring(1)) };
  }
  return { row: label.charAt(0), number: parseInt(label.substring(1)) || 1 };
}

interface GridSlot { dbSlot: DashboardSlot; row: string; number: number; category: SlotCategory }

// ─── Walk-in localStorage helpers ────────────────────────────────────────────
const loadWalkIns = (date: string): Record<string, any> => {
  try { return JSON.parse(localStorage.getItem(`walkIns_${date}`) || '{}'); } catch { return {}; }
};
const saveWalkIns = (date: string, data: Record<string, any>) => {
  localStorage.setItem(`walkIns_${date}`, JSON.stringify(data));
};

// ─── Mini countdown display ───────────────────────────────────────────────────
function CountdownPill({ timing }: { timing: BookingTiming | null }) {
  if (!timing) return null;
  const { timingState, minutesUntilStart, gracePeriodMinLeft, overstayMinutes } = timing;

  if (timingState === 'arriving_soon') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
        <AlarmClock className="size-2.5" />
        {minutesUntilStart}m
      </span>
    );
  }
  if (timingState === 'in_grace_period') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full animate-pulse">
        <Timer className="size-2.5" />
        {gracePeriodMinLeft}m left
      </span>
    );
  }
  if (timingState === 'overstay') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full">
        <TrendingUp className="size-2.5" />
        +{overstayMinutes}m
      </span>
    );
  }
  if (timingState === 'no_show') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
        <AlertOctagon className="size-2.5" />
        N/S
      </span>
    );
  }
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export function SmartParkingDashboard() {
  const today = new Date().toISOString().split('T')[0];

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [parkingConfig, setParkingConfig] = useState<AdvancedParkingConfigType | null>(() => {
    try { return JSON.parse(localStorage.getItem('advancedParkingConfig') || 'null'); } catch { return null; }
  });

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<GridSlot | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Locations
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    () => localStorage.getItem('adminSelectedLocationId') || ''
  );
  const [showLocDrop, setShowLocDrop] = useState(false);

  // Real-time slots
  const [dashboardSlots, setDashboardSlots] = useState<DashboardSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverTime, setServerTime] = useState<string>('');

  // Adaptive poll interval (server hint)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const recommendedMs = useRef(45_000);

  // Per-second tick to refresh countdowns without API call
  const [, setTick] = useState(0);
  const startTicker = useCallback(() => {
    tickRef.current && clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setTick(t => t + 1), 60_000); // once per minute is fine for minute-level display
  }, []);

  // Walk-in
  const [walkIns, setWalkIns] = useState<Record<string, any>>({});
  useEffect(() => { setWalkIns(loadWalkIns(selectedDate)); }, [selectedDate]);

  const [walkInForm, setWalkInForm] = useState({ driverName:'', carColor:'', plateNumber:'', vehicleType:'Sedan', phoneNumber:'', brand:'', model:'' });
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Pricing editor ────────────────────────────────────────────────────────
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingForm, setPricingForm] = useState({ freeHours: 2, overtimeRate: 15 });
  const [savingPricing, setSavingPricing] = useState(false);

  // Load saved pricing on location change
  useEffect(() => {
    if (!selectedLocationId) return;
    const saved = localStorage.getItem(`pricing_${selectedLocationId}`);
    if (saved) {
      try { setPricingForm(JSON.parse(saved)); } catch {}
    } else {
      setPricingForm({ freeHours: 2, overtimeRate: 15 }); // defaults
    }
  }, [selectedLocationId]);

  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      // Persist locally so teller / backend can read it
      localStorage.setItem(`pricing_${selectedLocationId}`, JSON.stringify(pricingForm));
      // Also patch the location record so the API has the canonical value
      await locationService.updateLocation(selectedLocationId, {
        overtimeRatePerHour: pricingForm.overtimeRate,
        freeHours: pricingForm.freeHours,
      } as any);
      toast.success(`Pricing updated: First ${pricingForm.freeHours}h free · ₱${pricingForm.overtimeRate}/hr after`);
      setShowPricingModal(false);
    } catch {
      // Backend may not have these fields yet — still save locally
      localStorage.setItem(`pricing_${selectedLocationId}`, JSON.stringify(pricingForm));
      toast.success('Pricing saved locally.');
      setShowPricingModal(false);
    } finally {
      setSavingPricing(false);
    }
  };

  // ─── Load locations ────────────────────────────────────────────────────────
  useEffect(() => {
    locationService.getLocations({ status: 'active' }).then((data) => {
      setLocations(data);
      if (!selectedLocationId && data.length > 0) {
        setSelectedLocationId(data[0]._id);
        localStorage.setItem('adminSelectedLocationId', data[0]._id);
      }
    }).catch(() => {});
  }, []);

  // ─── Fetch dashboard slots ─────────────────────────────────────────────────
  const fetchSlots = useCallback(async (quiet = false) => {
    if (!selectedLocationId) return;
    if (!quiet) setIsLoading(true);
    try {
      const { slots, recommendedPollMs, serverTime: st } =
        await parkingSlotService.getDashboardSlots(selectedLocationId, selectedDate);
      setDashboardSlots(slots);
      setLastUpdated(new Date());
      setIsLive(true);
      setServerTime(st);
      recommendedMs.current = recommendedPollMs;
      // Restart polling with server-recommended interval
      pollRef.current && clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchSlots(true), recommendedPollMs);
      startTicker();
    } catch {
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocationId, selectedDate, startTicker]);

  useEffect(() => {
    if (!selectedLocationId) return;
    fetchSlots();
    return () => {
      pollRef.current && clearInterval(pollRef.current);
      tickRef.current && clearInterval(tickRef.current);
    };
  }, [fetchSlots, selectedLocationId, selectedDate]);

  // First-load config prompt
  useEffect(() => {
    if (!parkingConfig && !selectedLocationId) setShowConfigModal(true);
  }, []);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const floors = [...new Set(dashboardSlots.map(s => s.floor))].sort((a, b) => a - b);
  const gridSlots: GridSlot[] = dashboardSlots.map(s => ({
    dbSlot: s, ...parseLabel(s.label), category: typeToCategory[s.type] || 'regular',
  }));
  const currentFloorSlots = gridSlots.filter(g => g.dbSlot.floor === selectedFloor);
  const rows = [...new Set(currentFloorSlots.map(g => g.row))].sort();
  const selectedLocation = locations.find(l => l._id === selectedLocationId);

  // Per-slot live timing (recomputed each render tick)
  const getTiming = (g: GridSlot) => recomputeTiming(g.dbSlot, today);

  // Stats (respect no-show as "available" for operator clarity)
  const stats = {
    total:     dashboardSlots.length,
    available: dashboardSlots.filter(s => ['available','no_show'].includes(s.derivedStatus)).length,
    reserved:  dashboardSlots.filter(s => ['reserved','arriving_soon','in_grace_period'].includes(s.derivedStatus)).length,
    occupied:  dashboardSlots.filter(s => ['occupied','overstay'].includes(s.derivedStatus)).length,
    noShow:    dashboardSlots.filter(s => s.derivedStatus === 'no_show').length,
    overstay:  dashboardSlots.filter(s => s.derivedStatus === 'overstay').length,
  };

  // Urgency flag: if any grace-period or overstay slot → faster polling hint badge
  const hasUrgent = dashboardSlots.some(s => ['in_grace_period','overstay'].includes(s.derivedStatus));
  const pollSecs  = Math.round(recommendedMs.current / 1000);

  // ─── Admin actions ─────────────────────────────────────────────────────────
  const handleCheckIn = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'active');
      toast.success('Customer checked in!');
      addNotification({ type: 'booking', title: 'Customer Check-In', message: `Booking ${bookingId} is now active.` });
      await fetchSlots();
      setShowModal(false);
    } catch (err: any) { toast.error(err.message || 'Check-in failed'); }
    finally { setActionLoading(false); }
  };

  const handleCheckOut = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'completed');
      toast.success('Customer checked out. Slot is now free.');
      addNotification({ type: 'booking', title: 'Check-Out', message: `Booking ${bookingId} completed.` });
      await fetchSlots();
      setShowModal(false);
    } catch (err: any) { toast.error(err.message || 'Check-out failed'); }
    finally { setActionLoading(false); }
  };

  const handleMarkNoShow = async (bookingId: string) => {
    setActionLoading(true);
    try {
      await bookingService.updateBookingStatus(bookingId, 'no_show');
      toast.success('Booking marked as no-show. Slot freed.');
      addNotification({ type: 'system', title: 'No-Show Recorded', message: `Booking ${bookingId} marked no-show.` });
      await fetchSlots();
      setShowModal(false);
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  // ─── Walk-in helpers ───────────────────────────────────────────────────────
  const slotKey = (g: GridSlot) => `${g.dbSlot.floor}F-${g.row}${g.number}`;

  const handleWalkInSave = () => {
    if (!selectedSlot || !walkInForm.driverName || !walkInForm.plateNumber) {
      toast.error('Driver name and plate number are required'); return;
    }
    const key = slotKey(selectedSlot);
    const updated = { ...walkIns, [key]: { ...walkInForm, status: 'occupied', createdAt: new Date().toISOString() } };
    setWalkIns(updated); saveWalkIns(selectedDate, updated);
    toast.success(`Walk-in reserved for slot ${selectedSlot.dbSlot.label}`);
    setShowModal(false);
    setWalkInForm({ driverName:'', carColor:'', plateNumber:'', vehicleType:'Sedan', phoneNumber:'', brand:'', model:'' });
  };

  const handleWalkInCancel = (key: string) => {
    const updated = { ...walkIns };
    delete updated[key];
    setWalkIns(updated); saveWalkIns(selectedDate, updated);
    toast.success('Walk-in removed');
    setShowModal(false);
  };

  // ─── Config save ───────────────────────────────────────────────────────────
  const handleSaveConfig = async (config: AdvancedParkingConfigType) => {
    setParkingConfig(config);
    localStorage.setItem('advancedParkingConfig', JSON.stringify(config));
    setShowConfigModal(false);
    toast.success('Parking configuration saved!');
    if (selectedLocationId && config.isEvenLayout && config.evenConfig) {
      const sections = Array.from({ length: config.evenConfig.rows }, (_, i) => String.fromCharCode(65 + i));
      setIsSyncing(true);
      try {
        await parkingSlotService.generateSlots({ locationId: selectedLocationId, sections, slotsPerSection: config.evenConfig.columns, floors: config.floors });
        toast.success('Slots synced to database!');
        await fetchSlots();
      } catch { toast.error('Config saved locally, sync failed.'); }
      finally { setIsSyncing(false); }
    }
  };

  // ─── Modal content ─────────────────────────────────────────────────────────
  const renderModalContent = () => {
    if (!selectedSlot) return null;
    const key     = slotKey(selectedSlot);
    const walkIn  = walkIns[key];
    const timing  = getTiming(selectedSlot);
    const visual  = resolveVisualState(selectedSlot.dbSlot, timing, walkIn);
    const booking = selectedSlot.dbSlot.booking;
    const Icon    = categoryIcons[selectedSlot.category];
    const Cat     = categoryStyles[selectedSlot.category];

    const CategoryBadge = () => (
      <span className={`flex items-center gap-1 px-2 py-1 ${Cat.bg} rounded-lg`}>
        <Icon className="size-3 text-white" /><span className="text-[10px] font-bold text-white uppercase">{selectedSlot.category}</span>
      </span>
    );

    // ── Available — walk-in form
    if (visual === 'available') return (
      <div className="space-y-4">
        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
        <div className="flex items-center justify-between">
          <div><h3 className="text-xl font-bold text-[#1e3d5a]">Walk-in Reservation</h3>
            <p className="text-sm text-gray-400">Slot <span className="font-bold text-[#ee6b20]">{selectedSlot.dbSlot.label}</span> · Floor {selectedSlot.dbSlot.floor}</p></div>
          <CategoryBadge />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Driver Name *</label><Input value={walkInForm.driverName} onChange={e => setWalkInForm({...walkInForm, driverName: e.target.value})} placeholder="Juan Dela Cruz" className="rounded-xl" /></div>
          <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Plate *</label><Input value={walkInForm.plateNumber} onChange={e => setWalkInForm({...walkInForm, plateNumber: e.target.value})} placeholder="ABC 123" className="rounded-xl" /></div>
          <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Color</label><Input value={walkInForm.carColor} onChange={e => setWalkInForm({...walkInForm, carColor: e.target.value})} placeholder="White" className="rounded-xl" /></div>
          <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={walkInForm.vehicleType} onChange={e => setWalkInForm({...walkInForm, vehicleType: e.target.value})}>
              {['Sedan','SUV','Van','Truck','Hatchback','Motorcycle'].map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</label><Input value={walkInForm.phoneNumber} onChange={e => setWalkInForm({...walkInForm, phoneNumber: e.target.value})} placeholder="+63 912 000 0000" className="rounded-xl" /></div>
          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Brand</label><Input value={walkInForm.brand} onChange={e => setWalkInForm({...walkInForm, brand: e.target.value})} placeholder="Toyota" className="rounded-xl" /></div>
          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Model</label><Input value={walkInForm.model} onChange={e => setWalkInForm({...walkInForm, model: e.target.value})} placeholder="Corolla" className="rounded-xl" /></div>
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Cancel</Button>
          <Button onClick={handleWalkInSave} className="flex-1 bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl"><Plus className="size-4 mr-2" />Reserve</Button>
        </div>
      </div>
    );

    // ── Walk-in details
    if (walkIn) return (
      <div className="space-y-4">
        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#1e3d5a]">Walk-in Details</h3><CategoryBadge />
        </div>
        <div className="space-y-2">
          {[['Driver',walkIn.driverName],['Plate',walkIn.plateNumber],['Color',walkIn.carColor],['Vehicle',walkIn.vehicleType],['Brand',walkIn.brand],['Model',walkIn.model],['Phone',walkIn.phoneNumber]].map(([l,v]) => v ? (
            <div key={l} className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="text-gray-400">{l}</span><span className="font-bold text-[#1e3d5a]">{v}</span></div>
          ) : null)}
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Close</Button>
          <Button variant="destructive" onClick={() => handleWalkInCancel(key)} className="flex-1 rounded-xl">Remove Walk-in</Button>
        </div>
      </div>
    );

    // ── No-show — special panel
    if (visual === 'no_show' && booking) return (
      <div className="space-y-4">
        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
        <div className="flex items-center justify-between">
          <div><h3 className="text-xl font-bold text-[#1e3d5a]">No-Show Detected</h3><p className="text-sm font-mono text-gray-400">{booking.reference}</p></div>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold flex items-center gap-1"><AlertOctagon className="size-3" />NO-SHOW</span>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-1">
          <p className="text-sm text-gray-600">Grace period expired at <span className="font-bold">{timing?.gracePeriodExpiresAt}</span>. Customer did not check in.</p>
          <p className="text-sm text-gray-500">Booking window: <span className="font-bold">{booking.timeSlot}</span></p>
          {booking.user && <p className="text-sm text-gray-500">Customer: <span className="font-bold">{booking.user.name}</span></p>}
          {booking.vehicle && <p className="text-sm text-[#ee6b20] font-bold">{booking.vehicle.plateNumber}</p>}
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Close</Button>
          <Button onClick={() => handleMarkNoShow(booking._id)} disabled={actionLoading} className="flex-1 bg-gray-700 hover:bg-gray-900 rounded-xl text-sm">
            <AlertOctagon className="size-4 mr-2" />{actionLoading ? 'Processing…' : 'Mark No-Show & Free Slot'}
          </Button>
        </div>
      </div>
    );

    // ── Reserved (upcoming — arriving soon or future)
    if ((visual === 'reserved' || visual === 'arriving_soon' || visual === 'in_grace_period') && booking) {
      const isGrace = visual === 'in_grace_period';
      return (
        <div className="space-y-4">
          <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
          <div className="flex items-center justify-between">
            <div><h3 className="text-xl font-bold text-[#1e3d5a]">{isGrace ? 'Grace Period' : 'Reservation'}</h3>
              <p className="text-sm font-mono text-[#ee6b20]">{booking.reference}</p></div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isGrace ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-yellow-100 text-yellow-700'}`}>
              {isGrace ? <Timer className="size-3" /> : <AlarmClock className="size-3" />}
              {isGrace ? `Grace: ${timing?.gracePeriodMinLeft}m left` : 'UPCOMING'}
            </span>
          </div>
          {isGrace && (
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-xs font-bold text-orange-800">⚠️ Grace period until {timing?.gracePeriodExpiresAt} — check if customer has arrived</p>
            </div>
          )}
          <div className="space-y-2">
            {booking.user && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><User className="size-3.5"/>Customer</span><span className="font-bold">{booking.user.name}</span></div>}
            {booking.vehicle && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Car className="size-3.5"/>Plate</span><span className="font-bold text-[#ee6b20]">{booking.vehicle.plateNumber}</span></div>}
            {booking.vehicle && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="text-gray-400">Vehicle</span><span className="font-bold">{booking.vehicle.brand} {booking.vehicle.model}</span></div>}
            <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Clock className="size-3.5"/>Time</span><span className="font-bold">{booking.timeSlot}</span></div>
            {booking.user?.phone && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Phone className="size-3.5"/>Phone</span><span className="font-bold">{booking.user.phone}</span></div>}
            <div className="flex justify-between p-3 bg-yellow-50 rounded-xl text-sm border border-yellow-100"><span className="font-medium text-yellow-800">Paid</span><span className="font-bold text-[#1e3d5a]">₱{booking.amount}</span></div>
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Close</Button>
            <Button onClick={() => handleCheckIn(booking._id)} disabled={actionLoading} className="flex-1 bg-[#1e3d5a] hover:bg-[#16304a] rounded-xl">
              <LogIn className="size-4 mr-2" />{actionLoading ? 'Processing…' : 'Check In'}
            </Button>
          </div>
        </div>
      );
    }

    // ── Occupied / Overstay
    if ((visual === 'occupied' || visual === 'overstay') && booking) {
      const isOver = visual === 'overstay';
      return (
        <div className="space-y-4">
          <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="size-5" /></button>
          <div className="flex items-center justify-between">
            <div><h3 className="text-xl font-bold text-[#1e3d5a]">{isOver ? 'Overstay Detected' : 'Active Parking'}</h3>
              <p className="text-sm font-mono text-[#ee6b20]">{booking.reference}</p></div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isOver ? 'bg-rose-100 text-rose-700' : 'bg-red-100 text-red-700'}`}>
              {isOver ? <TrendingUp className="size-3" /> : <Car className="size-3" />}
              {isOver ? `+${timing?.overstayMinutes}m OVERSTAY` : 'OCCUPIED'}
            </span>
          </div>
          {isOver && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-xs font-bold text-rose-800">⚠️ Vehicle exceeded booked time by {timing?.overstayMinutes} minutes. Expected out at {timing?.expectedEndAt}.</p>
            </div>
          )}
          <div className="space-y-2">
            {booking.user && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><User className="size-3.5"/>Customer</span><span className="font-bold">{booking.user.name}</span></div>}
            {booking.vehicle && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Car className="size-3.5"/>Plate</span><span className="font-bold text-[#ee6b20]">{booking.vehicle.plateNumber}</span></div>}
            {booking.vehicle && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="text-gray-400">Vehicle</span><span className="font-bold">{booking.vehicle.brand} {booking.vehicle.model} · {booking.vehicle.color}</span></div>}
            <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Clock className="size-3.5"/>Booked</span><span className="font-bold">{booking.timeSlot}</span></div>
            {booking.user?.phone && <div className="flex justify-between p-3 bg-gray-50 rounded-xl text-sm"><span className="flex items-center gap-2 text-gray-400"><Phone className="size-3.5"/>Phone</span><span className="font-bold">{booking.user.phone}</span></div>}
            <div className="flex justify-between p-3 bg-[#1e3d5a]/5 rounded-xl text-sm border border-[#1e3d5a]/10"><span className="flex items-center gap-2 text-[#1e3d5a] font-medium"><CreditCard className="size-3.5"/>Paid</span><span className="font-bold text-[#1e3d5a]">₱{booking.amount}</span></div>
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-xl">Close</Button>
            <Button onClick={() => handleCheckOut(booking._id)} disabled={actionLoading} className={`flex-1 rounded-xl ${isOver ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#ee6b20] hover:bg-[#d55f1c]'}`}>
              <LogOutIcon className="size-4 mr-2" />{actionLoading ? 'Processing…' : 'Check Out'}
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  const noSlotsConfigured = !isLoading && dashboardSlots.length === 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3d5a]">Parking Management</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-0.5">
            Live occupancy with smart reservation timing
            {hasUrgent && <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-bold"><Activity className="size-3 animate-pulse" />Urgent</span>}
          </p>
        </div>

        {/* Location selector */}
        <div className="relative">
          <button onClick={() => setShowLocDrop(!showLocDrop)}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-[#ee6b20] rounded-2xl px-4 py-2.5 font-bold text-[#1e3d5a] transition-all min-w-[220px]">
            <MapPin className="size-4 text-[#ee6b20] shrink-0" />
            <span className="flex-1 text-left text-sm truncate">{selectedLocation?.name || 'Select Location'}</span>
            <ChevronDown className={`size-4 text-gray-400 transition-transform ${showLocDrop ? 'rotate-180' : ''}`} />
          </button>
          {showLocDrop && locations.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border z-50 overflow-hidden">
              {locations.map(loc => (
                <button key={loc._id} onClick={() => { setSelectedLocationId(loc._id); localStorage.setItem('adminSelectedLocationId', loc._id); setShowLocDrop(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 text-left transition-colors ${selectedLocationId === loc._id ? 'bg-orange-50' : ''}`}>
                  <MapPin className="size-4 text-[#ee6b20] mt-0.5 shrink-0" />
                  <div><p className="font-bold text-[#1e3d5a] text-sm">{loc.name}</p><p className="text-xs text-gray-400">{loc.address}</p></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1e3d5a] rounded-xl"><CalendarIcon className="size-4 text-white" /></div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="rounded-xl h-9 border-gray-200 text-sm w-36" />
            </div>
          </div>

          {/* Live indicator + poll interval */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
            {isLive ? (
              <><div className={`size-2 rounded-full ${hasUrgent ? 'bg-rose-500 animate-ping' : 'bg-green-500 animate-pulse'}`}/><Wifi className="size-4 text-green-600"/><span className="text-xs font-bold text-green-700">Live</span></>
            ) : (
              <><WifiOff className="size-4 text-gray-400"/><span className="text-xs font-bold text-gray-400">Offline</span></>
            )}
            {isLive && <span className="text-[10px] text-gray-400 border-l pl-2">↻ {pollSecs}s</span>}
            {lastUpdated && <span className="text-[10px] text-gray-400">{lastUpdated.toLocaleTimeString()}</span>}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button onClick={() => fetchSlots()} disabled={isLoading} variant="outline" className="rounded-xl h-9 px-3 font-bold border-gray-200 text-sm">
              <RefreshCw className={`size-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {selectedLocationId && parkingConfig?.isEvenLayout && parkingConfig?.evenConfig && (
              <Button onClick={async () => {
                const sections = Array.from({ length: parkingConfig!.evenConfig!.rows }, (_, i) => String.fromCharCode(65 + i));
                setIsSyncing(true);
                try { await parkingSlotService.generateSlots({ locationId: selectedLocationId, sections, slotsPerSection: parkingConfig!.evenConfig!.columns, floors: parkingConfig!.floors }); toast.success('Synced!'); await fetchSlots(); }
                catch { toast.error('Sync failed'); } finally { setIsSyncing(false); }
              }} disabled={isSyncing} variant="outline" className="rounded-xl h-9 px-3 font-bold border-[#1e3d5a]/30 text-[#1e3d5a] text-sm">
                <RefreshCw className={`size-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync DB
              </Button>
            )}
            {/* Pricing Editor button */}
            <Button onClick={() => setShowPricingModal(true)} variant="outline" className="rounded-xl h-9 px-3 font-bold border-[#ee6b20]/40 text-[#ee6b20] text-sm">
              <CreditCard className="size-3.5 mr-1.5" /> Pricing
            </Button>
            <Button onClick={() => setShowConfigModal(true)} className="bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl h-9 px-4 font-bold text-sm">
              <Settings className="size-3.5 mr-1.5" /> Configure
            </Button>
          </div>
        </div>
        {selectedLocation && (
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1"><MapPin className="size-3"/>{selectedLocation.address}</span>
            <span className="flex items-center gap-1"><Car className="size-3"/>{selectedLocation.availableSpots}/{selectedLocation.totalSpots} available</span>
            <span className="flex items-center gap-1"><Clock className="size-3"/>{selectedLocation.operatingHours}</span>
          </div>
        )}
      </div>

      {/* Stats — 6 cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total',     value: stats.total,     color: '#1e3d5a', bg: 'bg-[#1e3d5a]/5'  },
          { label: 'Available', value: stats.available, color: '#10b981', bg: 'bg-green-50'      },
          { label: 'Reserved',  value: stats.reserved,  color: '#f59e0b', bg: 'bg-yellow-50'     },
          { label: 'Occupied',  value: stats.occupied,  color: '#ef4444', bg: 'bg-red-50'        },
          { label: 'No-Show',   value: stats.noShow,    color: '#6b7280', bg: 'bg-gray-50'       },
          { label: 'Overstay',  value: stats.overstay,  color: '#f43f5e', bg: 'bg-rose-50'       },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100 text-center`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 bg-white rounded-2xl border border-gray-100 p-4 text-xs">
        {[
          { color: 'bg-white border-gray-200',     label: 'Available' },
          { color: 'bg-amber-50 border-amber-300', label: 'Arriving soon (<60 min)' },
          { color: 'bg-orange-50 border-orange-400', label: 'Grace period (arrived late?)' },
          { color: 'bg-gray-50 border-dashed border-gray-400', label: 'No-show (past grace)' },
          { color: 'bg-red-50 border-red-400',     label: 'Occupied' },
          { color: 'bg-rose-50 border-rose-500',   label: 'Overstay' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`size-4 rounded border-2 ${l.color}`} />
            <span className="text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Floor tabs */}
      {floors.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {floors.map(floor => {
            const fs = dashboardSlots.filter(s => s.floor === floor);
            const avail = fs.filter(s => s.derivedStatus === 'available').length;
            return (
              <button key={floor} onClick={() => setSelectedFloor(floor)}
                className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${selectedFloor === floor ? 'bg-[#1e3d5a] border-[#1e3d5a] text-white shadow-md' : 'border-gray-200 text-gray-500 hover:border-[#ee6b20]'}`}>
                Floor {floor} <span className={`text-xs ${selectedFloor === floor ? 'text-white/70' : 'text-gray-400'}`}>({avail}/{fs.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Parking grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 gap-4">
            <RefreshCw className="size-7 text-[#ee6b20] animate-spin" />
            <span className="text-gray-400 font-medium">Loading real-time slot data…</span>
          </div>
        ) : noSlotsConfigured ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="size-8 text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-gray-500 text-lg">No parking slots configured yet</p>
              <p className="text-sm text-gray-400 mt-1">Configure your parking lot layout to manage slots in real-time.</p>
            </div>
            <Button onClick={() => setShowConfigModal(true)} className="bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl">
              <Settings className="size-4 mr-2" /> Configure Parking Lot
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex justify-between text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-5 px-1">
              <span>← Entry</span>
              <span>Floor {selectedFloor} · {selectedLocation?.name?.toUpperCase() || 'PARKING'}</span>
              <span>Exit →</span>
            </div>
            {rows.map(row => {
              const rowSlots = currentFloorSlots.filter(g => g.row === row).sort((a, b) => a.number - b.number);
              return (
                <div key={row} className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 flex items-center justify-center font-bold text-[#1e3d5a] bg-blue-50 rounded-lg text-xs shrink-0">{row}</div>
                  <div className="flex gap-2 flex-wrap">
                    {rowSlots.map(g => {
                      const timing   = getTiming(g);
                      const walkIn   = walkIns[slotKey(g)];
                      const visual   = resolveVisualState(g.dbSlot, timing, walkIn);
                      const vc       = getVisualConfig(visual);   // safe — never undefined
                      const CatIcon  = categoryIcons[g.category] ?? Grid3x3;
                      const SlotIcon = vc.icon;

                      return (
                        <button key={g.dbSlot._id} onClick={() => { if (visual !== 'maintenance') { setSelectedSlot(g); setShowModal(true); } }}
                          title={`${g.dbSlot.label} · ${g.category} · ${visual}`}
                          className={`relative group w-[4.25rem] h-[4.25rem] rounded-xl border-2 transition-all ${vc.card} ${visual !== 'maintenance' ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}`}>

                          <div className="flex flex-col items-center justify-center h-full gap-0.5 px-1">
                            <SlotIcon className={`size-3.5 ${vc.iconColor}`} />
                            <span className="text-[10px] font-black text-[#1e3d5a] leading-none">{g.number}</span>
                            <CountdownPill timing={visual !== 'available' ? timing : null} />
                          </div>

                          {/* Category corner dot */}
                          <div className={`absolute top-1 left-1 size-2 rounded-full ${categoryStyles[g.category].bg}`} title={g.category} />

                          {/* Online booking indicator */}
                          {g.dbSlot.booking && !walkIn && (
                            <div className="absolute -top-1.5 -right-1.5 size-3.5 bg-[#1e3d5a] rounded-full flex items-center justify-center">
                              <CheckCircle className="size-2.5 text-white" />
                            </div>
                          )}

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 bg-[#1e3d5a] text-white text-[10px] rounded-xl shadow-xl whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            <p className="font-bold">{g.dbSlot.label} · {g.category}</p>
                            <p className="text-white/60 capitalize">{visual.replace('_',' ')}</p>
                            {g.dbSlot.booking?.vehicle?.plateNumber && <p className="text-[#ee6b20] font-bold mt-0.5">{g.dbSlot.booking.vehicle.plateNumber}</p>}
                            {timing?.isInGracePeriod && <p className="text-orange-300">Grace: {timing.gracePeriodMinLeft}m left</p>}
                            {timing?.isOverstay && <p className="text-rose-300">Overstay: +{timing.overstayMinutes}m</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Config modal */}
      <AdvancedParkingConfig isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} onSave={handleSaveConfig} currentConfig={parkingConfig ?? undefined} />

      {/* Pricing Editor Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPricingModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-[#1e3d5a]">Overtime Pricing</h3>
                <p className="text-xs text-gray-400 mt-0.5">Set rates for {selectedLocation?.name ?? 'this location'}</p>
              </div>
              <button onClick={() => setShowPricingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Free hours */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2">
                  Free Window (hours)
                </label>
                <p className="text-xs text-green-600 mb-3">Customers park FREE for the first N hours after check-in.</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPricingForm(p => ({ ...p, freeHours: Math.max(0, p.freeHours - 1) }))}
                    className="size-9 rounded-xl bg-white border border-green-300 font-bold text-green-700 hover:bg-green-100 flex items-center justify-center text-lg">
                    −
                  </button>
                  <span className="text-3xl font-black text-[#1e3d5a] w-12 text-center">
                    {pricingForm.freeHours}
                  </span>
                  <button onClick={() => setPricingForm(p => ({ ...p, freeHours: Math.min(24, p.freeHours + 1) }))}
                    className="size-9 rounded-xl bg-white border border-green-300 font-bold text-green-700 hover:bg-green-100 flex items-center justify-center text-lg">
                    +
                  </button>
                  <span className="text-sm text-gray-400 font-medium">hr{pricingForm.freeHours !== 1 ? 's' : ''} free</span>
                </div>
              </div>

              {/* Rate per hour */}
              <div className="bg-[#ee6b20]/5 border border-[#ee6b20]/20 rounded-2xl p-4">
                <label className="block text-[10px] font-bold text-[#ee6b20] uppercase tracking-widest mb-2">
                  Overtime Rate (₱/hr)
                </label>
                <p className="text-xs text-gray-400 mb-3">Charged per hour (ceiling) after the free window ends.</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPricingForm(p => ({ ...p, overtimeRate: Math.max(1, p.overtimeRate - 5) }))}
                    className="size-9 rounded-xl bg-white border border-[#ee6b20]/30 font-bold text-[#ee6b20] hover:bg-orange-50 flex items-center justify-center text-lg">
                    −
                  </button>
                  <span className="text-3xl font-black text-[#ee6b20] w-16 text-center">
                    ₱{pricingForm.overtimeRate}
                  </span>
                  <button onClick={() => setPricingForm(p => ({ ...p, overtimeRate: p.overtimeRate + 5 }))}
                    className="size-9 rounded-xl bg-white border border-[#ee6b20]/30 font-bold text-[#ee6b20] hover:bg-orange-50 flex items-center justify-center text-lg">
                    +
                  </button>
                  <span className="text-sm text-gray-400 font-medium">/hr</span>
                </div>
                <input type="range" min={5} max={200} step={5}
                  value={pricingForm.overtimeRate}
                  onChange={e => setPricingForm(p => ({ ...p, overtimeRate: +e.target.value }))}
                  className="w-full mt-3 accent-[#ee6b20]"
                />
              </div>

              {/* Preview */}
              <div className="bg-[#1e3d5a]/5 rounded-2xl p-4 space-y-1.5 text-sm">
                <p className="text-[10px] font-bold text-[#1e3d5a] uppercase tracking-widest mb-2">Preview</p>
                {[
                  { label: `0 – ${pricingForm.freeHours}h`, fee: 'FREE', cls: 'text-green-600' },
                  { label: `${pricingForm.freeHours + 1}h`, fee: `₱${pricingForm.overtimeRate}`, cls: 'text-[#ee6b20]' },
                  { label: `${pricingForm.freeHours + 2}h`, fee: `₱${pricingForm.overtimeRate * 2}`, cls: 'text-[#ee6b20]' },
                  { label: `${pricingForm.freeHours + 3}h`, fee: `₱${pricingForm.overtimeRate * 3}`, cls: 'text-[#ee6b20]' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-gray-500">{r.label}</span>
                    <span className={`font-bold ${r.cls}`}>{r.fee}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowPricingModal(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleSavePricing} disabled={savingPricing}
                className="flex-1 bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl font-bold">
                {savingPricing ? <RefreshCw className="size-4 animate-spin mr-2" /> : null}
                Save Pricing
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slot detail modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 relative">{renderModalContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
