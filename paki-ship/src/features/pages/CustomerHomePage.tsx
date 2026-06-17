import { useState, useRef, forwardRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Send,
  MapPin,
  History,
  Star,
  Package,
  LogOut,
  ChevronRight,
  Clock,
  Camera,
  User,
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Mail,
  Phone,
  Info,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { NotificationDropdown, Notification } from "../components/NotificationDropdown";
import { clearClientSession, getTutorialStorageKey } from "@/lib/client-auth";
import {
  fetchCustomerProfile,
  syncCustomerProfileToStorage,
  uploadCustomerProfilePicture,
} from "@/lib/customer-profile";
import {
  clearAllCustomerNotifications,
  fetchCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
} from "@/lib/customer-notifications";
import {
  clearAllLocalCustomerNotifications,
  markAllLocalCustomerNotificationsAsRead,
  markLocalCustomerNotificationAsRead,
  mergeCustomerNotifications,
} from "@/lib/customer-local-notifications";
import {
  fetchCustomerActiveDeliveries,
  fetchCustomerAnnouncements,
  type ActiveDelivery,
} from "@/lib/customer-dashboard";

// Assets
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

const sendParcelIcon = "https://i.imgur.com/a6gHhtu.png";
const trackPackageIcon = "https://i.imgur.com/HHNarFY.png";
const historyIcon = "https://i.imgur.com/4Xgmx8D.png";
const rateReviewIcon = "https://i.imgur.com/pvzfoIz.png";
const sadMascotImg = "https://i.imgur.com/6bx4yV2.png";
const mascotWavingImg = "https://i.imgur.com/G4RbCRo.png";
const mascotWinkingImg = "https://i.imgur.com/0RM52cS.png";
const mascotMotorcycleImg = "https://i.imgur.com/7ywKdmd.png";
const mascotThinkingImg = "https://i.imgur.com/gDo17NY.png";

// Types for Announcements
type Announcement = {
  id: string;
  type: "system" | "update" | "promo";
  title: string;
  message: string;
  isPinned: boolean;
};

export function CustomerHomePage() {
  const navigate = useNavigate();

  // State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState("Guest User");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [customerStats, setCustomerStats] = useState([
    { label: "Total Bookings", value: "0" },
    { label: "Active Bookings", value: "0" },
    { label: "Saved Vehicles", value: "0" },
    { label: "Account Created", value: "Unknown" },
  ]);

  // Refs for Tutorial Spotlight
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeBannerRef = useRef<HTMLDivElement>(null);
  const actionCardsRef = useRef<HTMLDivElement>(null);
  const sendParcelRef = useRef<HTMLButtonElement>(null);
  const trackPackageRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const rateReviewRef = useRef<HTMLButtonElement>(null);
  const activeDeliveriesRef = useRef<HTMLDivElement>(null);
  const guideButtonRef = useRef<HTMLButtonElement>(null);

  // Handlers
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingProfileImage(true);
      void uploadCustomerProfilePicture(file)
        .then(async (result) => {
          setProfileImage(result.profilePicture);
          localStorage.setItem("customerProfilePicture", result.profilePicture);
          window.dispatchEvent(new Event("storage"));

          try {
            const profileResult = await fetchCustomerProfile();
            setUserName(profileResult.profile.fullName);
            setProfileImage(profileResult.profile.profilePicture);
            syncCustomerProfileToStorage(profileResult.profile);
          } catch {
            // Keep the uploaded photo visible even if the profile refresh fails.
          }
        })
        .finally(() => {
          setIsUploadingProfileImage(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        });
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleTrackParcel = (trackingId: string) => {
    navigate("/customer/track-package", {
      state: { trackingNumber: trackingId },
    });
  };

  const dismissAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    localStorage.setItem(`dismissed_${id}`, "true");
  };

  // Notification Handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
    if (id.startsWith("local-")) {
      markLocalCustomerNotificationAsRead(id);
      return;
    }
    void markCustomerNotificationAsRead(id).catch(() => {
      // Keep optimistic UI; notifications will refresh on next page load.
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true })),
    );
    markAllLocalCustomerNotificationsAsRead();
    void markAllCustomerNotificationsAsRead().catch(() => {
      // Keep optimistic UI; notifications will refresh on next page load.
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    clearAllLocalCustomerNotifications();
    void clearAllCustomerNotifications().catch(() => {
      // Keep optimistic UI; notifications will refresh on the next poll.
    });
  };

  useEffect(() => {
    const syncProfileData = () => {
      const nextProfileImage = localStorage.getItem("customerProfilePicture");
      setUserName(localStorage.getItem("userName") || "Guest User");
      setProfileImage(nextProfileImage || null);
    };

    syncProfileData();
    window.addEventListener("storage", syncProfileData);
  
    return () => window.removeEventListener("storage", syncProfileData);
  }, []);
  
  useEffect(() => {
    const hasShownTutorial = localStorage.getItem(getTutorialStorageKey("customer"));
    if (!hasShownTutorial) setShowTutorial(true);

    setAnnouncements((prev) =>
      prev.filter((a) => !localStorage.getItem(`dismissed_${a.id}`)),
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshNotifications = async () => {
      try {
        const notificationsResult = await fetchCustomerNotifications();
        if (isMounted) {
          setNotifications(mergeCustomerNotifications(notificationsResult.notifications));
        }
      } catch {
        // Keep the latest known notification state if refresh fails.
      }
    };

    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const loadCustomerProfile = async () => {
      try {
        const [
          profileResult,
          notificationsResult,
          announcementsResult,
          activeDeliveriesResult,
        ] = await Promise.all([
          fetchCustomerProfile(),
          fetchCustomerNotifications(),
          fetchCustomerAnnouncements(),
          fetchCustomerActiveDeliveries(),
        ]);
        setUserName(profileResult.profile.fullName);
        setProfileImage(profileResult.profile.profilePicture);
        setCustomerStats([
          { label: "Total Bookings", value: String(profileResult.stats.totalBookings) },
          { label: "Active Bookings", value: String(profileResult.stats.activeBookings) },
          { label: "Saved Vehicles", value: String(profileResult.stats.savedVehicles) },
          { label: "Account Created", value: profileResult.stats.accountCreated },
        ]);
        setNotifications(mergeCustomerNotifications(notificationsResult.notifications));
        setAnnouncements(
          announcementsResult.announcements.filter(
            (item) => !localStorage.getItem(`dismissed_${item.id}`),
          ),
        );
        setActiveDeliveries(activeDeliveriesResult.deliveries);
        syncCustomerProfileToStorage(profileResult.profile);
      } catch {
        // Keep local fallback values if the backend is unavailable.
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadCustomerProfile();
  }, []);

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] font-sans">
      {showTutorial && (
        <Tutorial
          step={tutorialStep}
          onNext={() => setTutorialStep(tutorialStep + 1)}
          onPrev={() => setTutorialStep(tutorialStep - 1)}
          onClose={() => {
            setShowTutorial(false);
            setTutorialStep(0);
            localStorage.setItem(getTutorialStorageKey("customer"), "true");
          }}
          welcomeBannerRef={welcomeBannerRef}
          actionCardsRef={actionCardsRef}
          sendParcelRef={sendParcelRef}
          trackPackageRef={trackPackageRef}
          historyRef={historyRef}
          rateReviewRef={rateReviewRef}
          activeDeliveriesRef={activeDeliveriesRef}
          guideButtonRef={guideButtonRef}
        />
      )}

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-[#39B5A8]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <img src={logoImg} alt="PakiSHIP" className="h-9" />

        <div className="flex items-center gap-4">
          <button
            ref={guideButtonRef}
            onClick={() => {
              setShowTutorial(true);
              setTutorialStep(0);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-[#39B5A8]/5 rounded-xl transition-colors text-[#39B5A8] border border-[#39B5A8]/20 font-bold text-sm"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="hidden md:inline">Guide</span>
          </button>

          <NotificationDropdown
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearAll}
          />

          <ProfileDropdown
            userName={userName}
            profileImage={profileImage}
            onProfileClick={() => navigate("/customer/edit-profile")}
            onSettingsClick={() => navigate("/customer/settings")}
            onLogoutClick={() => setShowLogoutModal(true)}
          />
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/*"
      />

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-8 space-y-3">
            {announcements.map((ann) => (
              <div 
                key={ann.id}
                className={`flex items-center justify-between p-4 rounded-2xl border animate-in fade-in slide-in-from-top-4 duration-500 ${
                  ann.type === 'system' 
                  ? "bg-amber-50 border-amber-200 text-amber-800" 
                  : "bg-[#39B5A8]/10 border-[#39B5A8]/20 text-[#1A5D56]"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${ann.type === 'system' ? "bg-amber-100" : "bg-white"}`}>
                    {ann.type === 'system' ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-[#39B5A8]" />}
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">{ann.title}</h4>
                    <p className="text-xs opacity-80 font-medium">{ann.message}</p>
                  </div>
                </div>
                {!ann.isPinned && (
                  <button 
                    onClick={() => dismissAnnouncement(ann.id)}
                    className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Banner */}
        <div
          ref={welcomeBannerRef}
          className="relative overflow-hidden rounded-[2.5rem] bg-white border border-[#39B5A8]/10 p-8 md:p-12 mb-12 shadow-sm"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#39B5A8]/5 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-[#F0F9F8] shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#F0F9F8] flex items-center justify-center">
                      <User className="w-12 h-12 text-[#39B5A8]" />
                    </div>
                  )}
                </div>

                <button
                  onClick={triggerFileInput}
                  className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-[#39B5A8]/20 text-[#39B5A8] hover:bg-[#39B5A8] hover:text-white transition-all disabled:opacity-60"
                  disabled={isUploadingProfileImage}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-[#041614] mb-2">
                  Welcome, {isLoadingProfile ? "Loading..." : userName}!
                </h1>
                <p className="text-[#39B5A8] text-lg font-semibold italic opacity-80">
                  Hatid Agad, Walang Abala.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/customer/edit-profile")}
              className="flex items-center gap-2 px-6 py-3 bg-[#F0F9F8] text-[#39B5A8] rounded-2xl font-bold text-sm hover:bg-[#39B5A8] hover:text-white transition-all border border-[#39B5A8]/10"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>

        <h2 className="text-1.5xl font-black text-[#39B5A8] uppercase tracking-[0.1em] mb-5">
          Navigation Menu
        </h2>

        {/* Action Cards */}
        <div
          ref={actionCardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 pt-20"
        >
          <ActionCard
            ref={sendParcelRef}
            image={sendParcelIcon}
            title="Send Parcel"
            desc="Book a delivery"
            accentColor="bg-[#FDB833]/10"
            onClick={() => navigate("/customer/send-parcel")}
          />
          <ActionCard
            ref={trackPackageRef}
            image={trackPackageIcon}
            title="Track Package"
            desc="Live tracking"
            accentColor="bg-[#54A0CC]/10"
            onClick={() => navigate("/customer/track-package")}
          />
          <ActionCard
            ref={historyRef}
            image={historyIcon}
            title="History"
            desc="Past deliveries"
            accentColor="bg-[#39B5A8]/10"
            onClick={() => navigate("/customer/history")}
          />
          <ActionCard
            ref={rateReviewRef}
            image={rateReviewIcon}
            title="Rate & Review"
            desc="Give feedback"
            accentColor="bg-[#A6DCD6]/20"
            onClick={() => navigate("/customer/rate-review")}
          />
        </div>

        <div ref={activeDeliveriesRef} className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-[#041614]">Active Deliveries</h2>
          <button
            onClick={() => navigate("/customer/all-deliveries")}
            className="text-[#39B5A8] font-bold text-sm hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {activeDeliveries.slice(0, 2).map((delivery) => (
            <DeliveryItem
              key={delivery.id}
              id={delivery.trackingNumber}
              location={delivery.to}
              time={delivery.timeLabel}
              status={delivery.status}
              statusClass="text-[#54A0CC] bg-[#54A0CC]/10"
              onTrack={() => handleTrackParcel(delivery.trackingNumber)}
            />
          ))}
          {activeDeliveries.length === 0 && (
            <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-8 text-center text-sm font-bold text-gray-400">
              No active deliveries yet.
            </div>
          )}
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div className="relative bg-white rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300 overflow-visible pt-28 pb-8 px-8">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none drop-shadow-2xl">
              <img src={sadMascotImg} alt="Sad Mascot" className="w-full h-full object-contain" />
            </div>

            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-[#041614] p-2 hover:bg-gray-100 rounded-xl transition-colors"
              onClick={() => setShowLogoutModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-black text-[#041614] mb-2">
                Your parcels will miss you!
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">
                Logging out means your active deliveries won't be tracked here. Sure about this?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 shadow-lg active:scale-95 transition-all"
                onClick={() => {
                  clearClientSession();
                  navigate("/");
                }}
              >
                <LogOut className="w-4 h-4" />
                Yes, Sign Me Out
              </button>
              <button
                className="w-full py-3.5 font-bold text-[#39B5A8] hover:bg-[#39B5A8]/5 rounded-2xl transition-all text-sm"
                onClick={() => setShowLogoutModal(false)}
              >
                Keep Tracking My Parcels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────────

const ActionCard = forwardRef<
  HTMLButtonElement,
  {
    image?: string;
    icon?: any;
    title: string;
    desc: string;
    accentColor: string;
    onClick?: () => void;
  }
>(({ image, icon, title, desc, accentColor, onClick }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className="relative overflow-visible flex flex-col items-center bg-white border border-[#39B5A8]/10 rounded-[2rem] transition-all hover:border-[#39B5A8] hover:shadow-xl hover:shadow-[#39B5A8]/5 group text-center pt-20 pb-8 px-6"
    >
      {image && (
        <div className="w-36 h-36 absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-2xl z-10 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300">
          <img src={image} alt={title} className="w-full h-full object-contain" />
        </div>
      )}

      <div className={`w-12 h-2 rounded-full ${accentColor} mb-4`} />
      <h3 className="text-[#041614] font-bold text-xl mb-1">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed font-medium">{desc}</p>
    </button>
  );
});

function DeliveryItem({
  id,
  location,
  time,
  status,
  statusClass,
  onTrack,
}: {
  id: string;
  location: string;
  time: string;
  status: string;
  statusClass: string;
  onTrack?: () => void;
}) {
  return (
    <div className="bg-white border border-[#39B5A8]/20 rounded-[1.5rem] p-6 flex flex-wrap items-center justify-between gap-4 hover:border-[#39B5A8] hover:bg-[#F0F9F8]/30 transition-all shadow-sm group">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-[#39B5A8]/10 rounded-2xl flex items-center justify-center border border-[#39B5A8]/20 group-hover:scale-110 transition-transform">
          <Package className="w-7 h-7 text-[#39B5A8]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[#1A5D56] font-black text-lg">{id}</h4>
            <span className="w-1.5 h-1.5 bg-[#39B5A8] rounded-full animate-pulse" />
          </div>
          <p className="text-slate-500 text-sm font-medium">{location}</p>
          <div className="flex items-center gap-1.5 mt-1 text-[#39B5A8] text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-[#39B5A8]/60 font-black uppercase tracking-[0.2em] mb-1">
            Status
          </span>
          <span className={`text-sm font-black uppercase tracking-wider px-3 py-1 rounded-lg ${statusClass}`}>
            {status}
          </span>
        </div>

        <button
          onClick={onTrack}
          className="bg-[#39B5A8] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2D8F85] transition-all shadow-lg shadow-[#39B5A8]/20 active:scale-95 flex items-center gap-2"
        >
          Track Now
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Tutorial({
  step,
  onNext,
  onPrev,
  onClose,
  welcomeBannerRef,
  actionCardsRef,
  sendParcelRef,
  trackPackageRef,
  historyRef,
  rateReviewRef,
  activeDeliveriesRef,
  guideButtonRef,
}: any) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const steps = [
    {
      title: "Welcome to PakiSHIP!",
      content: "Hi there! I'm your guide. Let me show you around your dashboard. This is where you'll manage deliveries with ease.",
      image: mascotWavingImg,
      targetRef: null,
    },
    {
      title: "Quick Actions",
      content: "These cards are your main tools! Book a parcel, track items, view history, or leave us a review.",
      image: mascotWinkingImg,
      targetRef: actionCardsRef,
    },
    {
      title: "Send Parcel",
      content: "Need to send something? Start booking here. Enter details and get it moving in seconds!",
      image: sendParcelIcon,
      targetRef: sendParcelRef,
    },
    {
      title: "Track Your Packages",
      content: "See real-time updates of your parcels. No more guessing where your items are!",
      image: trackPackageIcon,
      targetRef: trackPackageRef,
    },
    {
      title: "Delivery History",
      content: "All your past deliveries are stored here. Review previous orders, reorder, or check old receipts anytime!",
      image: historyIcon,
      targetRef: historyRef,
    },
    {
      title: "Rate & Review",
      content: "Help us improve by rating your experience! Your feedback helps our drivers and operators do even better.",
      image: rateReviewIcon,
      targetRef: rateReviewRef,
    },
    {
      title: "Active Deliveries",
      content: "Ongoing deliveries are listed here for a quick overview of tracking numbers and destination status.",
      image: mascotMotorcycleImg,
      targetRef: activeDeliveriesRef,
    },
    {
      title: "Need Help?",
      content: "Click the 'Guide' button anytime to see this tutorial again. Happy shipping! 📦",
      image: mascotThinkingImg,
      targetRef: guideButtonRef,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  useEffect(() => {
    const targetRef = currentStep.targetRef;
    if (targetRef?.current) {
      const element = targetRef.current;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightRect(element.getBoundingClientRect()), 350);
    } else {
      setHighlightRect(null);
    }
  }, [step, currentStep.targetRef]);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[59]">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask-customer">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 12}
                  y={highlightRect.top - 12}
                  width={highlightRect.width + 24}
                  height={highlightRect.height + 24}
                  rx="32"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(4, 22, 20, 0.5)"
            mask="url(#spotlight-mask-customer)"
          />
        </svg>

        {highlightRect && (
          <div
            className="absolute border-4 border-[#39B5A8] rounded-[2rem] shadow-2xl shadow-[#39B5A8]/30 animate-pulse"
            style={{
              left: highlightRect.left - 12,
              top: highlightRect.top - 12,
              width: highlightRect.width + 24,
              height: highlightRect.height + 24,
            }}
          />
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-[60] w-[380px] pointer-events-auto">
        <div className="relative flex justify-center mb-0">
          <div className="w-28 h-28 drop-shadow-2xl z-10 pointer-events-none">
            <img
              key={currentStep.image}
              src={currentStep.image}
              alt="Guide Mascot"
              className="w-full h-full object-contain animate-in zoom-in-75 duration-300"
            />
          </div>
        </div>

        <div className="bg-white border border-[#39B5A8]/20 text-[#1A5D56] p-6 rounded-[2rem] shadow-2xl -mt-6 pt-10">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-[#F0F9F8] rounded-full text-[#39B5A8] text-[10px] font-black uppercase tracking-widest">
              Tutorial {step + 1}/{steps.length}
            </span>
            <button className="text-gray-300 hover:text-red-500 transition-colors" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-black text-[#041614] mb-3">{currentStep.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <button
              className="text-xs font-black uppercase text-gray-400 hover:text-[#39B5A8] disabled:opacity-0 active:scale-95"
              onClick={onPrev}
              disabled={step === 0}
            >
              Previous
            </button>
            <button
              className="flex items-center gap-2 px-6 py-2.5 bg-[#39B5A8] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#2D8F85] transition-all active:scale-95"
              onClick={isLastStep ? onClose : onNext}
            >
              {isLastStep ? "Finish" : "Next"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
