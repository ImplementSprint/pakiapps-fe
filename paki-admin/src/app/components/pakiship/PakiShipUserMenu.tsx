import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from '../../lib/router';

/** Shared PakiShip top-bar account menu (avatar + Profile/Settings/Logout dropdown). */
export function PakiShipUserMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-[#F0F9F8] px-3 py-2 rounded-xl transition-all"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#39B5A8]/20">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden md:block min-w-max">
          <p className="text-sm font-bold text-[#041614] leading-tight whitespace-nowrap">{name}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#1A5D56] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
          <button
            onClick={() => { setIsOpen(false); navigate('/pakiship/profile'); }}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
          >
            <User className="w-4 h-4 text-[#39B5A8]" />
            <span className="font-semibold text-[#041614]">Profile</span>
          </button>
          <button
            onClick={() => { setIsOpen(false); navigate('/pakiship/settings'); }}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-[#39B5A8]" />
            <span className="font-semibold text-[#041614]">Settings</span>
          </button>
          <div className="border-t border-[#39B5A8]/10"></div>
          <button
            onClick={() => { setIsOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-500">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
