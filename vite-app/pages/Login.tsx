import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import pakiParkLogo from "../../assets/feccb20cc5f5015bfba988559af29b31524bf965.png";
import pakiShipLogo from "../../assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
import {
  Phone,
  Mail,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Clock,
  ChevronLeft,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authService } from "../services/authService";

function navigateByRole(role: string, navigate: (path: string) => void) {
  switch (role) {
    case "admin":           navigate("/admin/home"); break;
    case "teller":          navigate("/teller/home"); break;
    case "business_partner":navigate("/admin/home"); break;
    default:                navigate("/customer/home");
  }
}

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errors, setErrors] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  // Detect if identifier looks like a phone number
  const isPhone = /^\d/.test(formData.identifier) && !/[@.]/.test(formData.identifier);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [socialModal, setSocialModal] = useState<{ isOpen: boolean; provider: string; step: "connecting" | "success" }>({
    isOpen: false,
    provider: "",
    step: "connecting",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d/.test(value) && !/[@.]/.test(value)) {
      // Phone number mode
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) {
        setFormData({ ...formData, identifier: digits });
        setErrors((prev) => ({
          ...prev,
          identifier: digits.length > 0 && digits.length < 10 ? "Enter 10 digits for mobile number." : "",
        }));
      }
    } else {
      setFormData({ ...formData, identifier: value });
      setErrors((prev) => ({ ...prev, identifier: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { identifier: "", password: "" };
    let hasError = false;

    if (isPhone) {
      if (formData.identifier.length !== 10) {
        newErrors.identifier = "Enter 10 digits for mobile number.";
        hasError = true;
      }
    } else {
      if (!emailRegex.test(formData.identifier)) {
        newErrors.identifier = "Please enter a valid email address.";
        hasError = true;
      }
    }

    const passRegex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passRegex.test(formData.password)) {
      newErrors.password = "8+ chars, 1 number, and 1 special char required.";
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setIsLoading(true);
    try {
      const email = isPhone ? `+63${formData.identifier}` : formData.identifier;
      const user = await authService.login({ email, password: formData.password });
      navigateByRole(user.role, navigate);
    } catch (error: any) {
      if (error.message?.includes("Backend server is not running") || error.message?.includes("fetch")) {
        // Fallback: can't determine role without backend
        setErrors(prev => ({ ...prev, password: "Cannot connect to server. Please try again later." }));
      } else {
        setErrors(prev => ({ ...prev, password: error.message || "Login failed. Please try again." }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    setSocialModal({ isOpen: true, provider, step: "connecting" });
    setTimeout(() => setSocialModal(prev => ({ ...prev, step: "success" })), 2000);
  };

  const finalizeSocialLogin = () => {
    // Default to customer for social login
    localStorage.setItem("userRole", "customer");
    navigate("/customer/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fa] font-sans text-left">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <ChevronLeft className="w-5 h-5 text-[#1e3d5a] group-hover:-translate-x-1 transition-transform" />
            <img src={pakiParkLogo} alt="PakiPark Logo" className="h-10 object-contain" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24 bg-[#1e3d5a] relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#2a5373] rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-[-10%] left-[-10%] size-[300px] bg-[#ee6b20] rounded-full blur-[150px] opacity-10" />

          <div className="mb-8 relative z-10">
            <span className="bg-[#ee6b20]/20 text-white text-[10px] font-bold tracking-widest px-4 py-2 rounded-full uppercase border border-[#ee6b20]/40 backdrop-blur-sm">
              Philippines' #1 Smart Parking Platform
            </span>
          </div>

          <div className="space-y-4 mb-12 relative z-10">
            <h1 className="text-6xl font-bold text-white leading-[1.1]">
              Tap. Reserve. <br />
              <span className="text-[#ee6b20]">Convenience</span> in Every Spot!
            </h1>
            <p className="text-xl text-blue-100/70 font-medium italic opacity-80">
              Login to continue managing your reservations.
            </p>
          </div>

          <div className="space-y-4 max-w-lg relative z-10">
            {[
              { icon: <Zap />, title: "Lightning Fast Booking", desc: "Get your parking spot reserved within seconds" },
              { icon: <Clock />, title: "24/7 Real-time Tracking", desc: "Monitor your parking reservation every parcel" },
              { icon: <Shield />, title: "Secure & Insured", desc: "All parking locations are fully protected" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl flex items-center gap-5 border border-white/10 shadow-2xl group hover:bg-white/15 transition-all text-left">
                <div className="size-12 bg-[#ee6b20]/20 rounded-xl flex items-center justify-center text-[#ee6b20] group-hover:scale-110 transition-transform">
                  {React.cloneElement(item.icon as React.ReactElement, { className: "size-6 stroke-[2.5px]" })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-blue-100/60 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#f4f7fa]">
          <div className="w-full max-w-[520px] bg-white rounded-[40px] shadow-[0_20px_60px_-15px_rgba(30,61,90,0.15)] p-8 sm:p-14 border border-white relative">

            <div className="mb-10 text-left">
              <h2 className="text-4xl font-bold text-[#1e3d5a] mb-2">Log In</h2>
              <p className="text-[#8492a6] font-medium text-sm">
                Welcome back! Enter your credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 text-left">
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase opacity-70 px-1">
                  Email or Mobile Number
                </Label>
                <div className="flex gap-2">
                  {isPhone && (
                    <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-2xl px-4 flex items-center justify-center font-bold text-[#1e3d5a] select-none">+63</div>
                  )}
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                      {isPhone ? <Phone className="size-5" /> : <Mail className="size-5" />}
                    </div>
                    <Input
                      type="text"
                      placeholder={isPhone ? "9123456789" : "your@email.com"}
                      className={`h-14 pl-12 bg-[#f8fafc] border ${errors.identifier ? "border-red-500/50" : "border-[#e2e8f0]"} rounded-2xl focus:ring-[#1e3d5a]`}
                      value={formData.identifier}
                      onChange={handleIdentifierChange}
                      required
                    />
                  </div>
                </div>
                {errors.identifier && <p className="text-[10px] text-red-500 font-bold px-1 mt-1">{errors.identifier}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-[#1e3d5a] tracking-widest uppercase px-1 opacity-70">Password</Label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8492a6]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-14 pl-12 pr-12 bg-[#f8fafc] border ${errors.password ? "border-red-500/50" : "border-[#e2e8f0]"} rounded-2xl focus:ring-[#1e3d5a]`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8492a6]">
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold px-1 mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between px-1">
                <button type="button" onClick={() => setKeepLoggedIn(!keepLoggedIn)} className="flex items-center gap-2 group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${keepLoggedIn ? "bg-[#1e3d5a] border-[#1e3d5a]" : "border-gray-200 bg-white"}`}>
                    {keepLoggedIn && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                  </div>
                  <span className="text-xs font-bold text-[#8492a6] group-hover:text-[#1e3d5a]">Keep me logged in</span>
                </button>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-[#ee6b20] hover:underline">
                  Forgot Password?
                </button>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-16 bg-[#1e3d5a] hover:bg-[#2a5373] text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl mt-4">
                {isLoading ? "Signing In..." : "Continue to Dashboard"}
              </Button>
            </form>

            <div className="mt-10 mb-8 relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#e2e8f0]" /></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-[#8492a6]">
                <span className="bg-white px-4">Or Connect With</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              <Button variant="outline" onClick={() => handleSocialClick("Google")} className="h-14 rounded-2xl border-[#e2e8f0] text-[#1e3d5a] font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="size-4" /> Google
              </Button>
              <Button variant="outline" onClick={() => handleSocialClick("Facebook")} className="h-14 rounded-2xl border-[#e2e8f0] text-[#1e3d5a] font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg" alt="Facebook" className="size-4" /> Facebook
              </Button>
              <Button variant="outline" onClick={() => handleSocialClick("PakiShip")} className="h-14 rounded-2xl border-[#e2e8f0] text-[#1e3d5a] font-bold text-xs flex items-center gap-2 active:scale-95 transition-all">
                <img src={pakiShipLogo} alt="PakiShip" className="h-5 object-contain" /> PakiShip
              </Button>
            </div>

            <p className="text-center text-[#8492a6] font-bold text-sm">
              New to PakiPark? <Link to="/signup" className="text-[#ee6b20] hover:underline decoration-2 underline-offset-4">Create Account</Link>
            </p>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1e3d5a]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => { setShowForgotModal(false); setResetSent(false); }} className="absolute right-6 top-6 p-2 text-gray-300 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
            {!resetSent ? (
              <div className="space-y-6">
                <div className="w-14 h-14 bg-[#f4f7fa] rounded-2xl flex items-center justify-center"><Lock className="w-6 h-6 text-[#ee6b20]" /></div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-[#1e3d5a]">Reset Password</h3>
                  <p className="text-[#8492a6] text-sm font-medium mt-1">Enter your email to receive a reset link.</p>
                </div>
                <Input type="text" placeholder="your@email.com" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} className="h-14 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4" />
                <Button onClick={() => setResetSent(true)} disabled={forgotIdentifier.length < 5} className="w-full h-14 bg-[#ee6b20] text-white font-bold rounded-xl">
                  Send Reset Link <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-[#ee6b20]/10 rounded-full flex items-center justify-center mx-auto"><ShieldCheck className="w-8 h-8 text-[#ee6b20]" /></div>
                <h3 className="text-2xl font-bold text-[#1e3d5a]">Link Sent!</h3>
                <p className="text-[#8492a6] text-sm font-medium">Check your inbox to reset your password.</p>
                <Button onClick={() => setShowForgotModal(false)} className="w-full h-14 bg-[#1e3d5a] text-white font-bold rounded-xl mt-4">Back to Login</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOCIAL CONNECTION MODAL */}
      {socialModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1e3d5a]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative text-center animate-in zoom-in-95 duration-300">
            {socialModal.step === "connecting" ? (
              <div className="space-y-6 py-4">
                <div className="relative mx-auto size-20">
                  <div className="absolute inset-0 border-4 border-[#e2e8f0] rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#ee6b20] rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {socialModal.provider === "Google" && <img src="https://www.google.com/favicon.ico" className="size-8" alt="Google" />}
                    {socialModal.provider === "Facebook" && <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg" className="size-8" alt="Facebook" />}
                    {socialModal.provider === "PakiShip" && <img src={pakiShipLogo} className="h-8 object-contain" alt="PakiShip" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">Connecting...</h3>
                  <p className="text-gray-400 text-sm mt-2 font-medium">Authorizing your {socialModal.provider} account</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-in zoom-in duration-500">
                  <ShieldCheck className="size-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1e3d5a]">Linked!</h3>
                  <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">
                    Successfully authenticated via <strong>{socialModal.provider}</strong>.
                  </p>
                </div>
                <Button onClick={finalizeSocialLogin} className="w-full h-14 bg-[#1e3d5a] hover:bg-[#2a5373] text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg">
                  Enter Dashboard
                </Button>
              </div>
            )}
            {socialModal.step === "connecting" && (
              <button onClick={() => setSocialModal({ ...socialModal, isOpen: false })} className="mt-4 text-xs font-bold text-gray-400 hover:text-red-500">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
