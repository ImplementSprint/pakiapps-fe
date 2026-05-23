import { BarcodeDisplay } from '../components/BarcodeDisplay';
import JsBarcode from 'jsbarcode';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft, Clock, CheckCircle, MapPin, CreditCard, Share2,
  Download, Car, AlertTriangle, Timer, LayoutGrid, Loader2,
  Accessibility, Zap, Star, Bike, Wallet, Smartphone, ChevronRight,
  Eye, EyeOff, Lock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import { bookingService } from '../services/bookingService';
import { parkingSlotService, ParkingSlot } from '../services/parkingSlotService';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'timeslot' | 'confirmation' | 'payment';

interface LocationState {
  vehicle?: { _id?: string; type: string; brand?: string; model?: string; plateNumber?: string };
  location?: string;
  locationId?: string;
  /** Actual hourly rate from the selected parking location */
  hourlyRate?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`);
  }
  return slots;
}
function nowMinutes(): number { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function todayStr():    string  { return new Date().toISOString().split('T')[0]; }

function isSlotExpired(slot: string, date: string, nowMin: number): boolean {
  if (date !== todayStr()) return false;
  const [h, m] = slot.split(' - ')[0].split(':').map(Number);
  return h * 60 + m <= nowMin;
}

function makePreviewRef(plate: string, date: string, slot: string): string {
  const raw = `${plate}${date}${slot}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
  return `PKP-${String(Math.abs(hash) % 100_000_000).padStart(8, '0')}`;
}
function refToBarcode(ref: string): string { return ref.replace(/-/g, ''); }

// ─── Ticket image generator (pure Canvas 2D + JsBarcode — no DOM deps) ────────
interface TicketData {
  location: string;
  customer: string;
  plate:    string;
  vehicle:  string;
  timeSlot: string;
  spot:     string;
  date:     string;
  ref:      string;
  barcode:  string;
}

async function generateTicketImage(t: TicketData): Promise<string> {
  const S   = 2;          // pixel scale for retina quality
  const W   = 460 * S;
  const H   = 700 * S;
  const PAD = 36 * S;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Outer card ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  const r = 28 * S;
  ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
  ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
  ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // ── Header band ───────────────────────────────────────────────────────────
  const HEADER_H = 120 * S;
  ctx.fillStyle = '#1e3d5a';
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
  ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, HEADER_H); ctx.lineTo(0, HEADER_H); ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  function txt(text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  txt('PAKIPARK E-PASS',     PAD,           40 * S, `bold ${9 * S}px system-ui`, 'rgba(255,255,255,0.5)');
  txt('1-Hour Reservation',  PAD,           90 * S, `bold ${20 * S}px system-ui`, '#ee6b20');

  // ── Tear-off dashes ───────────────────────────────────────────────────────
  const TEAR_Y = (HEADER_H + 2 * S);
  ctx.setLineDash([8 * S, 6 * S]);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, TEAR_Y);
  ctx.lineTo(W - PAD, TEAR_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Detail rows ───────────────────────────────────────────────────────────
  function field(label: string, value: string, lx: number, ly: number, valColor = '#1e3d5a') {
    txt(label, lx, ly,            `bold ${7.5 * S}px system-ui`, '#9ca3af');
    txt(value, lx, ly + 18 * S,  `bold ${11 * S}px system-ui`, valColor);
  }

  const COL1 = PAD;
  const COL2 = W / 2 + 8 * S;
  let   gy   = (HEADER_H + 28 * S);

  // Location full-width
  txt('LOCATION', COL1, gy, `bold ${7.5 * S}px system-ui`, '#9ca3af');
  gy += 18 * S;
  txt(t.location, COL1, gy, `bold ${14 * S}px system-ui`, '#1e3d5a');
  gy += 28 * S;

  // Two-column rows
  const rows = [
    ['CUSTOMER', t.customer || '—',  'PLATE NUMBER', t.plate],
    ['VEHICLE',  t.vehicle,          'TIME SLOT',    t.timeSlot],
    ['PARKING SPOT', t.spot,         'DATE',         t.date],
  ] as const;

  for (const [l1, v1, l2, v2] of rows) {
    field(l1, v1, COL1, gy);
    field(l2, v2 as string, COL2, gy, l2 === 'PARKING SPOT' ? '#ee6b20' : '#1e3d5a');
    gy += 44 * S;
  }

  // ── Dashed separator ─────────────────────────────────────────────────────
  gy += 6 * S;
  ctx.setLineDash([8 * S, 6 * S]);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, gy); ctx.lineTo(W - PAD, gy);
  ctx.stroke();
  ctx.setLineDash([]);
  gy += 20 * S;

  // ── Barcode — rendered fresh off-screen via JsBarcode (no DOM ref needed) ─
  try {
    const bcCanvas = document.createElement('canvas');
    JsBarcode(bcCanvas, t.barcode, {
      format:       'CODE128',
      width:        3,
      height:       80,
      displayValue: false,
      margin:       8,
      background:   '#ffffff',
      lineColor:    '#1e3d5a',
    });
    const BC_H = 80 * S;
    ctx.drawImage(bcCanvas, PAD, gy, W - PAD * 2, BC_H);
    gy += BC_H + 10 * S;
  } catch {
    // Skip barcode silently if value is invalid
  }

  // ── Reference numbers ─────────────────────────────────────────────────────
  txt(t.ref,     W / 2, gy,        `bold ${11 * S}px monospace`, '#1e3d5a', 'center');
  gy += 16 * S;
  txt(t.barcode, W / 2, gy,        `${8.5 * S}px monospace`,     '#9ca3af', 'center');

  return canvas.toDataURL('image/jpeg', 0.95);
}

// ─── Slot type display ────────────────────────────────────────────────────────
const SLOT_TYPE_ICONS: Record<string, React.ReactNode> = {
  handicapped: <Accessibility className="size-3" />,
  ev_charging: <Zap className="size-3" />,
  vip:         <Star className="size-3" />,
  motorcycle:  <Bike className="size-3" />,
};
const SLOT_TYPE_COLORS: Record<string, string> = {
  regular:    '',
  handicapped:'border-blue-400 bg-blue-50',
  ev_charging:'border-green-400 bg-green-50',
  vip:        'border-yellow-400 bg-yellow-50',
  motorcycle: 'border-purple-400 bg-purple-50',
};

