import { useState, useRef, cloneElement, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Save, 
  Camera, Lock, Eye, EyeOff, ShieldCheck, Upload, Bell, 
  MessageSquare, RefreshCw, Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  changeCustomerPassword,
  disableCustomerTwoFactor,
  enableCustomerTwoFactor,
  fetchCustomerProfile,
  setupCustomerTwoFactor,
  syncCustomerProfileToStorage,
  uploadCustomerDiscountId,
  uploadCustomerProfilePicture,
  updateCustomerProfile,
  type CustomerProfileResponse,
} from '@/lib/customer-profile';
import { AuthenticatorQrCode } from '../components/AuthenticatorQrCode';

// Assets
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const EDITING_STORAGE_KEY = 'customerProfileEditMode';
const DRAFT_STORAGE_KEY = 'customerProfileEditDraft';

function getStoredValue(key: string) {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function getStoredDraft() {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      dob?: string;
    };
    const fallbackName = splitFullName(String(parsed.name ?? ''));

    return {
      firstName: String(parsed.firstName ?? fallbackName.firstName),
      lastName: String(parsed.lastName ?? fallbackName.lastName),
      email: String(parsed.email ?? ''),
      phone: String(parsed.phone ?? ''),
      address: String(parsed.address ?? ''),
      dob: String(parsed.dob ?? ''),
    };
  } catch {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

function getStoredEditMode() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(EDITING_STORAGE_KEY) === 'true';
}

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

