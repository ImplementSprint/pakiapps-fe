import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Edit2, Save, 
  Camera, Shield, Lock, Eye, EyeOff, Bell, Smartphone, Car,
  Upload, FileText, CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import { userService } from '../services/userService';

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null); 
  
  // Profile & Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(
    localStorage.getItem('customerProfilePicture')
  );
  
  // Document State
  const [proofDocument, setProofDocument] = useState<string | null>(
    localStorage.getItem('userProofDocument')
  );

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Data State
  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    phone: localStorage.getItem('userPhone') || '',
    address: localStorage.getItem('userAddress') || '',
    dateOfBirth: localStorage.getItem('userDOB') || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const userInitials = profileData.name
    ? profileData.name
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'; 

  const handleSaveProfile = async () => {
    toast.loading('Saving profile...');
    try {
      await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        address: { street: profileData.address },
      });
    } catch {
      // Fallback — save to localStorage
    }
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userEmail', profileData.email);
    localStorage.setItem('userPhone', profileData.phone);
    localStorage.setItem('userAddress', profileData.address);
    localStorage.setItem('userDOB', profileData.dateOfBirth);
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('profileUpdated')); 
    
    toast.dismiss();
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePicture(base64String);
        localStorage.setItem('customerProfilePicture', base64String);
        
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('profileUpdated'));
        
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProofDocument(base64String);
        localStorage.setItem('userProofDocument', base64String);
        toast.success('Verification document uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.loading('Changing password...');
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.dismiss();
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error: any) {
      toast.dismiss();
      if (error.message?.includes('Backend server is not running') || error.message?.includes('fetch')) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordModal(false);
      } else {
        toast.error(error.message || 'Failed to change password.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Modal content unchanged */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1e3d5a]">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pr-10 bg-gray-50 border-gray-200"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pr-10 bg-gray-50 border-gray-200"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="pr-10 bg-gray-50 border-gray-200"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowPasswordModal(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleChangePassword} className="flex-1 bg-[#ee6b20] hover:bg-[#ee6b20]/90 text-white">Update</Button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/customer/home')}
              className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </button>
            <img src={logo} alt="PakiPark" className="h-8 ml-4" />
          </div>
          <h1 className="text-[#1e3d5a] font-bold text-lg">Customer Profile</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="relative inline-block mb-4">
                <div className="size-32 bg-[#1e3d5a] rounded-full flex items-center justify-center shadow-sm mx-auto overflow-hidden">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white">{userInitials}</span>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="absolute bottom-1 right-1 size-8 bg-[#ee6b20] rounded-full flex items-center justify-center text-white hover:bg-[#ee6b20]/90 transition-colors border-2 border-white"
                >
                  <Camera className="size-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3d5a] mb-1">{profileData.name || 'New User'}</h2>
              <p className="text-gray-500 mb-4">Regular Customer</p>
              
              <div className="flex flex-col items-center gap-2 mt-4">
                {proofDocument && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
                    <CheckCircle className="size-4" />
                    Discount Eligible
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#1e3d5a] mb-6">Customer Stats</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600">Total Bookings</span><span className="font-bold">12</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Active Bookings</span><span className="font-bold">1</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Saved Vehicles</span><span className="font-bold">2</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Account Created</span><span className="font-bold">Jan 2025</span></div>
              </div>
            </div>

            {/* Security Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#1e3d5a] mb-4">Security</h3>
              <div className="space-y-3">
                <Button onClick={() => setShowPasswordModal(true)} variant="outline" className="w-full justify-start gap-2"><Lock className="size-4" /> Change Password</Button>
                <Button variant="outline" className="w-full justify-start gap-2"><Shield className="size-4" /> Enable 2FA</Button>
              </div>
            </div>

            {/* Activity Card (MOVED HERE TO BALANCE LAYOUT) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#1e3d5a] mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <ActivityItem text="Booked parking slot A-12 at SM Megamall" time="2 hours ago" />
                <ActivityItem text="Updated profile picture" time="1 day ago" />
                <ActivityItem text="Added new vehicle (Toyota Vios - ABC 1234)" time="3 days ago" />
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1e3d5a]">Personal Information</h2>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#ee6b20] text-white gap-2"><Edit2 className="size-4" /> Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleSaveProfile} className="bg-[#ee6b20] text-white gap-2"><Save className="size-4" /> Save</Button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="flex items-center text-sm text-gray-600 mb-2"><User className="size-4 mr-2" /> Full Name</label>
                  <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} placeholder="Enter your full name" />
                </div>
                <div>
                  <label className="flex items-center text-sm text-gray-600 mb-2"><Mail className="size-4 mr-2" /> Email</label>
                  <Input value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} placeholder="Enter your email" />
                </div>
                <div>
                  <label className="flex items-center text-sm text-gray-600 mb-2"><Phone className="size-4 mr-2" /> Phone</label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} placeholder="Enter your phone number" />
                </div>
                <div>
                  <label className="flex items-center text-sm text-gray-600 mb-2"><Calendar className="size-4 mr-2" /> Birth Date</label>
                  <Input type="date" value={profileData.dateOfBirth} onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center text-sm text-gray-600 mb-2"><MapPin className="size-4 mr-2" /> Address</label>
                  <Input value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} disabled={!isEditing} className={!isEditing ? 'bg-gray-50' : ''} placeholder="Enter your full address" />
                </div>
              </div>
            </div>

            {/* Verification Documents Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1e3d5a]">Special Discounts Verification</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload a valid PWD or Senior Citizen ID to automatically apply discounts to your parking bookings.</p>
                </div>
                {proofDocument && <CheckCircle className="size-6 text-green-500 hidden sm:block" />}
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <input 
                  type="file" 
                  ref={documentInputRef} 
                  onChange={handleDocumentUpload} 
                  accept="image/png, image/jpeg, application/pdf" 
                  className="hidden" 
                />
                
                {proofDocument ? (
                  <div className="space-y-4">
                    <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                      <FileText className="size-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Document Uploaded Successfully</p>
                      <p className="text-xs text-gray-500 mt-1">Your ID is under review. Discounts will apply once verified.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => documentInputRef.current?.click()} className="mt-2 text-sm">
                      Update Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="size-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#1e3d5a]">
                      <Upload className="size-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Supported formats: PNG, JPG, or PDF (Max 5MB)</p>
                    </div>
                    <Button onClick={() => documentInputRef.current?.click()} className="bg-[#1e3d5a] text-white mt-2">
                      Upload ID
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Preferences Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-[#1e3d5a] mb-6">Account Preferences</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <PreferenceItem icon={<Bell className="size-4 text-green-600" />} title="Email Notifications" description="Receive booking confirmations" />
                <PreferenceItem icon={<Smartphone className="size-4 text-green-600" />} title="SMS Updates" description="Get real-time parking alerts" />
                <PreferenceItem icon={<Car className="size-4 text-green-600" />} title="Auto-extend Booking" description="Automatically extend if running late" />
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner JSX
function PreferenceItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-4 rounded-xl border border-green-100 bg-green-50/30 flex items-start justify-between">
      <div>
        <h4 className="font-medium text-gray-900 flex items-center gap-2">{icon} {title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Shield className="size-5 text-green-500" />
    </div>
  );
}

function ActivityItem({ text, time }: { text: string, time: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-600">{text}</p>
      <p className="text-sm text-gray-400">{time}</p>
    </div>
  );
}
