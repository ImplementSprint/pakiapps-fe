import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { CustomerNavBar } from './CustomerNavBar';
import { authService } from '../services/authService';

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Layout State Management ---
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'settings'>('home');
  const [userName] = useState('Guest User');
  const [unreadCount, setUnreadCount] = useState(2);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Booking Confirmed', message: 'Your spot at SM City is ready.', isRead: false },
    { id: 2, title: 'Payment Success', message: 'Transaction PKP-1234 successful.', isRead: false },
  ]);

  // Sync the orange active button state with the current URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/customer/home')) setActiveTab('home');
    else if (path.includes('/customer/bookings')) setActiveTab('bookings');
    else if (path.includes('/customer/settings')) setActiveTab('settings');
    // Note: If the user is on /customer/profile, no tab will be highlighted as orange, which is standard design.
  }, [location.pathname]);

  // Handle Tab Switching & Navigation
  const handleTabChange = (tab: 'home' | 'bookings' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'home') navigate('/customer/home');
    if (tab === 'bookings') navigate('/customer/bookings');
    if (tab === 'settings') navigate('/customer/settings'); // Now routes to Settings!
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* This is your custom blue NavBar. 
        It stays fixed at the top across all customer pages.
      */}
      <CustomerNavBar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userName={userName}
        profilePicture={null}
        unreadCount={unreadCount}
        notifications={notifications}
        markAllRead={handleMarkAllRead}
        onLogout={handleLogout}
      />

      {/* The "Outlet" is where Home.tsx, MyBookings.tsx, CustomerSettings.tsx etc. render. */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
