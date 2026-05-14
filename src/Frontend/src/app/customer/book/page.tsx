'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Clock, CheckCircle, MapPin,
  Car, Loader2, Sparkles, CalendarDays, Download, User, Share,
  CreditCard, Smartphone, Building, ChevronDown, CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Barcode from 'react-barcode';

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

  useEffect(() => {
    vehiclesService.getMyVehicles().then(v => {
      const target = v.find((x: any) => x._id === queryVehicleId || x.id === queryVehicleId) || v[0];
      if (target) setActiveVehicle({
        _id: target._id || target.id,
        plate: target.plateNumber,
        model: `${target.brand} ${target.model}`.trim(),
        type: target.type
      });
    }).catch(() => {});
  }, [queryVehicleId]);

  const [currentStep, setCurrentStep] = useState<'timeslot' | 'review' | 'payment' | 'receipt'>('timeslot');
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Legacy, will ignore or remove
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
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);

  useEffect(() => {
    setIsLoadingMethods(true);
    paymentMethodService.getAll().then(methods => {
      setSavedMethods(methods);
      const def = methods.find((m: any) => m.isDefault);
      if (def) {
        setBookingData(prev => ({
          ...prev,
          paymentMethod: 'gcash_linked',
          savedPaymentMethodId: def.id
        }));
      }
    }).finally(() => setIsLoadingMethods(false));
  }, []);

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
    if (/^35/.test(n)) return 'JCB';
    if (/^62/.test(n) || /^81/.test(n)) return 'UnionPay';
    return null;
  };

  const formatCardName = (name: string) => {
    if (!name) return 'YOUR NAME';
    if (name.length <= 18) return name;
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name.substring(0, 18);
    const lastName = parts.pop();
    let initials = '';
    for (let i = 0; i < parts.length; i++) {
        const letter = parts[i].replace(/[^a-zA-Z]/g, '').charAt(0);
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
    if (!assigned) assigned = allSlots.find(s => s.status === 'available') || null;
    setBookingData(prev => ({ ...prev, selectedParkingSlot: assigned }));
    setShowFloorModal(false);
    setCurrentStep('review');
  };

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
        let digit = parseInt(n.charAt(i), 10);
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
      const expMonth = parseInt(mm, 10);
      const expYear = parseInt('20' + yy, 10);
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

      setTicketRef(result.reference || 'PKP-XXXXXXXX');
      setIsConfirming(false);
      setCurrentStep('receipt');
    } catch (err: any) {
      setIsConfirming(false);
      toast.error(err?.message || 'Booking failed.');
    }
  };

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
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${currentStep==='timeslot' ? 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110' : 'bg-green-500 text-white'}`}><CheckCircle2 className="size-5" /></div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 text-green-600`}>Schedule</span>
               </div>
               <div className="w-8 sm:w-16 h-[3px] bg-gray-200 mx-1 rounded-full relative overflow-hidden">
                  <div className={`absolute left-0 top-0 h-full bg-[#ee6b20] transition-all duration-700 w-full`} />
               </div>
               
               {/* 2 CONFIRM */}
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${currentStep==='review' ? 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110' : currentStep==='payment' || currentStep==='receipt' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{currentStep==='payment' || currentStep==='receipt' ? <CheckCircle2 className="size-5" /> : '2'}</div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 ${currentStep==='review' ? 'text-[#1e3d5a]' : currentStep==='payment' || currentStep==='receipt' ? 'text-green-600' : 'text-gray-300'}`}>Confirm</span>
               </div>
               <div className="w-8 sm:w-16 h-[3px] bg-gray-200 mx-1 rounded-full relative overflow-hidden">
                  <div className={`absolute left-0 top-0 h-full bg-[#ee6b20] transition-all duration-700 ${currentStep==='payment' || currentStep==='receipt' ? 'w-full' : 'w-0'}`} />
               </div>
               
               {/* 3 PAYMENT */}
               <div className="flex items-center gap-2 sm:gap-3">
                 <div className={`size-8 sm:size-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${currentStep==='payment' ? 'bg-[#ee6b20] text-white shadow-md shadow-orange-200 font-bold scale-110' : currentStep==='receipt' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{currentStep==='receipt' ? <CheckCircle2 className="size-5" /> : '3'}</div>
                 <span className={`font-black tracking-widest text-xs sm:text-sm uppercase transition-colors duration-500 ${currentStep==='payment' ? 'text-[#1e3d5a]' : currentStep==='receipt' ? 'text-green-600' : 'text-gray-300'}`}>Payment</span>
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
              {/* Date Selection */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Target Date</label>
                <div className="relative">
                  <Input 
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
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">Available 1-Hour Time Slots</label>
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
          <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-5xl mx-auto mt-4 px-4 sm:px-0">
             <div className="grid lg:grid-cols-2 gap-12 items-start">
               {/* Left Column */}
               <div>
                  <h2 className="text-4xl font-black text-[#1e3d5a] tracking-tight mb-2">Final <span className="text-[#ee6b20]">Review</span></h2>
                  <p className="text-gray-500 font-medium mb-8">Please check your reservation details before confirming.</p>
                  
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                     <div className="flex items-center p-4 bg-gray-50 rounded-2xl gap-4">
                        <div className="size-12 bg-white rounded-full flex items-center justify-center text-[#ee6b20] shadow-sm"><User className="size-5" /></div>
                        <div>
                           <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Reserved For</p>
                           <p className="font-bold text-[#1e3d5a]">{activeVehicle.plate}</p>
                        </div>
                     </div>
                     <div className="flex items-center p-4 bg-gray-50 rounded-2xl gap-4">
                        <div className="size-12 bg-white rounded-full flex items-center justify-center text-[#ee6b20] shadow-sm"><Clock className="size-5" /></div>
                        <div>
                           <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Total Duration</p>
                           <p className="font-bold text-[#1e3d5a]">1 Hour ({bookingData.selectedSlot})</p>
                        </div>
                     </div>

                     <div className="pt-4">
                        <h4 className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2 mb-4">
                           <ShieldCheck className="size-4 text-[#ee6b20]" /> Booking Policy
                        </h4>
                        <ul className="space-y-3 text-xs font-medium text-gray-500">
                           <li className="flex gap-2 items-start"><span className="text-[#ee6b20]">●</span> Grace period of 15 minutes for check-ins.</li>
                           <li className="flex gap-2 items-start"><span className="text-[#ee6b20]">●</span> Non-refundable if canceled within 2 hours of arrival.</li>
                           <li className="flex gap-2 items-start"><span className="text-[#ee6b20]">●</span> Present the E-Pass barcode to the attendant.</li>
                        </ul>
                     </div>

                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch gap-3 mt-6">
                     <button onClick={() => setCurrentStep('timeslot')} className="px-8 py-4 sm:w-auto bg-gray-100 hover:bg-gray-200 text-[#1e3d5a] font-black uppercase tracking-widest text-sm rounded-3xl transition-all shadow-sm flex items-center justify-center">
                        Back
                     </button>
                     <div className="flex-1 bg-[#1e3d5a] rounded-3xl p-6 flex items-center justify-between shadow-xl">
                        <div>
                           <p className="text-[11px] font-black tracking-widest text-[#90b4d8] uppercase">Total to Pay</p>
                           <p className="text-3xl font-black text-white">₱{HOURLY_RATE.toFixed(2)}</p>
                        </div>
                        <button onClick={() => setCurrentStep('payment')} className="px-8 py-4 bg-[#ee6b20] hover:bg-[#d95a10] text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all uppercase tracking-widest text-sm transform hover:scale-105 active:scale-95">
                           Confirm Now
                        </button>
                     </div>
                  </div>
               </div>

               {/* Right Column E-Pass Ticket Preview */}
               <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative mt-4 lg:mt-0 xl:mr-8 xl:scale-110 xl:origin-top">
                     <div className="bg-[#1e3d5a] p-8 text-white relative">
                        <p className="text-[10px] uppercase tracking-widest font-black text-[#90b4d8] mb-1">PakiPark E-Pass</p>
                        <h3 className="text-3xl font-black text-[#ee6b20] mb-4">Fixed Slot</h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                           <MapPin className="size-4" /> {locationName}
                        </div>
                        <div className="absolute top-8 right-8 bg-white/10 p-3 rounded-2xl"><Car className="size-5" /></div>
                     </div>
                     
                     <div className="p-8 relative">
                        {/* Cutouts */}
                        <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                        <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                        <div className="absolute left-6 right-6 top-0 border-t-2 border-dashed border-gray-200" />
                        
                        <div className="grid grid-cols-2 gap-y-6 pt-4">
                           <div>
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Driver Name</p>
                              <p className="font-bold text-[#1e3d5a] truncate pr-2 max-w-[120px]">{activeVehicle.plate ? 'Guest User' : 'Unknown'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Plate Number</p>
                              <p className="font-bold text-[#ee6b20] uppercase">{activeVehicle.plate}</p>
                           </div>
                           <div>
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Date</p>
                              <p className="font-bold text-[#1e3d5a]">{bookingData.date}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Time Slot</p>
                              <p className="font-bold text-[#1e3d5a]">{bookingData.selectedSlot.split(' - ')[0]}</p>
                           </div>
                           <div>
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Floor</p>
                              <p className="font-bold text-[#1e3d5a]">{bookingData.selectedParkingSlot?.floor || '1st Floor'}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Parking Slot</p>
                              <p className="font-bold text-[#ee6b20]">{bookingData.selectedParkingSlot?.label || 'A-01'}</p>
                           </div>
                        </div>

                        <div className="mt-8 bg-gray-50 rounded-2xl px-2 py-6 flex flex-col items-center justify-center gap-1 overflow-hidden">
                           <div className="blur-[4px] opacity-40 flex flex-col items-center justify-center scale-90 sm:scale-100 pointer-events-none select-none">
                              <Barcode value="PENDING" width={1.2} height={50} displayValue={false} background="transparent" />
                              <p className="font-mono text-[9px] tracking-[0.3em] text-gray-500 mt-2">PENDING</p>
                           </div>
                           <p className="text-[8px] font-black uppercase text-[#ee6b20] mt-3 tracking-widest bg-orange-100 px-3 py-1 rounded-full">Awaiting Payment</p>
                        </div>
                     </div>
                     
                     <div className="bg-orange-50/50 m-2 rounded-[1.5rem] p-4 flex justify-between items-center border border-[#ee6b20]/10">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-white rounded-xl text-[#ee6b20] shadow-sm"><Clock className="size-4" /></div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                              <p className="text-xs font-bold text-[#1e3d5a]">1 Hour Reserved</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</p>
                           <p className="text-xs font-bold text-[#1e3d5a]">Pending</p>
                        </div>
                     </div>
                  </div>
               </div>
             </div>
          </div>
        )}

        {currentStep === 'payment' && !showSuccessModal && (
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
                      <span className="font-bold">₱{HOURLY_RATE.toFixed(2)}/hr</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Duration</span>
                      <span className="font-bold">1 hr</span>
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
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'gcash_linked', savedPaymentMethodId: savedMethods[0].id })}>
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">💙</div>
                            <div>
                              <p className="font-bold text-[#1e3d5a] leading-tight">Saved GCash (Linked)</p>
                              <p className="text-xs text-gray-500 font-medium">Auto-Charge enabled</p>
                            </div>
                          </div>
                          <ChevronDown className="size-5 text-gray-400" />
                        </div>
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
                      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'GCash' })}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Smartphone className="size-5" /></div>
                          <div>
                            <p className="font-bold text-[#1e3d5a] leading-tight">E-Wallet</p>
                            <p className="text-xs text-gray-500 font-medium">GCash or Maya</p>
                          </div>
                        </div>
                        <ChevronDown className="size-5 text-gray-400" />
                      </div>
                      
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
                      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => setBookingData({ ...bookingData, paymentMethod: 'Credit/Debit Card' })}>
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CreditCard className="size-5" /></div>
                          <div>
                            <p className="font-bold text-[#1e3d5a] leading-tight">Credit/Debit Card</p>
                            <p className="text-xs text-gray-500 font-medium">Visa, Mastercard, Amex</p>
                          </div>
                        </div>
                        {bookingData.paymentMethod === 'Credit/Debit Card' ? <CheckCircle2 className="size-5 text-[#ee6b20]" /> : <ChevronDown className="size-5 text-gray-400" />}
                      </div>

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
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1">Card Number</label>
                                {getCardType(cardDetails.number) && <span className="text-[10px] font-black uppercase text-[#ee6b20] bg-orange-100 px-2 py-0.5 rounded-full">{getCardType(cardDetails.number)}</span>}
                              </div>
                              <div className="relative">
                                <CreditCard className={`absolute left-4 top-1/2 -translate-y-1/2 size-5 transition-colors ${focusedField === 'number' ? 'text-[#ee6b20]' : 'text-gray-400'}`} />
                                <Input 
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
                              <label className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">Card Holder</label>
                              <Input 
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
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">Expiry Date</label>
                                <Input 
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
                                <label className="text-[11px] font-black uppercase tracking-widest text-[#1e3d5a] pl-1 block mb-1.5">CVV / CVC</label>
                                <Input 
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
             <div className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative">
                 <div className="bg-[#1e3d5a] p-8 text-white relative">
                    <p className="text-[10px] uppercase tracking-widest font-black text-[#90b4d8] mb-1">PakiPark Official E-Pass</p>
                    <h3 className="text-3xl font-black text-[#ee6b20] mb-4">Fixed Slot</h3>
                    <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                       <MapPin className="size-4" /> {locationName}
                    </div>
                    <div className="absolute top-8 right-8 bg-white/10 p-3 rounded-2xl"><Car className="size-5" /></div>
                 </div>
                 
                 <div className="p-8 relative">
                    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                    <div className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 size-8 bg-[#f4f7fa] rounded-full" />
                    <div className="absolute left-6 right-6 top-0 border-t-2 border-dashed border-gray-200" />
                    
                    <div className="grid grid-cols-2 gap-y-6 pt-4">
                       <div>
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Driver Name</p>
                          <p className="font-bold text-[#1e3d5a] truncate pr-2 max-w-[120px]">{activeVehicle.plate ? 'Guest User' : 'Unknown'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Plate Number</p>
                          <p className="font-bold text-[#ee6b20] uppercase">{activeVehicle.plate}</p>
                       </div>
                       <div>
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Date</p>
                          <p className="font-bold text-[#1e3d5a]">{bookingData.date}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Time Slot</p>
                          <p className="font-bold text-[#1e3d5a]">{bookingData.selectedSlot.split(' - ')[0]}</p>
                       </div>
                       <div>
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Floor</p>
                          <p className="font-bold text-[#1e3d5a]">{bookingData.selectedParkingSlot?.floor || '1st Floor'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">Parking Slot</p>
                          <p className="font-bold text-[#ee6b20]">{bookingData.selectedParkingSlot?.label || 'A-01'}</p>
                       </div>
                    </div>

                    <div className="mt-8 bg-gray-50 rounded-2xl px-2 py-6 flex flex-col items-center justify-center overflow-hidden">
                       <div className="scale-90 sm:scale-100 flex flex-col items-center justify-center">
                          <Barcode value={ticketRef} width={1.2} height={60} displayValue={false} background="transparent" />
                       </div>
                       <p className="font-mono text-[10px] tracking-[0.3em] text-gray-500 mt-3">{ticketRef}</p>
                       <p className="text-[10px] font-black uppercase text-[#ee6b20] mt-4 tracking-widest">Present to Attendant</p>
                    </div>
                 </div>
                 
                 <div className="bg-orange-50/50 m-2 rounded-[1.5rem] p-4 flex justify-between items-center border border-[#ee6b20]/10">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-white rounded-xl text-[#ee6b20] shadow-sm"><Clock className="size-4" /></div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                          <p className="text-xs font-bold text-[#1e3d5a]">1 Hour Reserved</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</p>
                       <p className="text-sm font-black text-[#1e3d5a]">₱{HOURLY_RATE.toFixed(2)}</p>
                    </div>
                 </div>
              </div>

            <div className="space-y-3 mt-8 px-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                 <Button className="w-full bg-white h-14 rounded-2xl font-bold gap-2 text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50">
                    <Share className="size-4" /> Share
                 </Button>
                 <Button className="w-full bg-white h-14 rounded-2xl font-bold gap-2 text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-50">
                    <Download className="size-4" /> Save Image
                 </Button>
              </div>
              <Button onClick={() => window.print()} className="w-full bg-[#1e3d5a] h-14 rounded-2xl font-bold gap-2 hover:bg-transparent hover:text-[#1e3d5a] border border-[#1e3d5a] transition-colors shadow-xl">
                <Download className="size-4" /> Download/Print E-Pass
              </Button>
              <Button onClick={() => router.push('/customer/home')} variant="outline" className="w-full h-14 rounded-2xl font-bold border-gray-200 text-gray-600 bg-white shadow-sm hover:border-[#1e3d5a] transition-colors">
                Return to Dashboard
              </Button>
            </div>
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
