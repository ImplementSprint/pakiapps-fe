import { Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { 
  Lock, Eye, EyeOff, ChevronLeft, 
  Zap, MapPin, ShieldCheck, Star, X, ArrowRight, Check, Mail, Phone, AlertCircle 
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

type LoginRole = "customer" | "driver" | "operator";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState(""); 
  const [isEmail, setIsEmail] = useState(false);
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{
    challengeToken: string;
    redirectPath: string;
    user: { id: string; fullName: string; role: LoginRole };
  } | null>(null);
  const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] = useState(false);
  
  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [resetDestination, setResetDestination] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetOtpToken, setResetOtpToken] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Auto-detect if input is email or phone.
  useEffect(() => {
    setIsEmail(/[a-zA-Z@]/.test(identifier));
  }, [identifier]);

  useEffect(() => {
    let isMounted = true;

    const routeRecoveryToResetPage = async () => {
      const currentUrl = new URL(window.location.href);
      const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
      const queryType = currentUrl.searchParams.get("type");
      const hashType = hashParams.get("type");
      const hasRecoveryQuery =
        queryType === "recovery" && currentUrl.searchParams.has("token_hash");
      const hasRecoveryHash =
        hashType === "recovery" && hashParams.has("access_token");

      if (!hasRecoveryQuery && !hasRecoveryHash) {
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();

        if (hasRecoveryQuery) {
          const verification = await supabase.auth.verifyOtp({
            token_hash: String(currentUrl.searchParams.get("token_hash")),
            type: "recovery",
          });

          if (verification.error) {
            throw verification.error;
          }

          if (!isMounted) {
            return;
          }

          navigate("/reset-password", { replace: true });
          return;
        }

        if (hasRecoveryHash) {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (!accessToken || !refreshToken) {
            throw new Error("Reset link is missing session tokens.");
          }

          const sessionResult = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionResult.error) {
            throw sessionResult.error;
          }

          if (!isMounted) {
            return;
          }

          navigate("/reset-password", { replace: true });
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "We couldn't verify your reset link. Please request another password reset email.",
        );
      }
    };

    void routeRecoveryToResetPage();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!/[a-zA-Z@]/.test(value)) {
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) setIdentifier(digits);
    } else {
      setIdentifier(value);
    }
    
    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const activateGeofence = async (hubId: string) => {
    // Logic: Backend call to set 'is_active' to true for this hub
    // This allows the system to route PUV drivers to this location
    console.log(`Geofence activated for Hub: ${hubId}`);
    localStorage.setItem("hub_status", "active");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    
    // 1. Validation for identifier format
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setError("Invalid email or password.");
        return;
      }
    } else {
      if (identifier.length !== 10) {
        setError("Invalid mobile number or password.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password,
          keepLoggedIn,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Invalid email/phone or password.");
        return;
      }

      if (result.requiresTwoFactor && result.challengeToken) {
        setTwoFactorChallenge({
          challengeToken: result.challengeToken,
          redirectPath: result.redirectPath,
          user: result.user,
        });
        setTwoFactorCode("");
        setError("");
        return;
      }

      setError("");
      await finalizeLogin({
        user: result.user,
        redirectPath: result.redirectPath,
      });
    } catch {
      setError("Unable to log in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeLogin = async (payload: {
    user: { id: string; fullName: string; role: LoginRole };
    redirectPath: string;
  }) => {
    localStorage.setItem("userId", payload.user.id);
    localStorage.setItem("user_role", payload.user.role);
    localStorage.setItem("userRole", payload.user.role);
    localStorage.setItem("userName", payload.user.fullName);
    localStorage.setItem("is_logged_in", "true");

    if (payload.user.role === "driver") {
      localStorage.setItem("driverName", payload.user.fullName);
      localStorage.removeItem("operatorName");
      localStorage.removeItem("operatorProfilePicture");
    } else if (payload.user.role === "operator") {
      localStorage.setItem("operatorName", payload.user.fullName);
      localStorage.removeItem("driverName");
      localStorage.removeItem("driverProfilePicture");
    } else {
      localStorage.removeItem("driverName");
      localStorage.removeItem("operatorName");
      localStorage.removeItem("driverProfilePicture");
      localStorage.removeItem("operatorProfilePicture");
    }

    if (payload.user.role === "operator") {
      await activateGeofence("HUB_MNL_001");
    }

    navigate(payload.redirectPath);
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorChallenge) return;
    if (twoFactorCode.trim().length !== 6) {
      setError("Enter the 6-digit code from Google Authenticator.");
      return;
    }

    setIsVerifyingTwoFactor(true);

    try {
      const response = await apiFetch("/api/auth/login/verify-2fa", {
        method: "POST",
        body: JSON.stringify({
          challengeToken: twoFactorChallenge.challengeToken,
          code: twoFactorCode,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Invalid authenticator code.");
        return;
      }

      setError("");
      setTwoFactorChallenge(null);
      await finalizeLogin({
        user: result.user,
        redirectPath: result.redirectPath,
      });
    } catch {
      setError("Unable to verify your authenticator code right now.");
    } finally {
      setIsVerifyingTwoFactor(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError("");

    if (!forgotIdentifier.trim()) {
      setForgotError("Enter the email or mobile number linked to your account.");
      return;
    }

    setIsSendingReset(true);

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          identifier: forgotIdentifier,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setForgotError(result.message || "Unable to send the reset code right now.");
        return;
      }

      if (!result.otpToken) {
        setForgotError(result.message || "No reset code was sent. Check the account email or mobile number.");
        return;
      }

      setResetDestination(result.email || "");
      setResetOtpToken(result.otpToken || "");
      setResetSent(true);
    } catch {
      setForgotError("Unable to send the reset code right now.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPasswordWithOtp = async () => {
    setForgotError("");

    if (!resetOtpToken) {
      setForgotError("Please request a new reset code.");
      return;
    }

    if (resetOtp.length !== 6) {
      setForgotError("Enter the 6-digit reset code.");
      return;
    }

    if (!/^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(resetNewPassword)) {
      setForgotError("Password must be at least 8 characters and include a number and special character.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setIsResettingPassword(true);

    try {
      const response = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          otpToken: resetOtpToken,
          otp: resetOtp,
          newPassword: resetNewPassword,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setForgotError(result.message || "Unable to reset your password.");
        return;
      }

      setShowForgotModal(false);
      setResetSent(false);
      setForgotIdentifier("");
      setResetDestination("");
      setResetOtpToken("");
      setResetOtp("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setSuccessMessage("Password updated. Please log in with your new password.");
    } catch {
      setForgotError("Unable to reset your password right now.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] flex flex-col font-sans overflow-hidden">
      {/* --- HEADER NAVIGATION --- */}
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 z-50">
        <Link to="/" className="flex items-center group transition-transform active:scale-95">
          <ChevronLeft className="w-5 h-5 mr-4 text-[#39B5A8] group-hover:-translate-x-1 transition-transform" />
          <img src={logoImg} alt="PakiSHIP Logo" className="h-10 w-auto object-contain" />
        </Link>
      </nav>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-8 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#39B5A8]/5 rounded-full blur-[120px] -z-10" />
        
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-10 xl:gap-20 items-center">
          
          {/* LEFT COLUMN: Branding & Features */}
          <div className="hidden lg:flex flex-col items-start space-y-8">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-[#39B5A8]/10 border border-[#39B5A8]/20 px-4 py-1.5 rounded-full">
                <span className="text-[10px] font-bold text-[#2D8F85] uppercase tracking-widest">
                  Philippines' #1 Smart Logistics Platform
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl xl:text-6xl font-bold text-[#041614] leading-[1.1] tracking-tight">
                  Hatid Agad, <br />
                  <span className="text-[#39B5A8]">Walang Abala.</span>
                </h1>
                <p className="text-[#1A5D56] text-xl font-medium italic opacity-80">
                  Login to continue managing your deliveries.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-lg">
              <FeatureCard icon={<Zap className="w-5 h-5 text-[#39B5A8]" />} title="Fast Delivery" desc="Get parcels delivered in 30 mins" />
              <FeatureCard icon={<MapPin className="w-5 h-5 text-[#39B5A8]" />} title="Real-time Tracking" desc="Track your parcels live" />
              <FeatureCard icon={<ShieldCheck className="w-5 h-5 text-[#39B5A8]" />} title="Secure & Insured" desc="Your items are protected" />
            </div>
          </div>

          {/* RIGHT COLUMN: Login Card */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-lg bg-white border border-[#39B5A8]/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-[#39B5A8]/5 relative">
              <div className="mb-8 text-left">
                <h2 className="text-3xl font-bold text-[#041614] mb-2">Log In</h2>
                <p className="text-gray-400 font-medium text-sm">
                  Welcome back. Sign in and we will send you to the right dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{error}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <p className="text-xs font-bold text-emerald-700">{successMessage}</p>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">
                      Email or Mobile Number
                    </label>
                    {!isEmail && identifier.length > 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-gray-400">
                        {identifier.length}/10
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEmail && (
                      <div className="bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#1A5D56] font-bold text-sm flex items-center select-none animate-in slide-in-from-left-2 duration-200">+63</div>
                    )}
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#39B5A8]/40">
                        {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                      <input 
                        type="text" 
                        value={identifier}
                        onChange={handleIdentifierChange}
                        placeholder={isEmail ? "name@email.com" : "912 345 6789"}
                        className={`w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl pl-11 pr-4 py-3.5 text-[#041614] focus:border-[#39B5A8] focus:bg-white outline-none transition-all text-sm font-medium`} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#39B5A8]/40" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl pl-11 pr-11 py-3.5 text-[#041614] focus:border-[#39B5A8] focus:bg-white outline-none transition-all text-sm font-medium`} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#39B5A8]"
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
                        ? "bg-[#39B5A8] border-[#39B5A8]" 
                        : "border-gray-200 bg-white group-hover:border-[#39B5A8]"
                    }`}>
                      {keepLoggedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-[#1A5D56] transition-colors">
                      Keep me logged in
                    </span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-[#39B5A8] font-bold hover:text-[#2D8F85] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-[#041614] disabled:opacity-40 text-white font-bold py-4 rounded-xl hover:bg-[#123E3A] transition-all shadow-lg active:scale-[0.98] mt-4 text-xs uppercase tracking-[0.2em]">
                  {isSubmitting ? "Signing In..." : "Continue to Dashboard"}
                </button>

                <p className="text-center text-sm font-medium text-gray-400 mt-6">
                  New to PakiSHIP? <Link to="/signup" className="text-[#39B5A8] font-bold hover:underline decoration-2 underline-offset-4">Create Account</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      {twoFactorChallenge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#041614]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setTwoFactorChallenge(null);
                setTwoFactorCode("");
                setError("");
              }}
              className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#39B5A8]" />
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-[#041614]">Verify Sign-In</h3>
                <p className="text-gray-400 text-sm font-medium mt-1">
                  Enter the 6-digit code from Google Authenticator for {twoFactorChallenge.user.fullName}.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest px-1">
                  Authenticator Code
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#041614] outline-none text-center tracking-[0.5em] text-sm font-bold focus:border-[#39B5A8]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  void handleVerifyTwoFactor();
                }}
                disabled={isVerifyingTwoFactor}
                className="w-full bg-[#041614] disabled:opacity-40 text-white font-bold py-4 rounded-xl hover:bg-[#123E3A] transition-all shadow-lg active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
              >
                {isVerifyingTwoFactor ? "Verifying..." : "Complete Login"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#041614]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetSent(false);
                setForgotIdentifier("");
                setForgotError("");
                setResetDestination("");
                setResetOtpToken("");
                setResetOtp("");
                setResetNewPassword("");
                setResetConfirmPassword("");
              }}
              className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!resetSent ? (
              <div className="space-y-6">
                <div className="w-14 h-14 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#39B5A8]" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-[#041614]">Reset Password</h3>
                  <p className="text-gray-400 text-sm font-medium mt-1">
                    Enter your registered email or mobile number.
                  </p>
                </div>
                {forgotError ? (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{forgotError}</p>
                  </div>
                ) : null}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest px-1">
                    Email or Mobile Number
                  </label>
                  <input 
                    type="text" 
                    value={forgotIdentifier}
                    onChange={(e) => {
                      setForgotIdentifier(e.target.value);
                      if (forgotError) {
                        setForgotError("");
                      }
                    }}
                    className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#041614] outline-none text-sm font-medium focus:border-[#39B5A8]" 
                  />
                </div>
                <button 
                  onClick={() => {
                    void handleForgotPassword();
                  }}
                  disabled={forgotIdentifier.trim().length < 5 || isSendingReset}
                  className="w-full bg-[#39B5A8] disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#39B5A8]/20 flex items-center justify-center gap-2 group transition-all"
                >
                  {isSendingReset ? "Sending..." : "Send Reset Code"} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="w-16 h-16 bg-[#39B5A8]/10 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8 text-[#39B5A8]" />
                </div>
                <h3 className="text-center text-2xl font-bold text-[#041614]">Code Sent!</h3>
                <p className="text-center text-gray-400 text-sm font-medium">
                  {resetDestination
                    ? `Please check ${resetDestination} for your reset code.`
                    : "If an account matches those details, a reset code has been sent to its email address."}
                </p>
                {forgotError ? (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-xs font-bold text-red-600">{forgotError}</p>
                  </div>
                ) : null}
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-center tracking-[0.5em] text-[#041614] outline-none text-sm font-black focus:border-[#39B5A8]"
                />
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(event) => setResetNewPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#041614] outline-none text-sm font-medium focus:border-[#39B5A8]"
                />
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(event) => setResetConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#041614] outline-none text-sm font-medium focus:border-[#39B5A8]"
                />
                <button 
                  onClick={() => void handleResetPasswordWithOtp()}
                  disabled={isResettingPassword}
                  className="w-full bg-[#041614] text-white font-bold py-4 rounded-xl mt-4"
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-[#39B5A8]/5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="w-11 h-11 bg-[#F0F9F8] rounded-xl shrink-0 flex items-center justify-center transition-colors group-hover:bg-[#39B5A8]/10">
        {icon}
      </div>
      <div className="flex flex-col text-left">
        <h4 className="font-bold text-[#041614] text-base leading-tight">{title}</h4>
        <p className="text-gray-400 text-xs font-medium leading-tight">{desc}</p>
      </div>
    </div>
  );
}
