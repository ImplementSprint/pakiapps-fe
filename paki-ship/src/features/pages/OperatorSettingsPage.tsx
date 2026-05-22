import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Lock, Eye, EyeOff, X, AlertCircle, Shield, Bell, MessageSquare, 
  Package, BadgeHelp
} from "lucide-react";
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { changeAccountPassword } from '@/lib/auth-security';
import { AccountTwoFactorModal } from "../components/AccountTwoFactorModal";
import {
  fetchOperatorSettings,
  updateOperatorSettings,
} from "@/lib/operator-account";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

export function OperatorSettingsPage() {
  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    smsAlerts: false,
    parcelAlerts: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    setTwoFactorEnabled(localStorage.getItem("operatorTwoFactorEnabled") === "true");
    setPreferences({
      emailNotifications: localStorage.getItem('operatorEmailNotifications') === 'true',
      smsAlerts: localStorage.getItem('operatorSmsAlerts') === 'true',
      parcelAlerts: localStorage.getItem('operatorParcelAlerts') === 'true',
    });

    let isMounted = true;

    void (async () => {
      try {
        const result = await fetchOperatorSettings();
        if (!isMounted) return;

        const nextPreferences = {
          emailNotifications: Boolean(result.settings.preferences.emailNotifications),
          smsAlerts: Boolean(result.settings.preferences.smsAlerts),
          parcelAlerts: Boolean(result.settings.preferences.parcelAlerts),
        };

        setTwoFactorEnabled(result.settings.security.twoFactorEnabled);
        setPreferences(nextPreferences);

        localStorage.setItem("operatorTwoFactorEnabled", String(result.settings.security.twoFactorEnabled));
        localStorage.setItem("operatorEmailNotifications", String(nextPreferences.emailNotifications));
        localStorage.setItem("operatorSmsAlerts", String(nextPreferences.smsAlerts));
        localStorage.setItem("operatorParcelAlerts", String(nextPreferences.parcelAlerts));
      } catch {
        // Keep local fallback values if backend settings are unavailable.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChangePassword = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setPasswordError('');

    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      const message = 'Please fill in all password fields';
      setPasswordError(message);
      toast.error(message);
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      const message = 'New passwords do not match';
      setPasswordError(message);
      toast.error(message);
      return;
    }
    if (passwordData.new.length < 8) {
      const message = 'Password must be at least 8 characters';
      setPasswordError(message);
      toast.error(message);
      return;
    }
    setIsChangingPassword(true);
    const loadingToast = toast.loading('Updating password...');

    try {
      await changeAccountPassword(passwordData.current, passwordData.new);
      toast.dismiss(loadingToast);
      toast.success('Password changed successfully!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setShowPasswordModal(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : 'Unable to update your password.';
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePreference = async (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    localStorage.setItem(`operator${key.charAt(0).toUpperCase()}${key.slice(1)}`, String(newPreferences[key]));
    window.dispatchEvent(new Event('storage'));

    try {
      await updateOperatorSettings({ preferences: newPreferences });
      toast.success('Preference updated!');
    } catch (error) {
      setPreferences(preferences);
      localStorage.setItem(`operator${key.charAt(0).toUpperCase()}${key.slice(1)}`, String(preferences[key]));
      toast.error(error instanceof Error ? error.message : 'Unable to update preference.');
    }
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
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                      autoComplete={
                        field.key === 'current'
                          ? 'current-password'
                          : 'new-password'
                      }
                      className="pr-10 bg-[#F0F9F8] border-[#39B5A8]/20 focus:border-[#39B5A8] rounded-xl text-[#041614]"
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
              {passwordError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {passwordError}
                </div>
              ) : null}
              <div className="bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-xl p-3">
                <p className="text-xs text-[#1A5D56]/70 font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#39B5A8]" />
                  Minimum 8 characters with letters and numbers.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    setPasswordError('');
                    setShowPasswordModal(false);
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl border-[#39B5A8]/20"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="flex-1 bg-[#39B5A8] hover:bg-[#2D8F85] rounded-xl"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </form>
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

      {/* Header */}
      <header className="h-20 bg-white border-b border-[#39B5A8]/10 sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#39B5A8] font-bold text-sm hover:bg-[#39B5A8]/10 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black text-[#041614]">Settings</h1>
        </div>
        
        <img src={logoImg} alt="PakiSHIP" className="h-9" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-6">
          
          {/* Security Settings */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#F0F9F8] rounded-xl">
                <Lock className="w-5 h-5 text-[#39B5A8]" />
              </div>
              <h2 className="text-2xl font-black text-[#041614]">Security</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F0F9F8] transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#39B5A8]" />
                  <div>
                    <p className="font-bold text-[#1A5D56]">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password</p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </button>

              <button
                onClick={() => setShow2FAModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F0F9F8] transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#39B5A8]" />
                  <div>
                    <p className="font-bold text-[#1A5D56]">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">
                      {twoFactorEnabled ? 'Authenticator app protection is active' : 'Add extra security to your account'}
                    </p>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
              </button>
            </div>
          </div>

          {/* Help */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#F0F9F8] rounded-xl">
                <BadgeHelp className="w-5 h-5 text-[#39B5A8]" />
              </div>
              <h2 className="text-2xl font-black text-[#041614]">Help</h2>
            </div>

            <button
              onClick={() => navigate('/operator/faq')}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[#F0F9F8] transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <BadgeHelp className="w-5 h-5 text-[#39B5A8]" />
                <div>
                  <p className="font-bold text-[#1A5D56]">Frequently Asked Questions</p>
                  <p className="text-xs text-gray-500">Relay parcels, QR codes, hub profile, and alerts</p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </button>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-[#39B5A8]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#F0F9F8] rounded-xl">
                <Bell className="w-5 h-5 text-[#39B5A8]" />
              </div>
              <h2 className="text-2xl font-black text-[#041614]">Notifications</h2>
            </div>
            
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
                description="Alert when new parcels arrive at hub"
                checked={preferences.parcelAlerts}
                onChange={() => togglePreference('parcelAlerts')}
              />
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
