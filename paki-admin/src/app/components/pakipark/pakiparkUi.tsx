import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut, Search, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useNavigate } from '../../lib/router';
import { Card, CardContent } from '../ui/card';

/** Shared PakiPark top-bar account menu (avatar + Profile/Settings/Logout dropdown). */
export function PakiParkUserMenu({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all">
        <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-bold text-[#1e3d5a] hidden md:block">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
          <button onClick={() => { setIsOpen(false); navigate('/pakipark/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"><User className="w-4 h-4 text-[#ee6b20]" /><span className="font-semibold text-[#1e3d5a]">Profile</span></button>
          <button onClick={() => { setIsOpen(false); navigate('/pakipark/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left"><Settings className="w-4 h-4 text-[#ee6b20]" /><span className="font-semibold text-[#1e3d5a]">Settings</span></button>
          <div className="border-t border-[#1e3d5a]/10" />
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left"><LogOut className="w-4 h-4 text-red-500" /><span className="font-semibold text-red-500">Logout</span></button>
        </div>
      )}
    </div>
  );
}

/** Shared PakiPark search header (search box + success toast + account menu) for Accounts/Documents. */
export function PakiParkSearchHeader({
  searchValue,
  onSearchChange,
  placeholder,
  successMsg,
  displayName,
  onLogout,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
  successMsg?: string;
  displayName: string;
  onLogout: () => void;
}) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-80">
        <Search className="w-4 h-4 text-[#1e3d5a]/60" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium text-[#1e3d5a]"
        />
      </div>
      <div className="flex items-center gap-4">
        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /><span className="text-sm font-bold">{successMsg}</span>
          </div>
        )}
        <PakiParkUserMenu displayName={displayName} onLogout={onLogout} />
      </div>
    </header>
  );
}

/** Larger PakiPark header account menu (with divider + wide dropdown) used on Bookings/Reports. */
export function PakiParkHeaderUserMenu({ displayName, onLogout }: { displayName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-6">
      <div className="h-8 w-[1px] bg-[#1e3d5a]/10"></div>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden md:block min-w-max">
            <p className="text-sm font-bold text-[#1e3d5a] leading-tight whitespace-nowrap">{displayName}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-50">
            <button onClick={() => { setIsOpen(false); navigate('/pakipark/profile'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
              <User className="w-4 h-4 text-[#ee6b20]" />
              <span className="font-semibold text-[#1e3d5a]">Profile</span>
            </button>
            <button onClick={() => { setIsOpen(false); navigate('/pakipark/settings'); }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] text-left">
              <Settings className="w-4 h-4 text-[#ee6b20]" />
              <span className="font-semibold text-[#1e3d5a]">Settings</span>
            </button>
            <div className="border-t border-[#1e3d5a]/10"></div>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-left">
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-red-500">Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Shared PakiPark dashboard stat card (icon tile + value + label). */
export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Card className="bg-white rounded-[2rem] border-none shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-3xl font-black text-[#1e3d5a]">{value}</p>
          <p className="text-xs font-bold text-[#1e3d5a]/50 uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
