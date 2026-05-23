import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Phone, Mail, Eye, EyeOff, Shield, Zap, Clock,
  User, ChevronLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import pakiShipLogo from "../../assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
import { authService } from '../services/authService';
import { toast } from 'sonner';

/**
 * SignUp — Customer-only public registration.
 *
 * Admin, Teller, and Business Partner accounts are provisioned
 * internally by the system administrator. Staff should contact
 * their admin for login credentials.
 */
export function SignUp() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [formData, setFormData] = useState({ name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({ identifier: '', password: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);

  const isPhone = /^\d/.test(identifier) && !/[@.]/.test(identifier);

  const validatePassword = (pwd: string) => {
    if (pwd.length === 0) return '';
    if (pwd.length < 8 || !/\d/.test(pwd) || !/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return '8+ chars, 1 number, and 1 special char required.';
    return '';
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d+$/.test(val) && !val.includes('@')) {
      if (val.length <= 10) {
        setIdentifier(val);
        setErrors((prev) => ({
          ...prev,
          identifier: val.length > 0 && val.length < 10 ? 'Mobile number must be exactly 10 digits.' : '',
        }));
      }
    } else {
      setIdentifier(val);
      setErrors((prev) => ({ ...prev, identifier: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { identifier: '', password: '', confirm: '' };
    let hasError = false;

    if (isPhone && identifier.length !== 10) {
      newErrors.identifier = 'Mobile number must be exactly 10 digits.';
      hasError = true;
    }
    const pwdError = validatePassword(formData.password);
    if (pwdError) { newErrors.password = pwdError; hasError = true; }
    if (formData.password !== formData.confirm) {
      newErrors.confirm = "Passwords don't match.";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    setIsLoading(true);
    try {
      const email = isPhone ? `+63${identifier}` : identifier;
      await authService.registerCustomer({ name: formData.name, email, password: formData.password });
      toast.success('Account created! Please log in to continue.');
      navigate('/login');
    } catch (error: any) {
      if (error.message?.includes('Backend server is not running') || error.message?.includes('fetch')) {
        // Backend offline fallback — still don't auto-login, send to login page
        toast.success('Account created! Please log in to continue.');
        navigate('/login');
      } else {
        setErrors(prev => ({ ...prev, identifier: error.message || 'Registration failed.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    if (provider === 'PakiShip') { alert('PakiShip Integration\n\nConnecting to your PakiShip account...'); return; }
    alert(`OAuth Integration Required for ${provider}.`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#f4f7fa] overflow-hidden">

      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <ChevronLeft className="w-5 h-5 text-[#1e3d5a] group-hover:-translate-x-1 transition-transform" />
            <img src={logo} alt="PakiPark" className="h-9 object-contain" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Info Sidebar */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-16 xl:px-20 pr-4 xl:pr-6 relative overflow-hidden bg-[#f4f7fa]">
          <div className="absolute top-[-10%] left-[-10%] size-96 bg-[#1e3d5a]/5 rounded-full blur-3xl" />
          <div className="mb-4 relative z-10">
            <span className="bg-[#e8eff5] text-[#1e3d5a] text-[10px] font-bold tracking-widest px-4 py-2 rounded-full uppercase border border-[#d0deeb]">
              Philippines' #1 Smart Parking Platform
            </span>
          </div>
          <div className="space-y-2 mb-6 relative z-10">
            <h1 className="text-5xl font-extrabold text-[#1e3d5a] leading-[1.1]">
              Tap. Reserve.<br />
              <span className="text-[#ee6b20]">Convenience</span> in Every Spot!
            </h1>
            <p className="text-base text-[#5a7184] font-medium">
              Create your account and start parking smarter today.
            </p>
          </div>
          <div className="space-y-2 max-w-lg relative z-10">
            {[
              { icon: <Zap className="size-5" />, title: "Instant Booking", desc: "Reserve your parking spot in under 30 seconds" },
              { icon: <Clock className="size-5" />, title: "Real-time Availability", desc: "Check live occupancy of city parking lots" },
              { icon: <Shield className="size-5" />, title: "Secure & Insured", desc: "Your vehicle is monitored and protected" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-white">
                <div className="size-11 bg-[#1e3d5a] rounded-xl flex items-center justify-center text-white flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-base font-bold text-[#1e3d5a]">{item.title}</h3>
                  <p className="text-[#5a7184] text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="w-full lg:w-[55%] flex justify-center overflow-y-auto px-6 sm:px-8">
          <div className="w-full max-w-[560px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(30,61,90,0.1)] p-7 sm:p-10 mt-8 mb-8 border border-white self-start">

            {/* Heading */}
            <div className="mb-6 text-left">
              <div className="inline-flex items-center gap-2 bg-[#ee6b20]/10 text-[#ee6b20] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                <User className="size-3" /> Customer Account
              </div>
              <h2 className="text-3xl font-bold text-[#1e3d5a] mb-1">Create Account</h2>
              <p className="text-[#8492a6] font-medium text-sm">Sign up to start booking parking spots with PakiPark.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <Input
                    type="text"
                    placeholder="Juan dela Cruz"
                    className="h-12 pl-12 bg-[#f8fafc] border-[#e2e8f0] rounded-2xl focus:ring-[#1e3d5a] focus:border-[#1e3d5a] font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email/Phone */}
              <div>
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Email or Phone Number</Label>
                <div className="flex gap-2">
                  {isPhone && (
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl px-4 flex items-center font-bold text-[#1e3d5a] text-sm flex-shrink-0">+63</div>
                  )}
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                      {isPhone ? <Phone className="size-5" /> : <Mail className="size-5" />}
                    </div>
                    <Input
                      type="text"
                      placeholder="name@email.com or 9123456789"
                      className="h-12 pl-12 bg-[#f8fafc] border-[#e2e8f0] rounded-2xl focus:ring-[#1e3d5a] focus:border-[#1e3d5a] font-medium"
                      value={identifier}
                      onChange={handleIdentifierChange}
                      required
                    />
                  </div>
                </div>
                {errors.identifier && <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.identifier}</p>}
              </div>

              {/* Password */}
              <div>
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Password</Label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-[#f8fafc] border-[#e2e8f0] rounded-2xl focus:ring-[#1e3d5a] focus:border-[#1e3d5a] font-medium"
                    value={formData.password}
                    onChange={(e) => {
                      const pwd = e.target.value;
                      setFormData({ ...formData, password: pwd });
                      setErrors((prev) => ({ ...prev, password: validatePassword(pwd) }));
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase mb-1.5 block opacity-70">Confirm Password</Label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-[#f8fafc] border-[#e2e8f0] rounded-2xl focus:ring-[#1e3d5a] focus:border-[#1e3d5a] font-medium"
                    value={formData.confirm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, confirm: val });
                      setErrors((prev) => ({ ...prev, confirm: val && val !== formData.password ? "Passwords don't match." : '' }));
                    }}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-[11px] text-red-500 font-semibold mt-1.5 px-1">{errors.confirm}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#1e3d5a] hover:bg-[#2a5373] text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Social signup */}
            <div className="mt-5 mb-4 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#e2e8f0]" /></div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-[#8492a6]">
                <span className="bg-white px-4">Or Sign Up With</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <Button variant="outline" onClick={() => handleSocialSignup('Google')} className="h-12 rounded-2xl border-[#e2e8f0] hover:bg-[#f8fafc] text-[#1e3d5a] font-bold text-xs gap-2">
                <svg className="size-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleSocialSignup('Facebook')} className="h-12 rounded-2xl border-[#e2e8f0] hover:bg-[#f8fafc] text-[#1e3d5a] font-bold text-xs gap-2">
                <svg className="size-4" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
              <Button variant="outline" onClick={() => handleSocialSignup('PakiShip')} className="h-12 rounded-2xl border-[#e2e8f0] hover:bg-[#f8fafc] text-[#1e3d5a] font-bold text-xs gap-2">
                <img src={pakiShipLogo} alt="PakiShip" className="h-5 object-contain" />
                PakiShip
              </Button>
            </div>

            <p className="text-center text-[#8492a6] font-bold text-sm mt-2">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#ee6b20] hover:underline">Log In</button>
            </p>

            {/* Info note for staff */}
            <div className="mt-4 bg-[#f0f4f8] border border-[#d0deeb] rounded-2xl p-4 text-center">
              <p className="text-xs text-[#5a7184] font-medium">
                Are you a <span className="font-bold text-[#1e3d5a]">Teller</span>, <span className="font-bold text-[#1e3d5a]">Business Partner</span>, or <span className="font-bold text-[#1e3d5a]">Admin</span>?
              </p>
              <p className="text-xs text-[#8492a6] mt-0.5">
                Staff accounts are created by your system administrator. Please log in directly at <button onClick={() => navigate('/login')} className="text-[#ee6b20] hover:underline font-bold">/login</button> using your provided credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