// ─── Slot size display ────────────────────────────────────────────────────────
// compact = motorcycle (narrow), standard = sedan (default), large = EV/VIP/SUV (wide)
const SLOT_SIZE_DIMS: Record<string, string> = {
  compact:  'w-12 h-14',
  standard: 'w-16 h-16',
  large:    'w-20 h-16',
};
const SLOT_SIZE_BADGE: Record<string, { label: string; cls: string }> = {
  compact:  { label: 'S', cls: 'bg-purple-100 text-purple-700' },
  standard: { label: 'M', cls: 'bg-gray-100 text-gray-500'    },
  large:    { label: 'L', cls: 'bg-teal-100 text-teal-700'     },
};

const PAYMENT_METHODS = [
  { key: 'GCash',             label: 'GCash',             Icon: Wallet,     hint: 'Via GCash mobile wallet'          },
  { key: 'PayMaya',           label: 'PayMaya',           Icon: Smartphone, hint: 'Via Maya / PayMaya app'           },
  { key: 'Credit/Debit Card', label: 'Credit/Debit Card', Icon: CreditCard, hint: 'Visa, Mastercard, JCB accepted'   },
] as const;

// ─── Card detection engine ────────────────────────────────────────────────────
interface CardTypeInfo {
  id:       string;
  label:    string;
  pattern:  RegExp;
  lengths:  number[];   // valid raw-digit lengths
  cvvLen:   number;
  format:   number[];   // group sizes e.g. [4,4,4,4] or [4,6,5]
  gradient: string;
}

const CARD_TYPES: CardTypeInfo[] = [
  { id:'amex',      label:'American Express', pattern:/^3[47]/,               lengths:[15],            cvvLen:4, format:[4,6,5],   gradient:'linear-gradient(135deg,#007cc3 0%,#005a8e 100%)' },
  { id:'visa',      label:'Visa',             pattern:/^4/,                   lengths:[13,16,19],      cvvLen:3, format:[4,4,4,4], gradient:'linear-gradient(135deg,#1a1f71 0%,#2b3490 100%)' },
  { id:'mastercard',label:'Mastercard',       pattern:/^(5[1-5]|2[2-7])/,    lengths:[16],            cvvLen:3, format:[4,4,4,4], gradient:'linear-gradient(135deg,#1d1d1d 0%,#3a3a3a 100%)' },
  { id:'jcb',       label:'JCB',              pattern:/^35[2-8]/,             lengths:[16],            cvvLen:3, format:[4,4,4,4], gradient:'linear-gradient(135deg,#003087 0%,#009f6b 100%)' },
  { id:'discover',  label:'Discover',         pattern:/^(6011|65|64[4-9])/,  lengths:[16],            cvvLen:3, format:[4,4,4,4], gradient:'linear-gradient(135deg,#231f20 0%,#4a4a4a 100%)' },
  { id:'diners',    label:'Diners Club',      pattern:/^(30[0-5]|36|38)/,    lengths:[14],            cvvLen:3, format:[4,6,4],   gradient:'linear-gradient(135deg,#004b87 0%,#0066aa 100%)' },
  { id:'unionpay',  label:'UnionPay',         pattern:/^62/,                  lengths:[16,17,18,19],   cvvLen:3, format:[4,4,4,4], gradient:'linear-gradient(135deg,#e21836 0%,#c01232 100%)' },
];

function detectCardType(number: string): CardTypeInfo | null {
  const n = number.replace(/\D/g, '');
  if (!n) return null;
  return CARD_TYPES.find(t => t.pattern.test(n)) ?? null;
}

function formatCardNumber(raw: string, info: CardTypeInfo | null): string {
  const digits = raw.replace(/\D/g, '');
  const groups = info?.format ?? [4, 4, 4, 4];
  let result = '', pos = 0;
  for (const len of groups) {
    if (pos >= digits.length) break;
    if (pos > 0) result += ' ';
    result += digits.slice(pos, pos + len);
    pos += len;
  }
  return result;
}

function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2);
  if (d.length === 2) return d + '/';
  return d;
}

