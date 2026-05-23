import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  Car,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Users,
  DollarSign,
  Menu,
  X,
  ChevronDown,
  User,
  Lock,
  CreditCard,
  ShieldCheck,
  UserCog,
  Sliders,
  Save,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  List,
  HelpCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import mascotLogout from '../../assets/3ab94b49d340bf5c808a76004d2bebbd7166a97f.png';
import { SmartParkingDashboard } from "../components/SmartParkingDashboard";
import { AdminSettings } from "./AdminSettings";
import { AdminBookings } from "./AdminBookings";
import { AdminAnalytics } from "./AdminAnalytics";
import { AdminLocations } from "./AdminLocations";
import { AdminTutorial } from "../components/AdminTutorial";
import {
  NotificationCenter,
  getUnreadCount,
} from "../components/NotificationCenter";
import { analyticsService } from "../services/analyticsService";
import { bookingService } from "../services/bookingService";
import { authService } from "../services/authService";
import { BackendStatus } from "../components/BackendStatus";

export function AdminHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSettingsPage, setActiveSettingsPage] = useState<
    string | null
  >(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  // Profile data from localStorage
  const [adminProfile, setAdminProfile] = useState({
    name: localStorage.getItem("userName") || "Admin",
    profilePicture:
      localStorage.getItem("adminProfilePicture") || null,
    role: localStorage.getItem("userRole") || "admin",
  });

  // Check if this is the first time the admin is logging in
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(
      "adminTutorialCompleted",
    );
    const isFirstLogin = localStorage.getItem(
      "adminFirstLoginShown",
    );

    if (!tutorialCompleted && !isFirstLogin) {
      // Show tutorial for first-time login
      setShowTutorial(true);
      localStorage.setItem("adminFirstLoginShown", "true");
    }
  }, []);

  // Update profile data when component mounts or when navigating back to this page
  const refreshProfile = () => {
    setAdminProfile({
      name: localStorage.getItem("userName") || "Admin",
      profilePicture:
        localStorage.getItem("adminProfilePicture") || null,
      role: localStorage.getItem("userRole") || "admin",
    });
  };

  // Refresh profile data on mount and when navigating back
  useEffect(() => {
    refreshProfile();

    // Listen for focus events (when user navigates back to this page)
    const handleFocus = () => {
      refreshProfile();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", refreshProfile);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", refreshProfile);
    };
  }, []);

  // Parking Rates State
  const [parkingRates, setParkingRates] = useState(() => {
    const saved = localStorage.getItem("parkingRates");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            vehicleType: "Sedan",
            hourlyRate: 50,
            dailyRate: 300,
          },
          {
            id: 2,
            vehicleType: "SUV",
            hourlyRate: 75,
            dailyRate: 450,
          },
          {
            id: 3,
            vehicleType: "Motorcycle",
            hourlyRate: 30,
            dailyRate: 180,
          },
        ];
  });
  const [editingRate, setEditingRate] = useState<any>(null);
  const [showRateModal, setShowRateModal] = useState(false);

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem("paymentMethods");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "GCash",
            enabled: true,
            processingFee: "2%",
          },
          {
            id: 2,
            name: "PayMaya",
            enabled: true,
            processingFee: "2.5%",
          },
          {
            id: 3,
            name: "Credit/Debit Card",
            enabled: true,
            processingFee: "3%",
          },
          {
            id: 4,
            name: "Cash on Site",
            enabled: true,
            processingFee: "None",
          },
        ];
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState(
    () => {
      const saved = localStorage.getItem("securitySettings");
      return saved
        ? JSON.parse(saved)
        : {
            twoFactorAuth: false,
            sessionTimeout: 30,
            passwordExpiry: 90,
            loginAttempts: 5,
          };
    },
  );

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] =
    useState(() => {
      const saved = localStorage.getItem(
        "notificationSettings",
      );
      return saved
        ? JSON.parse(saved)
        : {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            bookingAlerts: true,
            paymentAlerts: true,
            systemAlerts: true,
          };
    });

  // User Management State
  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem("adminUsers");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: "Admin User",
            email: "admin@pakipark.com",
            role: "Super Admin",
            status: "Active",
          },
          {
            id: 2,
            name: "John Manager",
            email: "john@pakipark.com",
            role: "Manager",
            status: "Active",
          },
          {
            id: 3,
            name: "Jane Staff",
            email: "jane@pakipark.com",
            role: "Staff",
            status: "Active",
          },
        ];
  });

  // System Preferences State
  const [systemPreferences, setSystemPreferences] = useState(
    () => {
      const saved = localStorage.getItem("systemPreferences");
      return saved
        ? JSON.parse(saved)
        : {
            parkingName: "PakiPark Main Facility",
            timezone: "Asia/Manila",
            currency: "PHP",
            operatingHours: "24/7",
            maxBookingDays: 30,
            cancellationWindow: 24,
          };
    },
  );

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    // Small delay so the modal closes visually before the page unloads
    setTimeout(() => {
      authService.logout();
    }, 120);
  };

  const [stats, setStats] = useState([
    {
      label: "Total Bookings",
      value: "1,234",
      icon: Car,
      color: "#0ea5e9",
      light: "#f0f9ff",
      change: "+12%",
    },
    {
      label: "Active Users",
      value: "856",
      icon: Users,
      color: "#10b981",
      light: "#f0fdf8",
      change: "+8%",
    },
    {
      label: "Parking Spots",
      value: "45",
      icon: MapPin,
      color: "#f59e0b",
      light: "#fffbeb",
      change: "+3",
    },
    {
      label: "Revenue",
      value: "₱125,450",
      icon: DollarSign,
      color: "#8b5cf6",
      light: "#f5f0ff",
      change: "+15%",
    },
  ]);

  // Fetch dashboard stats from API
  useEffect(() => {
    analyticsService.getDashboardStats().then((data) => {
      if (data) {
        setStats([
          {
            label: "Total Bookings",
            value: data.totalBookings?.toLocaleString() || "0",
            icon: Car,
            color: "#0ea5e9",
            light: "#f0f9ff",
            change: "+12%",
          },
          {
            label: "Active Users",
            value: data.activeUsers?.toLocaleString() || "0",
            icon: Users,
            color: "#10b981",
            light: "#f0fdf8",
            change: "+8%",
          },
          {
            label: "Parking Spots",
            value: data.parkingSpots?.toLocaleString() || "0",
            icon: MapPin,
            color: "#f59e0b",
            light: "#fffbeb",
            change: `+${data.totalLocations || 0}`,
          },
          {
            label: "Revenue",
            value: `₱${data.revenue?.toLocaleString() || "0"}`,
            icon: DollarSign,
            color: "#8b5cf6",
            light: "#f5f0ff",
            change: "+15%",
          },
        ]);
      }
    }).catch((err: any) => {
      // Silently ignore access-denied errors — keep fallback stats
      if (!err?.message?.includes('Access denied')) {
        setApiError(err?.message || 'Failed to load dashboard data');
      }
    });
  }, []);

  const mockRecentBookings: any[] = [];
  const [recentBookings, setRecentBookings] = useState(mockRecentBookings);

  // Fetch recent bookings from API (admin view)
  useEffect(() => {
    bookingService.getAllBookings({ page: 1 }).then((data) => {
      if (data?.bookings && data.bookings.length > 0) {
        setRecentBookings(
          data.bookings.slice(0, 5).map((b: any) => ({
            id: b._id,
            customer: b.userId?.name || "Customer",
            spot: b.spot,
            time: b.timeSlot?.split(" - ")[0] || "",
            status: b.status === "upcoming" ? "pending" : b.status,
            duration: "1 hr",
          })),
        );
      }
    }).catch((err: any) => {
      // Silently ignore access-denied errors — keep fallback bookings
      if (!err?.message?.includes('Access denied')) {
        setApiError(err?.message || 'Failed to load bookings');
      }
    });
  }, []);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { id: "parking", label: "Parking Management", icon: Car },
    { id: "bookings", label: "Booking Management", icon: List },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  // Update unread notification count
  useEffect(() => {
    const count = getUnreadCount();
    setUnreadCount(count);

    // Listen for storage changes to update count
    const handleStorageChange = () => {
      const newCount = getUnreadCount();
      setUnreadCount(newCount);
    };

    window.addEventListener("storage", handleStorageChange);

    // Poll for updates every 2 seconds
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
      clearInterval(interval);
    };
  }, []);

  // Update count when closing notifications
  useEffect(() => {
    if (!showNotifications) {
      const count = getUnreadCount();
      setUnreadCount(count);
    }
  }, [showNotifications]);

  return (
    <div className="min-h-screen bg-gray-50">
      {apiError && (
        <BackendStatus
          error={apiError}
          onRetry={() => { setApiError(null); window.location.reload(); }}
        />
      )}
      {!apiError && (
        <>
          {/* Overflow Mascot Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 pt-20 relative animate-in fade-in zoom-in duration-300">
                {/* Mascot Peeking/Overflowing from the box */}
                <div className="absolute -top-33 left-1/2 -translate-x-1/2 w-52 drop-shadow-2xl">
                  <img
                    src={mascotLogout}
                    alt="Mascot"
                    className="w-full h-auto animate-bounce-subtle"
                  />
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black text-[#1e3d5a] leading-tight">
                    Admin Session <br /> Ending?
                  </h3>
                  <p className="text-sm text-gray-500 font-medium px-2">
                    Are you sure you want to exit the dashboard?
                    Unsaved administrative changes may be lost.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={confirmLogout}
                    className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white h-14 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Yes, Log Me Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full h-12 rounded-2xl font-bold text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-50 transition-colors"
                  >
                    Stay Logged In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Navigation Bar */}
          <nav className="bg-[#1e3d5a] shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                {/* Logo */}
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={logo}
                      alt="PakiPark"
                      className="h-14 brightness-0 invert"
                      data-tutorial="logo"
                    />
                  </button>

                  {/* Desktop Navigation */}
                  <div className="hidden lg:flex items-center gap-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        data-tutorial={`${item.id}-tab`}
                        className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-colors text-sm ${
                          activeTab === item.id
                            ? "bg-[#ee6b20] text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <item.icon className="size-4" />
                        <span className="font-medium whitespace-nowrap">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-6">
                  {/* Guide Button */}
                  <button
                    onClick={() => setShowTutorial(true)}
                    data-tutorial="guide-button"
                    className="hidden lg:flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
                    title="Open Tutorial Guide"
                  >
                    <HelpCircle className="size-5" />
                    <span className="text-sm font-medium">
                      Guide
                    </span>
                  </button>

                  {/* Notifications */}
                  <button
                    onClick={() =>
                      setShowNotifications(!showNotifications)
                    }
                    className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Bell className="size-5 text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 size-2 bg-[#ee6b20] rounded-full"></span>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  <div className="relative hidden lg:block">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="size-8 bg-[#ee6b20] rounded-full flex items-center justify-center overflow-hidden">
                        {adminProfile.profilePicture ? (
                          <img
                            src={adminProfile.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="size-5 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white font-medium text-sm leading-tight">
                          {adminProfile.name}
                        </span>
                        <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest leading-tight">
                          {adminProfile.role === 'business_partner' ? 'Business Partner' :
                           adminProfile.role === 'admin' ? 'PakiApps Super Admin' : adminProfile.role}
                        </span>
                      </div>
                      <ChevronDown className="size-4 text-white" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            navigate("/admin/profile");
                            setDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                        >
                          <User className="size-4 text-gray-400" />
                          <span className="text-md font-medium">
                            Profile
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("settings");
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                            activeTab === "settings"
                              ? "bg-orange-50 text-[#ee6b20]"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <Settings
                            className={`size-4 ${
                              activeTab === "settings"
                                ? "text-[#ee6b20]"
                                : "text-gray-400"
                            }`}
                          />
                          <span className="text-md font-medium">
                            Settings
                          </span>
                        </button>

                        <div className="my-1 border-t border-gray-100" />

                        <button
                          onClick={() => {
                            setShowLogoutConfirm(true); // Triggers the new Mascot Modal
                            setDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
                        >
                          <LogOut className="size-4" />
                          <span className="text-md font-medium">
                            Logout
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() =>
                      setMobileMenuOpen(!mobileMenuOpen)
                    }
                    className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {mobileMenuOpen ? (
                      <X className="size-6 text-white" />
                    ) : (
                      <Menu className="size-6 text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="lg:hidden border-t border-white/10 py-4">
                  <div className="space-y-2">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === item.id
                            ? "bg-[#ee6b20] text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <item.icon className="size-5" />
                        <span className="font-medium">
                          {item.label}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowTutorial(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <HelpCircle className="size-5" />
                      <span className="font-medium">Guide</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true); // Triggers the new Mascot Modal
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="size-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard View */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-[#1e3d5a] mb-2">
                    Dashboard Overview
                  </h1>
                  <p className="text-gray-600">
                    Welcome back! Here's what's happening with your
                    parking facility today.
                  </p>
                </div>

                {/* Stats Grid */}
                <style>{`
                  .stat-card { transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1); }
                  .stat-card:hover { transform: translateY(-6px); }
                  .stat-card .stat-blob { transition: transform 0.4s ease; transform: scale(1); }
                  .stat-card:hover .stat-blob { transform: scale(2.2); }
                  .stat-card .stat-icon { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
                  .stat-card .stat-accent { opacity: 0; transition: opacity 0.3s; }
                  .stat-card:hover .stat-accent { opacity: 1; }
                `}</style>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="stat-card relative bg-white rounded-3xl border-2 border-[#f1f5f9] p-6 flex flex-col items-center text-center overflow-hidden"
                      style={{} as React.CSSProperties}
                    >
                      <style>{`
                        .stat-card:nth-child(${index + 1}):hover {
                          border-color: ${stat.color}60;
                          background: ${stat.light};
                          box-shadow: 0 20px 50px ${stat.color}25, 0 4px 16px ${stat.color}15;
                        }
                        .stat-card:nth-child(${index + 1}) .stat-icon {
                          background: ${stat.light};
                          box-shadow: 0 2px 8px ${stat.color}25;
                        }
                        .stat-card:nth-child(${index + 1}):hover .stat-icon {
                          background: ${stat.color};
                          box-shadow: 0 8px 24px ${stat.color}50;
                          transform: scale(1.12) rotate(6deg);
                        }
                        .stat-card:nth-child(${index + 1}):hover .stat-icon svg {
                          color: white !important;
                        }
                        .stat-card:nth-child(${index + 1}):hover .stat-label {
                          color: ${stat.color};
                        }
                        .stat-card:nth-child(${index + 1}) .stat-blob {
                          background: ${stat.color}12;
                        }
                        .stat-card:nth-child(${index + 1}) .stat-accent {
                          background: linear-gradient(90deg, transparent, ${stat.color}, transparent);
                        }
                      `}</style>

                      {/* Decorative blob */}
                      <div className="stat-blob absolute -top-6 -right-6 w-20 h-20 rounded-full" />

                      {/* Icon */}
                      <div className="stat-icon size-14 rounded-2xl flex items-center justify-center mb-4 relative z-10">
                        <stat.icon
                          className="size-6 transition-colors duration-300"
                          style={{ color: stat.color }}
                        />
                      </div>

                      {/* Value */}
                      <p className="text-2xl font-extrabold text-[#1e3d5a] mb-1 relative z-10">
                        {stat.value}
                      </p>

                      {/* Label */}
                      <p className="stat-label text-sm font-semibold text-gray-400 transition-colors duration-300 relative z-10 mb-2">
                        {stat.label}
                      </p>

                      {/* Change badge */}
                      <span
                        className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full relative z-10"
                        style={{
                          background: stat.color + "18",
                          color: stat.color,
                        }}
                      >
                        {stat.change}
                      </span>

                      {/* Bottom accent line */}
                      <div className="stat-accent absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl" />
                    </div>
                  ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Bookings - Takes 2 columns */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#1e3d5a]">
                          Recent Bookings
                        </h2>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#1e3d5a] text-[#1e3d5a]"
                          onClick={() => setActiveTab("bookings")}
                        >
                          <List className="size-4 mr-1" />
                          View All
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Spot
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recentBookings.map((booking) => (
                            <tr
                              key={booking.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-[#1e3d5a]">
                                  {booking.customer}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-[#ee6b20]">
                                  {booking.spot}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">
                                  {booking.time}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">
                                  {booking.duration}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {booking.status === "active" && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    <CheckCircle className="size-3" />
                                    Active
                                  </span>
                                )}
                                {booking.status === "completed" && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    <CheckCircle className="size-3" />
                                    Completed
                                  </span>
                                )}
                                {booking.status === "pending" && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    <AlertCircle className="size-3" />
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="space-y-6">
                    <div
                      className="bg-white rounded-xl shadow-sm p-6"
                      data-tutorial="quick-actions"
                    >
                      <h3 className="text-lg font-bold text-[#1e3d5a] mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setActiveTab("bookings")}
                          className="w-full bg-[#ee6b20] hover:bg-[#d55f1c] text-white"
                          data-tutorial="bookings-button"
                        >
                          <Car className="size-4 mr-2" />
                          New Booking
                        </Button>
                        <Button
                          onClick={() => setActiveTab("parking")}
                          variant="outline"
                          className="w-full border-[#1e3d5a] text-[#1e3d5a]"
                        >
                          <MapPin className="size-4 mr-2" />
                          Manage Slots
                        </Button>
                        <Button
                          onClick={() => setActiveTab("analytics")}
                          variant="outline"
                          className="w-full border-[#1e3d5a] text-[#1e3d5a]"
                        >
                          <TrendingUp className="size-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-lg font-bold text-[#1e3d5a] mb-4">
                        System Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Server Status
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                            <div className="size-2 bg-green-600 rounded-full" />
                            Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Payment Gateway
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                            <div className="size-2 bg-green-600 rounded-full" />
                            Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Database
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                            <div className="size-2 bg-green-600 rounded-full" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parking Management View */}
            {activeTab === "parking" && <SmartParkingDashboard />}

            {/* Bookings Management View */}
            {activeTab === "bookings" && <AdminBookings />}

            {/* Locations Management View */}
            {activeTab === "locations" && <AdminLocations />}

            {/* Analytics View */}
            {activeTab === "analytics" && <AdminAnalytics />}

            {/* Settings View */}
            {activeTab === "settings" && (
              <AdminSettings
                parkingRates={parkingRates}
                setParkingRates={setParkingRates}
                editingRate={editingRate}
                setEditingRate={setEditingRate}
                showRateModal={showRateModal}
                setShowRateModal={setShowRateModal}
                paymentMethods={paymentMethods}
                setPaymentMethods={setPaymentMethods}
                securitySettings={securitySettings}
                setSecuritySettings={setSecuritySettings}
                notificationSettings={notificationSettings}
                setNotificationSettings={setNotificationSettings}
                adminUsers={adminUsers}
                setAdminUsers={setAdminUsers}
                systemPreferences={systemPreferences}
                setSystemPreferences={setSystemPreferences}
                activeSettingsPage={activeSettingsPage}
                setActiveSettingsPage={setActiveSettingsPage}
              />
            )}
          </main>

          {/* Tutorial Modal */}
          {showTutorial && (
            <AdminTutorial
              isOpen={showTutorial}
              onClose={() => setShowTutorial(false)}
              onNavigate={setActiveTab}
              currentTab={activeTab}
            />
          )}

          {/* Notifications Modal */}
          {showNotifications && (
            <NotificationCenter
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
