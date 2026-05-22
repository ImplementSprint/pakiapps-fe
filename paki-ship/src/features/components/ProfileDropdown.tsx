import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

interface ProfileDropdownProps {
  userName: string;
  profileImage: string | null;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}

export function ProfileDropdown({
  userName,
  profileImage,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#39B5A8]/5 rounded-full transition-colors border border-[#39B5A8]/20 group"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#39B5A8]/20 group-hover:border-[#39B5A8] transition-all shrink-0">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#E6F4F2] flex items-center justify-center">
              <User className="w-4 h-4 text-[#39B5A8]" />
            </div>
          )}
        </div>
        <span className="text-sm font-bold text-[#041614] hidden sm:block max-w-[100px] truncate">
          {userName}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-[#39B5A8] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#39B5A8]/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
            className="w-full px-5 py-3.5 hover:bg-[#F0F9F8] transition-colors flex items-center gap-3 text-left border-b border-gray-100"
          >
            <div className="w-9 h-9 rounded-full bg-[#E6F4F2] flex items-center justify-center">
              <User className="w-4 h-4 text-[#39B5A8]" />
            </div>
            <span className="text-sm font-bold text-[#041614]">Profile</span>
          </button>

          <button
            onClick={() => {
              onSettingsClick();
              setIsOpen(false);
            }}
            className="w-full px-5 py-3.5 hover:bg-[#F0F9F8] transition-colors flex items-center gap-3 text-left border-b border-gray-100"
          >
            <div className="w-9 h-9 rounded-full bg-[#E6F4F2] flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#39B5A8]" />
            </div>
            <span className="text-sm font-bold text-[#041614]">Settings</span>
          </button>

          <button
            onClick={() => {
              onLogoutClick();
              setIsOpen(false);
            }}
            className="w-full px-5 py-3.5 hover:bg-red-50 transition-colors flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-bold text-red-500">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
