'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone, Mail, Eye, EyeOff, Zap, Shield, Clock,
  ChevronLeft, Check, X, ArrowRight, ShieldCheck, Lock, Smartphone, RefreshCw, KeyRound,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function navigateByRole(role: string, push: (p: string) => void) {
  if (role === 'admin' || role === 'business_partner') push('/admin/home');
  else if (role === 'teller') push('/teller/home');
  else push('/customer/home');
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword]   = useState(false);
  const [keepLoggedIn, setKeepLoggedIn]   = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [formData, setFormData]           = useState({ identifier: '', password: '' });
  const [errors, setErrors]               = useState({ identifier: '', password: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  // Forgot-password multi-step state
  const [fpStep, setFpStep]         = useState<1|2|3>(1);
  const [fpMode, setFpMode]         = useState<'email'|'sms'>('email'); // NEW: email or sms
  const [fpIdentifier, setFpIdentifier] = useState(''); // email or phone digits
  const [fpOtp, setFpOtp]           = useState('');
  const [fpNewPw, setFpNewPw]       = useState('');
  const [fpConfirm, setFpConfirm]   = useState('');
  const [fpShowPw, setFpShowPw]     = useState(false);
  const [fpLoading, setFpLoading]   = useState(false);
  const [fpError, setFpError]       = useState('');
  const [fpCooldown, setFpCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>|null>(null);

  function closeForgot() {
    setShowForgotModal(false);
    setFpStep(1); setFpIdentifier(''); setFpOtp('');
    setFpNewPw(''); setFpConfirm(''); setFpError('');
  }

  /** Canonical identifier to send to API */
  function canonicalIdentifier() {
    if (fpMode === 'email') return fpIdentifier.trim().toLowerCase();
    // Phone: strip non-digits, normalize to +63XXXXXXXXXX
    let d = fpIdentifier.replace(/\D/g, '');
    if (d.startsWith('63')) d = d.slice(2);
    if (d.startsWith('0'))  d = d.slice(1);
    return `+63${d}`;
  }

  function smsReady() {
    const d = fpIdentifier.replace(/\D/g, '').replace(/^(63|0)/, '');
    return d.length === 10;
  }
  function emailReady() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpIdentifier.trim());
  }
  function step1Ready() { return fpMode === 'email' ? emailReady() : smsReady(); }

  async function handleFpRequest() {
    setFpError('');
    if (!step1Ready()) {
      setFpError(fpMode === 'email' ? 'Enter a valid email address.' : 'Enter a valid 10-digit PH mobile number.');
      return;
    }
    setFpLoading(true);
    try {
      await api.post('/auth/forgot-password/request', { identifier: canonicalIdentifier() });
      setFpStep(2);
      startCooldown();
    } catch (e: any) {
      setFpError(e.response?.data?.message || e.message);
    } finally { setFpLoading(false); }
  }

  function startCooldown(secs = 60) {
    setFpCooldown(secs);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setFpCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current!); return 0; } return c - 1; });
    }, 1000);
  }

  async function handleFpVerify() {
    setFpError('');
    if (fpOtp.length !== 6) { setFpError('Enter the 6-digit code.'); return; }
    setFpLoading(true);
    try {
      await api.post('/auth/forgot-password/verify', { identifier: canonicalIdentifier(), otp: fpOtp });
      setFpStep(3);
    } catch (e: any) {
      setFpError(e.response?.data?.message || e.message);
    } finally { setFpLoading(false); }
  }

  async function handleFpReset() {
    setFpError('');
    if (fpNewPw.length < 8) { setFpError('Password must be at least 8 characters.'); return; }
    if (fpNewPw !== fpConfirm) { setFpError("Passwords don't match."); return; }
    setFpLoading(true);
    try {
      await api.post('/auth/forgot-password/reset', { identifier: canonicalIdentifier(), otp: fpOtp, newPassword: fpNewPw });
      toast.success('Password reset! You can now log in.');
      closeForgot();
    } catch (e: any) {
      setFpError(e.response?.data?.message || e.message);
    } finally { setFpLoading(false); }
  }

  const isPhone = /^\d/.test(formData.identifier) && !formData.identifier.includes('@');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d/.test(val) && !val.includes('@')) {
      // Strip non-digits then remove leading 0 (PH users type 09XXXXXXXXX naturally)
      let digits = val.replace(/\D/g, '');
      if (digits.startsWith('0')) digits = digits.slice(1);
      digits = digits.slice(0, 10);
      setFormData({ ...formData, identifier: digits });
      setErrors(prev => ({ ...prev, identifier: digits.length > 0 && digits.length < 10 ? 'Enter 10 digits for mobile number.' : '' }));
    } else {
      setFormData({ ...formData, identifier: val });
      setErrors(prev => ({ ...prev, identifier: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { identifier: '', password: '' };
    let hasError = false;

    if (isPhone && formData.identifier.length !== 10) {
      newErrors.identifier = 'Enter 10 digits for mobile number.'; hasError = true;
    } else if (!isPhone && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email address.'; hasError = true;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.'; hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setIsLoading(true);
    try {
      const loginPayload = isPhone
        ? `+63${formData.identifier}`  // backend loginUser handles phone lookup
        : formData.identifier;
      const user = await authService.login(loginPayload, formData.password);
      navigateByRole(user.role, router.push.bind(router));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, password: err.message || 'Login failed. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fa] font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/')}>
            <ChevronLeft className="w-5 h-5 text-[#1e3d5a] group-hover:-translate-x-1 transition-transform" />
            <Image src="/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png" alt="PakiPark" width={120} height={40} className="h-10 object-contain" unoptimized />
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24 bg-[#1e3d5a] relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#2a5373] rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-10%] left-[-10%] size-[300px] bg-[#ee6b20] rounded-full blur-[150px] opacity-10" />
          <div className="mb-8 relative z-10">
            <span className="bg-[#ee6b20]/20 text-white text-[10px] font-bold tracking-widest px-4 py-2 rounded-full uppercase border border-[#ee6b20]/40">
              Philippines' #1 Smart Parking Platform
            </span>
          </div>
          <div className="space-y-4 mb-12 relative z-10">
            <h1 className="text-6xl font-bold text-white leading-[1.1]">
              Tap. Reserve. <br /><span className="text-[#ee6b20]">Convenience</span> in Every Spot!
            </h1>
            <p className="text-xl text-blue-100/70 font-medium italic opacity-80">Login to continue managing your reservations.</p>
          </div>
          <div className="space-y-4 max-w-lg relative z-10">
            {[
              { icon: <Zap />, title: 'Lightning Fast Booking', desc: 'Get your parking spot reserved within seconds' },
              { icon: <Clock />, title: '24/7 Real-time Tracking', desc: 'Monitor your parking reservation every parcel' },
              { icon: <Shield />, title: 'Secure & Insured', desc: 'All parking locations are fully protected' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl flex items-center gap-5 border border-white/10 shadow-2xl group hover:bg-white/15 transition-all">
                <div className="size-12 bg-[#ee6b20]/20 rounded-xl flex items-center justify-center text-[#ee6b20] group-hover:scale-110 transition-transform">
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'size-6' })}
                </div>
                <div><h3 className="text-lg font-bold text-white">{item.title}</h3><p className="text-blue-100/60 text-sm">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#f4f7fa]">
          <div className="w-full max-w-[520px] bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(30,61,90,0.15)] p-8 sm:p-14 border border-white">
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-[#1e3d5a] mb-2">Log In</h2>
              <p className="text-[#8492a6] font-medium text-sm">Welcome back! Enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase opacity-70 px-1 block">Email or Mobile Number</label>
                <div className="flex gap-2">
                  {isPhone && <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl px-4 flex items-center font-bold text-[#1e3d5a]">+63</div>}
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                      {isPhone ? <Phone className="size-5" /> : <Mail className="size-5" />}
                    </div>
                    <input type="text" placeholder={isPhone ? '9123456789' : 'your@email.com'}
                      className={`h-14 w-full pl-12 pr-4 bg-[#f8fafc] border ${errors.identifier ? 'border-red-400' : 'border-[#e2e8f0]'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20 focus:border-[#1e3d5a]`}
                      value={formData.identifier} onChange={handleIdentifierChange} required suppressHydrationWarning />
                  </div>
                </div>
                {errors.identifier && <p className="text-[10px] text-red-500 font-bold px-1">{errors.identifier}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase px-1 opacity-70 block">Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    className={`h-14 w-full pl-12 pr-12 bg-[#f8fafc] border ${errors.password ? 'border-red-400' : 'border-[#e2e8f0]'} rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20 focus:border-[#1e3d5a]`}
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required suppressHydrationWarning />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]" suppressHydrationWarning>
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold px-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between px-1">
                <button type="button" onClick={() => setKeepLoggedIn(!keepLoggedIn)} className="flex items-center gap-2 group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${keepLoggedIn ? 'bg-[#1e3d5a] border-[#1e3d5a]' : 'border-gray-200 bg-white'}`}>
                    {keepLoggedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                  </div>
                  <span className="text-xs font-bold text-[#8492a6] group-hover:text-[#1e3d5a]">Keep me logged in</span>
                </button>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-[#ee6b20] hover:underline">Forgot Password?</button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full h-16 bg-[#1e3d5a] hover:bg-[#2a5373] disabled:opacity-60 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl mt-4 transition-all">
                {isLoading ? 'Signing In...' : 'Continue to Dashboard'}
              </button>
            </form>


            <p className="text-center text-[#8492a6] font-bold text-sm">
              New to PakiPark? <Link href="/signup" className="text-[#ee6b20] hover:underline decoration-2 underline-offset-4">Create Account</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1e3d5a]/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
            <button onClick={closeForgot} className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-7">
              {[1,2,3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
                  s <= fpStep ? 'bg-[#ee6b20]' : 'bg-gray-100'
                }`} />
              ))}
            </div>

            {/* ── Step 1: Email or Phone ── */}
            {fpStep === 1 && (
              <div className="space-y-5">
                <div className="w-14 h-14 bg-[#fff3ed] rounded-2xl flex items-center justify-center">
                  {fpMode === 'email' ? <Mail className="w-7 h-7 text-[#ee6b20]" /> : <Smartphone className="w-7 h-7 text-[#ee6b20]" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3d5a]">Reset Password</h3>
                  <p className="text-[#8492a6] text-sm mt-1">
                    {fpMode === 'email' ? "Enter your registered email. We'll send a 6-digit code." : "Enter your registered phone number. We'll send a 6-digit code via SMS."}
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2 p-1 bg-[#f1f5f9] rounded-2xl">
                  <button type="button" onClick={() => { setFpMode('email'); setFpIdentifier(''); setFpError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
                      fpMode === 'email' ? 'bg-white shadow text-[#1e3d5a]' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <Mail className="size-4" /> Email
                  </button>
                  <button type="button" onClick={() => { setFpMode('sms'); setFpIdentifier(''); setFpError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
                      fpMode === 'sms' ? 'bg-white shadow text-[#1e3d5a]' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <Phone className="size-4" /> SMS
                  </button>
                </div>

                {/* Input */}
                {fpMode === 'email' ? (
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                    <input type="email" placeholder="your@email.com"
                      className="h-14 w-full pl-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                      value={fpIdentifier}
                      onChange={e => setFpIdentifier(e.target.value)} />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl px-4 flex items-center font-bold text-[#1e3d5a] text-sm flex-shrink-0">+63</div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                      <input type="text" inputMode="numeric" maxLength={10} placeholder="9XXXXXXXXX"
                        className="h-14 w-full pl-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                        value={fpIdentifier}
                        onChange={e => setFpIdentifier(e.target.value.replace(/\D/g,'').slice(0,10))} />
                    </div>
                  </div>
                )}

                {fpError && <p className="text-sm text-red-500 font-semibold">{fpError}</p>}
                <button onClick={handleFpRequest} disabled={fpLoading || !step1Ready()}
                  className="w-full h-14 bg-[#ee6b20] disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                  {fpLoading ? 'Sending...' : <> Send Code <ArrowRight className="w-4 h-4" /> </>}
                </button>
              </div>
            )}

            {/* ── Step 2: OTP ── */}
            {fpStep === 2 && (
              <div className="space-y-5">
                <div className="w-14 h-14 bg-[#fff3ed] rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-[#ee6b20]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3d5a]">Enter Code</h3>
                  <p className="text-[#8492a6] text-sm mt-1">
                    We sent a 6-digit code to{' '}
                    <span className="font-bold text-[#1e3d5a]">
                      {fpMode === 'email' ? fpIdentifier.trim() : `+63${fpIdentifier}`}
                    </span>.
                  </p>
                </div>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="• • • • • •"
                  className="h-16 w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30"
                  value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g,'').slice(0,6))} />
                {fpError && <p className="text-sm text-red-500 font-semibold">{fpError}</p>}
                <button onClick={handleFpVerify} disabled={fpLoading || fpOtp.length !== 6}
                  className="w-full h-14 bg-[#ee6b20] disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                  {fpLoading ? 'Verifying...' : <> Verify Code <ArrowRight className="w-4 h-4" /> </>}
                </button>
                <button onClick={() => { if (fpCooldown === 0) { handleFpRequest(); } }}
                  disabled={fpCooldown > 0}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#8492a6] disabled:opacity-50 hover:text-[#1e3d5a] transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {fpCooldown > 0 ? `Resend in ${fpCooldown}s` : 'Resend Code'}
                </button>
              </div>
            )}

            {/* ── Step 3: New Password ── */}
            {fpStep === 3 && (
              <div className="space-y-5">
                <div className="w-14 h-14 bg-[#fff3ed] rounded-2xl flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#ee6b20]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3d5a]">New Password</h3>
                  <p className="text-[#8492a6] text-sm mt-1">Choose a strong password with 8+ characters.</p>
                </div>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <input type={fpShowPw ? 'text' : 'password'} placeholder="New password"
                    className="h-14 w-full pl-12 pr-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                    value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} />
                  <button type="button" onClick={() => setFpShowPw(!fpShowPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {fpShowPw ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <input type={fpShowPw ? 'text' : 'password'} placeholder="Confirm new password"
                    className="h-14 w-full pl-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                    value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} />
                </div>
                {fpError && <p className="text-sm text-red-500 font-semibold">{fpError}</p>}
                <button onClick={handleFpReset} disabled={fpLoading}
                  className="w-full h-14 bg-[#1e3d5a] hover:bg-[#2a5373] disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                  {fpLoading ? 'Saving...' : <><ShieldCheck className="w-4 h-4" /> Save New Password</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
