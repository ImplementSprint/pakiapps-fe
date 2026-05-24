"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("Verifying your reset link...");
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordChecklist = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    }),
    [newPassword],
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const verifyRecovery = async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (tokenHash && type === "recovery") {
          const verification = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (verification.error) {
            throw verification.error;
          }
        }

        const sessionResult = await supabase.auth.getSession();
        if (!isMounted) return;

        if (sessionResult.error) {
          throw sessionResult.error;
        }

        if (!sessionResult.data.session) {
          setError("This reset link is invalid or has already expired. Please request a new one.");
          setInfo("");
          setIsReady(false);
          return;
        }

        setError("");
        setInfo("Enter your new password below.");
        setIsReady(true);
      } catch (caughtError) {
        if (!isMounted) return;
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "We couldn't verify your reset link. Please request another password reset email.",
        );
        setInfo("");
        setIsReady(false);
      }
    };

    void verifyRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(
        "Password must be at least 8 characters and include a number and special character.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const updateResult = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateResult.error) {
        throw updateResult.error;
      }

      await supabase.auth.signOut();
      setIsSuccess(true);
      setInfo("Your password has been updated. You can now log in with the new password.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update your password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] flex flex-col font-sans overflow-hidden">
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 z-50">
        <Link to="/login" className="flex items-center group transition-transform active:scale-95">
          <ArrowLeft className="w-5 h-5 mr-4 text-[#39B5A8] group-hover:-translate-x-1 transition-transform" />
          <img src={logoImg} alt="PakiSHIP Logo" className="h-10 w-auto object-contain" />
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-8 md:px-16 lg:px-24 py-8">
        <div className="w-full max-w-xl bg-white border border-[#39B5A8]/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-[#39B5A8]/5">
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-bold text-[#041614] mb-2">Reset Password</h2>
            {info ? (
              <p className="text-gray-400 font-medium text-sm">{info}</p>
            ) : null}
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          ) : null}

          {isSuccess ? (
            <div className="space-y-6">
              <div className="bg-[#F0F9F8] border border-[#39B5A8]/10 p-5 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#39B5A8] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#041614]">Password updated</p>
                  <p className="text-sm text-[#1A5D56]/70 mt-1">
                    Your new password is saved in Supabase. Please return to login and use it there.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full bg-[#041614] text-white font-bold py-4 rounded-xl hover:bg-[#123E3A] transition-all text-xs uppercase tracking-[0.2em]"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest px-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#39B5A8]/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl pl-11 pr-11 py-3.5 text-[#041614] focus:border-[#39B5A8] focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    disabled={!isReady || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#39B5A8]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest px-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#39B5A8]/40" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl pl-11 pr-11 py-3.5 text-[#041614] focus:border-[#39B5A8] focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    disabled={!isReady || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#39B5A8]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl p-4 text-left space-y-2">
                <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">
                  Password Rules
                </p>
                <p className={`text-xs font-medium ${passwordChecklist.minLength ? "text-[#2D8F85]" : "text-gray-500"}`}>
                  At least 8 characters
                </p>
                <p className={`text-xs font-medium ${passwordChecklist.hasNumber ? "text-[#2D8F85]" : "text-gray-500"}`}>
                  Includes a number
                </p>
                <p className={`text-xs font-medium ${passwordChecklist.hasSpecial ? "text-[#2D8F85]" : "text-gray-500"}`}>
                  Includes a special character
                </p>
              </div>

              <button
                type="submit"
                disabled={!isReady || isSubmitting}
                className="w-full bg-[#041614] disabled:opacity-40 text-white font-bold py-4 rounded-xl hover:bg-[#123E3A] transition-all text-xs uppercase tracking-[0.2em]"
              >
                {isSubmitting ? "Updating Password..." : "Save New Password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
