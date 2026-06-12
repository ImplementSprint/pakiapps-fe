'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Phone, Mail, Eye, EyeOff, Shield, Zap, Clock, User, ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({ identifier: '', password: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [identifierTaken, setIdentifierTaken] = useState(false);
  const [checkingId, setCheckingId] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPhone = /^\d/.test(identifier) && !identifier.includes('@');

  // Auto-capitalize: first letter of every word
  const toTitleCase = (str: string) =>
    str.replace(/\b\w/g, c => c.toUpperCase());

  // ── Debounced live-check ──────────────────────────────────────────────────
  useEffect(() => {
    if (!identifier) { setIdentifierTaken(false); return; }
    // Only check after a valid-looking input
    const minLength = isPhone ? 10 : 5;
    if (identifier.length < minLength) { setIdentifierTaken(false); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCheckingId(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/check-identifier?value=${encodeURIComponent(identifier)}`
        );
        const data = await res.json();
        setIdentifierTaken(!data.available);
        if (!data.available) {
          setErrors(prev => ({ ...prev, identifier: 'This email / phone number is already registered.' }));
        } else {
          setErrors(prev => ({ ...prev, identifier: '' }));
        }
      } catch { /* network fail — fail open */ }
      finally { setCheckingId(false); }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [identifier]);

  const validatePassword = (pwd: string) => {
    if (!pwd) return '';
    if (pwd.length < 8 || !/\d/.test(pwd) || !/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return '8+ chars, 1 number, and 1 special char required.';
    return '';
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d+$/.test(val) && !val.includes('@')) {
      if (val.length <= 10) {
        setIdentifier(val);
        setErrors(prev => ({ ...prev, identifier: val.length > 0 && val.length < 10 ? 'Mobile number must be exactly 10 digits.' : '' }));
      }
    } else {
      setIdentifier(val);
      setErrors(prev => ({ ...prev, identifier: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { identifier: '', password: '', confirm: '' };
    let hasError = false;
    if (isPhone && identifier.length !== 10) { newErrors.identifier = 'Mobile number must be exactly 10 digits.'; hasError = true; }
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) { newErrors.password = pwdErr; hasError = true; }
    if (formData.password !== formData.confirm) { newErrors.confirm = "Passwords don't match."; hasError = true; }
    setErrors(newErrors);
    if (hasError) return;
    if (identifierTaken) return; // blocked by live check

    setIsLoading(true);
    try {
      const payload: any = { firstName: formData.firstName, lastName: formData.lastName, password: formData.password };
      if (isPhone) {
        payload.phone = `+63${identifier}`;
      } else {
        payload.email = identifier;
      }
      await authService.register(payload);
      toast.success('Account created! Please log in to continue.');
      router.push('/login');
    } catch (err: any) {
      setErrors(prev => ({ ...prev, identifier: err.message || 'Registration failed.' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#f4f7fa] overflow-hidden">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <button type="button" className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/')}>
            <ChevronLeft className="w-5 h-5 text-[#1e3d5a] group-hover:-translate-x-1 transition-transform" />
            <Image src="/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png" alt="PakiPark" width={100} height={36} className="h-9 object-contain" unoptimized />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Info Panel */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 xl:px-20 relative overflow-hidden bg-[#f4f7fa]">
          <div className="absolute top-[-10%] left-[-10%] size-96 bg-[#1e3d5a]/5 rounded-full blur-3xl" />
          <div className="mb-4 relative z-10">
            <span className="bg-[#e8eff5] text-[#1e3d5a] text-[10px] font-bold tracking-widest px-4 py-2 rounded-full uppercase border border-[#d0deeb]">
              Philippines' #1 Smart Parking Platform
            </span>
          </div>
          <div className="space-y-2 mb-6 relative z-10">
            <h1 className="text-5xl font-extrabold text-[#1e3d5a] leading-[1.1]">
              Tap. Reserve.<br /><span className="text-[#ee6b20]">Convenience</span> in Every Spot!
            </h1>
            <p className="text-base text-[#5a7184] font-medium">Create your account and start parking smarter today.</p>
          </div>
          <div className="space-y-2 max-w-lg relative z-10">
            {[
              { icon: <Zap className="size-5" />, title: 'Instant Booking', desc: 'Reserve your parking spot in under 30 seconds' },
              { icon: <Clock className="size-5" />, title: 'Real-time Availability', desc: 'Check live occupancy of city parking lots' },
              { icon: <Shield className="size-5" />, title: 'Secure & Insured', desc: 'Your vehicle is monitored and protected' },
            ].map((item) => (
              <div key={item.title} className="bg-white/80 p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-white">
                <div className="size-11 bg-[#1e3d5a] rounded-xl flex items-center justify-center text-white flex-shrink-0">{item.icon}</div>
                <div><h3 className="text-base font-bold text-[#1e3d5a]">{item.title}</h3><p className="text-[#5a7184] text-sm">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full lg:w-[55%] flex justify-center overflow-y-auto px-6 sm:px-8">
          <div className="w-full max-w-[560px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(30,61,90,0.1)] p-7 sm:p-10 mt-8 mb-8 border border-white self-start">

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-[#ee6b20]/10 text-[#ee6b20] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                <User className="size-3" /> Customer Account
              </div>
              <h2 className="text-3xl font-bold text-[#1e3d5a] mb-1">Create Account</h2>
              <p className="text-[#8492a6] font-medium text-sm">Sign up to start booking parking spots with PakiPark.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                    <input id="firstName" type="text" placeholder="Juan" required
                      className="h-12 w-full pl-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: toTitleCase(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                    <input id="lastName" type="text" placeholder="Dela Cruz" required
                      className="h-12 w-full pl-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: toTitleCase(e.target.value) })} />
                  </div>
                </div>
              </div>

              {/* Email/Phone */}
              <div>
                <label htmlFor="identifier" className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Email or Phone Number</label>
                <div className="flex gap-2">
                  {isPhone && <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl px-4 flex items-center font-bold text-[#1e3d5a] text-sm flex-shrink-0">+63</div>}
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                      {isPhone ? <Phone className="size-5" /> : <Mail className="size-5" />}
                    </div>
                    <input id="identifier" type="text" placeholder="name@email.com or 9123456789" required
                      className={`h-12 w-full pl-12 bg-[#f8fafc] border ${errors.identifier || identifierTaken ? 'border-red-400 ring-1 ring-red-300' : 'border-[#e2e8f0]'
                        } rounded-2xl text-sm focus:outline-none focus:ring-2 ${errors.identifier || identifierTaken ? 'focus:ring-red-300' : 'focus:ring-[#1e3d5a]/20'} transition-all`}
                      value={identifier} onChange={handleIdentifierChange} />
                  </div>
                </div>
                {/* Live status indicator */}
                {checkingId && (
                  <p className="text-[11px] text-gray-400 font-medium mt-1.5 px-1 flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Checking availability...
                  </p>
                )}
                {!checkingId && identifierTaken && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.identifier}</p>
                )}
                {!checkingId && !identifierTaken && identifier.length >= (isPhone ? 10 : 5) && (
                  <p className="text-[11px] text-green-600 font-semibold mt-1.5 px-1 flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Available
                  </p>
                )}
                {!checkingId && !identifierTaken && errors.identifier && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.identifier}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                    className="h-12 w-full pl-12 pr-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                    value={formData.password} onChange={e => { setFormData({ ...formData, password: e.target.value }); setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) })); }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm" className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Confirm Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <input id="confirm" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" required
                    className="h-12 w-full pl-12 pr-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                    value={formData.confirm} onChange={e => { setFormData({ ...formData, confirm: e.target.value }); setErrors(prev => ({ ...prev, confirm: e.target.value && e.target.value !== formData.password ? "Passwords don't match." : '' })); }} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.confirm}</p>}
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full h-14 bg-[#1e3d5a] hover:bg-[#2a5373] disabled:opacity-60 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg mt-2 transition-all">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>


            <p className="text-center text-[#8492a6] font-bold text-sm mt-2">
              Already have an account?{' '}
              <button onClick={() => router.push('/login')} className="text-[#ee6b20] hover:underline">Log In</button>
            </p>

            <div className="mt-4 bg-[#f0f4f8] border border-[#d0deeb] rounded-2xl p-4 text-center">
              <p className="text-xs text-[#5a7184] font-medium">
                Are you a <span className="font-bold text-[#1e3d5a]">Teller</span>, <span className="font-bold text-[#1e3d5a]">Business Partner</span>, or <span className="font-bold text-[#1e3d5a]">Admin</span>?
              </p>
              <p className="text-xs text-[#8492a6] mt-0.5">
                Staff accounts are created by your system administrator. Please log in at{' '}
                <button onClick={() => router.push('/login')} className="text-[#ee6b20] hover:underline font-bold">/login</button> using your provided credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
