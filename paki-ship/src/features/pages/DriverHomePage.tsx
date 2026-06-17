import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  LogOut,
  Map,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Star,
  TrendingUp,
  Truck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { clearClientSession, getTutorialStorageKey } from "@/lib/client-auth";
import {
  fetchDriverProfile,
  fetchDriverNotifications,
  markAllDriverNotificationsAsRead,
  markDriverNotificationAsRead,
  type DriverNotification,
} from "@/lib/driver-account";
import { useJobs, type Job } from "./JobsContext";

const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

function formatOnlineTime(totalSeconds: number) {
  const hours = Math.floor(Math.max(0, totalSeconds) / 3600);
  const minutes = Math.floor((Math.max(0, totalSeconds) % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function CallModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#041614]/60 flex items-end sm:items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#39B5A8] flex items-center justify-center text-white font-black text-3xl mb-3">
            {job.customerName.charAt(0)}
          </div>
          <h2 className="text-xl font-black text-[#041614]">{job.customerName}</h2>
          <p className="text-[#39B5A8] font-bold text-sm mt-1">{job.customerPhone}</p>
        </div>
        <a
          href={`tel:${job.customerPhone}`}
          className="w-full bg-[#39B5A8] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#2D8F85] transition-all mb-3"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </a>
        <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

function MobileNavigationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-[#F0F9F8] flex items-center justify-center mx-auto mb-5">
          <Navigation className="w-8 h-8 text-[#39B5A8]" />
        </div>
        <h2 className="text-2xl font-black text-[#041614] mb-2">Mobile App Only</h2>
        <p className="text-sm text-gray-500 font-medium mb-6">
          Navigate through the Mobile App
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#39B5A8] text-white font-black py-3.5 rounded-2xl hover:bg-[#2D8F85] transition-all"
        >
          Okay
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, primary }: { icon: ReactNode; label: string; value: string; trend: string; primary?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 border ${primary ? "bg-white border-[#39B5A8] shadow-md shadow-[#39B5A8]/10" : "bg-white border-[#39B5A8]/10 shadow-sm"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${primary ? "bg-[#39B5A8] text-white" : "bg-[#F0F9F8] text-[#39B5A8]"}`}>{icon}</div>
        <TrendingUp className={`w-4 h-4 ${primary ? "text-[#39B5A8]" : "text-gray-300"}`} />
      </div>
      <div className="text-3xl font-black mb-1 text-[#041614]">{value}</div>
      <div className="text-xs mb-1 font-bold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-[10px] font-bold ${primary ? "text-[#39B5A8]" : "text-gray-400"}`}>{trend}</div>
    </div>
  );
}

function JobCard({ job, navigate, onCall }: { job: Job; navigate: (path: string) => void; onCall: () => void }) {
  return (
    <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-6 hover:border-[#39B5A8]/40 transition-all shadow-sm">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg border border-[#39B5A8]/10">{job.jobNumber}</span>
            <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-full uppercase">{job.packageSize}</span>
            {job.timeLimit && <span className="text-[10px] text-white bg-[#39B5A8] px-2 py-1 rounded-full flex items-center gap-1 font-bold"><Clock className="w-3 h-3" />{job.timeLimit}</span>}
            {job.status === "in-progress" && job.parcelStatus && <span className="text-[10px] font-bold bg-[#F0F9F8] text-[#39B5A8] px-2.5 py-1 rounded-full border border-[#39B5A8]/30">{job.parcelStatus}</span>}
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3"><div className="w-4 h-4 rounded-full bg-[#39B5A8] mt-1" /><div><div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PICKUP</div><div className="text-[#041614] font-bold">{job.pickup}</div></div></div>
            <div className="ml-2 border-l-2 border-dashed border-[#39B5A8]/20 h-6" />
            <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-red-400 mt-1" /><div><div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">DROP-OFF</div><div className="text-[#041614] font-bold">{job.dropoff}</div></div></div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
            <span className="flex items-center gap-1.5"><Map className="w-3.5 h-3.5" />{job.distance}</span>
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{job.customerName}</span>
          </div>
        </div>
        <div className="text-right"><div className="text-3xl font-black text-[#39B5A8] leading-none mb-1">{job.earnings}</div><div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Earnings</div></div>
      </div>
      <div className="pt-4 border-t border-gray-50">
        {job.status === "available" && <button onClick={() => navigate(`/driver/job/${job.id}`)} className="w-full bg-[#39B5A8] text-white font-black py-4 rounded-xl hover:bg-[#2D8F85] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#39B5A8]/20"><Info className="w-5 h-5" />View Full Information</button>}
        {job.status === "in-progress" && <div className="grid grid-cols-2 gap-3"><button onClick={onCall} className="bg-white border-2 border-[#39B5A8] text-[#39B5A8] font-black py-3.5 rounded-xl flex items-center justify-center gap-2"><Phone className="w-4 h-4" />Call</button><button onClick={() => navigate(`/driver/job/${job.id}/update-status`)} className="bg-[#041614] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg"><RefreshCw className="w-4 h-4" />Update Status</button></div>}
        {job.status === "completed" && <div className="flex items-center justify-between py-2"><div className="flex items-center gap-2 text-green-500"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-black">Completed</span></div><button onClick={() => navigate(`/driver/job/${job.id}`)} className="text-sm font-black text-[#39B5A8] hover:underline">View Receipt</button></div>}
      </div>
    </div>
  );
}

export function DriverHomePage() {
  const navigate = useNavigate();
  const { jobs, metrics, isOnline, isLoading, isRefreshing, isMutating, error, refreshDashboard, setOnlineStatus } = useJobs();
  const [activeTab, setActiveTab] = useState<"available" | "in-progress" | "completed">("available");
  const [showTutorial, setShowTutorial] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [callJob, setCallJob] = useState<Job | null>(null);
  const [showMobileNavigationModal, setShowMobileNavigationModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState("Pedro");
  const notificationRef = useRef<HTMLDivElement>(null);
  const onlineToggleRef = useRef<HTMLDivElement>(null);
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const jobsSectionRef = useRef<HTMLDivElement>(null);
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const knownAvailableJobIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedAvailableJobsRef = useRef(false);
  const activeJob = jobs.find((job) => job.status === "in-progress");
  const completedJobs = jobs.filter((job) => job.status === "completed");
  const jobsForActiveTab = jobs.filter((job) => job.status === activeTab);
  const unreadNotifications = notifications.filter((notification) => !notification.isRead);

  useEffect(() => {
    const storedName = localStorage.getItem("driverName") || localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
    const storedPhoto = localStorage.getItem("driverProfilePicture");
    if (storedPhoto) setProfileImage(storedPhoto);
    if (localStorage.getItem(getTutorialStorageKey("driver"))) setShowTutorial(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const result = await fetchDriverProfile();
        if (!isMounted) return;

        const nextName = result.profile.fullName || "Driver";
        setUserName(nextName);
        setProfileImage(result.profile.profilePhotoUrl);
        localStorage.setItem("driverName", nextName);
        localStorage.setItem("userName", nextName);
        if (result.profile.profilePhotoUrl) {
          localStorage.setItem("driverProfilePicture", result.profile.profilePhotoUrl);
        } else {
          localStorage.removeItem("driverProfilePicture");
        }
      } catch {
        // Keep the cached login name if profile sync is temporarily unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setProfileImage(localStorage.getItem("driverProfilePicture"));
      setUserName(localStorage.getItem("driverName") || localStorage.getItem("userName") || "Pedro");
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    };
    window.addEventListener("storage", handleStorage);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const result = await fetchDriverNotifications();
        if (isMounted) {
          setNotifications(result.notifications);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const availableJobs = jobs.filter((job) => job.status === "available");
    const currentIds = new Set(availableJobs.map((job) => job.id));

    if (!hasInitializedAvailableJobsRef.current) {
      knownAvailableJobIdsRef.current = currentIds;
      hasInitializedAvailableJobsRef.current = true;
      return;
    }

    const newJobs = availableJobs.filter(
      (job) => !knownAvailableJobIdsRef.current.has(job.id),
    );

    knownAvailableJobIdsRef.current = currentIds;

    if (newJobs.length === 0 || !isOnline) {
      return;
    }

    const newestJob = newJobs[0];
    const notification: DriverNotification = {
      id: `local-new-job-${newestJob.id}-${Date.now()}`,
      userId: "local",
      type: "delivery",
      title: newJobs.length === 1 ? "New job available" : `${newJobs.length} new jobs available`,
      message:
        newJobs.length === 1
          ? `${newestJob.jobNumber}: ${newestJob.pickup} to ${newestJob.dropoff} · ${newestJob.earnings}`
          : "Open Available jobs to review the latest delivery requests.",
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((current) => [notification, ...current].slice(0, 20));
    setActiveTab("available");
    toast.info(notification.title, {
      description: notification.message,
    });
  }, [isOnline, jobs]);

  const handleMarkNotification = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );

    try {
      await markDriverNotificationAsRead(notificationId);
    } catch {
      // Keep optimistic state.
    }
  };

  const handleMarkAllNotifications = async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );

    try {
      await markAllDriverNotificationsAsRead();
    } catch {
      // Keep optimistic state.
    }
  };

  const handleLogout = async () => {
    if (activeJob) {
      alert("Cannot logout while a delivery is in progress. Please complete your current job first.");
      setShowLogoutModal(false);
      return;
    }
    try {
      await setOnlineStatus(false);
      clearClientSession();
      navigate("/");
    } catch (logoutError) {
      console.error("Logout failed:", logoutError);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] font-sans">
      {callJob && <CallModal job={callJob} onClose={() => setCallJob(null)} />}
      {showMobileNavigationModal && (
        <MobileNavigationModal onClose={() => setShowMobileNavigationModal(false)} />
      )}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <img src={logoImg} alt="PakiSHIP Logo" className="h-10" />
          <div className="flex items-center gap-4">
            <button ref={guideButtonRef} onClick={() => setShowTutorial((current) => !current)} className="flex items-center gap-2 px-3 py-2 hover:bg-[#39B5A8]/5 border border-[#39B5A8]/20 rounded-xl text-[#39B5A8] font-bold text-sm"><HelpCircle className="w-4 h-4" /><span className="hidden md:inline">Guide</span></button>
            <div className="flex items-center gap-2 bg-[#E6F4F2] rounded-full px-4 py-2 border border-[#39B5A8]/10" ref={onlineToggleRef}>
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <button onClick={() => void setOnlineStatus(!isOnline)} disabled={isMutating} className="text-xs font-bold text-[#041614] disabled:opacity-50">{isMutating ? "Saving..." : isOnline ? "Online" : "Offline"}</button>
            </div>
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications((current) => !current)} className="relative p-2 hover:bg-[#39B5A8]/5 rounded-full transition-colors"><Bell className="w-5 h-5 text-[#39B5A8]" />{unreadNotifications.length > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#39B5A8] rounded-full border-2 border-white text-[9px] text-white font-black flex items-center justify-center px-0.5">{unreadNotifications.length}</span>}</button>
              {showNotifications && <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#39B5A8]/10 py-3 z-50"><div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between"><h3 className="font-black text-[#041614]">Notifications</h3>{unreadNotifications.length > 0 && <button onClick={() => void handleMarkAllNotifications()} className="text-xs font-black text-[#39B5A8]">Mark all read</button>}</div><div className="max-h-80 overflow-y-auto">{notifications.length === 0 ? <div className="px-4 py-3 text-sm text-gray-500">No notifications yet.</div> : notifications.map((notification) => <button key={notification.id} onClick={() => void handleMarkNotification(notification.id)} className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 ${notification.isRead ? "bg-white" : "bg-[#F0F9F8]/50"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-[#041614]">{notification.title}</p><p className="text-xs text-gray-500 mt-1">{notification.message}</p></div>{!notification.isRead && <span className="mt-1 w-2 h-2 rounded-full bg-[#39B5A8]" />}</div></button>)}</div></div>}
            </div>
            <ProfileDropdown profileImage={profileImage} userName={userName} onProfileClick={() => navigate("/driver/profile")} onSettingsClick={() => navigate("/driver/settings")} onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-black text-[#041614] mb-2">Ready to Earn, {userName}!</h1><p className="text-[#39B5A8] font-medium">You're doing great today. Hatid Agad, Walang Abala.</p></div>
        {error && <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[1.5rem] border border-red-100 bg-red-50 px-5 py-4"><div className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" /><div><p className="text-sm font-black text-red-700">Dashboard sync issue</p><p className="text-sm text-red-600">{error}</p></div></div><button onClick={() => void refreshDashboard()} className="px-4 py-2 rounded-xl bg-white text-red-600 font-black text-sm border border-red-100">Retry</button></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" ref={statsCardsRef}>
          <StatCard icon={<span className="text-sm font-black leading-none">PHP</span>} label="Today's Earnings" value={isLoading ? "..." : metrics.todaysEarningsLabel} trend={activeJob ? `${activeJob.earnings} in progress` : completedJobs[0] ? `${completedJobs[0].earnings} last completed` : "No earnings yet"} primary />
          <StatCard icon={<Package className="w-5 h-5" />} label="Deliveries Today" value={isLoading ? "..." : String(metrics.deliveriesToday)} trend={activeJob ? "+1 active delivery" : "Watching for new jobs"} />
          <StatCard icon={<Star className="w-5 h-5" />} label="Rating" value={isLoading ? "..." : metrics.ratingAverage === null ? "New" : metrics.ratingAverage.toFixed(1)} trend={metrics.ratingAverage === null ? "Awaiting reviews" : "Customer average"} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Online Time" value={isLoading ? "..." : formatOnlineTime(metrics.onlineSeconds)} trend={isOnline ? "Session active" : "Currently offline"} />
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[2rem] p-8 mb-8 relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-5 h-5 text-[#39B5A8]" />
                <h3 className="text-xl font-black text-[#041614]">Active Delivery</h3>
              </div>
              <p className="text-gray-500 font-medium">
                {activeJob
                  ? "Keep going! Your customer is waiting for their package."
                  : "No active delivery right now. Accept a job to start navigating."}
              </p>
            </div>
            <button
              onClick={() => setShowMobileNavigationModal(true)}
              className="bg-[#041614] text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              Navigate to Destination
            </button>
          </div>
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[2.5rem] p-6 md:p-8 shadow-sm" ref={jobsSectionRef}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div><h2 className="text-2xl font-black text-[#041614]">Delivery Jobs</h2><p className="text-xs font-bold text-gray-400 mt-2">{isRefreshing ? "Refreshing live jobs..." : "Auto-refresh every 30 seconds"}</p></div>
            <button onClick={() => void refreshDashboard({ silent: true })} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#39B5A8]/20 text-[#39B5A8] font-black text-sm"><RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />Refresh</button>
            <div className="flex bg-[#F0F9F8] p-1.5 rounded-2xl border border-[#39B5A8]/10">{(["available", "in-progress", "completed"] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-xs md:text-sm font-black rounded-xl transition-all ${activeTab === tab ? "bg-white text-[#39B5A8] shadow-sm" : "text-gray-400 hover:text-[#39B5A8]"}`}>{tab === "in-progress" ? "In Progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}<span className="ml-1.5 text-[10px] bg-[#39B5A8]/10 text-[#39B5A8] px-1.5 py-0.5 rounded-full font-black">{jobs.filter((job) => job.status === tab).length}</span></button>)}</div>
          </div>
          <div className="space-y-4">
            {isLoading && jobs.length === 0 ? <div className="text-center py-12 text-gray-400"><RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-40 animate-spin" /><p className="font-bold text-sm">Loading dashboard data</p></div> : jobsForActiveTab.length === 0 ? <div className="text-center py-12 text-gray-400"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-bold text-sm">No {activeTab === "in-progress" ? "in-progress" : activeTab} jobs</p></div> : jobsForActiveTab.map((job) => <JobCard key={job.id} job={job} navigate={navigate} onCall={() => setCallJob(job)} />)}
          </div>
        </div>
      </main>
      {showTutorial && <div className="fixed bottom-6 right-6 z-[60] w-[320px] bg-white border border-[#39B5A8]/10 rounded-[2rem] p-5 shadow-2xl"><div className="flex items-center justify-between mb-3"><div className="text-xs font-black text-[#39B5A8]">Driver Guide</div><button onClick={() => { setShowTutorial(false); localStorage.setItem(getTutorialStorageKey("driver"), "true"); }} className="text-gray-400"><X className="w-4 h-4" /></button></div><p className="text-sm text-gray-500 mb-4">Your dashboard is now connected to backend jobs, metrics, and auto-refresh updates.</p><div className="grid grid-cols-2 gap-2 text-xs font-bold"><div className="rounded-xl bg-[#F0F9F8] px-3 py-2">Availability toggle</div><div className="rounded-xl bg-[#F0F9F8] px-3 py-2">Live metrics</div><div className="rounded-xl bg-[#F0F9F8] px-3 py-2">Job tabs</div><div className="rounded-xl bg-[#F0F9F8] px-3 py-2">Status updates</div></div></div>}
      {showLogoutModal && <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"><div className="relative bg-white rounded-[2.5rem] max-w-sm w-full shadow-2xl overflow-visible pt-20 pb-8 px-8"><button className="absolute top-4 right-4 text-gray-400 hover:text-[#041614] p-2 hover:bg-gray-100 rounded-xl" onClick={() => setShowLogoutModal(false)}><X className="w-5 h-5" /></button><div className="text-center mb-6"><h2 className="text-xl md:text-2xl font-black text-[#041614] mb-2">Are you sure?</h2>{activeJob ? <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /><p className="text-red-600 text-xs font-black uppercase tracking-tight">Access Denied</p><p className="text-red-500 text-xs font-medium">You cannot logout while you have an active delivery ({activeJob.jobNumber}).</p></div> : <p className="text-gray-400 text-sm leading-relaxed font-medium">We're sad to see you go! Come back soon, the deliveries need you.</p>}</div><div className="flex flex-col gap-3">{!activeJob && <button className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-500 text-white rounded-2xl font-black text-sm" onClick={handleLogout}><LogOut className="w-4 h-4" />Yes, Logout</button>}<button className="w-full py-3.5 font-bold text-[#39B5A8]" onClick={() => setShowLogoutModal(false)}>{activeJob ? "Back to Dashboard" : "Stay & Keep Earning"}</button></div></div></div>}
    </div>
  );
}
