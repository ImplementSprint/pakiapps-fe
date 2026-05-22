import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User, Mail, Phone, Camera, ArrowLeft, CheckCircle2,
  MapPin, Star, Package, Clock, Shield, LogOut, ChevronRight,
  Lock, Eye, EyeOff, X, AlertCircle, Upload, Bell, MessageSquare,
  Activity, Edit2, Save
} from "lucide-react";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { changeAccountPassword } from '@/lib/auth-security';
import { AccountTwoFactorModal } from "../components/AccountTwoFactorModal";
import {
  fetchOperatorDropOffPointProfile,
  fetchOperatorProfile,
  updateOperatorDropOffPointProfile,
  updateOperatorProfile,
  updateOperatorSettings,
  uploadOperatorDocument,
} from "@/lib/operator-account";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

const STORAGE_KEY_NAME  = "operatorName";
const STORAGE_KEY_EMAIL = "operatorEmail";
const STORAGE_KEY_PHONE = "operatorPhone";
const STORAGE_KEY_PHOTO = "operatorProfilePicture";

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function joinName(firstName: string, lastName: string) {
  return [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');
}

export function OperatorProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const governmentIdFileInputRef = useRef<HTMLInputElement>(null);
  const businessPermitFileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    localStorage.getItem("operatorTwoFactorEnabled") === "true",
  );

  const [profileData, setProfileData] = useState({
    ...splitFullName(localStorage.getItem(STORAGE_KEY_NAME) || "Operator"),
    email: localStorage.getItem(STORAGE_KEY_EMAIL) || "operator@pakiship.ph",
    phone: localStorage.getItem(STORAGE_KEY_PHONE) || "09123456789",
    hubLocation: localStorage.getItem("operatorHub") || "BGC Central Hub",
    hubAddress: localStorage.getItem("operatorHubAddress") || "Taguig City, Metro Manila",
    operatorId: localStorage.getItem("operatorId") || "OPR-2026-0089",
    shiftSchedule: localStorage.getItem("operatorShift") || "Day Shift (8AM - 5PM)",
    hubStatus: (localStorage.getItem("operatorHubStatus") || "Open") as "Open" | "Busy" | "Closed",
    hubCapacity: (localStorage.getItem("operatorHubCapacity") || "High") as "High" | "Medium" | "Full",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: localStorage.getItem('operatorEmailNotifications') === 'true',
    smsAlerts: localStorage.getItem('operatorSmsAlerts') === 'true',
    parcelAlerts: localStorage.getItem('operatorParcelAlerts') === 'true',
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [documentsUploaded, setDocumentsUploaded] = useState({
    governmentId: localStorage.getItem('operatorGovernmentIdUploaded') === 'true',
    businessPermit: localStorage.getItem('operatorBusinessPermitUploaded') === 'true',
  });

  useEffect(() => {
    setProfilePicture(localStorage.getItem(STORAGE_KEY_PHOTO) || null);

    let isMounted = true;

    void (async () => {
      try {
        const [result, dropOffPointResult] = await Promise.all([
          fetchOperatorProfile(),
          fetchOperatorDropOffPointProfile(),
        ]);
        if (!isMounted) return;

        setProfileData((current) => ({
          ...current,
          firstName: result.profile.firstName || splitFullName(result.profile.fullName || joinName(current.firstName, current.lastName)).firstName,
          lastName: result.profile.lastName || splitFullName(result.profile.fullName || joinName(current.firstName, current.lastName)).lastName,
          email: result.profile.email || current.email,
          phone: result.profile.phone || current.phone,
          hubLocation: dropOffPointResult.dropOffPoint?.name || current.hubLocation,
          hubAddress: dropOffPointResult.dropOffPoint?.address || current.hubAddress,
          hubStatus: dropOffPointResult.dropOffPoint?.status || current.hubStatus,
          hubCapacity: dropOffPointResult.dropOffPoint?.capacity || current.hubCapacity,
        }));
        setProfilePicture(result.profile.profilePhotoUrl);
        setDocumentsUploaded({
          governmentId: Boolean(result.profile.operatorDetails?.documentsUploaded.governmentId),
          businessPermit: Boolean(result.profile.operatorDetails?.documentsUploaded.businessPermit),
        });

        localStorage.setItem(STORAGE_KEY_NAME, result.profile.fullName || "");
        localStorage.setItem(STORAGE_KEY_EMAIL, result.profile.email || "");
        localStorage.setItem(STORAGE_KEY_PHONE, result.profile.phone || "");
        localStorage.setItem(STORAGE_KEY_PHOTO, result.profile.profilePhotoUrl || "");
        if (dropOffPointResult.dropOffPoint) {
          localStorage.setItem("operatorHub", dropOffPointResult.dropOffPoint.name);
          localStorage.setItem("operatorHubAddress", dropOffPointResult.dropOffPoint.address);
          localStorage.setItem("operatorHubStatus", dropOffPointResult.dropOffPoint.status);
          localStorage.setItem("operatorHubCapacity", dropOffPointResult.dropOffPoint.capacity);
        }
        localStorage.setItem(
          "operatorGovernmentIdUploaded",
          String(Boolean(result.profile.operatorDetails?.documentsUploaded.governmentId)),
        );
        localStorage.setItem(
          "operatorBusinessPermitUploaded",
          String(Boolean(result.profile.operatorDetails?.documentsUploaded.businessPermit)),
        );
      } catch {
        // Keep local fallback values if backend profile is unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const operatorStats = [
    { label: 'Parcels Processed', value: localStorage.getItem('parcelsProcessed') || '1,248' },
    { label: 'Active Parcels', value: localStorage.getItem('activeParcels') || '42' },
    { label: 'Avg. Rating', value: localStorage.getItem('operatorRating') || '4.9 ★' },
    { label: 'Member Since', value: localStorage.getItem('operatorMemberSince') || 'Jan 2025' },
  ];

  const recentActivity = [
    { text: 'Processed parcel #PKG-5678 for pickup', time: '15 mins ago' },
    { text: 'Updated hub inventory', time: '2 hours ago' },
    { text: 'Assisted driver with package collection', time: '1 day ago' },
  ];

  const displayName = joinName(profileData.firstName, profileData.lastName);
  const userInitials = displayName
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');

    void (async () => {
      try {
      localStorage.setItem(STORAGE_KEY_NAME, displayName);
      localStorage.setItem(STORAGE_KEY_EMAIL, profileData.email);
      localStorage.setItem(STORAGE_KEY_PHONE, profileData.phone);
      localStorage.setItem("userName", displayName);
      localStorage.setItem("operatorHub", profileData.hubLocation);
      localStorage.setItem("operatorHubAddress", profileData.hubAddress);
      localStorage.setItem("operatorHubStatus", profileData.hubStatus);
      localStorage.setItem("operatorHubCapacity", profileData.hubCapacity);
      localStorage.setItem("operatorShift", profileData.shiftSchedule);
      
      // Save preferences
      localStorage.setItem('operatorEmailNotifications', String(preferences.emailNotifications));
      localStorage.setItem('operatorSmsAlerts', String(preferences.smsAlerts));
      localStorage.setItem('operatorParcelAlerts', String(preferences.parcelAlerts));
      
      if (profilePicture) localStorage.setItem(STORAGE_KEY_PHOTO, profilePicture);

      await updateOperatorProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        profilePhotoUrl: profilePicture,
      });

      const dropOffPointResult = await updateOperatorDropOffPointProfile({
        name: profileData.hubLocation,
        address: profileData.hubAddress,
        status: profileData.hubStatus,
        capacity: profileData.hubCapacity,
      });
      localStorage.setItem("operatorHub", dropOffPointResult.dropOffPoint.name);
      localStorage.setItem("operatorHubAddress", dropOffPointResult.dropOffPoint.address);
      localStorage.setItem("operatorHubStatus", dropOffPointResult.dropOffPoint.status);
      localStorage.setItem("operatorHubCapacity", dropOffPointResult.dropOffPoint.capacity);

      await updateOperatorSettings({
        preferences: {
          emailNotifications: preferences.emailNotifications,
          smsAlerts: preferences.smsAlerts,
          parcelAlerts: preferences.parcelAlerts,
        },
      });
      
      window.dispatchEvent(new Event('storage'));
      
      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error instanceof Error ? error.message : 'Unable to save operator profile.');
      }
    })();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfilePicture(base64);
      localStorage.setItem(STORAGE_KEY_PHOTO, base64);
      window.dispatchEvent(new Event('storage'));
      void updateOperatorProfile({ profilePhotoUrl: base64 }).catch(() => {});
      toast.success('Photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (
    documentType: "government-id" | "business-permit",
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Uploading document...');
    void uploadOperatorDocument(documentType, file)
      .then((result) => {
        const nextUploaded = {
          governmentId: Boolean(result.profile.operatorDetails?.documentsUploaded.governmentId),
          businessPermit: Boolean(result.profile.operatorDetails?.documentsUploaded.businessPermit),
        };
        setDocumentsUploaded(nextUploaded);
        localStorage.setItem("operatorGovernmentIdUploaded", String(nextUploaded.governmentId));
        localStorage.setItem("operatorBusinessPermitUploaded", String(nextUploaded.businessPermit));
        toast.success(`${result.document.fileName} uploaded successfully!`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Unable to upload document.');
      })
      .finally(() => {
        toast.dismiss(loadingToast);
        if (documentType === "government-id" && governmentIdFileInputRef.current) {
          governmentIdFileInputRef.current.value = '';
        }
        if (documentType === "business-permit" && businessPermitFileInputRef.current) {
          businessPermitFileInputRef.current.value = '';
        }
      });
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const loadingToast = toast.loading('Updating password...');

    try {
      await changeAccountPassword(passwordData.current, passwordData.new);
      toast.dismiss(loadingToast);
      toast.success('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordModal(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Unable to update your password.');
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] font-sans pb-12">

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-[#39B5A8]/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#041614]">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Current Password', key: 'current' as const },
                { label: 'New Password', key: 'new' as const },
                { label: 'Confirm New Password', key: 'confirm' as const },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-[#1A5D56] uppercase tracking-widest mb-2">{field.label}</label>
                  <div className="relative">
                    <Input
                      type={showPass[field.key] ? 'text' : 'password'}
                      value={passwordData[field.key]}
                      onChange={(e) => setPasswordData({ ...passwordData, [field.key]: e.target.value })}
                      className="pr-10 bg-[#F0F9F8] border-[#39B5A8]/20 focus:border-[#39B5A8] rounded-xl"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(prev => ({ ...prev, [field.key]: !prev[field.key] }))} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#39B5A8]"
                    >
                      {showPass[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-xl p-3">
                <p className="text-xs text-[#1A5D56]/70 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#39B5A8]" />
                  Minimum 8 characters with letters and numbers.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowPasswordModal(false)} variant="outline" className="flex-1 rounded-xl border-[#39B5A8]/20">Cancel</Button>
              <Button onClick={handleChangePassword} className="flex-1 bg-[#39B5A8] hover:bg-[#2D8F85] rounded-xl">Change Password</Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <AccountTwoFactorModal
          enabled={twoFactorEnabled}
          storageKey="operatorTwoFactorEnabled"
          onClose={() => setShow2FAModal(false)}
          onUpdated={(enabled) => {
            setTwoFactorEnabled(enabled);
            localStorage.setItem("operatorTwoFactorEnabled", String(enabled));
            void updateOperatorSettings({ twoFactorEnabled: enabled }).catch(() => {});
          }}
        />
      )}

      {/* ── Header ── */}
      <header className="h-20 bg-white border-b border-[#39B5A8]/10 sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#39B5A8] font-bold text-sm hover:bg-[#39B5A8]/10 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black text-[#041614]">Operator Profile</h1>
        </div>
        
        <img src={logoImg} alt="PakiSHIP" className="h-9" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm text-center">
              <div className="relative inline-block">
                <div className="size-32 rounded-[2.5rem] bg-[#1A5D56] overflow-hidden border-4 border-[#F0F9F8] shadow-lg flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-white">{userInitials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-[#FF6B35] text-white p-3 rounded-2xl shadow-xl hover:bg-[#e55a28] border-2 border-white transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#041614] truncate">{displayName}</h2>
              <p className="text-sm text-[#39B5A8] font-bold mt-1">Drop-off Operator</p>
              <div className="flex flex-col gap-2 mt-4 items-center">
                <span className="px-4 py-1.5 rounded-full bg-[#F0F9F8] text-[#39B5A8] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Operator
                </span>
                <span className="text-[11px] text-slate-400 font-bold">{profileData.operatorId}</span>
              </div>
            </div>

            {/* Hub Info */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#39B5A8]" /> Hub Location
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-black text-[#1A5D56]">{profileData.hubLocation}</p>
                  <p className="text-sm text-gray-500 mt-1">{profileData.hubAddress}</p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Shift Schedule</p>
                  <p className="font-bold text-[#1A5D56] mt-1">{profileData.shiftSchedule}</p>
                </div>
              </div>
            </div>

            {/* Operator Stats */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-[#39B5A8]" /> Operator Stats
              </h3>
              <div className="space-y-3">
                {operatorStats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                    <span className="font-black text-[#1A5D56]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#39B5A8]" /> Security
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9F8] transition-all text-left"
                >
                  <Lock className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-[#1A5D56]">Change Password</span>
                </button>
                <button
                  onClick={() => setShow2FAModal(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9F8] transition-all text-left"
                >
                  <Shield className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-[#1A5D56]">
                    {twoFactorEnabled ? '2FA Enabled' : 'Enable 2FA'}
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Activity className="w-4 h-4 text-[#39B5A8]" /> Recent Activity
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="border-b border-gray-50 pb-3 last:border-0">
                    <p className="text-sm text-[#1A5D56] font-medium">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-[#041614]">Personal Information</h2>
                {!isEditing ? (
                  <Button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="bg-[#FF6B35] hover:bg-[#e55a28] text-white px-6 rounded-2xl h-12 font-bold shadow-lg shadow-[#FF6B35]/20"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      onClick={() => setIsEditing(false)} 
                      variant="outline" 
                      className="rounded-2xl border-[#39B5A8]/20 h-12 px-6 font-bold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#39B5A8] hover:bg-[#2D8F85] text-white px-8 rounded-2xl h-12 font-bold shadow-lg shadow-[#39B5A8]/20"
                    >
                      <Save className="w-4 h-4 mr-2" /> Save All
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: <User />, label: "First Name", key: 'firstName' as const, type: "text", placeholder: "First name" },
                  { icon: <User />, label: "Last Name", key: 'lastName' as const, type: "text", placeholder: "Last name" },
                  { icon: <Mail />, label: "Email Address", key: 'email' as const, type: "email", placeholder: "your@email.com" },
                  { icon: <Phone />, label: "Mobile Number", key: 'phone' as const, type: "tel", placeholder: "09XX XXX XXXX" },
                  { icon: <MapPin />, label: "Hub Location", key: 'hubLocation' as const, type: "text", placeholder: "Hub name" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                      {f.label}
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        {f.icon}
                      </div>
                      <Input
                        type={f.type}
                        value={profileData[f.key]}
                        onChange={e => setProfileData({ ...profileData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        disabled={!isEditing}
                        className={`pl-12 rounded-2xl py-5 text-sm font-bold border-2 transition-all ${!isEditing ? 'bg-[#F0F9F8] border-transparent text-[#1A5D56]' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8] text-[#041614]'}`}
                      />
                    </div>
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                    Hub Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <Input
                      type="text"
                      value={profileData.hubAddress}
                      onChange={e => setProfileData({ ...profileData, hubAddress: e.target.value })}
                      placeholder="Full hub address"
                      disabled={!isEditing}
                      className={`pl-12 rounded-2xl py-5 text-sm font-bold border-2 transition-all ${!isEditing ? 'bg-[#F0F9F8] border-transparent text-[#1A5D56]' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8] text-[#041614]'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                    Customer Visibility
                  </label>
                  <select
                    value={profileData.hubStatus}
                    onChange={e => setProfileData({ ...profileData, hubStatus: e.target.value as typeof profileData.hubStatus })}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold border-2 transition-all ${!isEditing ? 'bg-[#F0F9F8] border-transparent text-[#1A5D56]' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8] text-[#041614]'}`}
                  >
                    <option value="Open">Open</option>
                    <option value="Busy">Busy</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                    Capacity
                  </label>
                  <select
                    value={profileData.hubCapacity}
                    onChange={e => setProfileData({ ...profileData, hubCapacity: e.target.value as typeof profileData.hubCapacity })}
                    disabled={!isEditing}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold border-2 transition-all ${!isEditing ? 'bg-[#F0F9F8] border-transparent text-[#1A5D56]' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8] text-[#041614]'}`}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Work Schedule */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#F0F9F8] rounded-xl">
                  <Clock className="w-5 h-5 text-[#39B5A8]" />
                </div>
                <h2 className="text-2xl font-black text-[#041614]">Work Schedule</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                    Shift Schedule
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <Input
                      type="text"
                      value={profileData.shiftSchedule}
                      onChange={e => setProfileData({ ...profileData, shiftSchedule: e.target.value })}
                      disabled={!isEditing}
                      className={`pl-12 rounded-2xl py-5 text-sm font-bold border-2 transition-all ${!isEditing ? 'bg-[#F0F9F8] border-transparent' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8]'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#39B5A8] uppercase tracking-widest mb-1.5 ml-1">
                    Operator ID
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <Input
                      type="text"
                      value={profileData.operatorId}
                      disabled
                      className="pl-12 rounded-2xl py-5 text-sm font-bold bg-[#F0F9F8] border-transparent"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-1 mt-2">Contact support to update this field.</p>
                </div>
              </div>
            </div>

            {/* Document Verification */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
              <h2 className="text-2xl font-black text-[#041614] mb-3">Document Verification</h2>
              <p className="text-sm text-[#1A5D56]/70 mb-6">
                Upload the required documents to complete your drop-off point registration.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Government ID",
                    description: "Valid government-issued ID",
                    uploaded: documentsUploaded.governmentId,
                    inputRef: governmentIdFileInputRef,
                    onChange: handleDocumentUpload("government-id"),
                  },
                  {
                    title: "Business Permit",
                    description: "Business or barangay permit",
                    uploaded: documentsUploaded.businessPermit,
                    inputRef: businessPermitFileInputRef,
                    onChange: handleDocumentUpload("business-permit"),
                  },
                ].map((document) => (
                  <div
                    key={document.title}
                    className="border-2 border-dashed border-[#39B5A8]/30 rounded-[2rem] p-6 text-center hover:border-[#39B5A8] transition-all cursor-pointer"
                    onClick={() => document.inputRef.current?.click()}
                  >
                    {document.uploaded ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="font-bold text-[#1A5D56]">{document.title} Uploaded</p>
                        <p className="text-xs text-gray-500">Saved in your registration record</p>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.inputRef.current?.click();
                          }}
                          variant="outline"
                          className="mt-2 rounded-xl border-[#39B5A8]/20"
                        >
                          Replace File
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                          <Upload className="w-7 h-7 text-[#39B5A8]" />
                        </div>
                        <p className="font-bold text-[#1A5D56]">{document.title}</p>
                        <p className="text-xs text-gray-500">{document.description}</p>
                        <p className="text-[10px] text-gray-400">PNG, JPG, WEBP, or PDF (Max 8MB)</p>
                      </div>
                    )}
                    <input
                      ref={document.inputRef}
                      type="file"
                      onChange={document.onChange}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Account Preferences */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
              <h2 className="text-2xl font-black text-[#041614] mb-6">Account Preferences</h2>
              
              <div className="space-y-5">
                <PreferenceToggle
                  icon={<Bell className="w-5 h-5 text-[#39B5A8]" />}
                  title="Email Notifications"
                  description="Receive parcel processing updates"
                  checked={preferences.emailNotifications}
                  onChange={() => togglePreference('emailNotifications')}
                />
                <PreferenceToggle
                  icon={<MessageSquare className="w-5 h-5 text-[#39B5A8]" />}
                  title="SMS Alerts"
                  description="Get real-time hub notifications"
                  checked={preferences.smsAlerts}
                  onChange={() => togglePreference('smsAlerts')}
                />
                <PreferenceToggle
                  icon={<Package className="w-5 h-5 text-[#39B5A8]" />}
                  title="Parcel Alerts"
                  description="Alert when new parcels arrive"
                  checked={preferences.parcelAlerts}
                  onChange={() => togglePreference('parcelAlerts')}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper component for preference toggles
function PreferenceToggle({ icon, title, description, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-[#F0F9F8] transition-all">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-[#F0F9F8] rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-[#1A5D56]">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all ${
          checked ? 'bg-[#39B5A8]' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
