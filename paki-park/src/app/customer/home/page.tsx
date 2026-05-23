'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  MapPin, ChevronRight, CheckCircle2, Edit, Trash2, Car, Bike, Truck, 
  Info, Clock, Plus, LogOut, LayoutGrid, X, Settings, HelpCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookingService, type Booking } from '@/services/bookingService';
import { vehiclesService, type Vehicle } from '@/services/vehiclesService';
import { authService } from '@/services/authService';
import { NotificationBell } from '@/components/NotificationBell';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

const VehicleIcon = ({ type, size }: { type?: string; size: number }) => {
  switch ((type ?? '').toLowerCase()) {
    case 'motorcycle':
    case 'motor': return <Bike size={size} />;
    case 'truck': return <Truck size={size} />;
    default: return <Car size={size} />;
  }
};

const TutorialOverlay = () => {
  const [step, setStep] = useState<number | null>(null);
  const [modalStyle, setModalStyle] = useState<any>({});
  const [mascotStyle, setMascotStyle] = useState<any>({});
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenTutorial');
      if (!hasSeen) setStep(0);
    }
  }, []);

  useEffect(() => {
    const removeHighlights = () => {
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight', '!relative', '!z-[1001]', 'ring-4', 'ring-orange-400', 'bg-white', 'shadow-2xl', 'rounded-xl', 'px-2', 'py-1');
      });
    };
    
    removeHighlights();
    
    if (step === 1) {
      const el = document.getElementById('tutorial-add-vehicle');
      if (el) {
        el.classList.add('tutorial-highlight', '!relative', '!z-[1001]', 'ring-4', 'ring-orange-400', 'bg-white', 'shadow-2xl', 'rounded-xl', 'px-2', 'py-1');
        const rect = el.getBoundingClientRect();
        if (window.innerWidth > 768) {
          setModalStyle({ position: 'absolute', top: rect.bottom + 60, right: window.innerWidth - rect.right - 20 });
          // Position mascot above the button, centered horizontally
          const mascotSize = 60;
          const topPos = rect.top - mascotSize - 10; // 10px gap above button
          const leftPos = rect.left + rect.width / 2 - mascotSize / 2;
          setMascotStyle({
            position: 'absolute',
            top: `${topPos}px`,
            left: `${leftPos}px`,
            width: `${mascotSize}px`,
            height: `${mascotSize}px`,
            zIndex: 30,
          });
        } else {
          setModalStyle({});
          setMascotStyle({});
        }
      }
    } else if (step === 2) {
      const el = document.getElementById('tutorial-reserve-now');
      if (el) {
        el.classList.add('tutorial-highlight', '!relative', '!z-[1001]', 'ring-4', 'ring-orange-400', 'shadow-2xl');
        const rect = el.getBoundingClientRect();
        if (window.innerWidth > 768) setModalStyle({ position: 'absolute', top: rect.bottom + 60, right: window.innerWidth - rect.right });
        else setModalStyle({});
      }
    } else {
      setModalStyle({});
    }

    return removeHighlights;
  }, [step]);

  if (step === null) return null;

  const handleNext = () => {
    if (step >= 2) {
      localStorage.setItem('hasSeenTutorial', 'true');
      setStep(null);
    } else {
      setStep(s => s! + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setStep(null);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in transition-all">
      <div style={modalStyle} className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative pt-14 pb-6 px-6 text-center animate-in zoom-in-95 duration-300">
        
        <div className="bg-[#1e3d5a] text-white absolute top-0 left-0 right-0 h-20 rounded-t-[2rem] flex items-center justify-center pt-5 z-10">
           <h3 className="font-black tracking-widest text-xs lg:text-sm uppercase drop-shadow-sm">
             {step === 0 ? 'Welcome to PakiPark' : step === 1 ? 'Manage Your Vehicles' : 'Reserve Your Spot'}
           </h3>
        </div>

        {/* Mascot positioned dynamically based on step */}
        <div style={mascotStyle} className="pointer-events-none drop-shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-500">
           <Image src="/assets/12fd230c37e50c6b66ed6ffc16a84157be746936.png" alt="Mascot" fill className="object-contain" unoptimized />
        </div>

        <div className="mt-14 mb-8 text-gray-500 text-sm font-medium leading-relaxed px-2 relative z-10">
          {step === 0 && 'This tutorial will guide you through the main features of PakiPark. Ready to start?'}
          {step === 1 && "Click 'Add New' to register your vehicles. Select a vehicle from your list to make it the active one."}
          {step === 2 && "Ready to park? Click the orange 'Reserve Now' button to search and select your preferred parking location, then proceed to book your spot."}
        </div>

        <div className="space-y-4 relative z-20">
          <button onClick={handleNext} className="w-full bg-[#ee6b20] hover:bg-[#d95a10] text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-200">
            {step === 0 || step === 1 ? 'NEXT STEP' : 'GET STARTED'}
          </button>
          
          <div className="flex items-center justify-between px-2">
            {step > 0 ? (
               <button onClick={() => setStep(s => s! - 1)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider">
                 &lt; Back
               </button>
            ) : <div />}
            <button onClick={handleSkip} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider">
              Skip Tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CustomerHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Guest User');

  const [showGuide, setShowGuide] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('userName') ?? 'Guest User');
    }
    vehiclesService.getMyVehicles().then(v => setVehicles(v ?? [])).catch(() => {});
    bookingService.getMyBookings({ page: 1 }).then(data => setRecentBookings((data.bookings ?? []).slice(0, 5))).catch(() => {});
  }, []);

  // Active vehicle: prefer the default, else first. User can click any sidebar card to switch.
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);

  // When vehicles load, set the active vehicle to the default (or first)
  useEffect(() => {
    if (vehicles.length > 0 && !activeVehicle) {
      setActiveVehicle(vehicles.find(v => v.isDefault) || vehicles[0]);
    }
  }, [vehicles]);

  const handleSelectVehicle = (v: Vehicle) => {
    setActiveVehicle(v);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      {/* ── TOP HEADER ── */}
      <header className="bg-[#1e3d5a] text-white px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Image src={LOGO_SRC} alt="PakiPark" width={120} height={32} className="h-8 object-contain brightness-0 invert" unoptimized />
            
            <nav className="hidden md:flex items-center gap-2">
              <button onClick={() => router.push('/customer/home')} className="bg-[#ee6b20] hover:bg-[#d95a10] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                <Car size={16} /> Home
              </button>
              <button onClick={() => router.push('/customer/bookings')} className="text-white/80 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
                <Clock size={16} /> My Bookings
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell pollIntervalMs={30_000} accentColor="#ee6b20" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="hidden sm:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-colors">
                  <div className="size-7 bg-[#ee6b20] rounded-full flex items-center justify-center text-xs font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{userName}</span>
                  <ChevronRight className="size-4 opacity-50 rotate-90" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] bg-white border border-gray-100 shadow-xl rounded-2xl p-2 z-[100]">
                <DropdownMenuItem onClick={() => router.push('/customer/profile')} className="cursor-pointer gap-3 p-3 font-semibold text-[#1e3d5a] focus:bg-gray-50 rounded-xl transition-colors">
                  <Settings className="size-4 text-gray-400" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                <DropdownMenuItem onClick={() => authService.logout()} className="cursor-pointer gap-3 p-3 font-semibold text-red-600 focus:bg-red-50 rounded-xl transition-colors">
                  <LogOut className="size-4 text-red-500" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        
        {/* ── GREETING & ACTION ROW ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="size-20 bg-[#ee6b20] rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-200 shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e3d5a]">Hello, {userName}!</h1>
              <p className="text-gray-500 font-medium mt-1">Ready to park your vehicle?</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 bg-white border border-gray-200 text-[#1e3d5a] font-bold px-6 py-3.5 rounded-full hover:bg-gray-50 hover:shadow-md transition-all">
              <Info size={18} /> Guide
            </button>
            <button
              id="tutorial-reserve-now"
              onClick={() => router.push(`/customer/find-parking${activeVehicle ? `?vehicleId=${activeVehicle._id}` : ''}`)}
              className="flex items-center gap-2 bg-[#ee6b20] text-white font-bold px-6 py-3.5 rounded-full hover:bg-[#d95a10] hover:shadow-lg shadow-orange-200 transition-all"
            >
              <MapPin size={18} /> Reserve Now
            </button>
          </div>
        </div>

        {/* ── MY VEHICLES SECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-[#1e3d5a] flex items-center gap-2">
              <Car size={22} className="text-[#1e3d5a]" /> My Vehicles
            </h2>
            <button id="tutorial-add-vehicle" onClick={() => router.push('/customer/vehicles')} className="text-[#ee6b20] text-sm font-bold flex items-center gap-1 hover:underline">
              <Plus size={16} /> Add New
            </button>
          </div>

          {!activeVehicle ? (
            <button 
              type="button"
              className="w-full bg-white rounded-3xl border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors" 
              onClick={() => router.push('/customer/vehicles')}
            >
              <div className="size-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                <Car size={24} />
              </div>
              <p className="font-bold text-[#1e3d5a]">No vehicles saved</p>
              <p className="text-sm text-gray-500">Click to add your first vehicle</p>
            </button>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Active Vehicle Card (Main) */}
              <button 
                type="button"
                className="lg:col-span-8 group relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99] text-left" 
                onClick={() => router.push('/customer/vehicles')}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700 text-[#1e3d5a]">
                  <VehicleIcon type={activeVehicle.type} size={140} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-orange-100 text-[#ee6b20] text-[9px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} /> Active Selection
                      </span>
                      <div className="flex gap-2">
                        <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg"><Edit size={16} /></div>
                        <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg"><Trash2 size={16} /></div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-[#1e3d5a] mt-4 uppercase">
                      {activeVehicle.brand} <span className="text-[#ee6b20]">{activeVehicle.model}</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">PLATE</p>
                      <p className="text-sm font-black text-[#1e3d5a] font-mono tracking-wider">{activeVehicle.plateNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">COLOR</p>
                      <p className="text-sm font-black text-[#1e3d5a] capitalize">{activeVehicle.color}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">TYPE</p>
                      <p className="text-sm font-black text-[#1e3d5a] capitalize">{activeVehicle.type}</p>
                    </div>
                  </div>
                </div>
              </button>

              {/* Sidebar List — click any car to make it the active selection */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {vehicles.map((v) => {
                  const isSelected = activeVehicle?._id === v._id;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() => handleSelectVehicle(v)}
                      className={`p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all duration-200 w-full text-left ${
                        isSelected
                          ? 'bg-white border-[#ee6b20] shadow-md ring-1 ring-[#ee6b20]/20 scale-[1.02]'
                          : 'bg-white/50 border-gray-200 hover:bg-white hover:border-[#1e3d5a]/30 hover:shadow-sm hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#ee6b20] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <VehicleIcon type={v.type} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black uppercase truncate transition-colors ${
                          isSelected ? 'text-[#ee6b20]' : 'text-gray-600'
                        }`}>
                          {v.brand} {v.model}
                        </h4>
                        <p className={`text-xs font-mono mt-0.5 transition-colors ${
                          isSelected ? 'text-[#1e3d5a] font-bold' : 'text-gray-400'
                        }`}>
                          {v.plateNumber}{v.isDefault ? ' · Default' : ''}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-[#ee6b20] shrink-0" />
                      )}
                    </button>
                  );
                })}
                {vehicles.length === 1 && (
                  <button
                    type="button"
                    onClick={() => router.push('/customer/vehicles')}
                    className="p-4 rounded-2xl border border-dashed border-gray-200 flex items-center gap-4 cursor-pointer hover:bg-white transition-colors opacity-50 w-full text-left"
                  >
                    <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-300">
                      <Car size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-400">+ Add Another Car</h4>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── NAVIGATION MENU (Mascot Cards) ── */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid size={22} className="text-[#1e3d5a]" />
            <h2 className="text-xl font-black text-[#1e3d5a]">Navigation Menu</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nav Card 1 */}
            <button 
              type="button"
              onClick={() => router.push('/customer/find-parking')} 
              className="group mt-20 bg-white rounded-[2rem] pt-16 pb-8 px-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-300 flex flex-col items-center text-center relative"
            >
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-44 transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110 animate-in zoom-in">
                <Image src="/assets/2f36e075afb851770b0825e8580b43ef7b12efb3.png" alt="Reserve Parking mascot" fill className="object-contain drop-shadow-2xl" unoptimized />
              </div>
              <h3 className="text-lg font-black text-[#1e3d5a]">Reserve Parking</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Book a parking spot</p>
            </button>

            {/* Nav Card 2 */}
            <button 
              type="button"
              onClick={() => router.push('/customer/bookings')} 
              className="group mt-20 bg-white rounded-[2rem] pt-16 pb-8 px-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 hover:border-blue-100 transition-all duration-300 flex flex-col items-center text-center relative"
            >
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-44 transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110 animate-in zoom-in delay-75">
                <Image src="/assets/6ba55cecd5b7106e37c71ca0e89f4f80eb706edd.png" alt="My Bookings mascot" fill className="object-contain drop-shadow-2xl" unoptimized />
              </div>
              <h3 className="text-lg font-black text-[#1e3d5a]">My Bookings</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">View active bookings</p>
            </button>

            {/* Nav Card 3 — Ratings */}
            <button 
              type="button"
              onClick={() => router.push('/customer/ratings')}
              className="group mt-20 bg-white rounded-[2rem] pt-16 pb-8 px-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 hover:border-yellow-100 transition-all duration-300 flex flex-col items-center text-center relative"
            >
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-44 w-44 transition-transform duration-500 group-hover:-translate-y-4 group-hover:scale-110 animate-in zoom-in delay-150">
                <Image src="/assets/49e0d16aae0cfb13df1b2acdc4fbd4b2ab68795e.png" alt="Ratings mascot" fill className="object-contain drop-shadow-2xl" unoptimized />
              </div>
              <h3 className="text-lg font-black text-[#1e3d5a]">Ratings &amp; Reviews</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Share your experience</p>
            </button>
          </div>
        </section>

        {/* ── RECENT BOOKINGS ── */}
        <section className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 mt-12 mb-8 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-[#1e3d5a] flex items-center gap-2">
              <Clock size={18} className="text-[#1e3d5a]" /> Recent Bookings
            </h2>
            <button onClick={() => router.push('/customer/bookings')} className="text-[#ee6b20] text-sm font-bold flex items-center gap-1 hover:text-[#d95a10] transition-colors">
              View All <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="divide-y divide-gray-50">
            {recentBookings.length === 0 ? (
              <div className="p-10 text-center text-gray-400 font-medium">No recent bookings</div>
            ) : (
              recentBookings.map(b => (
                <button 
                  type="button"
                  key={b._id} 
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group text-left border-b border-gray-50 last:border-0" 
                  onClick={() => router.push('/customer/bookings')}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-blue-50/50 rounded-full flex items-center justify-center shrink-0 border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
                      <MapPin size={16} className="text-[#1e3d5a]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1e3d5a] text-[15px]">{b.locationName || (typeof b.locationId === 'object' && b.locationId?.name) || 'Unknown Location'}</h4>
                      <p className="text-[11px] text-gray-400 font-bold tracking-wide mt-0.5">{b.date} • {b.timeSlot}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-black text-[#ee6b20] text-[15px]">₱{Number(b.amount || 0).toFixed(2)}</p>
                    <div className={`mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      b.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {b.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
        
      </main>

      {/* ── Guide Modal ──────────────────────────────────────────────────────── */}
      {showGuide && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" 
          onClick={() => setShowGuide(false)}
          onKeyDown={e => e.key === 'Escape' && setShowGuide(false)}
          role="presentation"
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" 
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            role="presentation"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#ee6b20] text-white p-4 rounded-full shadow-lg border-[6px] border-white">
              <Info className="size-8" />
            </div>
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
              <X className="size-4" />
            </button>
            <h3 className="text-2xl font-black text-[#1e3d5a] text-center mt-6 mb-4">How to use PakiPark</h3>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li className="flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0"><MapPin className="size-5" /></div>
                <p><strong>Reserve a Slot:</strong> Click 'Reserve Now', choose a location, specify your parking duration, and select your preferred floor/slot.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-orange-50 text-[#ee6b20] p-2.5 rounded-xl shrink-0"><Car className="size-5" /></div>
                <p><strong>Manage Vehicles:</strong> Register your license plates in 'My Vehicles' so the teller instantly recognizes you upon check-in.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0"><CheckCircle2 className="size-5" /></div>
                <p><strong>Check-In dynamically:</strong> Present your digital ticket reference to the station teller when you arrive.</p>
              </li>
              <li role="button" tabIndex={0} className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-2xl transition-colors" onClick={() => router.push('/help')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push('/help'); }}>
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl shrink-0"><HelpCircle className="size-5" /></div>
                <p><strong>Need more help?</strong> Visit our <span className="text-purple-600 font-bold underline">Help & FAQ Center</span> for detailed answers to common questions.</p>
              </li>
            </ul>
            <button onClick={() => setShowGuide(false)} className="w-full mt-8 bg-[#1e3d5a] hover:bg-[#2a5373] text-white font-bold py-4 rounded-2xl transition-colors shadow-lg">
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* ── Tutorial Overlay ─────────────────────────────────────────────────── */}
      <TutorialOverlay />
    </div>
  );
}
