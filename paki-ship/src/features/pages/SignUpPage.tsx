import { Link, useNavigate } from "react-router";
import { useState, useMemo, useRef } from "react";
import { 
  User, Truck, MapPin, Mail, Lock, Eye, EyeOff,
  ChevronLeft, Upload, CheckCircle2, HeartPulse, Sparkles, Calendar, FileText, AlertCircle, Smartphone, Camera, Building2, Store, Map, ShieldCheck, Info
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

type UserRole = "customer" | "driver" | "operator" | null;
type Step = "role" | "reminder" | "operator_reminder" | "info" | "documents";

export function SignUpPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    fullName: string;
    role: string;
    redirectPath: string;
  } | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  
  // File State
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
    // Location Data
    address: "",
    city: "",
    province: "",
  });

  const validation = useMemo(() => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (formData.email && !emailRegex.test(formData.email)) errors.email = "Valid email is required.";

    const passRegex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    
    if (formData.password && !passRegex.test(formData.password)) {
      errors.password = "8+ chars, 1 number, and 1 special char required.";
    }
    
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    let age = 0;
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      
      if (selectedRole === "customer") {
        if (age < 16) errors.dob = "Must be at least 16.";
      } else {
        if (age < 18 || age > 65) errors.dob = "Age must be 18-65.";
      }
    }

    if (formData.phone && formData.phone.length < 10) errors.phone = "Enter 10 digits.";

    const isSenior = age >= 51 && age <= 65;
    const requiredAgeMet = selectedRole === "customer" ? age >= 16 : (age >= 18 && age <= 65);

    const isStep1Valid = 
      formData.fullName.trim().length >= 3 &&
      emailRegex.test(formData.email) &&
      formData.phone.length === 10 &&
      requiredAgeMet &&
      passRegex.test(formData.password) &&
      formData.password === formData.confirmPassword &&
      formData.address.trim().length > 5 &&
      formData.city.trim().length > 2 &&
      formData.province.trim().length > 2;

    return { errors, isSenior, isStep1Valid };
  }, [formData, selectedRole]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (!dateValue) {
      setFormData({ ...formData, dob: "" });
      return;
    }
    const yearPart = dateValue.split("-")[0];
    if (yearPart.length > 4) return;
    const selectedYear = parseInt(yearPart);
    const currentYear = new Date().getFullYear();
    if (selectedYear > currentYear) return;
    setFormData({ ...formData, dob: dateValue });
  };

  const formatRole = (role: string | null) => 
    role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
  
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "driver") {
      setCurrentStep("reminder");
    } else if (role === "operator") {
      setCurrentStep("operator_reminder");
    } else {
      setCurrentStep("info");
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.isStep1Valid) {
      if (selectedRole === "customer") {
        void submitSignup();
      } else {
        setCurrentStep("documents");
      }
    }
  };

  const handleFileUpload = (label: string, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [label]: file }));
  };

  const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

  const submitSignup = async () => {
    if (!selectedRole) return;

    setSubmitting(true);
    setSubmitError("");

    const oversizedDocument = Object.values(uploadedFiles).find(
      (file) => file && file.size > MAX_UPLOAD_SIZE_BYTES,
    );

    if (oversizedDocument) {
      setSubmitError("One of the uploaded files exceeds the 5MB limit.");
      setSubmitting(false);
      return;
    }

    const requiredApplicationFiles =
      selectedRole === "driver"
        ? ["Driver's License", "Vehicle OR/CR", "Selfie with Valid ID"]
        : selectedRole === "operator"
          ? ["DTI / SEC", "Permit", "Location"]
          : [];
    const missingApplicationFile = requiredApplicationFiles.find(
      (label) => !uploadedFiles[label],
    );
    if (missingApplicationFile) {
      setSubmitError(`Please upload ${missingApplicationFile} before submitting.`);
      setSubmitting(false);
      return;
    }

    try {
      const signupPayload = new FormData();
      Object.entries(formData).forEach(([field, value]) => {
        signupPayload.append(field, value);
      });
      signupPayload.append("role", selectedRole);

      [
        { label: "Driver's License", field: "driverLicense" },
        { label: "Vehicle OR/CR", field: "vehicleRegistration" },
        { label: "Selfie with Valid ID", field: "driverIdSelfie" },
        { label: "Medical Certificate", field: "medicalCertificate" },
        { label: "DTI / SEC", field: "operatorRegistration" },
        { label: "Permit", field: "businessPermit" },
        { label: "Location", field: "proofOfLocation" },
      ].forEach(({ label, field }) => {
        const file = uploadedFiles[label];
        if (file) {
          signupPayload.append(field, file);
        }
      });

      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: signupPayload,
      });
      const rawText = await response.text();
      let result: Record<string, unknown> = {};

      if (rawText) {
        try {
          result = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          result = { message: rawText };
        }
      }

      if (!response.ok) {
        setSubmitError(
          typeof result.message === "string"
            ? result.message
            : "Unable to create account.",
        );
        return;
      }

      const user = result.user as
        | { id: string; fullName: string; role: string }
        | undefined;

      if (!user?.id || !user.fullName || !user.role || typeof result.redirectPath !== "string") {
        setSubmitError("Account was created but the app returned an unexpected response.");
        return;
      }

      if (result.requiresVerification && typeof result.otpToken === "string") {
        setVerificationToken(result.otpToken);
        setPendingVerification({
          email: formData.email,
          fullName: user.fullName,
          role: user.role,
          redirectPath: result.redirectPath,
        });
        return;
      }

      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.fullName);
      localStorage.setItem("userRole", user.role);
      navigate(result.redirectPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong while creating your account.";
      setSubmitError(message || "Something went wrong while creating your account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = () => {
    if (!agreedToTerms) return;
    void submitSignup();
  };

  const handleVerifyEmail = async () => {
    if (!verificationToken || verificationCode.length !== 6) return;

    setIsVerifyingEmail(true);
    setSubmitError("");

    try {
      const response = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          otpToken: verificationToken,
          otp: verificationCode,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.message || "Invalid verification code.");
        return;
      }

      const user = result.user as
        | { id: string; fullName: string; role: string }
        | undefined;

      if (!user?.id || !user.fullName || !user.role || typeof result.redirectPath !== "string") {
        setSubmitError("Account verified but the app returned an unexpected response.");
        return;
      }

      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.fullName);
      localStorage.setItem("userRole", user.role);
      navigate(result.redirectPath);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to verify your account.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] flex flex-col font-sans overflow-x-hidden">
      <nav className="h-20 flex items-center px-8 md:px-16 lg:px-24 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 z-50">
        <button 
          onClick={() => {
            if (currentStep === "documents") setCurrentStep("info");
            else if (currentStep === "info") {
                if (selectedRole === "driver") setCurrentStep("reminder");
                else if (selectedRole === "operator") setCurrentStep("operator_reminder");
                else setCurrentStep("role");
            }
            else if (currentStep === "reminder" || currentStep === "operator_reminder") setCurrentStep("role");
            else navigate("/");
          }}
          className="mr-6 flex items-center text-[#39B5A8] hover:text-[#2D8F85] transition-all group"
        >
          <ChevronLeft className="w-5 h-5 -mr-2 text-[#39B5A8] group-hover:-translate-x-1 transition-transform" />
        </button>
        <Link to="/"><img src={logoImg} alt="PakiSHIP Logo" className="h-10 w-auto object-contain" /></Link>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#39B5A8]/5 rounded-full blur-[120px] -z-10" />
        
        <div className="w-full max-w-4xl bg-white border border-[#39B5A8]/10 rounded-[2.5rem] shadow-2xl shadow-[#39B5A8]/5 overflow-hidden">
          
          {selectedRole !== "customer" && !["role", "reminder", "operator_reminder"].includes(currentStep) && (
            <div className="flex bg-[#F0F9F8]/50 border-b border-[#39B5A8]/10">
              <ProgressTab active={currentStep === "info"} label="1. Personal Information" />
              <ProgressTab active={currentStep === "documents"} label="2. Verification" />
            </div>
          )}

          <div className="p-8 md:p-14">
            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm font-bold text-red-600">{submitError}</p>
              </div>
            )}
            {currentStep === "role" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-[#041614] mb-3">Create Account</h1>
                  <p className="text-gray-400 font-medium">Choose how you want to join the PakiSHIP community.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <RoleCard icon={<User className="w-6 h-6"/>} title="Parcel Sender" desc="Send and track parcels" onClick={() => handleRoleSelect("customer")} />
                  <RoleCard icon={<Truck className="w-6 h-6"/>} title="Driver" desc="Deliver and earn money" onClick={() => handleRoleSelect("driver")} />
                  <RoleCard icon={<MapPin className="w-6 h-6"/>} title="Partner Business" desc="Manage drop-off points" onClick={() => handleRoleSelect("operator")} />
                </div>
              </div>
            )}

            {currentStep === "reminder" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-[#39B5A8]" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#041614]">Paalala para sa Rider</h2>
                </div>
                
                <div className="grid gap-4 mb-10">
                  <ReminderItem 
                    icon={<HeartPulse className="w-5 h-5 text-rose-500" />} 
                    title="Para sa Edad 51-65" 
                    text='Siguraduhing may Medical Certificate na "Fit to Drive Motorcycle" bago magpatuloy.' 
                  />
                  <ReminderItem 
                    icon={<Smartphone className="w-5 h-5 text-blue-500" />} 
                    title="Phone Requirements" 
                    text="Gumamit ng Android (V10 pataas) o Huawei device. Hindi pa suportado ang iOS sa kasalukuyan." 
                  />
                  <ReminderItem 
                    icon={<ShieldCheck className="w-5 h-5 text-[#39B5A8]" />} 
                    title="Dokumentong Kailangan" 
                    text="Ihanda ang iyong Driver's License at Vehicle OR/CR. Siguraduhing ito ay orihinal at malinaw." 
                  />
                  <ReminderItem 
                    icon={<Info className="w-5 h-5 text-amber-500" />} 
                    title="Professionalism" 
                    text="Inaasahan ang maayos na pakikitungo sa mga customer at pagsunod sa batas trapiko." 
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <button onClick={() => setCurrentStep("info")} className="w-full bg-[#041614] text-white font-bold py-5 rounded-2xl hover:bg-[#123E3A] transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em]">
                    Proceed to Sign Up
                  </button>
                  <p className="text-center text-[10px] text-gray-400 font-medium">Sa pag-proceed, kinukumpirma mo na nabasa at naintindihan ang mga paalala.</p>
                </div>
              </div>
            )}

            {currentStep === "operator_reminder" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[#F0F9F8] rounded-2xl flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-indigo-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-[#041614]">Paalala para sa mga Partner Business</h2>
                </div>
                <div className="space-y-4 mb-10">
                  <ReminderItem icon={<Store className="w-5 h-5 text-emerald-500" />} title="Physical Location" text="Dapat ay mayroong physical space o establishment para sa parcel drop-off at pickup." />
                  <ReminderItem icon={<FileText className="w-5 h-5 text-sky-500" />} title="Business Compliance" text="Siguraduhing updated ang DTI/SEC at Mayor's Permit ng inyong lokasyon." />
                  <ReminderItem icon={<MapPin className="w-5 h-5 text-orange-500" />} title="Accessible Area" text="Ang lokasyon ay dapat madaling mapuntahan ng mga riders at customers." />
                </div>
                <button onClick={() => setCurrentStep("info")} className="w-full bg-[#041614] text-white font-bold py-5 rounded-2xl hover:bg-[#123E3A] transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em]">Proceed to Sign Up</button>
              </div>
            )}

            {currentStep === "info" && (
              <form onSubmit={handleNext} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <div className="text-[#39B5A8] text-[11px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#39B5A8]" />
                    {formatRole(selectedRole)} Application Form
                  </div>
                  <h2 className="text-2xl font-bold text-[#041614] mb-2">Personal Details</h2>
                  <p className="text-gray-400 text-sm font-medium">Please provide your legal information and current location.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField label="Full Name" icon={<User className="w-5 h-5"/>} placeholder="Juan Dela Cruz" value={formData.fullName} onChange={(e:any)=>setFormData({...formData, fullName: e.target.value})} />
                  <InputField label="Date of Birth" type="date" icon={<Calendar className="w-5 h-5"/>} value={formData.dob} error={validation.errors.dob} onChange={handleDobChange} />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">Phone Number</label>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter ${validation.errors.phone ? 'text-red-500' : 'text-gray-400'}`}>{validation.errors.phone}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-xl px-4 py-3.5 text-[#1A5D56] font-bold text-sm flex items-center select-none">+63</div>
                      <input className={`flex-1 bg-[#F0F9F8] border ${validation.errors.phone ? 'border-red-500/30' : 'border-[#39B5A8]/10'} rounded-xl px-5 py-3.5 text-[#041614] focus:border-[#39B5A8] focus:bg-white outline-none transition-all text-sm font-medium`} placeholder="912 345 6789" type="tel" value={formData.phone} onChange={handlePhoneChange} />
                    </div>
                  </div>

                  <InputField label="Email Address" icon={<Mail className="w-5 h-5"/>} placeholder="juandelacruz@email.com" value={formData.email} error={validation.errors.email} onChange={(e:any)=>setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="pt-4 border-t border-[#39B5A8]/10">
                  <h3 className="text-sm font-bold text-[#041614] mb-4 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#39B5A8]" /> Address Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <InputField label="Street Address / House No." icon={<Map className="w-5 h-5"/>} placeholder="123 Mabini St. Brgy. 4" value={formData.address} onChange={(e:any)=>setFormData({...formData, address: e.target.value})} />
                    </div>
                    <InputField label="City / Municipality" icon={<Building2 className="w-5 h-5"/>} placeholder="Quezon City" value={formData.city} onChange={(e:any)=>setFormData({...formData, city: e.target.value})} />
                    <InputField label="Province" icon={<MapPin className="w-5 h-5"/>} placeholder="Metro Manila" value={formData.province} onChange={(e:any)=>setFormData({...formData, province: e.target.value})} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-[#39B5A8]/10">
                  <InputField label="Password" type={showPassword ? "text" : "password"} icon={<Lock className="w-5 h-5"/>} placeholder="8+ chars, number, special char" value={formData.password} error={validation.errors.password} showEye onEyeClick={()=>setShowPassword(!showPassword)} eyeOpen={showPassword} onChange={(e:any)=>setFormData({...formData, password: e.target.value})} />
                  <InputField label="Confirm Password" type={showPassword ? "text" : "password"} icon={<Lock className="w-5 h-5"/>} placeholder="Repeat password" value={formData.confirmPassword} error={validation.errors.confirmPassword} onChange={(e:any)=>setFormData({...formData, confirmPassword: e.target.value})} />
                </div>

                <button disabled={!validation.isStep1Valid || submitting} className="w-full bg-[#041614] disabled:opacity-30 text-white font-bold py-5 rounded-2xl hover:bg-[#123E3A] transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em] mt-4">
                  {submitting
                    ? "Submitting..."
                    : selectedRole === "customer"
                      ? "Create Account"
                      : "Proceed to Documents"}
                </button>
              </form>
            )}

            {currentStep === "documents" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 text-[#39B5A8]">
                      <CheckCircle2 className="w-6 h-6" />
                      <h3 className="font-bold">Verification Requirements</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A5D56]/60 md:text-right">
                      {selectedRole} Application Form
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 font-medium italic">Accepted formats: JPEG or PDF (Max 5MB).</p>
                  <ul className="text-xs space-y-2 text-[#1A5D56] opacity-80 list-disc list-inside">
                    {selectedRole === "driver" ? (
                      <><li>Valid driver's license</li><li>Vehicle registration (OR/CR)</li><li>Selfie holding your Valid ID</li></>
                    ) : (
                      <><li>Business registration (DTI/SEC)</li><li>Business permit</li><li>Proof of ownership</li></>
                    )}
                  </ul>
                </div>

                <div className="flex flex-col gap-6">
                   {selectedRole === "driver" ? (
                    <>
                      <UploadBox label="Driver's License" value={uploadedFiles["Driver's License"]} onChange={(f: any) => handleFileUpload("Driver's License", f)} subtext="Front and back view" />
                      <UploadBox label="Vehicle OR/CR" value={uploadedFiles["Vehicle OR/CR"]} onChange={(f: any) => handleFileUpload("Vehicle OR/CR", f)} subtext="Current year registration" />
                      <UploadBox label="Selfie with Valid ID" value={uploadedFiles["Selfie with Valid ID"]} onChange={(f: any) => handleFileUpload("Selfie with Valid ID", f)} subtext="Face and ID must be clear" icon={<Camera className="w-6 h-6 text-violet-500" />} />
                      {validation.isSenior && <UploadBox label="Medical Certificate" value={uploadedFiles["Medical Certificate"]} onChange={(f: any) => handleFileUpload("Medical Certificate", f)} subtext="Fit to drive (Ages 51-65)" icon={<HeartPulse className="w-6 h-6 text-rose-500" />} />}
                    </>
                  ) : (
                    <>
                      <UploadBox label="DTI / SEC Registration" value={uploadedFiles["DTI / SEC"]} onChange={(f: any) => handleFileUpload("DTI / SEC", f)} subtext="Business legal documentation" />
                      <UploadBox label="Business Permit" value={uploadedFiles["Permit"]} onChange={(f: any) => handleFileUpload("Permit", f)} subtext="Current Mayor's Permit" />
                      <UploadBox label="Proof of Location" value={uploadedFiles["Location"]} onChange={(f: any) => handleFileUpload("Location", f)} subtext="Lease contract or Land title" />
                    </>
                  )}
                </div>

                <div className="flex items-start gap-3 p-5 bg-[#F0F9F8] rounded-2xl border border-[#39B5A8]/10">
                  <input type="checkbox" id="terms" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-5 h-5 rounded border-[#39B5A8]/20 bg-white checked:bg-[#39B5A8] cursor-pointer accent-[#39B5A8]" />
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none">
                    I accept the <span className="text-[#39B5A8] font-bold underline">Terms and Conditions</span> and <span className="text-[#39B5A8] font-bold underline">Privacy Policy</span>.
                  </label>
                </div>

                <button onClick={handleFinalSubmit} disabled={!agreedToTerms || submitting} className="w-full bg-[#041614] disabled:opacity-30 text-white font-bold py-5 rounded-2xl hover:bg-[#123E3A] transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em]">
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {pendingVerification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#041614]/50 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F9F8] text-[#39B5A8]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-black text-[#041614]">Verify your email</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-gray-500">
              We sent a 6-digit code to <span className="font-bold text-[#1A5D56]">{pendingVerification.email}</span>.
            </p>

            {submitError ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs font-bold text-red-600">{submitError}</p>
              </div>
            ) : null}

            <input
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-6 w-full rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-5 py-4 text-center text-xl font-black tracking-[0.5em] text-[#041614] outline-none focus:border-[#39B5A8] focus:bg-white"
              placeholder="000000"
            />

            <button
              type="button"
              onClick={() => void handleVerifyEmail()}
              disabled={verificationCode.length !== 6 || isVerifyingEmail}
              className="mt-5 w-full rounded-2xl bg-[#041614] py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-[#123E3A] disabled:opacity-40"
            >
              {isVerifyingEmail ? "Verifying..." : "Verify Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Components
function InputField({ label, icon, placeholder, type, value, onChange, error, showEye, onEyeClick, eyeOpen }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">{label}</label>
        {error && <span className="text-[10px] text-red-500 font-bold">{error}</span>}
      </div>
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#39B5A8]/40">{icon}</div>
        <input 
          type={type} 
          value={value} 
          onChange={onChange} 
          className={`w-full bg-[#F0F9F8] border ${error ? 'border-red-500/30' : 'border-[#39B5A8]/10'} rounded-xl pl-14 pr-12 py-3.5 text-[#041614] outline-none focus:border-[#39B5A8] focus:bg-white transition-all text-sm font-medium`} 
          placeholder={placeholder} 
        />
        {showEye && (
          <button type="button" onClick={onEyeClick} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#39B5A8]">
            {eyeOpen ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
          </button>
        )}
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="p-8 bg-white border border-[#39B5A8]/10 rounded-3xl hover:border-[#39B5A8] hover:shadow-xl hover:shadow-[#39B5A8]/10 transition-all group text-left">
      <div className="w-14 h-14 bg-[#F0F9F8] rounded-2xl flex items-center justify-center mb-6 text-[#39B5A8] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-[#041614] font-bold text-lg mb-1">{title}</h3>
      <p className="text-gray-400 text-sm font-medium leading-snug">{desc}</p>
    </button>
  );
}

function ReminderItem({ icon, title, text }: any) {
  return (
    <div className="flex gap-4 p-5 bg-white border border-[#39B5A8]/10 rounded-2xl hover:shadow-md transition-all">
      <div className="shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-[#041614] text-sm mb-1">{title}</h4>
        <p className="text-gray-400 text-xs font-medium leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ProgressTab({ active, label }: any) {
  return (
    <div className={`flex-1 text-center py-5 text-[10px] uppercase tracking-widest font-bold transition-all ${active ? 'text-[#39B5A8] border-b-2 border-[#39B5A8] bg-white' : 'text-gray-400 border-b border-[#39B5A8]/10'}`}>
      {label}
    </div>
  );
}

function UploadBox({ label, subtext, icon, value, onChange }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 w-full text-left">
      <label className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest ml-1">{label}</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed ${value ? 'border-[#39B5A8] bg-white' : 'border-[#39B5A8]/10 bg-[#F0F9F8]/30'} rounded-3xl py-10 hover:bg-white hover:border-[#39B5A8] transition-all cursor-pointer group flex flex-col items-center justify-center text-center`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/jpeg,application/pdf"
          onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
        />
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#39B5A8]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
          {value ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : (icon || <Upload className="w-5 h-5 text-sky-500" />)}
        </div>
        <div className="space-y-1 px-4">
          <p className="text-[#041614] font-bold text-xs truncate max-w-[200px]">
            {value ? value.name : `Upload ${label}`}
          </p>
          <p className="text-gray-400 text-[10px] font-medium">
            {value ? `${(value.size / 1024).toFixed(0)} KB` : subtext}
          </p>
        </div>
      </div>
    </div>
  );
}
