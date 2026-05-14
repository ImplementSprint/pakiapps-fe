'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, User, Mail, Phone, Lock, Edit3, Camera, ShieldCheck,
  Upload, Calendar, MapPin, Bell, Smartphone, RefreshCcw, LogOut,
  Eye, EyeOff, X, CheckCircle2, Clock, AlertTriangle, Shield,
  QrCode, KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usersService } from '@/services/usersService';
import { authService } from '@/services/authService';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
const PH_PHONE_RE = /^(\+639|09)\d{9}$/;

/** Safely render an address that may be a string, object, or empty */
function renderAddress(addr: any): string {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    return [addr.street, addr.city, addr.province].filter(Boolean).join(', ');
  }
  return '';
}

/** Determine if the current profile data meets the auto-verify criteria */
function meetsVerification(profile: { phone: string; dateOfBirth: string; address: string }) {
  return PH_PHONE_RE.test(profile.phone.trim()) && profile.dateOfBirth.trim() !== '' && profile.address.trim() !== '';
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [show, setShow]       = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error('New passwords do not match'); return; }
    if (form.next.length < 8)       { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await usersService.changePassword(form.current, form.next);
      toast.success('Password changed successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
              <Lock className="size-5 text-[#1e3d5a]" />
            </div>
            <h2 className="text-xl font-black text-[#1e3d5a]">Change Password</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="size-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(['current', 'next', 'confirm'] as const).map((key, i) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase">
                {key === 'current' ? 'Current Password' : key === 'next' ? 'New Password' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Input
                  type={show[key] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === 'current' ? 'Enter current password' : key === 'next' ? 'Min. 8 characters' : 'Repeat new password'}
                  required
                  className="h-12 pr-10 bg-gray-50/50 border-gray-200 rounded-xl focus-visible:ring-[#ee6b20] font-medium"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show[key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#ee6b20] hover:bg-[#d95a10] font-black rounded-xl mt-2">
            {loading ? 'Saving…' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── 2FA Setup Modal ──────────────────────────────────────────────────────────
function TwoFAModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<'setup' | 'verify' | 'done'>('setup');
  const [secret, setSecret]   = useState('');
  const [otpUri, setOtpUri]   = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const data = await usersService.setup2FA();
      setSecret(data.secret);
      setOtpUri(data.otpUri);
      setStep('verify');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set up 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersService.verify2FA(code);
      setStep('done');
      toast.success('2FA enabled! Your account is now more secure.');
    } catch (err: any) {
      toast.error(err?.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
              <Shield className="size-5 text-[#1e3d5a]" />
            </div>
            <h2 className="text-xl font-black text-[#1e3d5a]">Two-Factor Authentication</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X className="size-4 text-gray-500" />
          </button>
        </div>

        {step === 'setup' && (
          <div className="text-center space-y-5">
            <div className="size-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Shield className="size-10 text-[#1e3d5a]" />
            </div>
            <div>
              <h3 className="font-black text-[#1e3d5a] text-lg">Secure your account</h3>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security using an authenticator app like Google Authenticator or Authy.</p>
            </div>
            <Button onClick={handleSetup} disabled={loading} className="w-full h-12 bg-[#1e3d5a] hover:bg-[#2a5373] font-black rounded-xl">
              {loading ? 'Generating…' : 'Get Started'}
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-gray-500 mb-2">Scan this QR code with your authenticator app, or enter the secret manually:</p>
              {/* QR code via a free encode API */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`}
                alt="2FA QR Code"
                className="mx-auto rounded-xl border border-gray-200"
                width={180}
                height={180}
              />
              <div className="mt-3 bg-white border border-gray-200 rounded-xl px-3 py-2 font-mono text-sm tracking-widest break-all text-[#1e3d5a] font-bold">
                {secret}
              </div>
            </div>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase">Enter 6-digit code from app</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="h-12 mt-1.5 text-center text-2xl tracking-[0.5em] bg-gray-50 border-gray-200 rounded-xl font-mono font-black"
                  required
                />
              </div>
              <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-12 bg-[#ee6b20] hover:bg-[#d95a10] font-black rounded-xl">
                {loading ? 'Verifying…' : 'Verify & Enable'}
              </Button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center space-y-5 py-4">
            <div className="size-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-10 text-green-500" />
            </div>
            <div>
              <h3 className="font-black text-[#1e3d5a] text-lg">2FA Enabled!</h3>
              <p className="text-sm text-gray-500 mt-1">Your account is now protected with two-factor authentication.</p>
            </div>
            <Button onClick={onClose} className="w-full h-12 bg-[#1e3d5a] hover:bg-[#2a5373] font-black rounded-xl">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error('Enter your password to confirm'); return; }
    setLoading(true);
    try {
      await usersService.deleteAccount(password);
      toast.success('Account deleted. Goodbye!');
      authService.logout();
    } catch (err: any) {
      toast.error(err?.message || 'Incorrect password or server error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-red-100 rounded-xl flex items-center justify-center">
              <X className="size-5 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-red-600">Delete Account</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="size-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          This action is <strong>permanent and irreversible</strong>. All your bookings, vehicles, and data will be deleted. Please enter your password to confirm.
        </p>
        <form onSubmit={handleDelete} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-12 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Yes, Delete My Account'}
          </button>
          <button type="button" onClick={onClose} className="w-full h-12 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', dateOfBirth: '', address: '', profilePicture: '',
  });
  const [serverData, setServerData]   = useState<any>(null);
  const [preferences, setPreferences] = useState({ emailNotifications: true, smsUpdates: true, autoExtend: false });
  const [isEditing, setIsEditing]     = useState(false);
  const [stats, setStats]             = useState({ totalBookings: 0, activeBookings: 0, savedVehicles: 0, created: '' });
  const [showPwModal, setShowPwModal] = useState(false);
  const [show2FA, setShow2FA]         = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);

  useEffect(() => {
    usersService.getProfile().then(p => {
      setServerData(p);
      setProfile({
        name:           p.name || '',
        email:          p.email || '',
        phone:          p.phone || '',
        dateOfBirth:    p.dateOfBirth || '',
        address:        renderAddress(p.address),
        profilePicture: p.profilePicture || '',
      });
      if (p.preferences) setPreferences(p.preferences);
      setStats({
        totalBookings:  p.totalBookings  ?? 0,
        activeBookings: p.activeBookings ?? 0,
        savedVehicles:  p.savedVehicles  ?? 0,
        created:        p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '',
      });
    }).catch(() => {
      setProfile({
        name:           localStorage.getItem('userName') || '',
        email:          localStorage.getItem('userEmail') || '',
        phone:          localStorage.getItem('userPhone') || '',
        dateOfBirth:    '',
        address:        '',
        profilePicture: localStorage.getItem('userProfilePic') || '',
      });
    });
  }, []);

  const isVerified = serverData?.isVerified ?? false;
  const discountStatus = serverData?.discountStatus ?? 'none';
  const discountPct    = serverData?.discountPct ?? 0;
  const twoFAEnabled   = serverData?.twoFactorEnabled ?? false;

  // Will this profile qualify for verification once saved?
  const willVerify = meetsVerification(profile);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await usersService.updateProfile({
        name:        profile.name,
        phone:       profile.phone,
        address:     profile.address,
        dateOfBirth: profile.dateOfBirth,
        profilePicture: profile.profilePicture,
        preferences,
      });
      setServerData(updated);
      localStorage.setItem('userName',  profile.name);
      localStorage.setItem('userEmail', profile.email);
      localStorage.setItem('userPhone', profile.phone);
      if (profile.profilePicture) localStorage.setItem('userProfilePic', profile.profilePicture);
      toast.success(updated?.isVerified ? '✅ Profile saved — account is now Verified!' : 'Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const handleTogglePref = (key: keyof typeof preferences) => {
    const newVal = { ...preferences, [key]: !preferences[key] };
    setPreferences(newVal);
    usersService.updateProfile({ preferences: newVal }).catch(() => toast.error('Failed to update preference'));
  };

  const handleDiscountUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size cannot exceed 5MB'); return; }
    setDiscountLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target?.result as string;
        const discountType = file.name.toLowerCase().includes('senior') ? 'senior_citizen' : 'PWD';
        await usersService.submitDiscountRequest(base64, discountType);
        toast.success('ID submitted for admin review. You\'ll be notified when approved.');
        setServerData((s: any) => ({ ...s, discountStatus: 'pending' }));
      } catch (err: any) {
        toast.error(err?.message || 'Failed to submit ID');
      } finally {
        setDiscountLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const discountBadge = () => {
    if (discountStatus === 'approved') return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-2xl">
        <CheckCircle2 className="size-5 text-green-500" />
        <div>
          <p className="text-sm font-black text-green-700">Discount Approved — {discountPct}% Off</p>
          <p className="text-xs text-green-600">Applied automatically to every reservation</p>
        </div>
      </div>
    );
    if (discountStatus === 'pending') return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl">
        <Clock className="size-5 text-amber-500" />
        <div>
          <p className="text-sm font-black text-amber-700">Under Review</p>
          <p className="text-xs text-amber-600">Admin is reviewing your ID. Please wait.</p>
        </div>
      </div>
    );
    if (discountStatus === 'rejected') return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl">
        <AlertTriangle className="size-5 text-red-500" />
        <div>
          <p className="text-sm font-black text-red-700">Request Rejected</p>
          <p className="text-xs text-red-600">Please upload a clearer, valid PWD or Senior Citizen ID.</p>
        </div>
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {showPwModal      && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      {show2FA          && <TwoFAModal         onClose={() => setShow2FA(false)} />}
      {showDeleteModal  && <DeleteAccountModal  onClose={() => setShowDeleteModal(false)} />}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" onClick={() => router.push('/customer/home')} className="gap-2 font-bold text-[#1e3d5a] hover:bg-gray-100">
              <ArrowLeft className="size-4" /> Back to Home
            </Button>
            <div className="w-px h-6 bg-gray-200" />
            <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 w-auto object-contain" unoptimized />
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-[#1e3d5a] hidden sm:block">Customer Profile</h1>
            <Button variant="ghost" onClick={() => authService.logout()} className="gap-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 font-semibold">
              <LogOut className="size-4" /><span className="hidden sm:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Avatar + Verification Badge */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="size-32 bg-[#1e3d5a] text-white rounded-full flex items-center justify-center text-5xl font-black shadow-lg overflow-hidden">
                  {profile.profilePicture ? (
                    <Image src={profile.profilePicture} alt="Avatar" fill className="object-cover" unoptimized />
                  ) : (
                    profile.name.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <label className="absolute bottom-1 right-1 size-9 bg-[#ee6b20] text-white rounded-full flex items-center justify-center hover:bg-[#d95a10] border-[3px] border-white shadow-sm transition-colors cursor-pointer">
                  <Camera className="size-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const base64 = ev.target?.result as string;
                        setProfile(p => ({ ...p, profilePicture: base64 }));
                        usersService.updateProfile({ profilePicture: base64 }).catch(() => {});
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
              <h2 className="text-2xl font-black text-[#1e3d5a]">{profile.name || 'New User'}</h2>
              <p className="text-gray-500 font-medium mb-3">
                {discountStatus === 'approved' ? `${discountPct}% Discount Customer` : 'Regular Customer'}
              </p>

              {/* Verification badge */}
              {isVerified ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                  <ShieldCheck className="size-4" /> Verified Account
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                  <AlertTriangle className="size-4" /> Unverified
                </div>
              )}

              {!isVerified && willVerify && (
                <p className="text-[11px] text-green-600 font-bold mt-2">
                  ✅ Save your profile to become Verified!
                </p>
              )}
              {!isVerified && !willVerify && (
                <p className="text-[11px] text-gray-400 font-medium mt-2">
                  Add phone, birthdate & address to get verified
                </p>
              )}
            </div>

            {/* Customer Stats */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-black text-[#1e3d5a] mb-6">Customer Stats</h3>
              <div className="space-y-4 text-sm">
                {[
                  ['Total Bookings', stats.totalBookings],
                  ['Active Bookings', stats.activeBookings],
                  ['Saved Vehicles', stats.savedVehicles],
                  ['Account Created', stats.created],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between items-center text-gray-500 font-medium">
                    <span>{label}</span>
                    <span className="font-black text-[#1e3d5a]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
              <h3 className="text-lg font-black text-[#1e3d5a] mb-6">Security</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPwModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-[#1e3d5a] hover:bg-gray-50 transition-colors"
                >
                  <Lock className="size-4 text-gray-500" /> Change Password
                </button>
                <button
                  onClick={() => setShow2FA(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-bold transition-colors ${
                    twoFAEnabled
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 text-[#1e3d5a] hover:bg-gray-50'
                  }`}
                >
                  <Shield className="size-4" />
                  {twoFAEnabled ? '2FA Enabled ✓' : 'Enable 2FA'}
                </button>
                <button
                  onClick={() => router.push('/customer/payment-methods')}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-bold text-[#1e3d5a] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  <span className="text-base leading-none">💙</span> GCash &amp; Payment Methods
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-red-100 p-8">
              <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
              <p className="text-xs text-gray-500 mb-5">Once you delete your account, there is no going back. Please be certain.</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="size-4" /> Delete My Account
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Personal Information */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-[#1e3d5a]">Personal Information</h3>
                  {!isVerified && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      Fill in phone, birth date and address to get verified ✓
                    </p>
                  )}
                </div>
                <Button
                  onClick={e => { e.preventDefault(); if (isEditing) handleSave(e); else setIsEditing(true); }}
                  className="bg-[#ee6b20] hover:bg-[#d95a10] font-bold rounded-xl gap-2 px-6 h-11 transition-all shadow-md"
                >
                  <Edit3 className="size-4" /> {isEditing ? 'Save Profile' : 'Edit Profile'}
                </Button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2">
                    <User className="size-4 text-gray-400" /> Full Name
                  </label>
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} disabled={!isEditing}
                    placeholder="Enter your full name" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus-visible:ring-[#ee6b20] font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2">
                    <Mail className="size-4 text-gray-400" /> Email
                  </label>
                  <Input value={profile.email} disabled placeholder="Email" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl font-medium opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2">
                    <Phone className={`size-4 ${PH_PHONE_RE.test(profile.phone) ? 'text-green-500' : 'text-gray-400'}`} /> Phone
                    {profile.phone && !PH_PHONE_RE.test(profile.phone) && (
                      <span className="text-[10px] text-red-500 font-bold normal-case tracking-normal">Use format 09XXXXXXXXX</span>
                    )}
                  </label>
                  <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} disabled={!isEditing}
                    placeholder="09XXXXXXXXX" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus-visible:ring-[#ee6b20] font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2">
                    <Calendar className="size-4 text-gray-400" /> Birth Date
                  </label>
                  <Input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={e => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    disabled={!isEditing}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus-visible:ring-[#ee6b20] font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase flex items-center gap-2">
                    <MapPin className="size-4 text-gray-400" /> Address
                  </label>
                  <Input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} disabled={!isEditing}
                    placeholder="Enter your full address (street, city, province)" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus-visible:ring-[#ee6b20] font-medium" />
                </div>
                <button type="submit" className="hidden" />
              </form>
            </div>

            {/* Special Discounts Verification */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-black text-[#1e3d5a] mb-2">Special Discounts Verification</h3>
              <p className="text-gray-500 font-medium text-sm mb-6">
                Upload a valid PWD or Senior Citizen ID. Once approved by admin, you'll receive <strong className="text-[#ee6b20]">20% off</strong> every reservation automatically.
              </p>

              {discountBadge()}

              {(discountStatus === 'none' || discountStatus === 'rejected') && (
                <label className={`mt-4 border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${discountLoading ? 'opacity-60 pointer-events-none' : 'border-gray-200 hover:bg-blue-50/30 hover:border-blue-300'}`}>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleDiscountUpload} />
                  <div className="size-14 bg-[#1e3d5a]/5 text-[#1e3d5a] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {discountLoading ? (
                      <div className="size-6 border-2 border-[#1e3d5a]/30 border-t-[#1e3d5a] rounded-full animate-spin" />
                    ) : (
                      <Upload className="size-6" />
                    )}
                  </div>
                  <p className="font-black text-[#1e3d5a] mb-1">
                    {discountLoading ? 'Uploading…' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs font-bold text-gray-400 tracking-wide mb-6">PNG, JPG, or PDF · Max 5MB</p>
                  <div className="bg-[#1e3d5a] hover:bg-[#2a5373] text-white px-8 h-12 rounded-xl font-black transition-colors shadow-lg flex items-center justify-center">
                    Upload PWD / Senior Citizen ID
                  </div>
                </label>
              )}
            </div>

            {/* Account Preferences */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 mb-12">
              <h3 className="text-xl font-black text-[#1e3d5a] mb-6">Account Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'emailNotifications' as const, icon: Bell, label: 'Email Notifications', desc: 'Receive booking confirmations' },
                  { key: 'smsUpdates'          as const, icon: Smartphone, label: 'SMS Updates',          desc: 'Get real-time parking alerts' },
                  { key: 'autoExtend'          as const, icon: RefreshCcw, label: 'Auto-extend Booking',  desc: 'Automatically extend if running late' },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <div key={key} onClick={() => handleTogglePref(key)}
                    className={`p-5 rounded-2xl border flex justify-between items-start transition-all cursor-pointer hover:-translate-y-0.5 ${
                      preferences[key] ? 'border-green-200/50 bg-green-50/40' : 'border-gray-200 bg-gray-50/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-[#1e3d5a] flex items-center gap-2 mb-1">
                        <Icon className={`size-4 ${preferences[key] ? 'text-green-600' : 'text-gray-400'}`} /> {label}
                      </h4>
                      <p className="text-xs font-medium text-gray-500">{desc}</p>
                    </div>
                    {preferences[key] ? <ShieldCheck className="size-5 text-green-500 shrink-0" /> : <div className="size-5 rounded-full border-2 border-gray-300" />}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
