import { useState } from "react";
import { useNavigate } from "../../lib/router";
import {
  Mail,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Shield,
  Lock,
  Clock,
  KeyRound
} from "lucide-react";

import { pakiAdminLogo } from '../../lib/assets';

// Mock database of registered admin emails
const REGISTERED_EMAILS = [
  "admin@pakiadmin.ph",
  "juandelacruz@pakiadmin.ph",
  "marthaburgos@pakiadmin.ph",
  "test@pakiadmin.ph",
  "demo@pakiadmin.ph"
];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError("Please enter a valid email address.");
    }

    setIsLoading(true);

    // Simulate API call to check if email exists and send reset link
    setTimeout(() => {
      // Check if email is registered in the system
      const emailExists = REGISTERED_EMAILS.includes(email.toLowerCase());

      if (!emailExists) {
        setIsLoading(false);
        setError("This email address is not registered in our system. Please check your email or contact support.");
        return;
      }

      // Email found - send reset link
      setIsLoading(false);
      setSuccess(true);
      setSubmittedEmail(email);
      setError("");

      // In production, this would trigger an API call to send the email
      console.log('Password reset link would be sent to:', email);
      console.log('Reset link: /pakiadmin/reset-password?token=secure_token_' + Date.now());
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#dec0f1]/20 text-[#2c0735] flex flex-col font-sans overflow-hidden">

      {/* --- HEADER NAVIGATION --- */}
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/60 backdrop-blur-md border-b border-[#2c0735]/5 z-50">
        <button
          onClick={() => navigate("/pakiadmin/login")}
          className="flex items-center gap-2 text-[#2c0735] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-sm">Back to Login</span>
        </button>
      </nav>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-8 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#dec0f1] rounded-full blur-[140px] -z-10 opacity-40" />

        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-10 xl:gap-20 items-center">

          {/* LEFT COLUMN: Logo & Info */}
          <div className="hidden lg:flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-8 flex flex-col items-center text-center">
              <div className="space-y-8 flex flex-col items-center">
                <img
                  src={pakiAdminLogo}
                  alt="PakiAdmin Central"
                  className="h-85 w-auto object-contain -mt-15 -mb-15 drop-shadow-sm"
                />
                <p className="text-[#2c0735] text-xl font-medium opacity-75 -mb-5 max-w-md leading-relaxed">
                  Secure recovery protocol for administrative access.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-lg">
              <SecurityFeatureCard
                icon={<Shield className="w-5 h-5" />}
                title="Secure Email Verification"
                desc="Identity confirmation sent to your registered email address."
              />
              <SecurityFeatureCard
                icon={<Lock className="w-5 h-5" />}
                title="Encrypted Reset Link"
                desc="Password reset links are encrypted and expire after 60 minutes."
              />
              <SecurityFeatureCard
                icon={<Clock className="w-5 h-5" />}
                title="Time-Limited Access"
                desc="Reset tokens are single-use and automatically invalidated after password change."
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Recovery Form */}
          <div className="w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="w-full max-w-lg bg-white border border-[#dec0f1] rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-[#2c0735]/10 relative">

              {!success ? (
                <>
                  <div className="mb-8 text-left">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-[#dec0f1]/30 p-2.5 rounded-xl">
                        <KeyRound className="w-6 h-6 text-[#2c0735]" />
                      </div>
                      <h2 className="text-3xl font-black text-[#2c0735]">Forgot Password?</h2>
                    </div>
                    <p className="text-[#2c0735]/40 font-semibold text-sm">
                      Enter your registered email address to receive a secure password reset link.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-100 py-4 px-5 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c0735]/30">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          placeholder="admin@pakiadmin.ph"
                          className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-4 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold"
                          required
                        />
                      </div>
                      <p className="text-[10px] font-bold text-[#2c0735]/40 px-1 leading-relaxed">
                        Enter the email address associated with your admin account.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] mt-4 text-xs uppercase tracking-[0.2em] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Recovery Link
                        </>
                      )}
                    </button>
                  </form>

                  {/* --- BACK TO LOGIN --- */}
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
                </>
              ) : (
                <div className="text-center space-y-6 animate-in zoom-in-95 fade-in duration-500">
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-600 stroke-[2.5]" />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-[#2c0735]">Check Your Email!</h2>
                    <p className="text-[#2c0735]/60 font-semibold text-sm max-w-md mx-auto leading-relaxed">
                      We've sent a password reset link to:
                    </p>
                    <div className="bg-[#dec0f1]/20 border border-[#dec0f1] rounded-xl px-4 py-3 inline-block">
                      <p className="text-sm font-black text-[#2c0735]">{submittedEmail}</p>
                    </div>
                  </div>

                  <div className="bg-[#dec0f1]/10 border border-[#dec0f1] rounded-2xl p-6 text-left space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shrink-0">
                        <Mail className="w-4 h-4 text-[#2c0735]" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#2c0735] leading-relaxed">
                          Next Steps:
                        </p>
                        <ol className="text-xs font-bold text-[#2c0735]/60 space-y-2 list-decimal list-inside leading-relaxed">
                          <li>Check your email inbox (and spam folder)</li>
                          <li>Click the secure password reset link</li>
                          <li>Create a new strong password</li>
                          <li>Log in with your new credentials</li>
                        </ol>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#dec0f1]/50">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                          The reset link will expire in <strong>60 minutes</strong> for security purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => navigate("/pakiadmin/login")}
                      className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
                    >
                      Return to Login
                    </button>

                    <p className="text-xs font-bold text-[#2c0735]/40">
                      Didn't receive the email?{" "}
                      <button
                        onClick={() => {
                          setSuccess(false);
                          setEmail("");
                        }}
                        className="text-[#2c0735] hover:underline"
                      >
                        Try again
                      </button>
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
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
