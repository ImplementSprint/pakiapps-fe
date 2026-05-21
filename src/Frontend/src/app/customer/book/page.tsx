/* stylelint-disable */
// @ts-nocheck
'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Clock, MapPin,
  Car, Loader2, Sparkles, CalendarDays, Download, User, Share,
  CreditCard, Smartphone, ChevronDown, CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Barcode from 'react-barcode';
import { toPng } from 'html-to-image';

import { bookingService } from '@/services/bookingService';
import { parkingSlotService, ParkingSlot } from '@/services/parkingSlotService';
import { vehiclesService } from '@/services/vehiclesService';
import { paymentMethodService, PaymentMethod } from '@/services/paymentMethodService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h <= 22; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`);
  }
  return slots;
}
function todayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// nosonar
function BookParkingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const locationId = searchParams.get('locationId');
  const locationName = searchParams.get('locationName') || 'Parking Location';
  const queryVehicleId = searchParams.get('vehicleId');
  const HOURLY_RATE = Number(searchParams.get('hourlyRate')) || 50;

  const [activeVehicle, setActiveVehicle] = useState<any>({ _id: '', plate: '---', model: 'No Vehicle', type: 'Sedan' });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    // Real-time ticking clock every 10 seconds for slot pruning
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const [allVehicles, setAllVehicles] = useState<any[]>([]);

  useEffect(() => {
    vehiclesService.getMyVehicles().then(v => {
      const formatted = v.map((x: any) => ({
        _id:   x._id || x.id,
        plate: x.plateNumber,
        model: `${x.brand} ${x.model}`.trim(),
        type:  x.type,
      }));
      setAllVehicles(formatted);
      const target = formatted.find((x: any) => x._id === queryVehicleId) || formatted[0];
      if (target) setActiveVehicle(target);
    }).catch(() => {});
  }, [queryVehicleId]);

  const [currentStep, setCurrentStep] = useState<'timeslot' | 'review' | 'payment' | 'receipt' | 'payment-failed'>('timeslot');
  const [isConfirming, setIsConfirming] = useState(false);

  const [showFloorModal, setShowFloorModal] = useState(false);
  const [availableFloors, setAvailableFloors] = useState<number[]>([1, 2, 3]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [allSlots, setAllSlots] = useState<ParkingSlot[]>([]);

  const [bookingData, setBookingData] = useState({
    date: todayStr(),
    selectedSlot: '',
    selectedParkingSlot: null as ParkingSlot | null,
    paymentMethod: 'GCash',
    savedPaymentMethodId: null as number | null,
  });

  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    paymentMethodService.getAll().then((methods: PaymentMethod[]) => {
      setSavedMethods(methods);
      const def = methods.find((m: any) => m.isDefault);
      if (def) {
        setBookingData(prev => ({
          ...prev,
          paymentMethod: 'gcash_linked',
          savedPaymentMethodId: def.id
        }));
      }
    });
  }, []);

  const [customerName, setCustomerName] = useState('Guest User');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userName');
      if (stored) setCustomerName(stored);
    }
  }, []);

  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [loadedBooking, setLoadedBooking] = useState<any>(null);

  useEffect(() => {
    const ref = searchParams.get('reference');
    const step = searchParams.get('step');
    if (step === 'receipt' && ref) {
      setIsReceiptLoading(true);
      bookingService.getMyBookings({ search: ref })
        .then(res => {
          if (res.bookings && res.bookings.length > 0) {
            const b = res.bookings[0];
            setTicketRef(b.reference);
            setBookingData({
              date: b.date,
              selectedSlot: b.timeSlot,
              selectedParkingSlot: { label: b.spot, floor: b.floor || 1 } as any,
              paymentMethod: b.paymentMethod,
              savedPaymentMethodId: null
            });
            setActiveVehicle({
              _id: '',
              plate: b.vehiclePlate || '---',
              model: b.vehicleModel || 'Vehicle',
              type: b.vehicleType || 'Sedan'
            });
            if (b.userId?.name) {
              setCustomerName(b.userId.name);
            } else if (b.userName) {
              setCustomerName(b.userName);
            }
            setLoadedBooking(b);
            setCurrentStep('receipt');
          } else {
            toast.error('Booking details not found.');
          }
        })
        .catch(err => {
          toast.error('Failed to load booking details.');
        })
        .finally(() => {
          setIsReceiptLoading(false);
        });
    } else if (step === 'payment-failed' && ref) {
      setIsReceiptLoading(true);
      bookingService.getMyBookings({ search: ref })
        .then(res => {
          if (res.bookings && res.bookings.length > 0) {
            const b = res.bookings[0];
            const bookingId = b._id || b.id;
            // Un-reserve the slot since payment failed or was aborted!
            if (b.status === 'upcoming' && bookingId) {
              bookingService.cancelBooking(String(bookingId), 'Payment declined or aborted').catch(() => {});
            }
            setCurrentStep('payment-failed');
          }
        })
        .finally(() => setIsReceiptLoading(false));
    }
  }, [searchParams]);

  const handleDownloadImage = () => {
    const node = document.getElementById('epass-card');
    if (!node) return toast.error('Ticket card not found on the page.');

    const loadingToast = toast.loading('Generating high-resolution ticket image...');

    // Wait a brief tick for barcodes/images to render completely
    setTimeout(() => {
      toPng(node, {
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: node.offsetWidth + 'px',
          height: node.offsetHeight + 'px',
        },
        pixelRatio: 2, // 2x resolution for ultra-sharp rendering
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `PakiPark-EPass-${ticketRef}.png`;
        link.href = dataUrl;
        link.click();
        toast.dismiss(loadingToast);
        toast.success('Ticket image downloaded successfully!');
      })
      .catch((error) => {
        console.error('Oops, something went wrong with image generation!', error);
        toast.dismiss(loadingToast);
        toast.error('Failed to generate ticket image. Please try again.');
      });
    }, 150);
  };

  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [focusedField, setFocusedField] = useState<'number' | 'name' | 'expiry' | 'cvv' | null>(null);
  const [cardError, setCardError] = useState('');
  const [cardErrorField, setCardErrorField] = useState<'number' | 'name' | 'expiry' | 'cvv' | ''>('');

  const getCardType = (num: string) => {
    const n = num.replace(/\D/g, '');
    if (!n) return null;
    if (n.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    if (/^6(?:011|5)/.test(n) || n.startsWith('6')) return 'Discover';
    if (/^3(?:0[0-5]|[68])/.test(n)) return 'Diners Club';
    if (n.startsWith('35')) return 'JCB';
    if (n.startsWith('62') || n.startsWith('81')) return 'UnionPay';
    return null;
  };

  const formatCardName = (name: string) => {
    if (!name) return 'YOUR NAME';
    if (name.length <= 18) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name.substring(0, 18);
    const lastName = parts.pop();
    let initials = '';
    for (const part of parts) {
        const letter = part.replace(/[^a-zA-Z]/g, '').charAt(0);
        if (letter) initials += letter;
    }
    return `${initials} ${lastName}`.substring(0, 18);
  };

  const [ticketRef, setTicketRef] = useState('PKP-XXXXXXXX');

  // Real-time precise slot filtering
  const timeSlots = useMemo(() => {
    const isToday = bookingData.date === todayStr();
    if (!isToday) return generateTimeSlots();
    
    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return generateTimeSlots().filter(s => {
      const [h, m] = s.split(' - ')[0].split(':').map(Number);
      return h * 60 + m >= nowMin; // If slot start is at least now
    });
  }, [bookingData.date, currentTime]);

  const handleOpenFloorModal = async () => {
    if (!bookingData.selectedSlot) return toast.error('Please select a time slot.');
    setIsLoadingFloors(true); setShowFloorModal(true);
    try {
      if (locationId) {
        const slots = await parkingSlotService.getAvailableSlots(locationId, bookingData.date, bookingData.selectedSlot);
        setAllSlots(slots);
        const floors = [...new Set(slots.filter(s => s.status === 'available').map(s => s.floor))].sort((a, b) => a - b);
        setAvailableFloors(floors.length > 0 ? floors : [1, 2, 3]);
      }
    } catch { setAvailableFloors([1,2,3]); setAllSlots([]); }
    finally { setIsLoadingFloors(false); }
  };

  const handleFloorConfirm = (floor: number | null) => {
    let assigned: ParkingSlot | null = allSlots.filter(s => s.status === 'available').find(s => floor === null || s.floor === floor) || null;
    assigned ??= allSlots.find(s => s.status === 'available') || null;
    setBookingData(prev => ({ ...prev, selectedParkingSlot: assigned }));
    setShowFloorModal(false);
    setCurrentStep('review');
  };

  // nosonar
  const handleConfirmPay = async () => {
    if (!activeVehicle._id) return toast.error('Vehicle required. Please save a vehicle in Profile first.');
    if (!locationId) return toast.error('Location ID is missing.');
    if (!bookingData.selectedSlot) return toast.error('Please select a time slot.');

    if (bookingData.paymentMethod === 'Credit/Debit Card') {
      const n = cardDetails.number.replace(/\D/g, '');
      if (n.length < 13 || n.length > 19) { setCardErrorField('number'); return setCardError('Invalid card length. Check your number.'); }
      
      // Luhn verification
      let sum = 0;
      let shouldDouble = false;
      for (let i = n.length - 1; i >= 0; i--) {
        let digit = Number.parseInt(n.charAt(i), 10);
        if (shouldDouble) {
          if ((digit *= 2) > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      if (sum % 10 !== 0) { setCardErrorField('number'); return setCardError('Card number is invalid or incorrect.'); }

      const type = getCardType(n);
      if (!type) { setCardErrorField('number'); return setCardError('Unsupported or unknown card type.'); }

      if (!cardDetails.name || cardDetails.name.trim().length < 3) { setCardErrorField('name'); return setCardError('Please enter the Card Holder name.'); }
      
      const [mm, yy] = cardDetails.expiry.split('/');
      if (!mm || !yy || mm.length !== 2 || yy.length !== 2) { setCardErrorField('expiry'); return setCardError('Invalid expiry form (MM/YY).'); }
      const expMonth = Number.parseInt(mm, 10);
      const expYear = Number.parseInt('20' + yy, 10);
      const now = new Date();
      if (expMonth < 1 || expMonth > 12) { setCardErrorField('expiry'); return setCardError('Invalid expiry month (1-12).'); }
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) { setCardErrorField('expiry'); return setCardError('This card has already expired.'); }
      if (cardDetails.cvv.length < 3) { setCardErrorField('cvv'); return setCardError('Invalid security code (CVV).'); }
      
      setCardError('');
      setCardErrorField('');
    }

    setIsConfirming(true);
    try {
      const result = await bookingService.createBooking({
        vehicleId: activeVehicle._id, locationId,
        spot: bookingData.selectedParkingSlot?.label || 'Auto-Assigned',
        date: bookingData.date, timeSlot: bookingData.selectedSlot,
        amount: HOURLY_RATE, paymentMethod: bookingData.paymentMethod,
        savedPaymentMethodId: bookingData.savedPaymentMethodId,
        ...(bookingData.selectedParkingSlot ? { parkingSlotId: bookingData.selectedParkingSlot._id || bookingData.selectedParkingSlot.id } : {}),
      } as any);

      if ((result as any).checkoutUrl) {
        toast.success('Redirecting to PayMongo payment gateway...');
        window.location.href = (result as any).checkoutUrl;
        return;
      }

      setTicketRef(result.reference || 'PKP-XXXXXXXX');
      setIsConfirming(false);
      setCurrentStep('receipt');
    } catch (err: any) {
      setIsConfirming(false);
      toast.error(err?.message || 'Booking failed.');
    }
  };

  const isTimeslot = currentStep === 'timeslot';
  const isReview = currentStep === 'review';
  const isPayment = currentStep === 'payment';
  const isReceipt = currentStep === 'receipt';

  const step1Style = isTimeslot ? 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110' : 'bg-green-500 text-white';
  
  let step2Style = 'bg-gray-100 text-gray-400';
  if (isReview) step2Style = 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110';
  else if (isPayment || isReceipt) step2Style = 'bg-green-500 text-white';

  let step2Text = 'text-gray-300';
  if (isReview) step2Text = 'text-[#1e3d5a]';
  else if (isPayment || isReceipt) step2Text = 'text-green-600';

  let step3Style = 'bg-gray-100 text-gray-400';
  if (isPayment) step3Style = 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110';
  else if (isReceipt) step3Style = 'bg-green-500 text-white';

  let step3Text = 'text-gray-300';
  if (isPayment) step3Text = 'text-[#1e3d5a]';
  else if (isReceipt) step3Text = 'text-green-600';

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-5 h-16 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-6 w-auto" unoptimized />
        </div>
        <div className="flex items-center gap-2 bg-[#fbeade] border border-[#f5cdb2] px-3.5 py-1.5 rounded-full shrink-0">
          <MapPin className="size-3.5 text-[#ee6b20]" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#ee6b20]">{locationName}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 lg:p-8">
        
        {/* STEPPER */}
        <div className="flex items-center justify-center mb-10 mt-2">
          <div className="flex items-center gap-2 sm:gap-4">
               {/* 1 SCHEDULE */}
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${step1Style}`}><CheckCircle2 className="size-5" /></div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 text-green-600`}>Schedule</span>
               </div>
               <div className="w-8 sm:w-16 h-[3px] bg-gray-200 mx-1 rounded-full relative overflow-hidden">
                  <div className={`absolute left-0 top-0 h-full bg-[#ee6b20] transition-all duration-700 w-full`} />
               </div>
               
               {/* 2 CONFIRM */}
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${step2Style}`}>{isPayment || isReceipt ? <CheckCircle2 className="size-5" /> : '2'}</div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 ${step2Text}`}>Confirm</span>
               </div>
               <div className="w-8 sm:w-16 h-[3px] bg-gray-200 mx-1 rounded-full relative overflow-hidden">
                  <div className={`absolute left-0 top-0 h-full bg-[#ee6b20] transition-all duration-700 ${isPayment || isReceipt ? 'w-full' : 'w-0'}`} />
               </div>
               
               {/* 3 PAYMENT */}
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${step3Style}`}>{isReceipt ? <CheckCircle2 className="size-5" /> : '3'}</div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 ${step3Text}`}>Payment</span>
               </div>
          </div>
        </div>

        {currentStep === 'timeslot' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-[#1e3d5a] mb-6 flex items-center gap-2">
              <CalendarDays className="size-6 text-[#ee6b20]" />
              Choose Schedule
            </h2>

            <form onSubmit={e => { e.preventDefault(); handleOpenFloorModal(); }} className="space-y-8">

              {/* Vehicle Being Booked (read-only display) */}
              {activeVehicle._id && (
                <div className="flex items-center gap-4 bg-[#1e3d5a]/5 border border-[#1e3d5a]/10 rounded-2xl px-5 py-4">
                  <div className="size-11 bg-[#1e3d5a] text-white rounded-xl flex items-center justify-center shrink-0">
                    <Car className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Booking For</p>
                    <p className="text-[15px] font-black text-[#1e3d5a] truncate">{activeVehicle.model}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 tracking-wider">{activeVehicle.plate} · <span className="capitalize">{activeVehicle.type}</span></p>
                  </div>
                  <div className="size-2 rounded-full bg-[#ee6b20] shrink-0" />
                </div>
              )}

              {/* Date Selection */}
              <div className="space-y-3">
                <label htmlFor="targetDate" className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Date</label>
                <div className="relative">
                  <Input 
                    id="targetDate"
                    type="date" 
                    value={bookingData.date} 
                    min={todayStr()} 
                    onChange={e => setBookingData({ ...bookingData, date: e.target.value, selectedSlot: '' })} 
                    className="h-16 bg-gray-50 border-2 border-gray-100 rounded-2xl pl-12 text-lg font-black text-[#1e3d5a] focus-visible:ring-[#ee6b20] focus-visible:border-[#ee6b20]" 
                    required 
                  />
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                </div>
              </div>

              {/* Slot Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Available 1-Hour Time Slots</p>
                  <span className="text-[10px] font-bold text-[#ee6b20] bg-orange-50 px-2.5 py-1 rounded-md">{timeSlots.length} Slots</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1">
                  {timeSlots.map(slot => (
                    <button type="button" key={slot} onClick={() => setBookingData({ ...bookingData, selectedSlot: slot })}
                      className={`relative overflow-hidden h-16 rounded-2xl border-2 transition-all group ${
                        bookingData.selectedSlot === slot 
                        ? 'border-[#ee6b20] bg-orange-50/50 shadow-md transform scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5'
                      }`}
                    >
                      {bookingData.selectedSlot === slot && <div className="absolute top-0 left-0 w-1 h-full bg-[#ee6b20]" />}
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-[13px] font-black tabular-nums tracking-wide ${bookingData.selectedSlot === slot ? 'text-[#ee6b20]' : 'text-gray-600'}`}>
                          {slot.split(' - ')[0]}<span className="text-gray-400 px-1 font-medium">-</span>{slot.split(' - ')[1]}
                        </span>
                      </div>
                    </button>
                  ))}
                  {timeSlots.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <Clock className="size-10 text-gray-300 mb-3" />
                      <p className="font-bold text-gray-500">No more slots today</p>
                      <p className="text-xs text-gray-400 mt-1">Please select tomorrow's date</p>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={!bookingData.selectedSlot} 
                className="w-full h-16 bg-[#ee6b20] hover:bg-[#d95a10] text-lg font-black rounded-2xl shadow-xl shadow-orange-200 mt-4 transition-all">
                Proceed <ArrowLeft className="rotate-180 ml-2 size-5" />
              </Button>
            </form>
          </div>
        )}

        {/* Flooring & Confirmation Modals remain elegantly styled */}
        {showFloorModal && (
          <div className="fixed inset-0 z-50 bg-[#1e3d5a]/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 transform scale-100 transition-all">
              <div className="size-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {isLoadingFloors ? <Loader2 className="size-8 text-[#1e3d5a] animate-spin" /> : <MapPin className="size-8 text-[#1e3d5a]" />}
              </div>
              <h3 className="text-2xl font-black text-[#1e3d5a] mb-2 text-center">{isLoadingFloors ? 'Scanning Layout...' : 'Preferred Floor?'}</h3>
              <p className="text-center text-sm text-gray-500 mb-8">{isLoadingFloors ? 'Checking available inventory for this time slot.' : 'Choose where you want to park.'}</p>
              
              {!isLoadingFloors && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {availableFloors.map(floor => (
                      <button key={floor} type="button" onClick={() => handleFloorConfirm(floor)} 
                        className="py-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-[#ee6b20] hover:bg-orange-50 hover:text-[#ee6b20] font-black text-gray-600 transition-all hover:-translate-y-1">
                        L{floor}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => handleFloorConfirm(null)} 
                    className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-black text-white font-black flex items-center justify-center gap-2 transition-all hover:shadow-lg">
                    <Sparkles className="size-4" /> Auto-Assign Best Spot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-5xl mx-auto mt-2 px-0 sm:px-0">
            <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">

              {/* ── Left: Summary ─────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Title */}
                <div>
                  <h2 className="text-3xl font-black text-[#1e3d5a] tracking-tight leading-tight">
                    Final <span className="text-[#ee6b20]">Review</span>
                  </h2>
                  <p className="text-sm text-gray-400 font-medium mt-1">Check your details before confirming.</p>
                </div>

                {/* Details Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                  {/* Location row */}
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="size-11 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                      <MapPin className="size-5 text-[#ee6b20]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Parking Venue</p>
                      <p className="font-bold text-[#1e3d5a] truncate">{locationName}</p>
                    </div>
                  </div>

                  {/* Vehicle row */}
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="size-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Car className="size-5 text-[#1e3d5a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Vehicle</p>
                      <p className="font-bold text-[#1e3d5a]">{activeVehicle.plate}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full shrink-0">
                      {activeVehicle.type}
                    </span>
                  </div>

                  {/* Schedule row */}
                  <div className="flex items-center gap-4 px-6 py-4">
                    <div className="size-11 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                      <Clock className="size-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Date & Time</p>
                      <p className="font-bold text-[#1e3d5a]">{bookingData.date}</p>
                      <p className="text-sm text-gray-500 font-medium">{bookingData.selectedSlot}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 px-2.5 py-1 rounded-full shrink-0">
                      1 Hr
                    </span>
                  </div>

                  {/* Slot row */}
                  {bookingData.selectedParkingSlot && (
                    <div className="flex items-center gap-4 px-6 py-4">
                      <div className="size-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Sparkles className="size-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Assigned Slot</p>
                        <p className="font-bold text-[#1e3d5a]">Floor {bookingData.selectedParkingSlot.floor}</p>
                      </div>
                      <span className="text-sm font-black text-[#ee6b20] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full shrink-0">
                        {bookingData.selectedParkingSlot.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Policy */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5">
                  <h4 className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2 mb-3">
                    <ShieldCheck className="size-4 text-[#ee6b20]" /> Booking Policy
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-gray-500">
                    <li className="flex gap-2 items-start"><span className="text-[#ee6b20] mt-0.5">●</span>Grace period of 15 minutes for check-ins.</li>
                    <li className="flex gap-2 items-start"><span className="text-[#ee6b20] mt-0.5">●</span>Non-refundable if canceled within 2 hours of arrival.</li>
                    <li className="flex gap-2 items-start"><span className="text-[#ee6b20] mt-0.5">●</span>Present the E-Pass barcode to the attendant.</li>
                  </ul>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentStep('timeslot')}
                    className="h-14 px-7 bg-gray-100 hover:bg-gray-200 text-[#1e3d5a] font-black uppercase tracking-widest text-sm rounded-2xl transition-all shrink-0"
                  >
                    Back
                  </button>
                  <div className="flex-1 bg-[#1e3d5a] rounded-2xl p-1 flex items-center gap-1 shadow-xl">
                    <div className="flex-1 px-4">
                      <p className="text-[10px] font-black tracking-widest text-[#90b4d8] uppercase">Total to Pay</p>
                      <p className="text-2xl font-black text-white leading-tight">₱{HOURLY_RATE.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep('payment')}
                      className="h-12 px-6 bg-[#ee6b20] hover:bg-[#d95a10] text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all uppercase tracking-widest text-sm transform hover:scale-105 active:scale-95 shrink-0"
                    >
                      Confirm Now
                    </button>
                  </div>
                </div>

              </div>

              {/* ── Right: E-Pass Ticket Preview ───────────── */}
              <div className="flex justify-center lg:justify-start lg:sticky lg:top-24">
                <div className="w-full max-w-[340px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">

                  {/* Ticket Header */}
                  <div className="bg-gradient-to-br from-[#1e3d5a] to-[#162d42] p-7 text-white relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 size-28 bg-white/5 rounded-full" />
                    <div className="absolute -right-2 top-10 size-16 bg-white/5 rounded-full" />
                    <p className="text-[9px] uppercase tracking-[0.2em] font-black text-[#90b4d8] mb-2">PakiPark E-Pass · Preview</p>
                    <h3 className="text-2xl font-black text-[#ee6b20] mb-1">Fixed Slot</h3>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                      <MapPin className="size-3.5 shrink-0" /> {locationName}
                    </div>
                    <div className="absolute top-7 right-7 bg-white/10 p-2.5 rounded-xl">
                      <Car className="size-4" />
                    </div>
                  </div>

                  {/* Perforated Edge */}
                  <div className="relative h-4 bg-white">
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 size-7 bg-[#f4f7fa] rounded-full z-10" />
                    <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 size-7 bg-[#f4f7fa] rounded-full z-10" />
                    <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-gray-200" />
                  </div>

                  {/* Ticket Body */}
                  <div className="px-6 pb-4 pt-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Plate</p>
                        <p className="font-bold text-[#ee6b20] uppercase text-sm">{activeVehicle.plate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Date</p>
                        <p className="font-bold text-[#1e3d5a] text-sm">{bookingData.date}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Time</p>
                        <p className="font-bold text-[#1e3d5a] text-sm">{bookingData.selectedSlot.split(' - ')[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Floor</p>
                        <p className="font-bold text-[#1e3d5a] text-sm">{bookingData.selectedParkingSlot?.floor ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Slot</p>
                        <p className="font-bold text-[#ee6b20] text-sm">{bookingData.selectedParkingSlot?.label ?? 'Auto'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-0.5">Amount</p>
                        <p className="font-bold text-[#1e3d5a] text-sm">₱{HOURLY_RATE.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Blurred Barcode */}
                    <div className="mt-5 bg-gray-50 rounded-2xl py-5 flex flex-col items-center justify-center overflow-hidden">
                      <div className="blur-[5px] opacity-30 pointer-events-none select-none scale-90">
                        <Barcode value="PENDING" width={1.2} height={44} displayValue={false} background="transparent" />
                      </div>
                      <span className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#ee6b20] bg-orange-100 px-3 py-1 rounded-full">
                        Awaiting Payment
                      </span>
                    </div>
                  </div>

                  {/* Ticket Footer */}
                  <div className="mx-3 mb-3 bg-orange-50 border border-orange-100/80 rounded-2xl px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                      <p className="text-xs font-bold text-[#1e3d5a]">1 Hour</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</p>
                      <p className="text-xs font-bold text-amber-500">Pending</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {currentStep === 'payment' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-5xl mx-auto mt-4 px-4 sm:px-0">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-[#1e3d5a] tracking-tight">Checkout securely</h2>
              <p className="text-gray-500 mt-2 font-medium">Verify your parking details and complete your payment below.</p>
            </div>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Order Summary */}
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <div className="bg-[#1e3d5a] rounded-3xl p-6 shadow-xl shadow-blue-900/10 text-white">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Location</span>
                      <span className="font-bold text-right">{locationName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Vehicle</span>
                      <span className="font-bold">{activeVehicle.plate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Base Rate</span>
                      <span className="font-bold">₱{HOURLY_RATE.toFixed(2)}</span>
                    </div>
                    <hr className="border-white/10 my-4" />
                    <div className="flex justify-between items-end pt-2">
                      <span className="text-xs uppercase font-black tracking-widest text-white/70">Total Amount</span>
                      <span className="text-4xl font-black text-[#ee6b20]">₱{HOURLY_RATE.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Method */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black text-[#1e3d5a] mb-6 flex items-center gap-2">
                    <CreditCard className="size-6 text-[#ee6b20]" />
                    Payment Method
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Saved Payment Methods (Auto-Charge SCRUM-1018) */}
                    {savedMethods.length > 0 && (
                      <div className={`border-2 rounded-2xl overflow-hidden transition-all ${bookingData.paymentMethod === 'gcash_linked' ? 'border-[#ee6b20]' : 'border-gray-100'}`}>
                        <button type="button" onKeyDown={(e) => { if (e.key === 'Enter') setBookingData({ ...bookingData, paymentMethod: 'gcash_linked', savedPaymentMethodId: savedMethods[0].id }) }} className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'gcash_linked', savedPaymentMethodId: savedMethods[0].id })}>
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">💙</div>
                            <div>
                              <p className="font-bold text-[#1e3d5a] leading-tight">Saved GCash (Linked)</p>
                              <p className="text-xs text-gray-500 font-medium">Auto-Charge enabled</p>
                            </div>
                          </div>
                          <ChevronDown className="size-5 text-gray-400" />
                        </button>
                        {bookingData.paymentMethod === 'gcash_linked' && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-2">
                            {savedMethods.map(m => (
                              <button key={m.id} type="button" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'gcash_linked', savedPaymentMethodId: m.id })} 
                                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${bookingData.savedPaymentMethodId === m.id ? 'border-[#ee6b20] bg-white shadow-sm' : 'border-gray-200 bg-transparent'}`}>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#1e3d5a]">{m.displayLabel || 'GCash'}</span>
                                  <span className="text-xs text-gray-400 font-mono">{m.mobileNumber}</span>
                                  {m.isDefault && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">Default</span>}
                                </div>
                                {bookingData.savedPaymentMethodId === m.id && <CheckCircle2 className="size-5 text-[#ee6b20]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* E-Wallet Accordion */}
                    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${bookingData.paymentMethod === 'GCash' || bookingData.paymentMethod === 'Maya' ? 'border-[#ee6b20]' : 'border-gray-100'}`}>
                      <button type="button" onKeyDown={(e) => { if (e.key === 'Enter') setBookingData({ ...bookingData, paymentMethod: 'GCash' }) }} className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'GCash' })}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Smartphone className="size-5" /></div>
                          <div>
                            <p className="font-bold text-[#1e3d5a] leading-tight">E-Wallet</p>
                            <p className="text-xs text-gray-500 font-medium">GCash or Maya</p>
                          </div>
                        </div>
                        <ChevronDown className="size-5 text-gray-400" />
                      </button>
                      
                      {(bookingData.paymentMethod === 'GCash' || bookingData.paymentMethod === 'Maya') && (
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-2">
                          <button type="button" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'GCash' })} className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${bookingData.paymentMethod === 'GCash' ? 'border-[#ee6b20] bg-white shadow-sm' : 'border-gray-200 bg-transparent'}`}>
                            <span className="font-bold text-[#1e3d5a]">GCash</span>
                            {bookingData.paymentMethod === 'GCash' && <CheckCircle2 className="size-5 text-[#ee6b20]" />}
                          </button>
                          <button type="button" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'Maya' })} className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${bookingData.paymentMethod === 'Maya' ? 'border-[#ee6b20] bg-white shadow-sm' : 'border-gray-200 bg-transparent'}`}>
                            <span className="font-bold text-[#1e3d5a]">Maya</span>
                            {bookingData.paymentMethod === 'Maya' && <CheckCircle2 className="size-5 text-[#ee6b20]" />}
                          </button>
                        </div>
                      )}
                    </div>


                    {/* Credit Card */}
                    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${bookingData.paymentMethod === 'Credit/Debit Card' ? 'border-[#ee6b20]' : 'border-gray-100 hover:border-gray-200'}`}>
                      <button type="button" onKeyDown={(e) => { if (e.key === 'Enter') setBookingData({ ...bookingData, paymentMethod: 'Credit/Debit Card' }) }} className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'Credit/Debit Card' })}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CreditCard className="size-5" /></div>
                          <div>
                            <p className="font-bold text-[#1e3d5a] leading-tight">Credit/Debit Card</p>
                            <p className="text-xs text-gray-500 font-medium">Visa, Mastercard, Amex</p>
                          </div>
                        </div>
                        {bookingData.paymentMethod === 'Credit/Debit Card' ? <CheckCircle2 className="size-5 text-[#ee6b20]" /> : <ChevronDown className="size-5 text-gray-400" />}
                      </button>

                      {bookingData.paymentMethod === 'Credit/Debit Card' && (
                        <div className="px-4 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
                          
                          {/* Animated 3D CSS Card */}
                          <div className="flex justify-center mb-8 mt-4">
                            <div className="relative w-full max-w-[340px] h-[200px] text-white [perspective:1000px] pointer-events-none group">
                              <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${focusedField === 'cvv' ? '[transform:rotateY(180deg)]' : ''}`}>
                                
                                {/* Front Card */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#1b191e] to-[#252229] border border-gray-700/50 rounded-2xl p-6 shadow-2xl [backface-visibility:hidden] overflow-hidden flex flex-col justify-between">
                                  <div className="absolute -left-10 -top-10 w-48 h-48 border-[25px] border-purple-500/20 rounded-full blur-[2px]" />
                                  <div className="flex justify-between items-start relative z-10">
                                    <span className="font-bold text-white/90">CreditCard</span>
                                    {(() => {
                                      const ct = getCardType(cardDetails.number);
                                      if (ct === 'Visa') return (
                                        <div className="font-bold italic text-2xl tracking-tighter text-white mr-1 drop-shadow-md pb-1">VISA</div>
                                      );
                                      if (ct === 'Amex') return (
                                        <div className="font-black text-xl tracking-tighter text-white mr-1 drop-shadow-md bg-blue-600/0 px-1 rounded pb-1">AMEX</div>
                                      );
                                      if (ct === 'Discover') return (
                                        <div className="font-black italic text-xl tracking-tighter text-white mr-1 drop-shadow-md pb-1">DISCOVER</div>
                                      );
                                      if (ct === 'JCB') return (
                                        <div className="font-bold italic text-xl tracking-tighter text-white mr-1 drop-shadow-md pb-1">JCB</div>
                                      );
                                      if (ct === 'UnionPay') return (
                                        <div className="font-bold italic text-lg tracking-tighter text-white mr-1 drop-shadow-md pb-1">UnionPay</div>
                                      );
                                      if (ct === 'Diners Club') return (
                                        <div className="font-bold text-sm tracking-tighter text-white mr-1 drop-shadow-md pb-1 uppercase">Diners Club</div>
                                      );
                                      
                                      // Default Mastercard SVG
                                      if (ct === 'Mastercard' || !ct) return (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24">
                                          <circle cx="12" cy="12" r="12" fill="#eb001b" fillOpacity="0.9" />
                                          <circle cx="28" cy="12" r="12" fill="#f79e1b" fillOpacity="0.9" />
                                        </svg>
                                      );
                                      return <div className="font-bold text-xs tracking-tighter text-white mr-1 drop-shadow-md uppercase">{ct}</div>;
                                    })()}
                                  </div>
                                  <div className={`text-[22px] font-mono tracking-widest relative z-10 text-white/90 drop-shadow-sm flex items-center min-h-[33px] transition-all ${focusedField === 'number' ? 'ring-2 ring-white/20 px-2 py-1 -mx-2 rounded-lg bg-white/5' : ''}`}>
                                    {cardDetails.number ? cardDetails.number.padEnd(19, '•') : '•••• •••• •••• ••••'}
                                  </div>
                                  <div className="flex justify-between items-end relative z-10 uppercase">
                                    <div className={`transition-all ${focusedField === 'name' ? 'ring-2 ring-white/20 px-2 py-1 -mx-2 -my-1 rounded-lg bg-white/5' : ''}`}>
                                      <p className="text-[8px] text-white/50 font-black tracking-widest mb-1 shadow-sm">Card Holder</p>
                                      <p className="font-bold text-sm tracking-widest truncate max-w-[150px]">{formatCardName(cardDetails.name)}</p>
                                    </div>
                                    <div className={`text-right transition-all ${focusedField === 'expiry' ? 'ring-2 ring-white/20 px-2 py-1 -mx-2 -my-1 rounded-lg bg-white/5' : ''}`}>
                                      <p className="text-[8px] text-white/50 font-black tracking-widest mb-1 shadow-sm">Expires</p>
                                      <p className="font-bold text-sm tracking-widest">{cardDetails.expiry || 'MM/YY'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Back Card */}
                                <div className="absolute inset-0 bg-gradient-to-bl from-[#1b191e] to-[#252229] border border-gray-700/50 rounded-2xl shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden">
                                  <div className="w-full h-12 bg-black mt-6" />
                                  <div className="px-6 mt-4">
                                    <p className="text-[10px] text-white/70 font-black mb-1 text-right pr-2">CVV</p>
                                    <div className={`w-full h-10 bg-white rounded-md flex items-center justify-end px-4 text-black font-mono text-sm tracking-widest transition-all ${focusedField === 'cvv' ? 'ring-4 ring-orange-500/50' : ''}`}>
                                      {cardDetails.cvv ? cardDetails.cvv.replace(/./g, '*') : '***'}
                                    </div>
                                    <p className="text-[8px] text-white/40 mt-4 text-center leading-tight">This card is non-transferable and must be returned upon request.</p>
                                  </div>
                                </div>
                                
                              </div>
                            </div>
                          </div>

                          {cardError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold animate-in fade-in">
                              <AlertCircle className="size-4 shrink-0" /> {cardError}
                            </div>
                          )}
                          <div className="space-y-4 animate-in slide-in-from-bottom-2">
                            <div>
                              <div className="flex justify-between items-end mb-1.5">
                                <label htmlFor="cardNumber" className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1">Card Number</label>
                                {getCardType(cardDetails.number) && <span className="text-[10px] font-black uppercase text-[#ee6b20] bg-orange-100 px-2 py-0.5 rounded-full">{getCardType(cardDetails.number)}</span>}
                              </div>
                              <div className="relative">
                                <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors ${focusedField === 'number' ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
                                <Input 
                                  id="cardNumber"
                                  value={cardDetails.number}
                                  onFocus={() => setFocusedField('number')}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    const m = val.match(/.{1,4}/g);
                                    setCardDetails(p => ({ ...p, number: m ? m.join(' ') : val }));
                                    setCardError('');
                                    setCardErrorField('');
                                  }}
                                  placeholder="0000 0000 0000 0000"
                                  maxLength={19}
                                  className={`pl-12 h-14 rounded-2xl bg-white font-mono text-base shadow-sm font-medium transition-colors ${cardErrorField === 'number' ? 'border-red-400 ring-2 ring-red-100 bg-red-50 text-red-700' : 'border-gray-200 focus-visible:ring-[#ee6b20]'}`}
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="cardHolder" className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">Card Holder</label>
                              <Input 
                                id="cardHolder"
                                value={cardDetails.name}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => {
                                  setCardDetails(p => ({ ...p, name: e.target.value.toUpperCase() }));
                                  setCardError('');
                                  setCardErrorField('');
                                }}
                                placeholder="e.g. JUAN DELA CRUZ"
                                className={`h-14 rounded-2xl bg-white text-base shadow-sm font-medium px-4 transition-colors ${cardErrorField === 'name' ? 'border-red-400 ring-2 ring-red-100 bg-red-50 text-red-700' : 'border-gray-200 focus-visible:ring-[#ee6b20]'}`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="cardExpiry" className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">Expiry Date</label>
                                <Input 
                                  id="cardExpiry"
                                  value={cardDetails.expiry}
                                  onFocus={() => setFocusedField('expiry')}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                    setCardDetails(p => ({ ...p, expiry: val }));
                                    setCardError('');
                                    setCardErrorField('');
                                  }}
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  className={`h-14 rounded-2xl bg-white font-mono text-center text-base shadow-sm font-medium transition-colors ${cardErrorField === 'expiry' ? 'border-red-400 ring-2 ring-red-100 bg-red-50 text-red-700' : 'border-gray-200 focus-visible:ring-[#ee6b20]'}`}
                                />
                              </div>
                              <div>
                                <label htmlFor="cardCvv" className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">CVV / CVC</label>
                                <Input 
                                  id="cardCvv"
                                  type="password"
                                  value={cardDetails.cvv}
                                  onFocus={() => setFocusedField('cvv')}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 4) {
                                      setCardDetails(p => ({ ...p, cvv: val }));
                                      setCardError('');
                                      setCardErrorField('');
                                    }
                                  }}
                                  placeholder="***"
                                  maxLength={4}
                                  className={`h-14 rounded-2xl bg-white font-mono text-center text-base tracking-widest shadow-sm font-medium transition-colors ${cardErrorField === 'cvv' ? 'border-red-400 ring-2 ring-red-100 bg-red-50 text-red-700' : 'border-gray-200 focus-visible:ring-[#ee6b20]'}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-8">
                    <Button variant="outline" type="button" onClick={() => setCurrentStep('review')} className="h-14 px-6 rounded-2xl border-2 font-bold text-gray-500 hover:text-[#1e3d5a]">
                      Back
                    </Button>
                    <Button onClick={handleConfirmPay} disabled={isConfirming} className="flex-1 h-14 bg-[#1e3d5a] hover:bg-[#2a5373] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all">
                      {isConfirming ? <Loader2 className="animate-spin size-5 mx-auto" /> : 'Confirm Reservation'}
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-center gap-2 shadow-sm text-gray-400 text-center md:text-left">
                  <ShieldCheck className="size-5 text-orange-400 shrink-0" />
                  <p className="text-xs font-bold text-[#1e3d5a]">PakiPark SecurePay™ <span className="font-normal text-gray-400 ml-1">Processed through 256-bit SSL secure layers.</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'receipt' && (
          <div className="max-w-md mx-auto animate-in zoom-in-95 mt-4 pb-8">

            {/* ─── @media print styles injected inline ─── */}
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #epass-print, #epass-print * { visibility: visible !important; }
                #epass-print {
                  position: fixed !important;
                  inset: 0 !important;
                  width: 100vw !important;
                  height: 100vh !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  background: #fff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                #epass-card {
                  width: 360px !important;
                  border-radius: 24px !important;
                  overflow: hidden !important;
                  box-shadow: none !important;
                  border: 1px solid #cbd5e0 !important;
                  page-break-inside: avoid !important;
                  background: #ffffff !important;
                  color: #1e3d5a !important;
                }
                
                /* Override Header for Print */
                #epass-card .bg-\[\#1e3d5a\] {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  color: #1e3d5a !important;
                  padding-top: 24px !important;
                  padding-bottom: 20px !important;
                }
                #epass-card .text-\[\#90b4d8\] {
                  color: #4a5568 !important;
                  font-weight: 800 !important;
                }
                #epass-card h3.text-\[\#ee6b20\] {
                  color: #ee6b20 !important;
                  font-weight: 900 !important;
                }
                #epass-card .text-white\/70 {
                  color: #718096 !important;
                  font-weight: 600 !important;
                }
                #epass-card .text-white\/70 svg {
                  display: none !important; /* Hide MapPin icon for clean layout */
                }
                #epass-card .opacity-80 {
                  opacity: 1 !important;
                }
                #epass-card .bg-white\/5 {
                  display: none !important;
                }
                
                /* Detail row titles */
                #epass-card .text-gray-400 {
                  color: #718096 !important;
                  font-weight: 800 !important;
                }
                
                /* Detail values */
                #epass-card .text-\[\#1e3d5a\] {
                  color: #1e3d5a !important;
                }
                #epass-card .text-\[\#ee6b20\] {
                  color: #ee6b20 !important;
                }
                
                /* Barcode area */
                #epass-card .bg-gray-50 {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #cbd5e0 !important;
                }
                #epass-card .text-gray-500 {
                  color: #4a5568 !important;
                }
                
                /* perforated divider border */
                #epass-card .border-gray-200 {
                  border-color: #cbd5e0 !important;
                }
                
                /* Footer */
                #epass-card .bg-orange-50 {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #fbd38d !important;
                }
                #epass-card .bg-white {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border: 1px solid #cbd5e0 !important;
                }
              }
            `}</style>

            {/* ── Printable E-Pass card ── */}
            <div id="epass-print">
              <div id="epass-card" className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-[#1e3d5a] px-7 pt-6 pb-5 text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 size-24 bg-white/5 rounded-full" />
                  <div className="absolute right-6 top-5">
                    <Image src={LOGO_SRC} alt="PakiPark" width={38} height={38} unoptimized className="opacity-80" />
                  </div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#90b4d8] mb-1">PakiPark Official E-Pass</p>
                  <h3 className="text-3xl font-black text-[#ee6b20]">Fixed Slot</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-white/70">
                    <MapPin className="size-3.5 shrink-0" />{locationName}
                  </div>
                </div>

                {/* Perforated divider */}
                <div className="relative h-5 bg-gray-50">
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                  <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                  <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-gray-200" />
                </div>

                {/* Detail grid — matches screenshot exactly */}
                <div className="px-7 py-5 space-y-5 bg-white">
                  <div className="grid grid-cols-2 gap-y-5">
                    {/* Row 1 */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Driver Name</p>
                      <p className="text-base font-black text-[#1e3d5a]">
                        {customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Plate Number</p>
                      <p className="text-base font-black text-[#ee6b20] uppercase">{activeVehicle.plate}</p>
                    </div>
                    {/* Row 2 */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Date</p>
                      <p className="text-base font-black text-[#1e3d5a]">{bookingData.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Time Slot</p>
                      <p className="text-base font-black text-[#1e3d5a]">{bookingData.selectedSlot.split(' - ')[0]}</p>
                    </div>
                    {/* Row 3 */}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Floor</p>
                      <p className="text-base font-black text-[#1e3d5a]">{bookingData.selectedParkingSlot?.floor ?? '1'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Parking Slot</p>
                      <p className="text-base font-black text-[#ee6b20]">{bookingData.selectedParkingSlot?.label ?? 'A-01'}</p>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="bg-gray-50 rounded-2xl py-6 flex flex-col items-center justify-center">
                    <Barcode
                      value={ticketRef}
                      width={1.5}
                      height={64}
                      displayValue={false}
                      background="transparent"
                    />
                    <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500 mt-2">{ticketRef}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#ee6b20] mt-3">Present to Attendant</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mx-3 mb-3 bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-[#ee6b20]"><Clock className="size-4" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Duration</p>
                      <p className="text-sm font-bold text-[#1e3d5a]">1 Hour Reserved</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Amount Paid</p>
                    <p className="text-sm font-black text-[#1e3d5a]">₱{HOURLY_RATE.toFixed(2)}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Action buttons (hidden when printing) ── */}
            <div className="space-y-3 mt-6 px-1">
              <Button
                onClick={handleDownloadImage}
                className="w-full bg-[#1e3d5a] hover:bg-[#2a5373] h-14 rounded-2xl font-bold gap-2 text-white shadow-xl transition-all"
              >
                <Download className="size-4" /> Download E-Pass
              </Button>
              <Button
                onClick={() => router.push('/customer/home')}
                variant="outline"
                className="w-full h-14 rounded-2xl font-bold border-gray-200 text-gray-600 bg-white shadow-sm hover:border-[#1e3d5a] transition-colors"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'payment-failed' && (
          <div className="flex flex-col items-center justify-center pt-10 px-4">
            <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <AlertCircle className="size-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-[#1e3d5a] mb-2 text-center">Payment Failed</h2>
            <p className="text-gray-500 text-center mb-10 max-w-sm leading-relaxed text-sm font-medium">
              We couldn't process your payment, or the transaction was cancelled. Your slot reservation has been safely released.
            </p>
            <Button
              onClick={() => router.push('/customer/home')}
              className="w-full bg-[#1e3d5a] hover:bg-[#2a5373] h-14 rounded-2xl font-bold text-white shadow-xl transition-all max-w-sm"
            >
              Return to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/customer/find-parking')}
              variant="outline"
              className="w-full mt-3 h-14 rounded-2xl font-bold border-gray-200 text-gray-600 bg-white shadow-sm hover:border-[#1e3d5a] transition-colors max-w-sm"
            >
              Try Booking Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookParkingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa]">
        <Loader2 className="size-10 animate-spin text-[#ee6b20]" />
      </div>
    }>
      <BookParkingContent />
    </Suspense>
  );
}
