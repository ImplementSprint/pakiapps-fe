'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone, Mail, Eye, EyeOff, Zap, Shield, Clock,
  ChevronLeft, Check, X, ArrowRight, ShieldCheck, Lock,
} from 'lucide-react';
import { authService } from '@/services/authService';
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
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetSent, setResetSent]         = useState(false);

  const isPhone = /^\d/.test(formData.identifier) && !formData.identifier.includes('@');

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d/.test(val) && !val.includes('@')) {
      const digits = val.replace(/\D/g, '');
      if (digits.length <= 10) {
        setFormData({ ...formData, identifier: digits });
        setErrors(prev => ({ ...prev, identifier: digits.length > 0 && digits.length < 10 ? 'Enter 10 digits for mobile number.' : '' }));
      }
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
    if (!/^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(formData.password)) {
      newErrors.password = '8+ chars, 1 number, and 1 special char required.'; hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setIsLoading(true);
    try {
      const email = isPhone ? `+63${formData.identifier}` : formData.identifier;
      const user = await authService.login(email, formData.password);
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={formData.identifier} onChange={handleIdentifierChange} required />
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
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
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

            <div className="mt-10 mb-8 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#e2e8f0]" /></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-[#8492a6]">
                <span className="bg-white px-4">Or Connect With</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {[
                { label: 'Google',   icon: <img src="https://www.google.com/favicon.ico" alt="G" className="size-4" /> },
                { label: 'Facebook', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg" alt="F" className="size-4" /> },
                { label: 'PakiShip', icon: <Image src="/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png" alt="PS" width={20} height={20} className="h-5 object-contain" unoptimized /> },
              ].map(s => (
                <button key={s.label} className="h-14 rounded-2xl border border-[#e2e8f0] text-[#1e3d5a] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#f8fafc] transition-all active:scale-95">
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

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
            <button onClick={() => { setShowForgotModal(false); setResetSent(false); }} className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
            {!resetSent ? (
              <div className="space-y-6">
                <div className="w-14 h-14 bg-[#f4f7fa] rounded-2xl flex items-center justify-center"><Lock className="w-6 h-6 text-[#ee6b20]" /></div>
                <div><h3 className="text-2xl font-bold text-[#1e3d5a]">Reset Password</h3><p className="text-[#8492a6] text-sm mt-1">Enter your email to receive a reset link.</p></div>
                <input type="text" placeholder="your@email.com" value={forgotIdentifier} onChange={e => setForgotIdentifier(e.target.value)}
                  className="h-14 w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
                <button onClick={() => setResetSent(true)} disabled={forgotIdentifier.length < 5}
                  className="w-full h-14 bg-[#ee6b20] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  Send Reset Link <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-[#ee6b20]/10 rounded-full flex items-center justify-center mx-auto"><ShieldCheck className="w-8 h-8 text-[#ee6b20]" /></div>
                <h3 className="text-2xl font-bold text-[#1e3d5a]">Link Sent!</h3>
                <p className="text-[#8492a6] text-sm font-medium">Check your inbox to reset your password.</p>
                <button onClick={() => setShowForgotModal(false)} className="w-full h-14 bg-[#1e3d5a] text-white font-bold rounded-xl">Back to Login</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
