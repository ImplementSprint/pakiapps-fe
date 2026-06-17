import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "../../lib/router";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  X,
} from "lucide-react";

import { pakiAdminLogo } from '../../lib/assets';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get token from URL (e.g., /pakiadmin/reset-password?token=abc123)
  const resetToken = searchParams.get('token');

  // Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasUpperCase: false,
    hasLowerCase: false,
  });

  // Validate password requirements in real-time
  useEffect(() => {
    setValidations({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
    });
  }, [newPassword]);

  const allValidationsPassed = Object.values(validations).every(v => v);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate token exists
    if (!resetToken) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    // Check if all password requirements are met
    if (!allValidationsPassed) {
      setError("Password does not meet all security requirements.");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsLoading(true);

    // Simulate API call for password reset
    setTimeout(() => {
      setIsLoading(false);
      setResetSuccess(true);

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/pakiadmin/login");
      }, 3000);
    }, 1500);
  };

  // If no token, show error state
  if (!resetToken && !resetSuccess) {
    return (
      <div className="min-h-screen bg-[#dec0f1]/20 text-[#2c0735] flex items-center justify-center font-sans p-4">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#2c0735]">Invalid Reset Link</h2>
              <p className="text-[#2c0735]/50 text-sm font-bold leading-relaxed">
                This password reset link is invalid or has expired. Please request a new one from the login page.
              </p>
            </div>
            <button
              onClick={() => navigate("/pakiadmin/login")}
              className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dec0f1]/20 text-[#2c0735] flex flex-col font-sans overflow-hidden">
      {/* --- EMPTY HEADER --- */}
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/60 backdrop-blur-md border-b border-[#2c0735]/5 z-50">
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-8 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#dec0f1] rounded-full blur-[140px] -z-10 opacity-40" />

        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-10 xl:gap-20 items-center">
          {/* LEFT COLUMN: Security Info */}
          <div className="hidden lg:flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-8 flex flex-col items-center text-center">
              <div className="space-y-8 flex flex-col items-center">
                <img
                  src={pakiAdminLogo}
                  alt="PakiAdmin Central"
                  className="h-85 w-auto object-contain -mt-15 -mb-15 drop-shadow-sm"
                />
                <p className="text-[#2c0735] text-xl font-medium opacity-75 -mb-5 max-w-md leading-relaxed">
                  Secure your administrative access with a strong password.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-lg">
              <SecurityFeatureCard
                icon={<ShieldCheck className="w-5 h-5" />}
                title="Enhanced Security"
                desc="Your new password is encrypted and secured with industry-standard protocols."
              />
              <SecurityFeatureCard
                icon={<KeyRound className="w-5 h-5" />}
                title="Access Recovery"
                desc="Regain full control of your admin account with your new secure credentials."
              />
              <SecurityFeatureCard
                icon={<Lock className="w-5 h-5" />}
                title="Protected Systems"
                desc="Ensure only authorized personnel can access sensitive platform operations."
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Reset Password Form or Success Message */}
          <div className="w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
            {!resetSuccess ? (
              <div className="w-full max-w-lg bg-white border border-[#dec0f1] rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-[#2c0735]/10 relative">
                <div className="mb-8 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-[#dec0f1]/30 p-2.5 rounded-xl">
                      <KeyRound className="w-6 h-6 text-[#2c0735]" />
                    </div>
                    <h2 className="text-3xl font-black text-[#2c0735]">Reset Password</h2>
                  </div>
                  <p className="text-[#2c0735]/40 font-semibold text-sm">
                    Create a new secure password for your admin account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 border border-red-100 py-4 px-5 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                    </div>
                  )}

                  {/* New Password Field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if(error) setError(""); }}
                        placeholder="••••••••••••"
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-11 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2c0735]/20 hover:text-[#2c0735]"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if(error) setError(""); }}
                        placeholder="••••••••••••"
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-11 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2c0735]/20 hover:text-[#2c0735]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="bg-[#dec0f1]/10 border border-[#dec0f1]/50 rounded-2xl p-5 space-y-3">
                    <p className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest opacity-60">
                      Password Requirements
                    </p>
                    <div className="space-y-2">
                      <ValidationItem
                        label="At least 8 characters"
                        isValid={validations.minLength}
                      />
                      <ValidationItem
                        label="Contains uppercase letter (A-Z)"
                        isValid={validations.hasUpperCase}
                      />
                      <ValidationItem
                        label="Contains lowercase letter (a-z)"
                        isValid={validations.hasLowerCase}
                      />
                      <ValidationItem
                        label="Contains number (0-9)"
                        isValid={validations.hasNumber}
                      />
                      <ValidationItem
                        label="Contains special character (!@#$%...)"
                        isValid={validations.hasSpecialChar}
                      />
                      {confirmPassword && (
                        <ValidationItem
                          label="Passwords match"
                          isValid={newPassword === confirmPassword && confirmPassword.length > 0}
                        />
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !allValidationsPassed}
                    className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] mt-4 text-xs uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Securing Account..." : "Reset Password"}
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[#dec0f1]/50 flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-[#2c0735]/40">
                    Remember your password?
                  </span>
                  <button
                    onClick={() => navigate("/pakiadmin/login")}
                    className="text-[#2c0735] font-black text-sm hover:underline underline-offset-4 decoration-2 transition-all"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              // Success State
              <div className="w-full max-w-lg bg-white border border-green-200 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-green-500/10 relative animate-in zoom-in-95 fade-in duration-500">
                <div className="flex flex-col items-center text-center space-y-8">
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center animate-in zoom-in-50 duration-700">
                    <CheckCircle2 className="w-10 h-10 text-green-600 stroke-[2.5]" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-[#2c0735]">Password Reset Successful!</h2>
                    <p className="text-[#2c0735]/50 text-sm font-bold leading-relaxed max-w-sm">
                      Your admin password has been securely updated. You can now access your account with your new credentials.
                    </p>
                  </div>

                  <div className="w-full bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-green-700 text-left leading-relaxed">
                      Your account is now secured. Redirecting you to the login page...
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/pakiadmin/login")}
                    className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                  >
                    Proceed to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ValidationItem({ label, isValid }: { label: string; isValid: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
        isValid ? 'bg-green-500' : 'bg-gray-200'
      }`}>
        {isValid && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>
      <span className={`text-xs font-bold transition-colors ${
        isValid ? 'text-green-600' : 'text-[#2c0735]/40'
      }`}>
        {label}
      </span>
    </div>
  );
}

function SecurityFeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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
