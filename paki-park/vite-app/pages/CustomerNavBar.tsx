import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Car, History, Bell, User, ChevronDown, LogOut, Settings, X, Menu } from 'lucide-react';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import mascotLogout from '../../assets/3ab94b49d340bf5c808a76004d2bebbd7166a97f.png';
import { Button } from '../components/ui/button';

interface NavBarProps {
  activeTab: 'home' | 'bookings' | 'settings';
  setActiveTab: (tab: 'home' | 'bookings' | 'settings') => void;
  userName: string;
  profilePicture: string | null;
  unreadCount: number;
  notifications: any[];
  markAllRead: () => void;
  onLogout: () => void;
}

export function CustomerNavBar({ 
  activeTab, 
  setActiveTab, 
  userName: initialUserName, 
  profilePicture: initialProfilePicture, 
  unreadCount, 
  notifications, 
  markAllRead,
  onLogout 
}: NavBarProps) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // State for dynamic profile picture and name
  const [profilePicture, setProfilePicture] = useState<string | null>(initialProfilePicture);
  const [currentUserName, setCurrentUserName] = useState<string>(initialUserName);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for storage changes to update profile dynamically
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedPicture = localStorage.getItem('customerProfilePicture');
      setProfilePicture(updatedPicture);

      const updatedName = localStorage.getItem('userName');
      if (updatedName) {
        setCurrentUserName(updatedName);
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  if (location.pathname.includes('/profile')) {
    return null;
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: Car },
    { id: 'bookings', label: 'My Bookings', icon: History },
  ];

  return (
    <>
      <nav className="bg-[#1e3d5a] h-20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
          
          {/* Logo and Desktop Links */}
          <div className="flex items-center gap-8">
            <img 
              src={logo} 
              alt="PakiPark" 
              className="h-12 brightness-0 invert cursor-pointer" 
              onClick={() => setActiveTab('home')} 
            />
            
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-bold ${
                    activeTab === item.id 
                      ? 'bg-[#ee6b20] text-white shadow-md' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-white/80 p-2">
                <Bell className="size-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 size-2.5 bg-[#ee6b20] rounded-full border-2 border-[#1e3d5a]" />}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-[#1e3d5a]">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-[#ee6b20] font-bold">Mark all as read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b last:border-0 ${!n.isRead ? 'bg-orange-50/30' : ''}`}>
                        <p className="text-sm font-bold text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative hidden lg:block" ref={profileDropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
                <div className="size-9 bg-[#ee6b20] rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-5 text-white" />
                  )}
                </div>
                <span className="text-white text-sm font-bold capitalize">{currentUserName}</span>
                <ChevronDown className={`size-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-gray-100">
                  <button 
                    onClick={() => { 
                      setDropdownOpen(false); 
                      navigate('/customer/profile'); 
                    }} 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <User size={16}/> Profile
                  </button>
                  <button 
                    onClick={() => { 
                      setDropdownOpen(false); 
                      setActiveTab('settings'); 
                    }} 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings size={16}/> Settings
                  </button>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowLogoutConfirm(true);
                    }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
                  >
                    <LogOut size={16}/> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b shadow-2xl p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold ${activeTab === item.id ? 'bg-orange-50 text-[#ee6b20]' : 'text-[#1e3d5a]'}`}
              >
                <item.icon size={20} /> {item.label}
              </button>
            ))}
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/customer/profile');
              }} 
              className="w-full flex items-center gap-3 p-4 text-[#1e3d5a] font-bold border-t"
            >
              <User size={20} /> Profile
            </button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }} 
              className="w-full flex items-center gap-3 p-4 text-red-600 font-bold border-t"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        )}
      </nav>

      {/* Overflow Mascot Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 pt-16 relative animate-in fade-in zoom-in duration-300">
            {/* Mascot Peeking/Overflowing from the box */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 drop-shadow-2xl">
              <img 
                src={mascotLogout}
                alt="Mascot" 
                className="w-full h-auto animate-bounce-subtle"
              />
            </div>

            <div className="text-center space-y-4">
              <h3 className="text-2xl pt-13 font-black text-[#1e3d5a]">Leaving So Soon?</h3>
              <p className="text-gray-500 font-medium">
                Are you sure you want to log out? We'll miss having you around!
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <Button
                onClick={onLogout}
                className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white h-12 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:scale-[1.02]"
              >
                Yes, Log Me Out
              </Button>
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                variant="ghost"
                className="w-full h-12 rounded-xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
