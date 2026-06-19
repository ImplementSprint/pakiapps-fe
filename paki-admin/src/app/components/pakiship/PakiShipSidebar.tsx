import { useState } from 'react';
import { useNavigate } from '../../lib/router';
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Truck,
  Settings,
  LogOut,
  LayoutDashboard,
  Store,
  User,
  Users,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { pakiParkLogo, pakiShipLogo } from '../../lib/assets';

interface PakiShipSidebarProps {
  activeTab:
    | 'dashboard'
    | 'shipments'
    | 'drivers'
    | 'drop-off-operators'
    | 'analytics'
    | 'tracking'
    | 'profile'
    | 'settings'
    | 'user-acceptance';
}

export default function PakiShipSidebar({ activeTab }: PakiShipSidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const isSuperAdmin = user?.role === 'super-admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-72 bg-white border-r border-[#39B5A8]/10 flex flex-col shadow-xl shadow-[#39B5A8]/5">
      <div className="relative p-8">
        <button
          type="button"
          onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
          className="mx-auto flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-[#F0F9F8]"
        >
          <img src={pakiShipLogo} alt="PakiShip Logo" className="h-12 w-auto object-contain" />
          <ChevronDown className={`h-4 w-4 text-[#1A5D56] transition-transform ${isAppMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {isAppMenuOpen && (
          <div className="absolute left-6 right-6 top-24 z-30 rounded-2xl border border-[#39B5A8]/10 bg-white p-2 shadow-xl">
            <button
              type="button"
              onClick={() => setIsAppMenuOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl bg-[#F0F9F8] px-4 py-3 text-left"
            >
              <img src={pakiShipLogo} alt="PakiShip" className="h-7 w-auto" />
              <div>
                <p className="text-xs font-black text-[#041614]">PakiShip</p>
                <p className="text-[10px] font-bold text-[#39B5A8]">Logistics</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAppMenuOpen(false);
                navigate('/pakipark/dashboard');
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-[#F0F9F8]"
            >
              <img src={pakiParkLogo} alt="PakiPark" className="h-7 w-auto" />
              <div>
                <p className="text-xs font-black text-[#041614]">PakiPark</p>
                <p className="text-[10px] font-bold text-gray-400">Parking</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin && (
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => navigate('/pakiadmin/super-admin')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[#39B5A8]/10 bg-white text-xs font-black uppercase tracking-[0.14em] text-[#1A5D56] shadow-sm transition-colors hover:bg-[#F0F9F8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Super Admin
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2">
        <NavButton
          active={activeTab === 'dashboard'}
          onClick={() => navigate('/pakiship/dashboard')}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
        />
        <NavButton
          active={activeTab === 'shipments'}
          onClick={() => navigate('/pakiship/shipments')}
          icon={<Truck className="w-5 h-5" />}
          label="Shipments"
        />
        <NavButton
          active={activeTab === 'drivers'}
          onClick={() => navigate('/pakiship/drivers')}
          icon={<Users className="w-5 h-5" />}
          label="Drivers"
        />
        <NavButton
          active={activeTab === 'drop-off-operators'}
          onClick={() => navigate('/pakiship/drop-off-operators')}
          icon={<Store className="w-5 h-5" />}
          label="Drop-Off Operators"
        />
        <NavButton
          active={activeTab === 'analytics'}
          onClick={() => navigate('/pakiship/analytics')}
          icon={<BarChart3 className="w-5 h-5" />}
          label="Analytics"
        />
        <NavButton
          active={activeTab === 'user-acceptance'}
          onClick={() => navigate('/pakiship/user-acceptance')}
          icon={<UserCheck className="w-5 h-5" />}
          label="User Acceptance"
        />

        <div className="pt-4 pb-2 px-4">
          <span className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest opacity-60">System</span>
        </div>
        <NavButton
          active={activeTab === 'profile'}
          onClick={() => navigate('/pakiship/profile')}
          icon={<User className="w-5 h-5" />}
          label="My Profile"
        />
        <NavButton
          active={activeTab === 'settings'}
          onClick={() => navigate('/pakiship/settings')}
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
      </nav>

      <div className="p-6 border-t border-[#39B5A8]/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold text-sm group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-6 py-4 rounded-[1.25rem] transition-all font-bold text-sm ${
        active
          ? 'bg-[#F0F9F8] text-[#39B5A8] shadow-sm'
          : 'text-gray-400 hover:text-[#1A5D56] hover:bg-gray-50'
      }`}
    >
      <span className={active ? 'text-[#39B5A8]' : 'text-gray-400'}>{icon}</span>
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-[#39B5A8] rounded-full" />}
    </button>
  );
}