export function EditProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATE MANAGEMENT ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [isEditing, setIsEditing] = useState(() => getStoredEditMode());
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDiscountId, setIsUploadingDiscountId] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret?: string;
    otpauthUri?: string;
    twoFactorEnabled: boolean;
  } | null>(null);
  const [isPreparingTwoFactor, setIsPreparingTwoFactor] = useState(false);
  const [isSubmittingTwoFactor, setIsSubmittingTwoFactor] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  const [profilePicture, setProfilePicture] = useState<string | null>(() =>
    getStoredValue('customerProfilePicture'),
  );

  const [formData, setFormData] = useState(() => {
    const draft = getStoredDraft();
    if (draft) return draft;

    return {
      firstName: getStoredValue('userFirstName') || splitFullName(getStoredValue('userName') || '').firstName,
      lastName: getStoredValue('userLastName') || splitFullName(getStoredValue('userName') || '').lastName,
      email: getStoredValue('userEmail') || 'guest@pakiship.ph',
      phone: getStoredValue('userPhone') || '09123456789',
      address: getStoredValue('userAddress') || '123 Ayala Ave, Makati City',
      dob: getStoredValue('userDOB') || '',
    };
  });

  const [preferences, setPreferences] = useState(() => ({
    emailNotifications: getStoredValue('emailNotifications') === 'true',
    smsUpdates: getStoredValue('smsUpdates') === 'true',
    autoExtend: getStoredValue('autoExtend') === 'true',
  }));

  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [idUploaded, setIdUploaded] = useState(
    () => getStoredValue('discountIdUploaded') === 'true',
  );
  const [discountStatus, setDiscountStatus] = useState<'not_uploaded' | 'pending' | 'verified' | 'rejected'>('not_uploaded');
  const [discountIdType, setDiscountIdType] = useState('');
  const [discountIdFileUrl, setDiscountIdFileUrl] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    () => getStoredValue('twoFactorEnabled') === 'true',
  );
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<string | null>(
    () => getStoredValue('passwordUpdatedAt'),
  );
  const isEditingRef = useRef(getStoredEditMode());
  const [customerStats, setCustomerStats] = useState([
    { label: 'Total Bookings', value: '0' },
    { label: 'Active Bookings', value: '0' },
    { label: 'Saved Vehicles', value: '0' },
    { label: 'Account Created', value: 'Unknown' },
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{ text: string; time: string }>>([]);

  useEffect(() => {
    isEditingRef.current = isEditing;

    if (typeof window === 'undefined') return;

    if (isEditing) {
      window.sessionStorage.setItem(EDITING_STORAGE_KEY, 'true');
    } else {
      window.sessionStorage.removeItem(EDITING_STORAGE_KEY);
    }
  }, [isEditing]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isEditing) {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  // Initials logic if no photo exists
  const displayName = joinName(formData.firstName, formData.lastName);
  const userInitials = displayName 
    ? displayName.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'U';

  const applyProfileResponse = (
    result: CustomerProfileResponse,
    options: { forceFormSync?: boolean } = {},
  ) => {
    const shouldKeepDraft = isEditingRef.current && !options.forceFormSync;

    setProfilePicture(result.profile.profilePicture);
    if (!shouldKeepDraft) {
      setFormData({
        firstName: result.profile.firstName || splitFullName(result.profile.fullName || '').firstName,
        lastName: result.profile.lastName || splitFullName(result.profile.fullName || '').lastName,
        email: result.profile.email || '',
        phone: result.profile.phone || '',
        address: result.profile.address || '',
        dob: result.profile.dob || '',
      });
    }
    setPreferences(result.profile.preferences);
    setIdUploaded(result.profile.discountIdUploaded);
    setDiscountStatus(result.profile.discountIdStatus || 'not_uploaded');
    setDiscountIdType(result.profile.discountIdType || '');
    setDiscountIdFileUrl(result.profile.discountIdFileUrl || null);
    setTwoFactorEnabled(Boolean(result.profile.twoFactorEnabled));
    setPasswordUpdatedAt(result.profile.passwordUpdatedAt || null);
    setCustomerStats([
      { label: 'Total Bookings', value: String(result.stats.totalBookings) },
      { label: 'Active Bookings', value: String(result.stats.activeBookings) },
      { label: 'Saved Vehicles', value: String(result.stats.savedVehicles) },
      { label: 'Account Created', value: result.stats.accountCreated },
    ]);
    setRecentActivity(
      result.activity.map((item) => ({
        text: item.description || item.title,
        time: item.timeLabel,
      })),
    );
    syncCustomerProfileToStorage(result.profile);
  };

  useEffect(() => {
    const loadCustomerProfile = async () => {
      try {
        const result = await fetchCustomerProfile();
        applyProfileResponse(result);
      } catch {
        toast.error('Unable to load your profile right now.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void loadCustomerProfile();
  }, []);

  // --- HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');

    try {
      const result = await updateCustomerProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dob: formData.dob,
        preferences,
      });

      applyProfileResponse(result, { forceFormSync: true });
      isEditingRef.current = false;
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(EDITING_STORAGE_KEY);
        window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : 'Unable to save profile changes.',
      );
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      const loadingToast = toast.loading('Uploading photo...');
      void uploadCustomerProfilePicture(file)
        .then((result) => {
          setProfilePicture(result.profilePicture);
          localStorage.setItem('customerProfilePicture', result.profilePicture);
          window.dispatchEvent(new Event('storage'));
          toast.dismiss(loadingToast);
          toast.success('Profile photo updated.');
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          toast.error(error instanceof Error ? error.message : 'Unable to upload your photo.');
        })
        .finally(() => {
          setIsUploadingPhoto(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        });
    }
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const loadingToast = toast.loading('Uploading ID...');
      setIsUploadingDiscountId(true);
      void uploadCustomerDiscountId(file)
        .then((result) => {
          setIdUploaded(result.discountIdUploaded);
          setDiscountStatus(result.discountIdStatus);
          setDiscountIdType(result.discountIdType);
          setDiscountIdFileUrl(result.discountIdFileUrl);
          localStorage.setItem('discountIdUploaded', 'true');
          toast.dismiss(loadingToast);
          toast.success('ID uploaded successfully. We\'ll review it shortly.');
        })
        .catch((error) => {
          toast.dismiss(loadingToast);
          toast.error(error instanceof Error ? error.message : 'Unable to upload your ID.');
        })
        .finally(() => {
          setIsUploadingDiscountId(false);
          if (idFileInputRef.current) {
            idFileInputRef.current.value = '';
          }
        });
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openTwoFactorModal = async () => {
    setShow2FAModal(true);
    setTwoFactorCode('');
    setTwoFactorError('');

    setIsPreparingTwoFactor(true);
    try {
      const setup = await setupCustomerTwoFactor();
      setTwoFactorSetup(setup);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to prepare authenticator setup.');
      setShow2FAModal(false);
    } finally {
      setIsPreparingTwoFactor(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new) {
      toast.error('Enter both your current and new passwords.');
      return;
    }

    setIsSubmittingPassword(true);
    const loadingToast = toast.loading('Updating password...');

    try {
      const result = await changeCustomerPassword(passwordData.current, passwordData.new);
      applyProfileResponse(result);
      toast.dismiss(loadingToast);
      toast.success('Password updated successfully.');
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '' });
      setShowPass({ current: false, new: false });
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Unable to update your password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleTwoFactorSubmit = async () => {
    if (twoFactorCode.trim().length !== 6) {
      const message = 'Enter the 6-digit code from your authenticator app.';
      setTwoFactorError(message);
      toast.error(message);
      return;
    }

    setTwoFactorError('');
    setIsSubmittingTwoFactor(true);
    const loadingToast = toast.loading(
      twoFactorEnabled ? 'Turning off 2FA...' : 'Turning on 2FA...',
    );

    try {
      const result = twoFactorEnabled
        ? await disableCustomerTwoFactor(twoFactorCode)
        : await enableCustomerTwoFactor(twoFactorCode);
      applyProfileResponse(result);
      toast.dismiss(loadingToast);
      toast.success(
        twoFactorEnabled
          ? 'Two-factor authentication disabled.'
          : 'Two-factor authentication enabled.',
      );
      setShow2FAModal(false);
      setTwoFactorCode('');
      setTwoFactorSetup(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update two-factor authentication.';
      setTwoFactorError(message);
      toast.dismiss(loadingToast);
      toast.error(message);
    } finally {
      setIsSubmittingTwoFactor(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] font-sans pb-12">
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-[#39B5A8]/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#041614]">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <div className="space-y-4">
              <PasswordField 
                label="Current Password" 
                value={passwordData.current} 
                show={showPass.current} 
                toggle={() => setShowPass({...showPass, current: !showPass.current})} 
                onChange={(v: string) => setPasswordData({...passwordData, current: v})} 
              />
              <PasswordField 
                label="New Password" 
                value={passwordData.new} 
                show={showPass.new} 
                toggle={() => setShowPass({...showPass, new: !showPass.new})} 
                onChange={(v: string) => setPasswordData({...passwordData, new: v})} 
              />
            </div>
            <div className="flex gap-3 mt-8">
              <Button onClick={() => setShowPasswordModal(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
              <Button
                className="flex-1 bg-[#041614] hover:bg-[#123E3A] text-white rounded-xl"
                onClick={handlePasswordChange}
                disabled={isSubmittingPassword}
              >
                {isSubmittingPassword ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-[#39B5A8]/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#041614]">
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </h3>
              <button onClick={() => setShow2FAModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            {twoFactorEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from Google Authenticator to turn off two-factor authentication.
                </p>
                <Input
                  value={twoFactorCode}
                  onChange={(event) => {
                    setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setTwoFactorError('');
                  }}
                  placeholder="123456"
                  className="rounded-xl text-center tracking-[0.4em] font-bold"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Add this account to Google Authenticator, then enter its 6-digit code.
                </p>
                {isPreparingTwoFactor ? (
                  <p className="text-sm text-gray-500">Preparing authenticator setup...</p>
                ) : (
                  <>
                    <div className="rounded-2xl bg-[#F0F9F8] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#39B5A8]">Authenticator Setup Key</p>
                      <p className="mt-2 break-all font-mono text-sm font-bold text-[#041614]">
                        {twoFactorSetup?.secret || 'Preparing setup key...'}
                      </p>
                      {twoFactorSetup?.otpauthUri ? (
                        <a href={twoFactorSetup.otpauthUri} className="mt-3 inline-block text-xs font-black text-[#1A5D56] underline">
                          Open in authenticator app
                        </a>
                      ) : null}
                    </div>
                    {twoFactorSetup?.otpauthUri ? (
                      <AuthenticatorQrCode value={twoFactorSetup.otpauthUri} />
                    ) : null}
                    <Input
                      value={twoFactorCode}
                      onChange={(event) => {
                        setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                        setTwoFactorError('');
                      }}
                      placeholder="123456"
                      className="rounded-xl text-center tracking-[0.4em] font-bold"
                    />
                  </>
                )}
              </div>
            )}
            {twoFactorError ? (
              <p className="mt-3 text-sm font-medium text-red-600">{twoFactorError}</p>
            ) : null}
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShow2FAModal(false)} variant="outline" className="flex-1 rounded-xl">Cancel</Button>
              <Button
                className="flex-1 bg-[#39B5A8] hover:bg-[#2D8F85] text-white rounded-xl"
                onClick={handleTwoFactorSubmit}
                disabled={isPreparingTwoFactor || isSubmittingTwoFactor || twoFactorCode.length !== 6 || (!twoFactorEnabled && !twoFactorSetup?.secret)}
              >
                {isSubmittingTwoFactor
                  ? 'Saving...'
                  : twoFactorEnabled
                    ? 'Disable 2FA'
                    : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-20 bg-white border-b border-[#39B5A8]/10 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-[#39B5A8] font-bold hover:bg-[#F0F9F8] px-4 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black font-bold text-[#041614]">Customer Profile & Preferences</h1>
        </div>

        {/* PakiSHIP Logo on the Right */}
        <img src={logoImg} alt="PakiSHIP" className="h-9" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar */}
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
                  className="absolute -bottom-2 -right-2 bg-[#FF6B35] text-white p-3 rounded-2xl shadow-xl hover:bg-[#e55a28] border-2 border-white transition-all disabled:opacity-60"
                  disabled={isUploadingPhoto}
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
              </div>
              <h2 className="mt-6 text-2xl font-black font-bold text-[#041614] truncate">
                {isLoadingProfile ? 'Loading...' : displayName || 'New User'}
              </h2>
              <p className="text-sm text-[#39B5A8] font-bold mt-1">Regular Customer</p>
              <div className="flex flex-col gap-2 mt-4 items-center">
              </div>
            </div>

            {/* Customer Stats */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                Customer Stats
              </h3>
              <div className="space-y-3">
                {customerStats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-[#1A5D56]/70 font-medium">{stat.label}</span>
                    <span className="font-black text-[#1A5D56]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-[2.5rem] p-6 border border-[#39B5A8]/10 shadow-sm">
              <h3 className="font-black text-[#041614] mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[#39B5A8]" /> Security
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordModal(true)} 
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9F8] transition-all text-left group"
                >
                  <Lock className="w-4 h-4 text-[#39B5A8]" />
                  <span className="text-sm font-bold text-[#1A5D56]">Change Password</span>
                </button>
                <p className="px-3 text-xs text-gray-500">
                  {passwordUpdatedAt ? `Last updated ${new Date(passwordUpdatedAt).toLocaleDateString()}` : 'Password has not been changed yet.'}
                </p>
                <button
                  onClick={() => {
                    void openTwoFactorModal();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#F0F9F8] transition-all text-left group"
                >
                  <ShieldCheck className="w-4 h-4 text-[#39B5A8]" />
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
            <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#39B5A8]/10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black font-bold text-[#041614]">Personal Information</h2>
                {!isEditing ? (
                  <Button 
                    type="button"
                    onClick={() => {
                      isEditingRef.current = true;
                      if (typeof window !== 'undefined') {
                        window.sessionStorage.setItem(EDITING_STORAGE_KEY, 'true');
                        window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
                      }
                      setIsEditing(true);
                    }}
                    className="bg-[#FF6B35] hover:bg-[#e55a28] text-white px-6 rounded-2xl h-12 font-bold shadow-lg shadow-[#FF6B35]/20"
                  >
                    <User className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        isEditingRef.current = false;
                        if (typeof window !== 'undefined') {
                          window.sessionStorage.removeItem(EDITING_STORAGE_KEY);
                          window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                        }
                        setIsEditing(false);
                        void fetchCustomerProfile()
                          .then((result) => applyProfileResponse(result, { forceFormSync: true }))
                          .catch(() => toast.error('Unable to reload your saved profile.'));
                      }}
                      className="border-[#39B5A8]/20 text-[#1A5D56] px-5 rounded-2xl h-12 font-bold"
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
                <FormInput 
                  icon={<User />} 
                  label="First Name" 
                  value={formData.firstName} 
                  onChange={(v: string) => setFormData({...formData, firstName: v})} 
                  disabled={!isEditing}
                />
                <FormInput 
                  icon={<User />} 
                  label="Last Name" 
                  value={formData.lastName} 
                  onChange={(v: string) => setFormData({...formData, lastName: v})} 
                  disabled={!isEditing}
                />
                <FormInput 
                  icon={<Mail />} 
                  label="Email" 
                  value={formData.email} 
                  onChange={(v: string) => setFormData({...formData, email: v})} 
                  disabled={!isEditing}
                />
                <FormInput 
                  icon={<Phone />} 
                  label="Phone" 
                  value={formData.phone} 
                  onChange={(v: string) => setFormData({...formData, phone: v})} 
                  disabled={!isEditing}
                />
                <FormInput 
                  icon={<Calendar />} 
                  label="Birth Date" 
                  type="date" 
                  value={formData.dob} 
                  onChange={(v: string) => setFormData({...formData, dob: v})} 
                  disabled={!isEditing}
                  placeholder="dd/mm/yyyy"
                />
                <div className="md:col-span-2">
                  <FormInput 
                    icon={<MapPin />} 
                    label="Address" 
                    value={formData.address} 
                    onChange={(v: string) => setFormData({...formData, address: v})} 
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </form>

            {/* Special Discounts Verification */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#39B5A8]/10 shadow-sm">
              <h2 className="text-2xl font-black font-bold text-[#041614] mb-3">Special Discounts Verification</h2>
              <p className="text-sm text-[#1A5D56]/70 mb-6">
                Upload a valid PWD or Senior Citizen ID to automatically apply discounts to your parking bookings.
              </p>
              
              <div className="border-2 border-dashed border-[#39B5A8]/30 rounded-[2rem] p-8 text-center hover:border-[#39B5A8] transition-all cursor-pointer"
                onClick={() => !idUploaded && idFileInputRef.current?.click()}
              >
                {idUploaded ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-bold text-[#1A5D56]">
                      {discountStatus === 'verified' ? 'ID Verified' : 'ID Submitted'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {discountStatus === 'verified'
                        ? 'Your discount has been applied'
                        : discountStatus === 'pending'
                          ? 'Your ID is pending verification'
                          : 'Your uploaded ID is on file'}
                    </p>
                    {discountIdFileUrl && (
                      <p className="text-[11px] text-gray-400">{discountIdFileUrl}</p>
                    )}
                    <Button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        idFileInputRef.current?.click();
                      }}
                      variant="outline"
                      className="mt-2 rounded-xl border-[#39B5A8]/20"
                      disabled={isUploadingDiscountId}
                    >
                      {isUploadingDiscountId ? 'Uploading...' : 'Upload New ID'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-[#39B5A8]" />
                    </div>
                    <p className="font-bold text-[#1A5D56]">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">Supported formats: PNG, JPG, or PDF (Max 5MB)</p>
                    <Button 
                      type="button"
                      className="mt-3 bg-[#1A5D56] hover:bg-[#123E3A] text-white rounded-2xl"
                      disabled={isUploadingDiscountId}
                    >
                      {isUploadingDiscountId ? 'Uploading...' : 'Upload ID'}
                    </Button>
                  </div>
                )}
              </div>
              <input 
                ref={idFileInputRef} 
                type="file" 
                onChange={handleIdUpload} 
                className="hidden" 
                accept="image/*,.pdf" 
              />
            </div>

            {/* Account Preferences */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#39B5A8]/10 shadow-sm">
              <h2 className="text-2xl font-black font-bold text-[#041614] mb-6">Account Preferences</h2>
              
              <div className="space-y-5">
                <PreferenceToggle
                  icon={<Bell className="w-5 h-5 text-[#39B5A8]" />}
                  title="Email Notifications"
                  description="Receive booking confirmations"
                  checked={preferences.emailNotifications}
                  onChange={() => togglePreference('emailNotifications')}
                />
                <PreferenceToggle
                  icon={<MessageSquare className="w-5 h-5 text-[#39B5A8]" />}
                  title="SMS Updates"
                  description="Get real-time parking alerts"
                  checked={preferences.smsUpdates}
                  onChange={() => togglePreference('smsUpdates')}
                />
                <PreferenceToggle
                  icon={<RefreshCw className="w-5 h-5 text-[#39B5A8]" />}
                  title="Auto-extend Booking"
                  description="Automatically extend if running late"
                  checked={preferences.autoExtend}
                  onChange={() => togglePreference('autoExtend')}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- INTERNAL HELPERS ---

function FormInput({ icon, label, value, onChange, type = "text", disabled = false, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-[#39B5A8] uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon && cloneElement(icon, { className: "w-4 h-4" })}
        </div>
        <Input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full ${disabled ? 'bg-[#F0F9F8] border-transparent' : 'bg-white border-[#39B5A8]/30 focus:border-[#39B5A8]'} border-2 rounded-2xl pl-12 pr-4 py-6 text-sm font-bold outline-none transition-all`} 
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, toggle, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-600 ml-1">{label}</label>
      <div className="relative">
        <Input 
          type={show ? 'text' : 'password'} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="rounded-xl pr-10 bg-[#F0F9F8] border-transparent focus:border-[#39B5A8]/30" 
        />
        <button 
          type="button" 
          onClick={toggle} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#39B5A8]"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

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
