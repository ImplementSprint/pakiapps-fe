import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Plus,
  MapPin,
  Car,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Wrench,
  Loader2,
  DollarSign
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from '../../components/ui/card';
import { Badge } from "../../components/ui/badge";
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';

// MODAL IMPORT
import AddNewHub from './components/AddNewHub';

export default function BookingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hubs, setHubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const displayName = user?.name || 'Admin';

  const fetchHubs = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      const { data, error } = await supabase.schema('parking_lot').rpc('get_locations_with_stats');
      if (!error && data) {
        setHubs(data);
      } else if (error) {
        console.error("Error fetching hubs:", error.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleHubStatus = async (id: string, currentActive: boolean) => {
    // Optimistic UI update
    setHubs(prev => prev.map(h => h.id === id ? { ...h, is_active: !currentActive } : h));
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase
        .schema('parking_lot')
        .from('locations')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) {
        console.error("Failed to update status:", error.message);
        fetchHubs(); // rollback
      }
    } catch (e) {
      console.error(e);
      fetchHubs();
    }
  };

  // Filtered hubs based on search query
  const filteredHubs = useMemo(() => {
    return hubs.filter(hub => 
      (hub.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hub.status || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [hubs, searchQuery]);

  // Summary Metrics
  const totalCapacity = useMemo(() => hubs.reduce((acc, h) => acc + (h.total_spots || 0), 0), [hubs]);
  const totalOccupied = useMemo(() => hubs.reduce((acc, h) => acc + ((h.total_spots || 0) - (h.available_spots || 0)), [hubs]), [hubs]);
  const avgOccupancy = useMemo(() => totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0, [totalCapacity, totalOccupied]);
  const activeHubsCount = useMemo(() => hubs.filter(h => h.is_active).length, [hubs]);

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans overflow-hidden text-[#1e3d5a]">
      <AddNewHub isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); fetchHubs(); }} />
      <PakiParkSidebar activeTab="bookings" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* --- NAVBAR --- */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
              <Search className="w-4 h-4 text-[#1e3d5a]/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search smart parking hubs by name or status..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#1e3d5a]/10"></div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#1e3d5a] leading-tight whitespace-nowrap">{displayName}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <User className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Profile</span>
                  </button>
                  <button onClick={() => { setIsUserMenuOpen(false); navigate('/pakipark/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
                    <Settings className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Settings</span>
                  </button>
                  <div className="border-t border-[#1e3d5a]/10"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN CONTENT BODY --- */}
        <main className="flex-1 overflow-auto p-10 space-y-8 csb">
          <section className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1e3d5a] tracking-tight">Smart Parking Hubs</h1>
              <p className="text-[#1e3d5a] opacity-70 font-medium italic">Deploy, configure, and monitor physical nodes across the PakiPark network.</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#ee6b20] hover:bg-[#ff7a2e] text-white font-black rounded-xl h-12 px-6 uppercase text-[11px] tracking-widest shadow-lg shadow-orange-900/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Deploy New Hub
            </Button>
          </section>

          {/* --- METRICS ROW --- */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm rounded-[24px] bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Facilities</p>
                  <h2 className="text-2xl font-black text-[#1e3d5a]">{activeHubsCount} / {hubs.length}</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[24px] bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-[#ee6b20] rounded-xl">
                  <Car size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Slot Capacity</p>
                  <h2 className="text-2xl font-black text-[#1e3d5a]">{totalCapacity} spots</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[24px] bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupied Slots</p>
                  <h2 className="text-2xl font-black text-[#1e3d5a]">{totalOccupied} vehicles</h2>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[24px] bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <Zap size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Occupancy</p>
                  <h2 className="text-2xl font-black text-[#1e3d5a]">{avgOccupancy.toFixed(1)}%</h2>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* --- HUBS LIST GRID --- */}
          <section>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#ee6b20]" />
                <p className="text-sm font-bold text-[#1e3d5a]/60">Loading smart nodes...</p>
              </div>
            ) : filteredHubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredHubs.map((hub) => {
                  const occupied = (hub.total_spots || 0) - (hub.available_spots || 0);
                  const pct = hub.total_spots > 0 ? (occupied / hub.total_spots) * 100 : 0;
                  const isDeadlock = pct >= 95;
                  const isNearDeadlock = pct >= 85 && pct < 95;

                  return (
                    <Card key={hub.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300">
                      <CardHeader className="p-6 pb-2 border-b border-[#f4f7fa]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-[#ee6b20] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">
                            Node ID: {hub.id.substring(0, 6).toUpperCase()}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            hub.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {hub.is_active ? 'Active' : 'Maintenance'}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold text-[#1e3d5a] group-hover:text-[#ee6b20] transition-colors line-clamp-1">
                          {hub.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={12} className="text-[#ee6b20]" /> Metro Manila Hub
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Rate Tariff</span>
                            <span className="text-[#1e3d5a] font-black">₱50 / hour</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-400">Capacity Ratio</span>
                            <span className="text-[#1e3d5a] font-black">{occupied} / {hub.total_spots} spots</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-[#1e3d5a]/40">
                              <span>Occupancy</span>
                              <span className={isDeadlock ? 'text-red-500' : isNearDeadlock ? 'text-amber-500' : 'text-emerald-500'}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[#f4f7fa] rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${pct}%`,
                                  background: isDeadlock ? '#ef4444' : isNearDeadlock ? '#ee6b20' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Toggles */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#f4f7fa]">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            {hub.is_active ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-500" /> Operational
                              </>
                            ) : (
                              <>
                                <Wrench size={12} className="text-amber-500" /> Offline Mode
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => toggleHubStatus(hub.id, hub.is_active)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                              hub.is_active 
                                ? 'bg-white hover:bg-red-50 border-red-100 text-red-500' 
                                : 'bg-[#1e3d5a] hover:bg-[#2a5373] border-[#1e3d5a] text-white'
                            }`}
                          >
                            {hub.is_active ? 'Go Offline' : 'Activate Node'}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-[#1e3d5a]/5 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-[#1e3d5a]/20 mx-auto mb-3" />
                <p className="text-sm font-black text-[#1e3d5a]/60 uppercase tracking-widest">No hubs found</p>
                <p className="text-xs text-gray-400 mt-1">Try refining your search filter query.</p>
              </div>
            )}
          </section>
        </main>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.csb::-webkit-scrollbar{width:5px}.csb::-webkit-scrollbar-thumb{background:#1e3d5a20;border-radius:8px}` }} />
    </div>
  );
}
