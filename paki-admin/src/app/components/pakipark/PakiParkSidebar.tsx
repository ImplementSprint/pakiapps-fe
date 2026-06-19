import { useState } from 'react';
import { useNavigate } from '../../lib/router';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  MapPin,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  Car,
  ClipboardCheck,
  FileCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { pakiParkLogo, pakiShipLogo } from '../../lib/assets';

interface PakiParkSidebarProps {
  activeTab:
    | 'dashboard'
    | 'bookings'
    | 'reservations'
    | 'parking-areas'
    | 'live-monitor'
    | 'analytics'
    | 'user-acceptance'
    | 'reports'
    | 'documents'
    | 'accounts'
    | 'profile'
    | 'settings';
}

export default function PakiParkSidebar({ activeTab }: PakiParkSidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const isSuperAdmin = user?.role === 'super-admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', path: '/pakipark/dashboard' },
    { id: 'bookings', icon: MapPin, label: 'Bookings', path: '/pakipark/bookings' },
    { id: 'reservations', icon: Car, label: 'Reservations', path: '/pakipark/reservations' },
    { id: 'parking-areas', icon: MapPin, label: 'Parking Areas', path: '/pakipark/parking-areas' },
    { id: 'live-monitor', icon: Activity, label: 'Live Monitor', path: '/pakipark/live-monitor' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics', path: '/pakipark/analytics' },
    ...(isSuperAdmin ? [{ id: 'user-acceptance', icon: ClipboardCheck, label: 'User Acceptance', path: '/pakipark/user-acceptance' }] : []),
    { id: 'reports', icon: TrendingUp, label: 'Reports', path: '/pakipark/reports' },
    ...(isSuperAdmin ? [
      { id: 'documents', icon: FileCheck, label: 'Document Review', path: '/pakipark/documents' },
      { id: 'accounts', icon: UserPlus, label: 'Account Management', path: '/pakipark/accounts' },
    ] : []),
  ];

  const systemItems = [
    { id: 'profile', icon: Users, label: 'My Profile', path: '/pakipark/profile' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/pakipark/settings' }
  ];

  const renderNavItem = (item: typeof navItems[0]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => navigate(item.path)}
        className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold tracking-tight transition-all group ${
          isActive
            ? 'bg-[#1e3d5a] text-white shadow-lg shadow-blue-900/20'
            : 'text-[#8492a6] hover:bg-[#f8fafc] hover:text-[#1e3d5a]'
        }`}
      >
        <div className={isActive ? 'text-white' : 'group-hover:text-[#ee6b20] transition-colors'}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="w-72 bg-white border-r border-[#e2e8f0] flex flex-col shadow-sm relative z-20">
      <div className="relative h-24 flex items-center justify-center px-8 border-b border-[#f1f5f9]">
        <button
          type="button"
          onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-[#f4f7fa]"
        >
          <img src={pakiParkLogo} alt="PakiPark Logo" className="h-10 object-contain" />
          <ChevronDown className={`h-4 w-4 text-[#1e3d5a] transition-transform ${isAppMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isAppMenuOpen && (
          <div className="absolute left-6 right-6 top-20 z-30 rounded-2xl border border-[#1e3d5a]/10 bg-white p-2 shadow-xl">
            <button
              type="button"
              onClick={() => setIsAppMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-[#f4f7fa] px-4 py-3 text-left"
            >
              <img src={pakiParkLogo} alt="PakiPark" className="h-7 w-auto" />
              <div>
                <p className="text-xs font-black text-[#1e3d5a]">PakiPark</p>
                <p className="text-[10px] font-bold text-[#ee6b20]">Parking</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAppMenuOpen(false);
                navigate('/pakiship/dashboard');
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-[#f4f7fa]"
            >
              <img src={pakiShipLogo} alt="PakiShip" className="h-7 w-auto" />
              <div>
                <p className="text-xs font-black text-[#1e3d5a]">PakiShip</p>
                <p className="text-[10px] font-bold text-gray-400">Logistics</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <div className="px-6 pt-5">
          <button
            type="button"
            onClick={() => navigate('/pakiadmin/super-admin')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#1e3d5a]/10 bg-white text-xs font-black uppercase tracking-[0.14em] text-[#1e3d5a] shadow-sm transition-colors hover:bg-[#f4f7fa]"
          >
            <ArrowLeft className="h-4 w-4" />
            Super Admin
          </button>
        </div>
      )}

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {navItems.map(renderNavItem)}
        <div className="pt-6 pb-2">
          <p className="px-4 text-[11px] font-black text-[#ee6b20] uppercase tracking-[0.15em] mb-4 opacity-70">
            System
          </p>
          <div className="space-y-2">
            {systemItems.map(renderNavItem)}
          </div>
        </div>
      </nav>

      <div className="p-6 border-t border-[#f1f5f9]">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start h-14 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold gap-3"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