/** Luhn algorithm — validates card number checksum */
function luhnCheck(number: string): boolean {
  const d = number.replace(/\D/g, '');
  if (d.length < 8) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

/** Inline brand badge component */
function CardBadge({ info }: { info: CardTypeInfo | null }) {
  if (!info) return <CreditCard className="size-5 text-gray-300" />;
  if (info.id === 'visa') return (
    <span style={{ background: info.gradient, padding:'3px 10px', borderRadius:6, color:'#fff', fontFamily:'serif', fontStyle:'italic', fontWeight:900, fontSize:15, letterSpacing:1 }}>VISA</span>
  );
  if (info.id === 'mastercard') return (
    <span style={{ display:'flex', alignItems:'center' }}>
      <span style={{ width:22,height:22,borderRadius:'50%',background:'#eb001b',display:'inline-block' }} />
      <span style={{ width:22,height:22,borderRadius:'50%',background:'#f79e1b',display:'inline-block',marginLeft:-10 }} />
    </span>
  );
  if (info.id === 'amex') return (
    <span style={{ background:info.gradient, padding:'3px 8px', borderRadius:6, color:'#fff', fontWeight:900, fontSize:12, letterSpacing:1 }}>AMEX</span>
  );
  if (info.id === 'jcb') return (
    <span style={{ display:'flex', gap:2 }}>
      {(['#003087','#cc0000','#009f6b'] as const).map((c,i) => (
        <span key={i} style={{ background:c,color:'#fff',width:16,height:22,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:900 }}>
          {'JCB'[i]}
        </span>
      ))}
    </span>
  );
  if (info.id === 'discover') return (
    <span style={{ display:'flex', alignItems:'center', gap:4, background:info.gradient, padding:'3px 8px', borderRadius:6 }}>
      <span style={{ color:'#fff', fontWeight:900, fontSize:10, letterSpacing:1 }}>DISCOVER</span>
      <span style={{ width:16,height:16,borderRadius:'50%',background:'#ff6600',display:'inline-block' }} />
    </span>
  );
  return (
    <span style={{ background:info.gradient, padding:'3px 8px', borderRadius:6, color:'#fff', fontWeight:700, fontSize:11, letterSpacing:0.5 }}>{info.label.toUpperCase()}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function UnifiedBooking() {
  const navigate       = useNavigate();
  const routerLocation = useLocation();
  const state          = routerLocation.state as LocationState | null;

  // Use the actual hourly rate from the selected location; fall back to 50
  const HOURLY_RATE = (state?.hourlyRate && state.hourlyRate > 0) ? state.hourlyRate : 50;

  const [userData]      = useState({ name: localStorage.getItem('userName') || '' });
  const [activeVehicle] = useState({
    _id:   (state?.vehicle as any)?._id || '',
    model: state?.vehicle
      ? `${state.vehicle.brand ?? ''} ${state.vehicle.model ?? ''}`.trim()
      : 'No Vehicle Selected',
    plate: state?.vehicle?.plateNumber || '---',
    type:  state?.vehicle?.type || 'Sedan',
  });

  // ── Real-time clock ────────────────────────────────────────────────────────
  const [currentMinutes, setCurrentMinutes] = useState(nowMinutes);
  useEffect(() => {
    const id = setInterval(() => setCurrentMinutes(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Step + booking state ───────────────────────────────────────────────────
  const [currentStep,      setCurrentStep]      = useState<Step>('timeslot');
  const [showSuccessModal, setShowSuccessModal]  = useState(false);
  const [isConfirming,     setIsConfirming]      = useState(false);
  const [isDownloading,    setIsDownloading]     = useState(false);

  // ── Floor preference modal ────────────────────────────────────────────────
  const [showFloorModal,  setShowFloorModal]  = useState(false);
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);

  const [ticketRef,     setTicketRef]     = useState('');
  const [ticketBarcode, setTicketBarcode] = useState('');

  const [bookingData, setBookingData] = useState({
    date:                todayStr(),
    selectedSlot:        '',
    selectedParkingSlot: null as ParkingSlot | null,
    paymentMethod:       'GCash',
    location:            state?.location   || 'Manila City Central Lot',
    locationId:          state?.locationId || 'loc1',
  });

  // ── Credit/Debit Card state ────────────────────────────────────────────────
  const [cardData,    setCardData]    = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showCvv,     setShowCvv]     = useState(false);
  const cardInfo = useMemo(() => detectCardType(cardData.number), [cardData.number]);
  const isCardPayment = bookingData.paymentMethod === 'Credit/Debit Card';

  const handleCardNumberChange = (raw: string) => {
    const info   = detectCardType(raw);
    const maxLen = info ? Math.max(...info.lengths) : 19;
    const digits = raw.replace(/\D/g, '').slice(0, maxLen);
    setCardData(prev => ({ ...prev, number: formatCardNumber(digits, detectCardType(digits)) }));
  };
  const handleExpiryChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, expiry: formatExpiry(digits) }));
  };

  // ── Parking slots (loaded when opening the floor modal) ───────────────────
  const [allSlots, setAllSlots] = useState<ParkingSlot[]>([]);

  // ── Open the floor preference modal on "Next" from timeslot step ───────────
  const handleOpenFloorModal = async () => {
    setIsLoadingFloors(true);
    setShowFloorModal(true);
    try {
      const slots = await parkingSlotService.getAvailableSlots(
        bookingData.locationId, bookingData.date, bookingData.selectedSlot
      );
      setAllSlots(slots);
      const floors = [...new Set(slots.filter(s => s.status === 'available').map(s => s.floor))].sort((a, b) => a - b);
      setAvailableFloors(floors.length > 0 ? floors : [1, 2, 3]);
    } catch {
      setAvailableFloors([1, 2, 3]);
      setAllSlots([]);
    } finally {
      setIsLoadingFloors(false);
    }
  };

  // ── Confirm floor preference → auto-assign a slot ─────────────────────────
  const handleFloorConfirm = (floor: number | null) => {
    let assigned: ParkingSlot | null = null;
    const available = allSlots.filter(s => s.status === 'available');
    if (floor !== null) {
      assigned = available.find(s => s.floor === floor) ?? null;
    }
    if (!assigned) {
      // fallback: any available slot
      assigned = available[0] ?? null;
    }
    setBookingData(prev => ({ ...prev, selectedParkingSlot: assigned }));
    setShowFloorModal(false);
    setCurrentStep('confirmation');
  };

  // ── Generate preview ref on entering confirmation step ─────────────────────
  useEffect(() => {
    if (currentStep === 'confirmation') {
      const ref = makePreviewRef(activeVehicle.plate, bookingData.date, bookingData.selectedSlot);
      setTicketRef(ref);
      setTicketBarcode(refToBarcode(ref));
    }
  }, [currentStep]);

  // ── Barcode canvas ref (via BarcodeDisplay forwardRef) ─────────────────────
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  // ── Time slots — only future slots are shown (past ones hidden) ───────────
  const timeSlots = useMemo(() => {
    const all = generateTimeSlots();
    if (bookingData.date !== todayStr()) return all; // future day: show all
    return all.filter(slot => !isSlotExpired(slot, bookingData.date, currentMinutes));
  }, [bookingData.date, currentMinutes]);

  // ── Download handler (pure canvas — JsBarcode renders barcode internally) ──
  const handleDownloadImage = useCallback(async () => {
    setIsDownloading(true);
    toast.loading('Generating your E-Ticket image…', { id: 'dl' });
    try {
      const dataUrl = await generateTicketImage({
        location: bookingData.location,
        customer: userData.name,
        plate:    activeVehicle.plate,
        vehicle:  activeVehicle.model,
        timeSlot: bookingData.selectedSlot,
        spot:     bookingData.selectedParkingSlot?.label || 'Auto',
        date:     bookingData.date,
        ref:      ticketRef,
        barcode:  ticketBarcode,
      });
      const link    = document.createElement('a');
      link.download = `PakiPark-EPass-${ticketRef || 'ticket'}.jpg`;
      link.href     = dataUrl;
      link.click();
      toast.success('E-Ticket saved to your downloads!', { id: 'dl' });
    } catch {
      toast.error('Could not generate image. Try again.', { id: 'dl' });
    }
    setIsDownloading(false);
  }, [ticketRef, ticketBarcode, bookingData, activeVehicle, userData]);

  // ── Share handler ──────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const text = [
      '🚗 PakiPark E-Pass',
      `📍 ${bookingData.location}`,
      `🎫 Ref: ${ticketRef}`,
      `🔢 Barcode: ${ticketBarcode}`,
      `🚘 ${activeVehicle.plate} — ${activeVehicle.model}`,
      `🅿️  Spot: ${bookingData.selectedParkingSlot?.label || 'Auto-Assigned'}`,
      `🕐 ${bookingData.selectedSlot}  📅 ${bookingData.date}`,
    ].join('\n');

    if (navigator.share) {
      try { await navigator.share({ title: 'PakiPark E-Pass', text, url: window.location.href }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Ticket details copied to clipboard!');
    }
  }, [ticketRef, ticketBarcode, bookingData, activeVehicle]);

  // ── Confirm & pay (creates the booking) ───────────────────────────────────
  const handleConfirmPay = useCallback(async () => {
    // ── Pre-flight validation ─────────────────────────────────────────────
    if (!activeVehicle._id) {
      toast.error(
        'Vehicle not linked to an account. Please save your vehicle in Profile → My Vehicles first.',
        { duration: 6000 }
      );
      return;
    }
    if (!bookingData.locationId || bookingData.locationId === 'loc1') {
      toast.error('Invalid parking location. Please go back and select a location again.', { duration: 5000 });
      return;
    }
    if (!bookingData.selectedSlot) {
      toast.error('Please select a time slot first.');
      return;
    }

    // ── Credit/Debit card-specific validation ─────────────────────────────
    if (isCardPayment) {
      const digits = cardData.number.replace(/\D/g, '');
      const okLens = cardInfo?.lengths ?? [13, 14, 15, 16, 19];
      if (!okLens.includes(digits.length)) {
        toast.error(`Card number must be ${okLens.join(' or ')} digits for ${cardInfo?.label ?? 'this card type'}.`);
        return;
      }
      if (!luhnCheck(digits)) {
        toast.error('Card number is invalid. Please double-check the number entered.');
        return;
      }
      if (!cardData.name.trim()) {
        toast.error('Please enter the cardholder name.');
        return;
      }
      const [mm, yy] = cardData.expiry.split('/');
      const expMonth = parseInt(mm || '0', 10);
      const expYear  = 2000 + parseInt(yy || '0', 10);
      const now = new Date();
      if (!mm || !yy || mm.length < 2 || yy.length < 2 || expMonth < 1 || expMonth > 12
        || expYear < now.getFullYear()
        || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
        toast.error('Card has expired or the expiry date is invalid.');
        return;
      }
      const cvvLen = cardInfo?.cvvLen ?? 3;
      if (cardData.cvv.replace(/\D/g, '').length < cvvLen) {
        toast.error(`CVV must be ${cvvLen} digits for ${cardInfo?.label ?? 'this card type'}.`);
        return;
      }
    }

    setIsConfirming(true);
    try {
      const result = await bookingService.createBooking({
        vehicleId:     activeVehicle._id,
        locationId:    bookingData.locationId,
        spot:          bookingData.selectedParkingSlot?.label || 'Auto-Assigned',
        date:          bookingData.date,
        timeSlot:      bookingData.selectedSlot,
        amount:        HOURLY_RATE,
        paymentMethod: bookingData.paymentMethod,
        ...(bookingData.selectedParkingSlot ? { parkingSlotId: bookingData.selectedParkingSlot._id } : {}),
      } as any);

      // Use the real reference & barcode from the server (PKP-XXXXXXXX / PKPXXXXXXXX)
      const realRef     = result.reference || ticketRef;
      const realBarcode = (result as any).barcode || refToBarcode(realRef);
      setTicketRef(realRef);
      setTicketBarcode(realBarcode);
      toast.success('Booking confirmed! 🎉');
      setIsConfirming(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setIsConfirming(false);
      const msg = err?.message || 'Booking failed. Please try again.';
      toast.error(msg, { duration: 7000 });
      // Do NOT show the success modal — the booking was not created
    }
  }, [activeVehicle, bookingData, ticketRef, isCardPayment, cardData, cardInfo]);

  // ── Steps ──────────────────────────────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: 'timeslot',     label: 'Time Slot' },
    { key: 'confirmation', label: 'Confirm'   },
    { key: 'payment',      label: 'Payment'   },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === currentStep);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-gray-800">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-5 lg:px-8 py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customer/home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="size-5" />
          </button>
          <img src={logo} alt="PakiPark" className="h-6 lg:h-7 w-auto" />
        </div>

        {/* Step indicator */}
        <nav className="hidden lg:flex items-center gap-4">
          {steps.map((step, i) => {
            const isActive = currentStep === step.key;
            const isDone   = i < currentStepIdx;
            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isActive ? 'bg-[#ee6b20] text-white shadow-md' : isDone ? 'bg-[#1e3d5a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {isDone ? <CheckCircle className="size-4" /> : i + 1}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest
                  ${isActive ? 'text-[#1e3d5a]' : isDone ? 'text-[#1e3d5a]/50' : 'text-gray-300'}`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-5 h-[1px] transition-colors ${isDone ? 'bg-[#1e3d5a]/30' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-2 rounded-2xl max-w-[200px]">
          <MapPin className="size-3.5 text-[#ee6b20] shrink-0" />
          <span className="text-xs font-bold text-[#1e3d5a] truncate">{bookingData.location}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 lg:p-8">

        {/* ══ STEP 1: TIME SLOT ═══════════════════════════════════════════════ */}
        {currentStep === 'timeslot' && (
          <div className="w-full max-w-7xl mx-auto px-4 lg:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start min-h-[70vh]">
              <div className="lg:col-span-5 space-y-7 pt-6 lg:pt-10">
                <h2 className="text-4xl lg:text-6xl font-bold text-[#1e3d5a] leading-tight">
                  Reserve your <span className="text-[#ee6b20]">1-hour</span><br />parking slot.
                </h2>
                <div className="flex items-center gap-3 bg-white w-fit px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <Car className="text-[#ee6b20] size-5" />
                  <span className="text-sm font-bold text-[#1e3d5a]">{activeVehicle.plate} — {activeVehicle.model}</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: <Clock className="size-4"/>,         text: 'Reserve a specific 1-hour time slot'       },
                    { icon: <LayoutGrid className="size-4"/>,    text: 'Pick preferred floor — we assign your spot'              },
                    { icon: <AlertTriangle className="size-4"/>, text: 'No-show? Reservation auto-voided'          },
                    { icon: <Timer className="size-4"/>,         text: 'Stay longer? Charged by actual time used'  },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-[#ee6b20]">{item.icon}</span>
                      <span className="text-sm text-gray-600 font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 p-7 lg:p-10">
                  <form onSubmit={(e) => { e.preventDefault(); if (bookingData.selectedSlot) handleOpenFloorModal(); }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Date</label>
                      <Input
                        type="date"
                        value={bookingData.date}
                        min={todayStr()}
                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value, selectedSlot: '' })}
                        required
                        className="h-14 bg-gray-50 border-none rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose 1-Hour Slot</label>
                        {bookingData.date === todayStr() && (
                          <span className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold">
                            <span className="size-1.5 bg-amber-500 rounded-full animate-pulse block" />
                            Real-time · past slots disabled
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                        {timeSlots.map((slot) => {
                          const past       = isSlotExpired(slot, bookingData.date, currentMinutes);
                          const isSelected = bookingData.selectedSlot === slot;
                          return (
                            <button
                              type="button" key={slot} disabled={past}
                              onClick={() => !past && setBookingData({ ...bookingData, selectedSlot: slot })}
                              title={past ? 'This time slot has already passed' : ''}
                              className={[
                                'relative p-3 rounded-xl border-2 text-sm font-bold transition-all',
                                past
                                  ? 'border-gray-100 bg-gray-50/60 text-gray-300 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-[#ee6b20] bg-orange-50 text-[#ee6b20] shadow-md'
                                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-[#ee6b20]/40 hover:bg-orange-50/30',
                              ].join(' ')}
                            >
                              <Clock className={`size-4 mx-auto mb-1 ${past ? 'text-gray-200' : isSelected ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
                              <span className={past ? 'line-through' : ''}>{slot}</span>
                              {past && (
                                <span className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-bold text-gray-300 uppercase tracking-widest">
                                  Passed
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button type="submit" disabled={!bookingData.selectedSlot}
                      className="w-full bg-[#ee6b20] hover:bg-[#d95a10] h-14 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                      Next: Choose Parking Mode
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ FLOOR PREFERENCE MODAL ══════════════════════════════════════════ */}
        {showFloorModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">

              {/* Header */}
              <div className="text-center mb-6">
                <div className="size-16 bg-[#ee6b20]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isLoadingFloors
                    ? <Loader2 className="size-8 text-[#ee6b20] animate-spin" />
                    : <MapPin className="size-8 text-[#ee6b20]" />
                  }
                </div>
                <h3 className="text-2xl font-bold text-[#1e3d5a]">
                  {isLoadingFloors ? 'Loading available slots…' : 'Preferred Floor?'}
                </h3>
                {!isLoadingFloors && (
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                    We'll assign you the best available spot on your chosen floor. Or skip to let us decide.
                  </p>
                )}
              </div>

              {/* Booking summary pill */}
              <div className="bg-[#f4f7fa] rounded-2xl p-3 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1e3d5a]">
                  <Clock className="size-3.5 text-[#ee6b20]" />
                  {bookingData.selectedSlot}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1e3d5a]">
                  <Car className="size-3.5 text-[#1e3d5a]" />
                  {activeVehicle.plate}
                </div>
              </div>

              {!isLoadingFloors && (
                <>
                  {/* Floor buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {availableFloors.map(floor => (
                      <button
                        key={floor}
                        type="button"
                        onClick={() => handleFloorConfirm(floor)}
                        className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-[#ee6b20] hover:bg-orange-50 hover:text-[#ee6b20] text-[#1e3d5a] transition-all group"
                      >
                        <LayoutGrid className="size-6 mb-2 text-gray-300 group-hover:text-[#ee6b20] transition-colors" />
                        <span className="text-sm font-bold">Floor {floor}</span>
                        <span className="text-[10px] text-gray-400 group-hover:text-[#ee6b20]/70 font-medium mt-0.5">
                          {allSlots.filter(s => s.floor === floor && s.status === 'available').length} available
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* No preference button */}
                  <button
                    type="button"
                    onClick={() => handleFloorConfirm(null)}
                    className="w-full h-14 rounded-2xl border-2 border-[#1e3d5a] bg-[#1e3d5a] text-white font-bold text-sm hover:bg-[#2a5373] transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="size-4" />
                    No Preference — Auto-Assign Best Spot
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFloorModal(false)}
                    className="w-full mt-3 text-xs font-bold text-gray-400 hover:text-[#1e3d5a] transition-colors py-2"
                  >
                    ← Go Back
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3: CONFIRMATION — E-Pass preview (no barcode/ref yet) ════════ */}
        {currentStep === 'confirmation' && (
          <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-[0.97] duration-400">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

              {/* Left: policies only */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-[#1e3d5a] leading-tight">
                    Your E-Pass<br /><span className="text-[#ee6b20]">is Ready.</span>
                  </h2>
                  <p className="text-gray-500 mt-3 leading-relaxed">
                    Review your booking details, then proceed to payment to confirm your reservation.
                  </p>
                </div>

                {/* Policies */}
                <div className="space-y-3">
                  <div className="bg-orange-50 border border-orange-100 p-5 rounded-[1.5rem] flex items-start gap-4">
                    <div className="size-9 bg-[#ee6b20] rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="size-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1e3d5a] text-xs uppercase tracking-wider mb-1">Upon Arrival</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Show your <span className="font-bold text-[#ee6b20]">barcode</span> to the teller at the gate.
                        {bookingData.selectedParkingSlot
                          ? <> Proceed to spot <span className="font-bold text-[#1e3d5a]">{bookingData.selectedParkingSlot.label}</span>.</>
                          : <> Your spot will be <span className="font-bold text-[#ee6b20]">auto-assigned</span> upon check-in.</>
                        }
                      </p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-5 rounded-[1.5rem] flex items-start gap-4">
                    <div className="size-9 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                      <AlertTriangle className="size-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1e3d5a] text-xs uppercase tracking-wider mb-1">No-Show Policy</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Failure to arrive will <span className="font-bold text-amber-600">automatically void</span> the reservation after 30 minutes.
                      </p>
                    </div>
                  </div>

                  {/* Cancellation & Refund Policy */}
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-[1.5rem]">
                    <h4 className="font-bold text-[#1e3d5a] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Lock className="size-3.5 text-blue-500" /> Cancellation &amp; Refund Policy
                    </h4>
                    <div className="space-y-2">
                      {([
                        { icon: <CheckCircle className="size-3.5 text-green-600 shrink-0" />, text: 'Cancel ≥ 30 min before slot', badge: '100% Refund', badgeCls: 'bg-green-100 text-green-700' },
                        { icon: <Clock       className="size-3.5 text-amber-500 shrink-0" />, text: 'Cancel < 30 min before slot', badge: '50% Refund',  badgeCls: 'bg-amber-100 text-amber-700' },
                        { icon: <AlertTriangle className="size-3.5 text-red-500 shrink-0" />, text: 'No-show (past grace period)', badge: 'No Refund',   badgeCls: 'bg-red-100 text-red-600'    },
                      ] as const).map((row, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-gray-600">{row.icon}{row.text}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${row.badgeCls}`}>{row.badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button variant="ghost" onClick={() => { setCurrentStep('timeslot'); }} className="w-full h-12 text-gray-400 hover:text-[#1e3d5a] font-bold">
                  <ArrowLeft className="mr-2 size-4" /> Change Time Slot
                </Button>
              </div>

              {/* Right: E-Pass ticket — details only, no barcode/ref */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-2xl overflow-hidden max-w-[460px] mx-auto">
                  {/* Header */}
                  <div className="bg-[#1e3d5a] px-8 py-6 text-white">
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em] mb-1">PakiPark E-Pass</p>
                    <p className="text-2xl font-bold text-[#ee6b20]">1-Hour Reservation</p>
                  </div>

                  {/* Body */}
                  <div className="px-8 pt-7 pb-8 space-y-5 relative">
                    <div className="absolute -left-4 top-0 -translate-y-1/2 size-8 bg-[#f8fafc] rounded-full border border-gray-200" />
                    <div className="absolute -right-4 top-0 -translate-y-1/2 size-8 bg-[#f8fafc] rounded-full border border-gray-200" />

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                      <div className="col-span-2">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                        <p className="font-bold text-[#1e3d5a] text-lg leading-tight">{bookingData.location}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Customer</p>
                        <p className="font-bold text-[#1e3d5a] truncate">{userData.name || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Plate Number</p>
                        <p className="font-bold text-[#ee6b20]">{activeVehicle.plate}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vehicle</p>
                        <p className="font-bold text-[#1e3d5a]">{activeVehicle.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Time Slot</p>
                        <p className="font-bold text-[#1e3d5a]">{bookingData.selectedSlot}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Parking Spot</p>
                        <p className="font-bold text-[#ee6b20] text-xl">{bookingData.selectedParkingSlot?.label || 'Auto'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                        <p className="font-bold text-[#1e3d5a]">{bookingData.date}</p>
                      </div>
                    </div>

                    {/* Barcode placeholder — revealed after payment */}
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2.5 py-5 px-4">
                      <div className="flex items-end gap-[2px]">
                        {[3,2,4,2,3,2,4,3,2,3,4,2,3,2,4,3,2,4,2,3,2,4,3,2,4,2,3,2,4,3].map((h, i) => (
                          <div
                            key={i}
                            className="bg-gray-200 rounded-sm"
                            style={{ width: i % 4 === 0 ? 3 : 2, height: h * 9 }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        Barcode issued after payment
                      </p>
                    </div>

                    {/* Proceed to Payment */}
                    <Button
                      onClick={() => setCurrentStep('payment')}
                      className="w-full bg-[#1e3d5a] hover:bg-[#152b40] h-14 rounded-2xl text-white font-bold text-base uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                    >
                      Proceed to Payment <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4: PAYMENT ═════════════════════════════════════════════════ */}
        {currentStep === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto animate-in fade-in duration-400">
            {/* Summary */}
            <div className="lg:col-span-4 bg-[#1e3d5a] rounded-3xl p-8 text-white space-y-6 shadow-xl">
              <div>
                <h3 className="text-xl font-bold">Reservation Summary</h3>
                <p className="text-white/40 text-xs mt-1 font-mono">{ticketRef}</p>
              </div>
              <div className="space-y-3 text-sm opacity-80">
                {[
                  ['Vehicle',   activeVehicle.plate],
                  ['Time Slot', bookingData.selectedSlot],
                  ['Duration',  '1 hour'],
                  ['Rate',      `₱${HOURLY_RATE}.00/hr`],
                ].map(([l,v]) => (
                  <div key={l} className="flex justify-between"><span>{l}</span><span className="font-bold">{v}</span></div>
                ))}
                <div className="flex justify-between">
                  <span>Spot</span>
                  <span className="font-bold text-[#ee6b20]">{bookingData.selectedParkingSlot?.label || 'Auto-Assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-bold max-w-[130px] text-right truncate">{bookingData.location}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase opacity-50">Total</span>
                <span className="text-4xl font-bold text-[#ee6b20]">₱{HOURLY_RATE}</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-xs leading-relaxed opacity-80">
                <strong className="text-[#ee6b20]">Note:</strong> Additional ₱{HOURLY_RATE}/hr for overtime.
              </div>
            </div>

            {/* Payment selector */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-8 lg:p-10 shadow-sm space-y-8">
              <div>
                <h3 className="font-bold text-2xl text-[#1e3d5a]">Choose Payment Method</h3>
                <p className="text-gray-400 text-sm mt-1">Select how you'll settle the ₱{HOURLY_RATE} reservation fee.</p>
              </div>

              {/* Method toggle buttons */}
              <div className="grid grid-cols-3 gap-4">
                {PAYMENT_METHODS.map(({ key, label, Icon, hint }) => {
                  const sel = bookingData.paymentMethod === key;
                  return (
                    <button key={key} onClick={() => setBookingData({ ...bookingData, paymentMethod: key })}
                      className={[
                        'p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all text-center',
                        sel ? 'border-[#ee6b20] bg-orange-50 shadow-md shadow-orange-100' : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100',
                      ].join(' ')}>
                      <Icon className={`size-7 ${sel ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-bold text-sm leading-tight ${sel ? 'text-[#ee6b20]' : 'text-gray-700'}`}>{label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{hint}</p>
                      </div>
                      {sel && <div className="size-5 bg-[#ee6b20] rounded-full flex items-center justify-center"><CheckCircle className="size-3 text-white" /></div>}
                    </button>
                  );
                })}
              </div>

              {/* ── Credit / Debit Card form ─────────────────────────────── */}
              {isCardPayment && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">

                  {/* 3-D flip card preview */}
                  <div className="flex justify-center select-none">
                    <div style={{ perspective: '1000px', width: 340, height: 210 }}>
                      <div style={{
                        width: '100%', height: '100%', position: 'relative',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                        transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}>

                        {/* ── CARD FRONT ── */}
                        <div style={{
                          position:'absolute', inset:0, backfaceVisibility:'hidden',
                          borderRadius:16,
                          background: cardInfo?.gradient ?? 'linear-gradient(135deg,#1e3d5a 0%,#2d5a8a 100%)',
                          padding:'22px 26px',
                          boxShadow:'0 20px 60px rgba(0,0,0,0.35)',
                          display:'flex', flexDirection:'column', justifyContent:'space-between',
                          color:'#fff', overflow:'hidden',
                        }}>
                          {/* Decorative circles */}
                          <div style={{ position:'absolute',top:-50,right:-50,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,0.06)' }} />
                          <div style={{ position:'absolute',bottom:-70,left:-40,width:240,height:240,borderRadius:'50%',background:'rgba(255,255,255,0.04)' }} />

                          {/* Top: chip + brand */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
                            {/* EMV chip */}
                            <svg width="42" height="32" viewBox="0 0 42 32">
                              <rect width="42" height="32" rx="5" fill="#d4a843"/>
                              <line x1="14" y1="0" x2="14" y2="32" stroke="#b8902e" strokeWidth="1"/>
                              <line x1="28" y1="0" x2="28" y2="32" stroke="#b8902e" strokeWidth="1"/>
                              <line x1="0" y1="11" x2="42" y2="11" stroke="#b8902e" strokeWidth="1"/>
                              <line x1="0" y1="21" x2="42" y2="21" stroke="#b8902e" strokeWidth="1"/>
                              <rect x="14" y="11" width="14" height="10" fill="none" stroke="#b8902e" strokeWidth="0.5"/>
                            </svg>
                            <div style={{ position:'relative' }}>
                              <CardBadge info={cardInfo} />
                            </div>
                          </div>

                          {/* Card number */}
                          <div style={{ fontFamily:'monospace', fontSize:20, letterSpacing:3, position:'relative', userSelect:'none' }}>
                            {cardData.number
                              ? cardData.number
                              : (cardInfo?.format ?? [4,4,4,4]).map(len => '●'.repeat(len)).join('  ')
                            }
                          </div>

                          {/* Bottom: holder + expiry */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', position:'relative' }}>
                            <div>
                              <div style={{ fontSize:8, opacity:0.55, letterSpacing:2, marginBottom:3, textTransform:'uppercase' }}>Card Holder</div>
                              <div style={{ fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', maxWidth:190, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {cardData.name || 'FULL NAME'}
                              </div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <div style={{ fontSize:8, opacity:0.55, letterSpacing:2, marginBottom:3, textTransform:'uppercase' }}>Expires</div>
                              <div style={{ fontSize:13, fontWeight:700, letterSpacing:1 }}>{cardData.expiry || 'MM/YY'}</div>
                            </div>
                          </div>
                        </div>

                        {/* ── CARD BACK ── */}
                        <div style={{
                          position:'absolute', inset:0, backfaceVisibility:'hidden',
                          transform:'rotateY(180deg)',
                          borderRadius:16,
                          background: cardInfo?.gradient ?? 'linear-gradient(135deg,#1e3d5a 0%,#2d5a8a 100%)',
                          boxShadow:'0 20px 60px rgba(0,0,0,0.35)',
                          overflow:'hidden',
                        }}>
                          {/* Magnetic stripe */}
                          <div style={{ background:'#111', height:44, marginTop:30, width:'100%' }} />
                          {/* Signature strip + CVV */}
                          <div style={{ padding:'14px 22px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ flex:1, background:'repeating-linear-gradient(90deg,#e8dcc8,#e8dcc8 4px,#d4c4a0 4px,#d4c4a0 8px)', height:36, borderRadius:4 }} />
                            <div style={{ background:'#fff', padding:'4px 12px', borderRadius:4, minWidth:58, textAlign:'center' }}>
                              <div style={{ fontSize:7, color:'#888', marginBottom:2, letterSpacing:1 }}>CVV</div>
                              <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:16, letterSpacing:4, color:'#1a1a1a' }}>
                                {cardData.cvv ? '•'.repeat(cardData.cvv.length) : (cardInfo?.cvvLen === 4 ? '••••' : '•••')}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin:'4px 22px 0', color:'rgba(255,255,255,0.3)', fontSize:8, lineHeight:1.6 }}>
                            This card is for demonstration. PakiPark uses 256-bit SSL encryption to protect your payment details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">

                    {/* Card number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card Number</label>
                      <div className="relative">
                        <Input
                          value={cardData.number}
                          onChange={e => handleCardNumberChange(e.target.value)}
                          onFocus={() => setCardFlipped(false)}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          className="h-14 bg-gray-50 border-gray-200 rounded-xl pr-40 font-mono tracking-widest"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {cardInfo ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
                              style={{ background: cardInfo.gradient }}>
                              {cardInfo.label}
                              {luhnCheck(cardData.number.replace(/\D/g,'')) && cardData.number.replace(/\D/g,'').length >= 13 && (
                                <CheckCircle className="size-3" />
                              )}
                            </span>
                          ) : (
                            <CreditCard className="size-5 text-gray-300" />
                          )}
                        </div>
                      </div>
                      {/* Inline hints */}
                      {cardData.number && !cardInfo && (
                        <p className="text-[10px] text-gray-400 ml-1">Keep typing — card network will be detected automatically.</p>
                      )}
                      {cardInfo && cardData.number.replace(/\D/g,'').length >= 8 && !luhnCheck(cardData.number.replace(/\D/g,'')) && (
                        <p className="text-[10px] text-red-400 ml-1 flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Invalid card number
                        </p>
                      )}
                      {cardInfo && luhnCheck(cardData.number.replace(/\D/g,'')) && cardInfo.lengths.includes(cardData.number.replace(/\D/g,'').length) && (
                        <p className="text-[10px] text-emerald-500 ml-1 flex items-center gap-1">
                          <CheckCircle className="size-3" /> Valid {cardInfo.label} card number
                        </p>
                      )}
                    </div>

                    {/* Cardholder name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cardholder Name</label>
                      <Input
                        value={cardData.name}
                        onChange={e => setCardData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                        onFocus={() => setCardFlipped(false)}
                        placeholder="AS PRINTED ON CARD"
                        className="h-14 bg-gray-50 border-gray-200 rounded-xl uppercase tracking-widest"
                      />
                    </div>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expiry Date</label>
                        <Input
                          value={cardData.expiry}
                          onChange={e => handleExpiryChange(e.target.value)}
                          onFocus={() => setCardFlipped(false)}
                          placeholder="MM/YY"
                          maxLength={5}
                          inputMode="numeric"
                          className="h-14 bg-gray-50 border-gray-200 rounded-xl font-mono tracking-widest"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          CVV
                          {cardInfo?.cvvLen === 4 && <span className="text-blue-400 normal-case font-normal">(4-digit Amex)</span>}
                        </label>
                        <div className="relative">
                          <Input
                            value={cardData.cvv}
                            onChange={e => setCardData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g,'').slice(0, cardInfo?.cvvLen ?? 4) }))}
                            onFocus={() => setCardFlipped(true)}
                            onBlur={() => setCardFlipped(false)}
                            type={showCvv ? 'text' : 'password'}
                            placeholder={cardInfo?.cvvLen === 4 ? '••••' : '•••'}
                            maxLength={cardInfo?.cvvLen ?? 4}
                            inputMode="numeric"
                            className="h-14 bg-gray-50 border-gray-200 rounded-xl pr-12 font-mono tracking-widest"
                          />
                          <button type="button" onClick={() => setShowCvv(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showCvv ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Security note */}
                    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      <Lock className="size-4 text-gray-400 shrink-0" />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Your card details are encrypted in transit and never stored on PakiPark servers. 256-bit SSL secured.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button variant="outline" onClick={() => setCurrentStep('confirmation')} className="h-14 px-8 rounded-xl font-bold">
                  <ArrowLeft className="size-4 mr-2" /> Back
                </Button>
                <Button onClick={handleConfirmPay} disabled={isConfirming}
                  className="flex-1 bg-[#ee6b20] hover:bg-[#d95a10] h-14 rounded-xl text-white font-bold text-base uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5">
                  {isConfirming
                    ? <span className="flex items-center gap-2"><Loader2 className="size-5 animate-spin" /> Processing…</span>
                    : `Confirm & Pay ₱${HOURLY_RATE}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══ SUCCESS MODAL ══════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-[#1e3d5a]/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm flex flex-col items-center px-8 py-10 rounded-[2rem] border border-gray-100 shadow-2xl text-center">
            <div className="size-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="size-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1e3d5a] mb-1">Booking Confirmed!</h2>
            <p className="text-xs text-gray-400 mb-5">Your E-Pass barcode has been issued.</p>

            {/* Real barcode + reference — first reveal after payment */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4 space-y-2">
              <BarcodeDisplay
                ref={barcodeRef}
                value={ticketBarcode}
                height={48}
                lineColor="#1e3d5a"
                background="#f9fafb"
              />
              <p className="text-[13px] font-mono font-bold text-[#ee6b20] tracking-[0.2em]">{ticketRef}</p>
              <p className="text-[9px] font-mono text-gray-400 tracking-[0.12em]">{ticketBarcode}</p>
            </div>

            <div className="text-gray-500 text-xs leading-relaxed px-1 mb-5 space-y-0.5">
              <p>Spot <span className="font-bold text-gray-800">{bookingData.selectedParkingSlot?.label || 'Auto-Assigned'}</span> · <span className="font-bold text-gray-800">{activeVehicle.plate}</span></p>
              <p>{bookingData.location} · {bookingData.selectedSlot}</p>
              <p className="text-[#ee6b20] font-bold">{bookingData.paymentMethod}</p>
            </div>

            {/* Share + Download — only available after payment */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleShare}
                  className="h-11 rounded-xl font-bold border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-700 hover:border-[#1e3d5a] hover:text-[#1e3d5a] transition-all group">
                  <Share2 className="size-4 transition-transform group-hover:scale-110" /> Share
                </button>
                <button onClick={handleDownloadImage} disabled={isDownloading}
                  className="h-11 rounded-xl font-bold border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-700 hover:border-[#1e3d5a] hover:text-[#1e3d5a] transition-all group disabled:opacity-60 disabled:cursor-not-allowed">
                  {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4 transition-transform group-hover:-translate-y-0.5" />}
                  {isDownloading ? 'Saving…' : 'Download'}
                </button>
              </div>
              <Button onClick={() => navigate('/customer/home')}
                className="w-full h-11 bg-[#ee6b20] hover:bg-[#d95a10] text-white font-bold rounded-xl shadow-md">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
