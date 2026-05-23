import { useState, useEffect } from "react";
import { useNavigate } from "../../lib/router";
import { useAuth } from "../../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Check,
  AlertCircle,
  Phone,
  AppWindow,
  Activity,
  Workflow,
  X
} from "lucide-react";

import { pakiAdminLogo } from '../../lib/assets';
import { isTwoFactorEnabledForEmail } from '../../lib/twoFactor';

export default function PakiAdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Login State
  const [identifier, setIdentifier] = useState(""); 
  const [isEmail, setIsEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");

  // Forgot Password Popup State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);



  useEffect(() => {
    if (/[a-zA-Z@]/.test(identifier)) {
      setIsEmail(true);
    } else {
      setIsEmail(false);
    }
  }, [identifier]);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/[a-zA-Z@]/.test(value)) {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) setIdentifier(digits);
    } else {
      setIdentifier(value);
    }
    if (error) setError("");
  };

  const completeLogin = async () => {
    setIsLoading(true);
    try {
      await login(identifier, password, 'pakiadmin');
      navigate("/pakiadmin/super-admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authorization failed. Please check your credentials.";
      setError(message);
      setIsLoading(false);
    }
  };

  const validateCredentials = () => {
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setError("Invalid administrative email format.");
        return false;
      }
    } else {
      if (identifier.length !== 10) {
        setError("Invalid mobile number. 10 digits required.");
        return false;
      }
    }

    if (password.length < 4) {
      setError("Security Alert: Password must be at least 4 characters.");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCredentials()) {
      return;
    }

    if (isTwoFactorEnabledForEmail(identifier, ['pakiadmin', 'pakiship'])) {
      setTwoFactorCode("");
      setTwoFactorError("");
      setShowTwoFactorModal(true);
      return;
    }

    await completeLogin();
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(twoFactorCode)) {
      setTwoFactorError("Enter the 6-digit authenticator code.");
      return;
    }

    setShowTwoFactorModal(false);
    await completeLogin();
  };

  const handleResetRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call for reset
    setIsLoading(true);
    setTimeout(() => {
      setResetSent(true);
      setIsLoading(false);

      // In production, this would send an email with the reset link
      // For demo purposes, you can manually navigate to:
      // /pakiadmin/reset-password?token=demo_reset_token_123
      console.log('Reset link would be sent to:', resetEmail);
      console.log('Demo reset link: /pakiadmin/reset-password?token=demo_reset_token_123');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#dec0f1]/20 text-[#2c0735] flex flex-col font-sans overflow-hidden">
      
      {/* --- EMPTY HEADER (As requested) --- */}
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/60 backdrop-blur-md border-b border-[#2c0735]/5 z-50">
      </nav>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-8 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#dec0f1] rounded-full blur-[140px] -z-10 opacity-40" />
        
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-10 xl:gap-20 items-center">
          
          {/* LEFT COLUMN: Admin Context */}
          <div className="hidden lg:flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-8 flex flex-col items-center text-center">
              <div className="space-y-8 flex flex-col items-center">
                <img 
                  src={pakiAdminLogo} 
                  alt="PakiAdmin Central" 
                  className="h-85 w-auto object-contain -mt-15 -mb-15 drop-shadow-sm"
                />
                <p className="text-[#2c0735] text-xl font-medium opacity-75 -mb-5 max-w-md leading-relaxed">
                  Integrated Management for PakiShip and PakiPark.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-lg">
              <AdminFeatureCard 
                icon={<AppWindow className="w-5 h-5" />} 
                title="Centralized Management" 
                desc="Monitor and manage both Pakiship and Pakipark operations in one centralized admin platform." 
              />
              <AdminFeatureCard 
                icon={<Activity className="w-5 h-5" />} 
                title="Real-Time Visibility" 
                desc="Track real-time updates, statuses, and activity for faster and more accurate decision-making." 
              />
              <AdminFeatureCard 
                icon={<Workflow className="w-5 h-5" />} 
                title="Improved Efficiency" 
                desc="Improve workflow efficiency with easier oversight, better organization, and quicker response to issues." 
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Login Card */}
          <div className="w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="w-full max-w-lg bg-white border border-[#dec0f1] rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-[#2c0735]/10 relative">
              <div className="mb-8 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#dec0f1]/30 p-2.5 rounded-xl">
                    <Lock className="w-6 h-6 text-[#2c0735]" />
                  </div>
                  <h2 className="text-3xl font-black text-[#2c0735]">Admin Login</h2>
                </div>
                <p className="text-[#2c0735]/40 font-semibold text-sm">
                  Identity validation required for console decryption.
                </p>
              </div>



              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 py-4 px-5 rounded-2xl flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                    Email or Mobile Number
                  </label>
                  <div className="flex gap-2">
                    {!isEmail && (
                      <div className="bg-[#dec0f1]/20 border border-[#dec0f1] rounded-xl px-4 py-3.5 text-[#2c0735] font-bold flex items-center text-sm">+63</div>
                    )}
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c0735]/30">
                        {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                      <input 
                        type="text" 
                        value={identifier}
                        onChange={handleIdentifierChange}
                        placeholder={isEmail ? "admin@pakiadmin.ph" : "912 345 6789"}
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-4 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold" 
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                    Security Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(error) setError(""); }}
                      placeholder="••••••••••••"
                      className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-11 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold" 
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2c0735]/20 hover:text-[#2c0735]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button 
                    type="button"
                    onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                    className="flex items-center gap-2 group cursor-pointer"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                      keepLoggedIn 
                        ? "bg-[#2c0735] border-[#2c0735]" 
                        : "border-[#dec0f1] bg-white group-hover:border-[#2c0735]"
                    }`}>
                      {keepLoggedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                    </div>
                    <span className="text-xs font-bold text-[#2c0735]/60 group-hover:text-[#2c0735] transition-colors">
                      Remember Me
                    </span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setShowForgotModal(true); setResetSent(false); }}
                    className="text-xs text-[#2c0735] font-black hover:opacity-70 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] mt-4 text-xs uppercase tracking-[0.2em] disabled:opacity-70 disabled:cursor-not-allowed">
                  {isLoading ? "Authenticating..." : "Initialize Dashboard"}
                </button>
              </form>


            </div>
          </div>
        </div>
      </main>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#2c0735]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowForgotModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#dec0f1] animate-in zoom-in-95 fade-in duration-300">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-[#dec0f1]/20 transition-colors"
            >
              <X className="w-5 h-5 text-[#2c0735]" />
            </button>

            {!resetSent ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#2c0735]">Key Recovery</h3>
                  <p className="text-[#2c0735]/50 text-sm font-bold leading-relaxed">
                    Enter your administrative email to receive a decryption link for your credentials.
                  </p>
                </div>

                <form onSubmit={handleResetRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                      Recovery Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                      <input 
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@pakiadmin.ph"
                        required
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-4 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "Request Access Reset"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 stroke-[3]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#2c0735]">Link Initialized</h3>
                  <p className="text-[#2c0735]/50 text-sm font-bold leading-relaxed px-4">
                    If <span className="text-[#2c0735]">{resetEmail}</span> is authorized, you will receive instructions shortly.
                  </p>
                </div>
                <button 
                  onClick={() => setShowForgotModal(false)}
                  className="w-full bg-[#dec0f1]/30 text-[#2c0735] font-black py-4 rounded-xl hover:bg-[#dec0f1]/50 transition-all text-xs uppercase tracking-widest"
                >
                  Return to Console
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showTwoFactorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#2c0735]/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setShowTwoFactorModal(false);
              setTwoFactorCode("");
              setTwoFactorError("");
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-[#dec0f1] animate-in zoom-in-95 fade-in duration-300">
            <button
              onClick={() => {
                setShowTwoFactorModal(false);
                setTwoFactorCode("");
                setTwoFactorError("");
              }}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-[#dec0f1]/20 transition-colors"
            >
              <X className="w-5 h-5 text-[#2c0735]" />
            </button>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="w-14 h-14 bg-[#dec0f1]/30 rounded-2xl flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#2c0735]" />
                </div>
                <h3 className="text-2xl font-black text-[#2c0735]">Two-Factor Verification</h3>
                <p className="text-[#2c0735]/50 text-sm font-bold leading-relaxed">
                  This account has 2FA enabled. Enter the 6-digit code from the authenticator app to continue.
                </p>
              </div>

              <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                {twoFactorError && (
                  <div className="bg-red-50 border border-red-100 py-3 px-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600 leading-tight">{twoFactorError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                    Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => {
                      setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setTwoFactorError("");
                    }}
                    placeholder="123456"
                    className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl px-4 py-3.5 text-center text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-2xl font-black tracking-[0.35em]"
                    required
                  />
                  <p className="text-xs font-semibold text-[#2c0735]/45">
                    Prototype mode accepts any 6-digit number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify and Continue"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function AdminFeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/80 border border-[#dec0f1] rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="w-11 h-11 bg-[#dec0f1]/40 rounded-xl shrink-0 flex items-center justify-center text-[#2c0735] transition-colors group-hover:bg-[#2c0735] group-hover:text-white">
        {icon}
      </div>
      <div className="flex flex-col text-left">
        <h4 className="font-black text-[#2c0735] text-base leading-tight">{title}</h4>
        <p className="text-[#2c0735]/50 text-xs font-bold leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
