import { useMemo, useState } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Phone,
  AlertCircle,
  Bell,
  Search,
  HelpCircle,
  User,
  ChevronDown,
  Settings,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../contexts/AuthContext';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';

export default function TrackingPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All Drivers');

  const placeholderName = getDisplayNameForEmail(user?.email, "Juan Dela Cruz");

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGuide = () => {
    alert('Live Tracking Guide:\n\n• Monitor real-time vehicle locations\n• Check delivery progress\n• Contact drivers directly\n• View ETA and distance remaining');
  };

  const liveShipments = [
    {
      id: 'SHP-2024-1847',
      driver: 'John Salazar',
      vehicle: 'ABC-1234',
      from: 'SM Mall of Asia, Pasay',
      to: 'SM North EDSA, QC',
      progress: 65,
      eta: '35 mins',
      distance: '12.5 km',
      status: 'On Route',
      region: 'Manila',
      lastUpdate: '2 mins ago',
      lat: 14.5547,
      lng: 121.0244
    },
    {
      id: 'SHP-2024-1844',
      driver: 'Mark Gonzales',
      vehicle: 'DEF-5678',
      from: 'SM City Fairview, QC',
      to: 'SM Makati, Ayala',
      progress: 42,
      eta: '50 mins',
      distance: '18.2 km',
      status: 'On Route',
      region: 'Quezon City',
      lastUpdate: '5 mins ago',
      lat: 14.6760,
      lng: 121.0537
    },
    {
      id: 'SHP-2024-1843',
      driver: 'Anna Martinez',
      vehicle: 'GHI-9012',
      from: 'SM City San Lazaro, Manila',
      to: 'SM Grand Central, Caloocan',
      progress: 78,
      eta: '1.2 hours',
      distance: '8.7 km',
      status: 'On Route',
      region: 'Manila',
      lastUpdate: '1 min ago',
      lat: 14.6091,
      lng: 120.9842
    },
    {
      id: 'SHP-2024-1851',
      driver: 'Mika Santos',
      vehicle: 'JKL-4491',
      from: 'QC Hub',
      to: 'Makati Drop Point',
      progress: 38,
      eta: 'Delayed',
      distance: '14.1 km',
      status: 'Stuck',
      region: 'Makati',
      lastUpdate: '2 hrs 15 mins ago',
      lat: 14.5547,
      lng: 121.0244
    },
  ];

  const regions = useMemo(() => ['All', ...Array.from(new Set(liveShipments.map((shipment) => shipment.region)))], []);
  const drivers = useMemo(() => ['All Drivers', ...Array.from(new Set(liveShipments.map((shipment) => shipment.driver)))], []);
  const filteredLiveShipments = liveShipments.filter((shipment) => {
    const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || shipment.region === regionFilter;
    const matchesDriver = driverFilter === 'All Drivers' || shipment.driver === driverFilter;
    return matchesStatus && matchesRegion && matchesDriver;
  });
  const [selectedShipment, setSelectedShipment] = useState(liveShipments[0]);
  const stuckShipments = liveShipments.filter((shipment) => shipment.status === 'Stuck');

  return (
    <div className="flex h-screen bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="shipments" />

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Guide Button */}
            <button
              onClick={handleGuide}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#39B5A8]/20 text-[#39B5A8] hover:bg-[#F0F9F8] transition-all font-semibold text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              Guide
            </button>

            {/* Search Bar */}
            <div className="flex items-center gap-4 bg-[#F0F9F8] px-4 py-2 rounded-xl border border-[#39B5A8]/10 w-96">
              <Search className="w-4 h-4 text-[#39B5A8]/60" />
              <input
                type="text"
                placeholder="Search shipment or driver..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#39B5A8]/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 text-[#1A5D56] hover:bg-[#F0F9F8] rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white">
                2
              </span>
            </button>

            <div className="h-8 w-[1px] bg-[#39B5A8]/10"></div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-[#F0F9F8] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#39B5A8]/20">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#041614] leading-tight whitespace-nowrap">{placeholderName}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1A5D56] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/pakiship/profile');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/pakiship/settings');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Settings</span>
                  </button>
                  <div className="border-t border-[#39B5A8]/10"></div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tracking Body */}
        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#041614] tracking-tight">Live Tracking</h1>
              <p className="text-[#1A5D56] opacity-70 font-medium">Real-time monitoring of active shipments</p>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-emerald-700">{liveShipments.length} Vehicles Live</span>
            </div>
          </div>

          <Card className="bg-white rounded-[2.5rem] border-[#39B5A8]/10 shadow-lg overflow-hidden">
            <CardHeader className="p-7 pb-4">
              <div className="grid gap-4 xl:grid-cols-3">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-12 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 text-sm font-bold text-[#041614] outline-none">
                  {['All', 'On Route', 'Stuck'].map((status) => <option key={status}>{status}</option>)}
                </select>
                <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="h-12 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 text-sm font-bold text-[#041614] outline-none">
                  {regions.map((region) => <option key={region}>{region}</option>)}
                </select>
                <select value={driverFilter} onChange={(event) => setDriverFilter(event.target.value)} className="h-12 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 text-sm font-bold text-[#041614] outline-none">
                  {drivers.map((driver) => <option key={driver}>{driver}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-7 pt-0 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="relative h-[460px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#E8FCF8] to-[#F8FFFD]">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(57,181,168,0.13)_1px,transparent_1px),linear-gradient(rgba(57,181,168,0.13)_1px,transparent_1px)] bg-[size:76px_76px]" />
                {filteredLiveShipments.map((shipment, index) => (
                  <button
                    key={shipment.id}
                    type="button"
                    onClick={() => setSelectedShipment(shipment)}
                    className={`absolute rounded-full border-4 border-white p-4 text-white shadow-xl ${
                      shipment.status === 'Stuck' ? 'bg-red-500' : 'bg-[#39B5A8]'
                    }`}
                    style={{ left: `${18 + index * 20}%`, top: `${24 + (index % 3) * 18}%` }}
                    title={shipment.id}
                  >
                    <Truck className="h-5 w-5" />
                  </button>
                ))}
                <div className="absolute bottom-5 left-5 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#1A5D56] shadow">
                  Live map: click a vehicle pin to inspect driver details, parcel status, and ETA.
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-[#F8FFFD] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#39B5A8]">Selected Pin</p>
                  <h3 className="mt-4 text-2xl font-black text-[#041614]">{selectedShipment.id}</h3>
                  <p className="mt-3 text-sm font-black text-[#1A5D56]">Driver: {selectedShipment.driver}</p>
                  <p className="mt-2 text-sm font-bold text-[#1A5D56]/80">Status: {selectedShipment.status}</p>
                  <p className="mt-2 text-sm font-bold text-[#1A5D56]/80">Region: {selectedShipment.region}</p>
                  <p className="mt-2 text-sm font-bold text-[#1A5D56]/80">ETA: {selectedShipment.eta}</p>
                  <p className="mt-2 text-sm font-bold text-[#1A5D56]/80">Last movement: {selectedShipment.lastUpdate}</p>
                </div>

                <div className="rounded-[2rem] border border-red-100 bg-white p-6">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Stuck Shipment Alerts
                  </p>
                  <div className="mt-4 space-y-3">
                    {stuckShipments.map((shipment) => (
                      <button key={shipment.id} type="button" onClick={() => setSelectedShipment(shipment)} className="block w-full rounded-2xl border border-red-100 bg-red-50 p-4 text-left">
                        <p className="text-sm font-black text-red-700">{shipment.id}</p>
                        <p className="mt-1 text-xs font-bold text-red-600">No movement for {shipment.lastUpdate}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Shipments List */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#041614]">Active Shipments</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {liveShipments.map((shipment, index) => (
                <Card key={index} className="bg-white rounded-[2rem] border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="p-6 border-b border-[#39B5A8]/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-[#041614]">{shipment.id}</CardTitle>
                        <p className="text-xs text-[#39B5A8] font-medium mt-1">{shipment.vehicle}</p>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter bg-blue-50 text-blue-600 border border-blue-100">
                        {shipment.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Driver Info */}
                    <div className="flex items-center gap-3 p-3 bg-[#F0F9F8]/50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {shipment.driver.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#041614]">{shipment.driver}</p>
                        <button className="flex items-center gap-1 text-xs text-[#39B5A8] font-medium hover:underline">
                          <Phone className="w-3 h-3" />
                          Contact Driver
                        </button>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">From</p>
                          <p className="text-sm font-bold text-[#041614]">{shipment.from}</p>
                        </div>
                      </div>
                      <div className="ml-1.5 h-8 w-[1px] bg-[#39B5A8]/20 border-l border-dashed border-[#39B5A8]"></div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">To</p>
                          <p className="text-sm font-bold text-[#041614]">{shipment.to}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#39B5A8]">Progress</span>
                        <span className="font-bold text-[#041614]">{shipment.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#39B5A8] to-[#2F9D91] rounded-full transition-all duration-500"
                          style={{ width: `${shipment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2 p-2 bg-[#F0F9F8]/30 rounded-lg">
                        <Clock className="w-4 h-4 text-[#39B5A8]" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</p>
                          <p className="text-xs font-bold text-[#041614]">{shipment.eta}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-[#F0F9F8]/30 rounded-lg">
                        <Navigation className="w-4 h-4 text-[#39B5A8]" />
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Distance</p>
                          <p className="text-xs font-bold text-[#041614]">{shipment.distance}</p>
                        </div>
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="pt-3 border-t border-[#39B5A8]/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Updated {shipment.lastUpdate}</span>
                      </div>
                      <button className="text-xs font-bold text-[#39B5A8] hover:underline">
                        View Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
