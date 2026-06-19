import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Camera,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import PakiParkSidebar from '../../components/pakipark/PakiParkSidebar';
import { usePasswordValidation, FormInput, PasswordResetModal, type ProfileTheme } from '../../components/profile/profileForm';

const theme: ProfileTheme = {
  fieldLabel: 'text-[#8492a6]',
  inputEnabled: 'bg-white border-[#e2e8f0] focus:border-[#1e3d5a] text-[#1e3d5a]',
  inputDisabled: 'bg-[#f4f7fa] border-transparent text-[#1e3d5a]/60',
  inputHeight: 'h-14',
  iconFocus: 'group-focus-within:text-[#ee6b20]',
  pwLabel: 'text-xs font-black text-[#1e3d5a]/60 ml-1 uppercase tracking-wider',
  pwInput: 'rounded-2xl pr-12 h-14 bg-[#f4f7fa] border-2 border-transparent focus:border-[#ee6b20]/20 focus:bg-white font-bold transition-all',
  pwToggleHover: 'hover:text-[#ee6b20]',
  modalBorder: 'border-[#e2e8f0]',
  modalTitle: 'text-[#1e3d5a]',
  modalSubtitle: 'text-[#1e3d5a]/60',
  reqBox: 'bg-[#f4f7fa] border-[#1e3d5a]/10',
  reqLabel: 'text-[#ee6b20]',
  confirmEnabled: 'bg-[#1e3d5a] hover:bg-[#2a5373] text-white',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sampleDisplayName = (user?.name || 'Admin');
  const sampleEmail = user?.email || 'juandelacruz@pakiadmin.com';

  // --- STATE MANAGEMENT ---
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, profile: false });
  const [isEditing, setIsEditing] = useState(false);

  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('pakipark_profilePicture');
  });

  const [formData, setFormData] = useState({
    adminId: 'Loading...',
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    dob: '',
    password: '••••••••••••', 
  });

  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        const { supabase } = await import('../../lib/supabase');
        const { data } = await supabase.schema('account').from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setFormData(prev => ({
            ...prev,
            adminId: data.id.substring(0, 13),
            name: data.full_name || user.name || '',
            email: user.email || '',
            phone: data.phone_number || '',
            address: data.address || '',
            dob: data.dob || '',
          }));
        }
      }
      fetchProfile();
    }
  }, [user]);

  const { passwordData, setPasswordData, passwordErrors, isPasswordValid } = usePasswordValidation();

  const adminDetails = [
    { label: 'System Role', value: 'Facility Admin', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Last Login', value: 'Today, 10:15 AM', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  const userInitials = formData.name
    ? formData.name.trim().split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JD';

  // --- HANDLERS ---
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');

    if (user?.id) {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.schema('account').from('profiles').update({
        full_name: formData.name,
        phone_number: formData.phone,
        address: formData.address,
        dob: formData.dob
      }).eq('id', user.id);

      if (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to update profile');
        return;
      }
    }

    toast.dismiss(loadingToast);
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleUpdatePassword = () => {
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }
    toast.success('Password updated successfully!');
    setShowPasswordModal(false);
    setPasswordData({ current: '', new: '' });
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePicture(base64);
        localStorage.setItem('pakipark_profilePicture', base64);
        window.dispatchEvent(new Event('storage'));
        toast.success('Photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans text-[#1e3d5a] overflow-hidden">
      {/* Enhanced Password Modal */}
      <PasswordResetModal
        show={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        subtitle="Change your facility management password."
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        showPass={showPass}
        setShowPass={setShowPass}
        passwordErrors={passwordErrors}
        isPasswordValid={isPasswordValid}
        onConfirm={handleUpdatePassword}
        theme={theme}
      />

      <PakiParkSidebar activeTab="profile" />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#1e3d5a]/10 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-[#f4f7fa] px-4 py-2 rounded-xl border border-[#1e3d5a]/10 w-180">
            <Search className="w-4 h-4 text-[#1e3d5a]/60" />
            <input type="text" placeholder="Search profile details..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#1e3d5a]/40 font-medium" />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 hover:bg-[#f4f7fa] px-3 py-2 rounded-xl transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">
                  {userInitials[0]}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold text-[#1e3d5a] leading-tight">{formData.name}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1e3d5a] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#1e3d5a]/10 overflow-hidden z-20">
                  <button onClick={() => setIsUserMenuOpen(false)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#f4f7fa] transition-colors text-left">
                    <User className="w-4 h-4 text-[#ee6b20]" />
                    <span className="font-semibold text-[#1e3d5a]">Profile</span>
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Profile Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#f4f7fa]">
          <div className="max-w-6xl mx-auto p-10 pb-10 space-y-8"> 
            <section>
              <h1 className="text-3xl font-bold text-[#1e3d5a] tracking-tight">Personal Profile</h1>
              <p className="text-[#1e3d5a] opacity-70 font-medium italic">Manage your parking identity and administrative credentials.</p>
            </section>

            {/* Main Layout Grid */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Sidebar Info - Column 1 */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-[#1e3d5a]/10 shadow-sm text-center">
                  <div className="relative inline-block">
                    <div className="size-32 rounded-[2.5rem] bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] overflow-hidden border-4 border-[#f4f7fa] shadow-lg flex items-center justify-center">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold text-white">{userInitials}</span>
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-[#ee6b20] text-white p-3 rounded-2xl shadow-xl hover:bg-[#d45e1a] border-2 border-white transition-all">
                      <Camera className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
                  </div>
                  <h2 className="mt-6 text-2xl font-bold text-[#1e3d5a] truncate">{formData.name}</h2>
                  <p className="text-sm text-[#ee6b20] font-bold mt-1 uppercase tracking-wider">PakiPark Admin</p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-[#1e3d5a]/10 shadow-sm w-full">
                  <h3 className="font-bold text-[#1e3d5a] mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#ee6b20]">System Access</h3>
                  <div className="space-y-4">
                    {adminDetails.map((stat, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-[#f4f7fa] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#f4f7fa] rounded-xl flex items-center justify-center text-[#1e3d5a]">{stat.icon}</div>
                          <span className="text-sm text-[#1e3d5a]/70 font-medium">{stat.label}</span>
                        </div>
                        <span className="font-bold text-[#1e3d5a] text-right text-sm">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Form Content - Column 2 */}
              <div className="w-full lg:w-2/3">
                <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#1e3d5a]/10 shadow-sm flex flex-col mb-4">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-[#1e3d5a]">Profile Information</h2>
                    {!isEditing ? (
                      <Button type="button" onClick={() => setIsEditing(true)} className="bg-[#1e3d5a] hover:bg-[#2a5373] text-white px-6 rounded-2xl h-12 font-bold shadow-lg">
                        <User className="w-4 h-4 mr-2" /> Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="px-6 rounded-2xl h-12 font-bold">Cancel</Button>
                        <Button type="submit" className="bg-[#ee6b20] hover:bg-[#d45e1a] text-white px-8 rounded-2xl h-12 font-bold shadow-lg"><Save className="w-4 h-4 mr-2" /> Save</Button>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormInput icon={<User />} label="Full Name" value={formData.name} onChange={(v: string) => setFormData({ ...formData, name: v })} disabled={!isEditing} theme={theme} />
                    <FormInput icon={<ShieldCheck />} label="Admin ID" value={formData.adminId} disabled={true} theme={theme} />

                    <div className="md:col-span-2">
                      <FormInput icon={<Mail />} label="Email Address" value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} disabled={!isEditing} theme={theme} />
                    </div>

                    <FormInput icon={<Phone />} label="Phone Number" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} disabled={!isEditing} theme={theme} />
                    <FormInput icon={<Calendar />} label="Birth Date" type="date" value={formData.dob} onChange={(v: string) => setFormData({ ...formData, dob: v })} disabled={!isEditing} theme={theme} />

                    <div className="md:col-span-2">
                      <FormInput icon={<MapPin />} label="Residential Address" value={formData.address} onChange={(v: string) => setFormData({ ...formData, address: v })} disabled={!isEditing} theme={theme} />
                    </div>

                    {/* Integrated Password Field */}
                    <div className="md:col-span-2 mt-4 pt-6 border-t border-gray-100 relative">
                      <div className="flex justify-between items-center mb-1 px-1">
                         <label className="text-[10px] font-bold text-[#ee6b20] uppercase tracking-[0.2em]">System Password</label>
                         <button 
                           type="button" 
                           onClick={() => setShowPasswordModal(true)}
                           className="text-[10px] font-bold text-[#ee6b20] hover:text-[#1e3d5a] uppercase tracking-wider transition-colors underline underline-offset-4"
                         >
                           Reset Password
                         </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                          <Lock className="w-4 h-4" />
                        </div>
                        <Input
                          type={showPass.profile ? 'text' : 'password'}
                          value={formData.password}
                          readOnly
                          className="w-full bg-[#f4f7fa] border-transparent text-[#1e3d5a]/60 border-2 rounded-2xl pl-12 pr-12 py-6 text-sm font-bold h-14"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPass({...showPass, profile: !showPass.profile})}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ee6b20]"
                        >
                          {showPass.profile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


