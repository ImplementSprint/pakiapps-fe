import React, { useState } from "react";
import { useNavigate } from "../../lib/router";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  BadgeCheck,
  AppWindow,
  Activity,
  Workflow,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCog,
  ChevronDown,
} from "lucide-react";

import { pakiAdminLogo } from '../../lib/assets';

const ADMIN_ROLES = [
  { value: "admin", label: "Administrator", description: "Full system access and management" },
  { value: "moderator", label: "Moderator", description: "Content and user moderation" },
  { value: "analyst", label: "Analyst", description: "View analytics and reports" },
  { value: "support", label: "Support", description: "Customer support operations" },
  { value: "developer", label: "Developer", description: "Technical operations and API access" },
];

export default function PakiAdminSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    if (!formData.name || !formData.employeeId || !formData.email || !formData.role || !formData.password || !formData.confirmPassword) {
      setError("All fields are required. Please complete the form.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password requires 8+ characters, including numbers and special characters.");
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsLoading(true);

    // Simulate API call for signup
    setTimeout(() => {
      setIsLoading(false);
      setSubmittedEmail(formData.email);
      setSignupSuccess(true);

      // In production, this would trigger:
      // 1. Send verification email
      // 2. Create pending account record
      // 3. Notify super-admin for approval
      console.log('Signup request submitted:', {
        name: formData.name,
        employeeId: formData.employeeId,
        email: formData.email,
        role: formData.role,
      });
      console.log('Verification email would be sent to:', formData.email);
      console.log('Super-admin notification sent for approval');
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-[#dec0f1]/20 text-[#2c0735] flex flex-col font-sans overflow-hidden">
      
      {/* --- EMPTY HEADER (Consistent with Admin Login) --- */}
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
                  Start Managing for PakiShip and PakiPark.
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

          {/* RIGHT COLUMN: Signup Card or Success Message */}
          <div className="w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
            {!signupSuccess ? (
            <div className="w-full max-w-xl bg-white border border-[#dec0f1] rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-[#2c0735]/10 relative">
              
              <div className="mb-6 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-[#dec0f1]/30 p-2.5 rounded-xl">
                    <User className="w-6 h-6 text-[#2c0735]" />
                  </div>
                  <h2 className="text-3xl font-black text-[#2c0735]">Create Account</h2>
                </div>
                <p className="text-[#2c0735]/40 font-semibold text-sm">
                  Initialize administrative credentials for console access.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 py-4 px-5 rounded-2xl flex items-center gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm font-bold text-red-600 leading-tight">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Full Name" 
                    icon={<User className="w-4 h-4 text-[#2c0735]/30" />} 
                    placeholder="Juan Dela Cruz"
                    value={formData.name}
                    onChange={(val: string) => handleChange("name", val)}
                  />
                  <InputField 
                    label="Admin ID" 
                    icon={<BadgeCheck className="w-4 h-4 text-[#2c0735]/30" />} 
                    placeholder="ADM-2026-XXXX"
                    value={formData.employeeId}
                    onChange={(val: string) => handleChange("employeeId", val)}
                  />
                </div>

                <InputField
                  label="Administrative Email"
                  icon={<Mail className="w-4 h-4 text-[#2c0735]/30" />}
                  placeholder="name@pakiadmin.ph"
                  type="email"
                  value={formData.email}
                  onChange={(val: string) => handleChange("email", val)}
                />

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">
                    Admin Role
                  </label>
                  <div className="relative">
                    <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30 pointer-events-none z-10" />
                    <select
                      value={formData.role}
                      onChange={(e) => handleChange("role", e.target.value)}
                      className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-10 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>Select your role...</option>
                      {ADMIN_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30 pointer-events-none" />
                  </div>
                  {formData.role && (
                    <p className="text-[10px] font-bold text-[#2c0735]/40 px-1 leading-relaxed">
                      {ADMIN_ROLES.find(r => r.value === formData.role)?.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">Security Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-10 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold" 
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2c0735]/20 hover:text-[#2c0735]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">Confirm Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2c0735]/30" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-10 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold" 
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2c0735]/20 hover:text-[#2c0735]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] mt-4 text-xs uppercase tracking-[0.2em] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? "Provisioning..." : "Initialize Admin Node"}
                </button>

                <div className="mt-8 pt-8 border-t border-[#dec0f1]/50 flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-[#2c0735]/40">Already registered?</span>
                  <button 
                    type="button"
                    onClick={() => navigate("/pakiadmin/login")}
                    className="text-[#2c0735] font-black text-sm hover:underline underline-offset-4 decoration-2 transition-all"
                  >
                    Log In
                  </button>
                </div>
              </form>
            </div>
            ) : (
              // SUCCESS / PENDING APPROVAL SCREEN
              <div className="w-full max-w-xl bg-white border border-green-200 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-green-500/10 relative animate-in zoom-in-95 fade-in duration-500">
                <div className="flex flex-col items-center text-center space-y-8">
                  {/* Success Icon */}
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center animate-in zoom-in-50 duration-700">
                    <CheckCircle2 className="w-10 h-10 text-green-600 stroke-[2.5]" />
                  </div>

                  {/* Main Message */}
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-[#2c0735]">Account Request Submitted!</h2>
                    <p className="text-[#2c0735]/60 font-semibold text-sm max-w-md mx-auto leading-relaxed">
                      Your admin account request has been successfully submitted and is pending approval.
                    </p>
                  </div>

                  {/* Email Confirmation Box */}
                  <div className="w-full bg-[#dec0f1]/20 border border-[#dec0f1] rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-3 justify-center">
                      <Mail className="w-5 h-5 text-[#2c0735]" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-[#2c0735]/60">Verification email sent to:</p>
                        <p className="text-sm font-black text-[#2c0735]">{submittedEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-2xl p-6 text-left space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shrink-0">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-[#2c0735]">What Happens Next:</p>
                        <ol className="text-sm font-semibold text-[#2c0735]/70 space-y-2.5 list-decimal list-inside leading-relaxed">
                          <li>
                            <strong className="text-[#2c0735]">Verify your email</strong>
                            <p className="text-xs font-bold text-[#2c0735]/50 ml-5 mt-1">
                              Check your inbox and click the verification link
                            </p>
                          </li>
                          <li>
                            <strong className="text-[#2c0735]">Super-admin review</strong>
                            <p className="text-xs font-bold text-[#2c0735]/50 ml-5 mt-1">
                              Your request will be reviewed by a super-administrator
                            </p>
                          </li>
                          <li>
                            <strong className="text-[#2c0735]">Approval notification</strong>
                            <p className="text-xs font-bold text-[#2c0735]/50 ml-5 mt-1">
                              You'll receive an email once your account is approved
                            </p>
                          </li>
                          <li>
                            <strong className="text-[#2c0735]">Access granted</strong>
                            <p className="text-xs font-bold text-[#2c0735]/50 ml-5 mt-1">
                              Log in with your credentials to access the admin dashboard
                            </p>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Status Cards */}
                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                      <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Email Sent</p>
                      <p className="text-[10px] font-bold text-green-600 mt-1">Check your inbox</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                      <ShieldCheck className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Approval</p>
                      <p className="text-[10px] font-bold text-amber-600 mt-1">Awaiting review</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-blue-900">Typical approval time: 24-48 hours</p>
                        <p className="text-[10px] font-bold text-blue-700 leading-relaxed mt-1">
                          If you don't receive approval within 48 hours, please contact support.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full space-y-3 pt-2">
                    <button
                      onClick={() => navigate("/pakiadmin/login")}
                      className="w-full bg-[#2c0735] text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-[#2c0735]/20 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
                    >
                      Return to Login
                    </button>
                    <p className="text-xs font-bold text-[#2c0735]/40">
                      Didn't receive the verification email?{" "}
                      <button
                        onClick={() => {
                          setSignupSuccess(false);
                          setFormData({
                            name: "",
                            employeeId: "",
                            email: "",
                            role: "",
                            password: "",
                            confirmPassword: "",
                          });
                        }}
                        className="text-[#2c0735] hover:underline"
                      >
                        Try again
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function InputField({ label, icon, placeholder, value, onChange, type = "text", maxLength, customClass = "" }: any) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-bold text-[#2c0735] uppercase tracking-widest px-1 opacity-60">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2c0735]/30 group-focus-within:text-[#2c0735] transition-colors">
          {icon}
        </div>
        <input 
          type={type} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full bg-[#dec0f1]/10 border border-[#dec0f1] rounded-xl pl-11 pr-4 py-3.5 text-[#2c0735] focus:border-[#2c0735] focus:bg-white outline-none transition-all text-sm font-bold ${customClass}`} 
          required
        />
      </div>
    </div>
  );
}

function AdminFeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/80 border border-[#dec0f1] rounded-2xl shadow-sm hover:shadow-md transition-all group w-full">
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
