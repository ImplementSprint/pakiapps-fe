'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Car, TrendingUp, Settings, LogOut, Bell,
  AlertCircle, MapPin, Users, DollarSign, Menu, X, ChevronDown,
  User, CheckCircle, List, HelpCircle,
} from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { bookingService } from '@/services/bookingService';
import { authService } from '@/services/authService';
import { SmartParkingDashboard } from '@/components/SmartParkingDashboard';

// Sub-pages (lazy-loaded locally via state)
import AdminBookingsView   from './tabs/AdminBookingsView';
import AdminLocationsView  from './tabs/AdminLocationsView';
import AdminAnalyticsView  from './tabs/AdminAnalyticsView';
import AdminSettingsView   from './tabs/AdminSettingsView';

const LOGO_SRC          = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
const MASCOT_LOGOUT_SRC = '/assets/3ab94b49d340bf5c808a76004d2bebbd7166a97f.png';

export default function AdminHomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab]               = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dropdownOpen, setDropdownOpen]         = useState(false);
  const [showGuide, setShowGuide]               = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    name: typeof window !== 'undefined' ? (localStorage.getItem('userName') ?? 'Admin') : 'Admin',
    role: typeof window !== 'undefined' ? (localStorage.getItem('userRole') ?? 'admin') : 'admin',
    profilePicture: typeof window !== 'undefined' ? localStorage.getItem('adminProfilePicture') : null,
  });

  const refreshProfile = () => {
    setAdminProfile({
      name: localStorage.getItem('userName') ?? 'Admin',
      role: localStorage.getItem('userRole') ?? 'admin',
      profilePicture: localStorage.getItem('adminProfilePicture'),
    });
  };

  useEffect(() => {
    refreshProfile();
    window.addEventListener('focus', refreshProfile);
    window.addEventListener('storage', refreshProfile);
    return () => { window.removeEventListener('focus', refreshProfile); window.removeEventListener('storage', refreshProfile); };
  }, []);

  const [stats, setStats] = useState([
    { label: 'Total Bookings', value: '—', icon: Car,         color: '#0ea5e9', light: '#f0f9ff', change: '...' },
    { label: 'Active Users',   value: '—', icon: Users,       color: '#10b981', light: '#f0fdf8', change: '...' },
    { label: 'Parking Spots',  value: '—', icon: MapPin,      color: '#f59e0b', light: '#fffbeb', change: '...' },
    { label: 'Revenue',        value: '—', icon: DollarSign,  color: '#8b5cf6', light: '#f5f0ff', change: '...' },
  ]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    analyticsService.getDashboardStats().then(data => {
      if (!data) return;
      setStats([
        { label: 'Total Bookings', value: String(data.total ?? 0), icon: Car, color: '#0ea5e9', light: '#f0f9ff', change: `${data.active ?? 0} active` },
        { label: 'Upcoming',       value: String(data.upcoming ?? 0), icon: Users, color: '#10b981', light: '#f0fdf8', change: 'reserved' },
        { label: 'Completed',      value: String(data.completed ?? 0), icon: MapPin, color: '#f59e0b', light: '#fffbeb', change: 'done' },
        { label: 'Cancelled',      value: String(data.cancelled ?? 0), icon: DollarSign, color: '#8b5cf6', light: '#f5f0ff', change: 'forfeited' },
      ]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bookingService.getAllBookings({ page: 1 }).then(data => {
      if (data?.bookings?.length) {
        setRecentBookings(data.bookings.slice(0, 5).map((b: any) => ({
          id: b._id, customer: (b.userId as any)?.name ?? 'Customer',
          spot: b.spot, time: b.timeSlot?.split(' - ')[0] ?? '',
          status: b.status === 'upcoming' ? 'pending' : b.status, duration: '1 hr',
        })));
      }
    }).catch(() => {});
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
    { id: 'parking',   label: 'Parking Management', icon: Car },
    { id: 'bookings',  label: 'Booking Management', icon: List },
    { id: 'locations', label: 'Locations',           icon: MapPin },
    { id: 'analytics', label: 'Analytics',           icon: TrendingUp },
    { id: 'settings',  label: 'Settings',            icon: Settings },
  ];

  // Close profile dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel = adminProfile.role === 'business_partner' ? 'Business Partner'
                  : adminProfile.role === 'admin' ? 'PakiApps Super Admin' : adminProfile.role;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Guide Modal ──────────────────────────────────────────────────────── */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setShowGuide(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1e3d5a] text-white p-4 rounded-full shadow-lg border-[6px] border-white">
              <HelpCircle className="size-8" />
            </div>
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full">
              <X className="size-4" />
            </button>
            <h3 className="text-2xl font-black text-[#1e3d5a] text-center mt-6 mb-4">Admin Dashboard Guide</h3>
            <ul className="space-y-4 text-sm font-medium text-gray-600">
              <li className="flex items-start gap-4">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0"><MapPin className="size-5" /></div>
                <p><strong>Locations:</strong> Add new parking lots, specify rates, capacity, and auto-generate parking slot layouts.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0"><Users className="size-5" /></div>
                <p><strong>User Management:</strong> Under settings, you can assign roles like 'Teller' or 'Business Partner' to help manage terminal operations.</p>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-orange-50 text-[#ee6b20] p-2.5 rounded-xl shrink-0"><TrendingUp className="size-5" /></div>
                <p><strong>Analytics:</strong> Monitor active revenue and occupancy of your locations in real-time under the analytics tab.</p>
              </li>
            </ul>
            <button onClick={() => setShowGuide(false)} className="w-full mt-8 bg-[#ee6b20] hover:bg-[#d95a10] text-white font-bold py-4 rounded-2xl transition-colors shadow-lg">
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ── Logout Modal ─────────────────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 pt-20 relative">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-44 drop-shadow-2xl pointer-events-none">
              <Image src={MASCOT_LOGOUT_SRC} alt="Mascot" width={176} height={176} className="w-full h-auto" unoptimized />
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-[#1e3d5a] leading-tight">Admin Session <br />Ending?</h3>
              <p className="text-sm text-gray-500 font-medium px-2">Are you sure you want to exit the dashboard? Unsaved changes may be lost.</p>
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={() => { setShowLogoutConfirm(false); authService.logout(); }}
                className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white h-14 rounded-2xl font-black text-lg shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                Yes, Log Me Out
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full h-12 rounded-2xl font-bold text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-50 transition-colors">
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ────────────────────────────────────────────────────────────── */}
      <nav className="bg-[#1e3d5a] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-8">
              <button onClick={() => setActiveTab('dashboard')} className="cursor-pointer hover:opacity-80 transition-opacity">
                <Image src={LOGO_SRC} alt="PakiPark" width={120} height={48} className="h-14 object-contain brightness-0 invert" unoptimized />
              </button>
              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-1">
                {menuItems.map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm ${activeTab === item.id ? 'bg-[#ee6b20] text-white' : 'text-white/80 hover:bg-white/10'}`}>
                    <item.icon className="size-4" /><span className="font-medium whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setShowGuide(true)} className="hidden lg:flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white" title="Guide">
                <HelpCircle className="size-5" /><span className="text-sm font-medium">Guide</span>
              </button>
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="size-5 text-white" />
              </button>

              {/* Profile dropdown */}
              <div ref={dropdownRef} className="relative hidden lg:block">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="size-8 bg-[#ee6b20] rounded-full flex items-center justify-center overflow-hidden">
                    {adminProfile.profilePicture
                      ? <img src={adminProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      : <User className="size-5 text-white" />}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium text-sm leading-tight">{adminProfile.name}</span>
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-tight">{roleLabel}</span>
                  </div>
                  <ChevronDown className="size-4 text-white" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    <button onClick={() => { router.push('/admin/profile'); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors">
                      <User className="size-4 text-gray-400" /><span className="text-sm font-medium">Profile</span>
                    </button>
                    <button onClick={() => { setActiveTab('settings'); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors">
                      <Settings className="size-4 text-gray-400" /><span className="text-sm font-medium">Settings</span>
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={() => { setShowLogoutConfirm(true); setDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors">
                      <LogOut className="size-4" /><span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors">
                {mobileMenuOpen ? <X className="size-6 text-white" /> : <Menu className="size-6 text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/10 py-4">
              <div className="space-y-2">
                {menuItems.map(item => (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-[#ee6b20] text-white' : 'text-white/80 hover:bg-white/10'}`}>
                    <item.icon className="size-5" /><span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <button onClick={() => { setShowLogoutConfirm(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors">
                  <LogOut className="size-5" /><span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-[#1e3d5a] mb-2">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your parking facility today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="relative bg-white rounded-3xl border-2 border-[#f1f5f9] p-6 flex flex-col items-center text-center overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group">
                  <div className="absolute -top-6 -right-6 size-20 rounded-full transition-transform group-hover:scale-[2.2]" style={{ background: stat.color + '12' }} />
                  <div className="size-14 rounded-2xl flex items-center justify-center mb-4 relative z-10 transition-all" style={{ background: stat.light, boxShadow: `0 2px 8px ${stat.color}25`, color: stat.color }}>
                    <stat.icon className="size-6" />
                  </div>
                  <p className="text-2xl font-extrabold text-[#1e3d5a] mb-1 relative z-10">{stat.value}</p>
                  <p className="text-sm font-semibold text-gray-400 relative z-10 mb-2">{stat.label}</p>
                  <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full relative z-10" style={{ background: stat.color + '18', color: stat.color }}>{stat.change}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
                </div>
              ))}
            </div>

            {/* Recent Bookings + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3d5a]">Recent Bookings</h2>
                  <button onClick={() => setActiveTab('bookings')} className="flex items-center gap-1 px-3 py-1.5 border border-[#1e3d5a] text-[#1e3d5a] text-sm font-bold rounded-lg hover:bg-[#f4f7fa] transition-colors">
                    <List className="size-4" />View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>{['Customer','Spot','Time','Duration','Status'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentBookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-[#1e3d5a]">{b.customer}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-[#ee6b20]">{b.spot}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{b.time}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{b.duration}</td>
                          <td className="px-6 py-4">
                            {b.status === 'active' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><CheckCircle className="size-3" />Active</span>}
                            {b.status === 'completed' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><CheckCircle className="size-3" />Completed</span>}
                            {b.status === 'pending' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><AlertCircle className="size-3" />Pending</span>}
                          </td>
                        </tr>
                      ))}
                      {recentBookings.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No recent bookings</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-[#1e3d5a] mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button onClick={() => setActiveTab('bookings')} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ee6b20] hover:bg-[#d55f1c] text-white rounded-lg font-medium text-sm transition-colors">
                      <Car className="size-4" />New Booking
                    </button>
                    <button onClick={() => setActiveTab('parking')} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#1e3d5a] text-[#1e3d5a] rounded-lg font-medium text-sm hover:bg-[#f4f7fa] transition-colors">
                      <MapPin className="size-4" />Manage Slots
                    </button>
                    <button onClick={() => setActiveTab('analytics')} className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#1e3d5a] text-[#1e3d5a] rounded-lg font-medium text-sm hover:bg-[#f4f7fa] transition-colors">
                      <TrendingUp className="size-4" />View Analytics
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-[#1e3d5a] mb-4">System Status</h3>
                  <div className="space-y-3">
                    {[['Server Status','Active'],['Payment Gateway','Active'],['Database','Connected']].map(([k,v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{k}</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600"><div className="size-2 bg-green-600 rounded-full" />{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parking'   && <SmartParkingDashboard />}
        {activeTab === 'bookings'  && <AdminBookingsView />}
        {activeTab === 'locations' && <AdminLocationsView />}
        {activeTab === 'analytics' && <AdminAnalyticsView />}
        {activeTab === 'settings'  && <AdminSettingsView />}
      </main>
    </div>
  );
}
