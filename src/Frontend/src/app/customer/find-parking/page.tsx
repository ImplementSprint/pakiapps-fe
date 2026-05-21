'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, MapPin, Search, DollarSign,
  Filter, RefreshCw, Car, Zap, CheckCircle,
  AlertCircle, Layers, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { locationsService } from '@/services/locationsService';
import { vehiclesService } from '@/services/vehiclesService';
import { authService } from '@/services/authService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

function occupancyPct(loc: any) {
  if (!loc.totalSpots || loc.totalSpots === 0) return 0;
  return Math.round(((loc.totalSpots - loc.availableSpots) / loc.totalSpots) * 100);
}

function availabilityColor(avail: number, total: number) {
  if (total === 0) return 'text-gray-400';
  const pct = avail / total;
  if (pct > 0.5) return 'text-green-600';
  if (pct > 0.2) return 'text-amber-500';
  return 'text-red-600';
}

function OccupancyBar({ loc }: Readonly<{ loc: any }>) {
  const pct = occupancyPct(loc);
  let color = 'bg-red-500';
  if (pct < 50) color = 'bg-green-500';
  else if (pct < 80) color = 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-500 shrink-0">{pct}% full</span>
    </div>
  );
}

function getFilterLabel(f: string) {
  if (f === 'available') return 'Has Availability';
  if (f === 'ev') return 'EV Charging';
  return 'All Locations';
}

function FindParkingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryVehicleId = searchParams.get('vehicleId');
  const [searchQuery, setSearchQuery]   = useState('');
  const [filter, setFilter]             = useState<'all' | 'available' | 'ev'>('all');
  const [locations, setLocations]       = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeCar, setActiveCar]       = useState<any>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await locationsService.getLocations(); // Assuming this returns all active since it's customer
      setLocations(data);
    } catch (err: any) {
      setError(err?.message || 'Could not load parking locations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    vehiclesService.getMyVehicles().then(v => {
      if (!v?.length) return;
      // Prefer the vehicle passed from the home page via ?vehicleId=
      const preferred = queryVehicleId
        ? v.find((x: any) => (x._id || x.id) === queryVehicleId)
        : null;
      setActiveCar(preferred || v.find((x: any) => x.isDefault) || v[0]);
    }).catch(() => {});
    load();
  }, [queryVehicleId]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!isLoading) {
        try { setLocations(await locationsService.getLocations(searchQuery)); } catch { /* ignore */ }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = locations.filter(loc => {
    if (filter === 'available') return loc.availableSpots > 0;
    if (filter === 'ev')        return loc.amenities?.some((a: string) => /ev|electric/i.test(a));
    return true;
  });

  const handleBookNow = (loc: any) => {
    const params = new URLSearchParams({
      locationId:   loc._id || loc.id,
      locationName: loc.name,
      hourlyRate:   String(loc.hourlyRate)
    });
    // queryVehicleId is what the user picked on the home page (URL source of truth)
    // fall back to activeCar only if no query param was passed
    const vid = queryVehicleId || activeCar?._id || activeCar?.id;
    if (vid) params.set('vehicleId', vid);
    router.push(`/customer/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customer/home')} className="gap-2 text-gray-500">
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 object-contain" unoptimized />
          <h1 className="text-lg font-bold text-[#1e3d5a] ml-auto">Find Parking</h1>
          <Button variant="ghost" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-[#ee6b20]' : 'text-gray-400'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => authService.logout()}
            className="gap-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Search + Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or address…" className="pl-10 rounded-xl h-11" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-gray-400" />
            {(['all', 'available', 'ev'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all capitalize ${filter === f ? 'border-[#ee6b20] bg-[#ee6b20] text-white' : 'border-gray-200 text-gray-500 hover:border-[#ee6b20]/40 bg-white'}`}>
                {getFilterLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="size-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">Could not load parking locations</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <Button onClick={load} variant="outline" className="mt-3 border-red-300 text-red-600 text-sm"><RefreshCw className="size-3.5 mr-2" /> Try Again</Button>
            </div>
          </div>
        )}

        {isLoading && !error && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="size-12 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-2/5" /><div className="h-3 bg-gray-100 rounded w-3/5" /><div className="h-2 bg-gray-100 rounded w-1/2 mt-3" /></div>
                  <div className="w-24 h-10 bg-gray-100 rounded-xl shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <MapPin className="size-12 mx-auto text-gray-200 mb-4" />
            {locations.length === 0 ? (
              <p className="font-bold text-gray-700 text-lg">No active parking locations yet</p>
            ) : (
              <><p className="font-bold text-gray-700 text-lg">No results for "{searchQuery}"</p><Button onClick={() => { setSearchQuery(''); setFilter('all'); }} className="mt-5 bg-[#ee6b20]">Clear Search</Button></>
            )}
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map(loc => (
              <div key={loc.id || loc._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  <div className="bg-gradient-to-b from-[#1e3d5a] to-[#2a5373] sm:w-3 w-full sm:h-auto h-2 shrink-0" />
                  <div className="flex-1 p-5 sm:p-6 flex flex-col lg:flex-row gap-5">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-[#1e3d5a]">{loc.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="size-3.5" /> {loc.address}</p>
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle className="size-3" /> Open</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <Car className="size-4 text-[#ee6b20] mx-auto mb-0.5" />
                          <p className={`text-lg font-black ${availabilityColor(loc.availableSpots, loc.totalSpots)}`}>{loc.availableSpots}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Available</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <Layers className="size-4 text-blue-500 mx-auto mb-0.5" />
                          <p className="text-lg font-black text-[#1e3d5a]">{loc.totalSpots}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <DollarSign className="size-4 text-green-500 mx-auto mb-0.5" />
                          <p className="text-lg font-black text-[#1e3d5a]">₱{loc.hourlyRate}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">/ hour</p>
                        </div>
                      </div>
                      <OccupancyBar loc={loc} />
                      {loc.amenities && (
                        <div className="flex flex-wrap gap-1.5">
                          {loc.amenities.map((a: string) => (
                            <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                              {/ev|electric/i.test(a) && <Zap className="size-2.5" />}{a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:w-36 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Starting from</p>
                        <p className="text-2xl font-black text-[#1e3d5a]">₱{loc.hourlyRate}</p>
                        <p className="text-xs text-gray-400">/hour</p>
                      </div>
                      <Button onClick={() => handleBookNow(loc)} disabled={loc.availableSpots === 0} className={`w-full rounded-xl font-bold ${loc.availableSpots > 0 ? 'bg-[#ee6b20]' : 'bg-gray-200 text-gray-400'}`}>
                        {loc.availableSpots > 0 ? 'Book Now' : 'Full'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FindParkingPage() {
  return (
    <Suspense>
      <FindParkingContent />
    </Suspense>
  );
}
