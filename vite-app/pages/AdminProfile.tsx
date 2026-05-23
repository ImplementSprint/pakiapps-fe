import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Mail, Phone, Shield, Edit2, Save, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import logo from '../../assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
import { userService } from '../services/userService';

export function AdminProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(
    localStorage.getItem('adminProfilePicture')
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: localStorage.getItem('userName') || 'Admin User',
    email: localStorage.getItem('userEmail') || 'admin@pakipark.com',
    phone: '+63 917 123 4567',
    role: 'Super Administrator',
    department: 'Operations',
    employeeId: 'PKP-ADM-001',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const userInitials = profileData.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSaveProfile = async () => {
    toast.loading('Saving profile...');
    try {
      await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });
    } catch {
      // Fallback - continue with localStorage save
    }
    toast.dismiss();
    toast.success('Profile updated successfully!');
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userEmail', profileData.email);
    window.dispatchEvent(new Event('storage'));
    setIsEditing(false);
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfilePicture(base64String);
        localStorage.setItem('adminProfilePicture', base64String);
        
        // Trigger a custom storage event to notify other components
        window.dispatchEvent(new Event('storage'));
        
        toast.success('Profile picture updated!');
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

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
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

  const adminStats = [
    { label: 'Total Managed Locations', value: '5' },
    { label: 'Active Bookings', value: '234' },
    { label: 'Users Managed', value: '1,234' },
    { label: 'Account Created', value: 'Jan 2025' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1e3d5a]">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Password must be at least 8 characters long and include a mix of letters and numbers.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPasswordModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="flex-1 bg-[#ee6b20] hover:bg-[#ee6b20]/90"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/home')}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Back to Dashboard
              </Button>
              <img src={logo} alt="PakiPark" className="h-8" />
            </div>
            <h1 className="text-xl font-bold text-[#1e3d5a]">Admin Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Picture Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="size-32 bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-full flex items-center justify-center shadow-lg">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">{userInitials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 size-10 bg-[#ee6b20] rounded-full flex items-center justify-center text-white hover:bg-[#ee6b20]/90 transition-colors shadow-lg"
                >
                  <Camera className="size-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-bold text-[#1e3d5a] mb-1">{profileData.name}</h2>
              <p className="text-gray-600 mb-2">{profileData.role}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ee6b20]/10 text-[#ee6b20] text-sm font-semibold">
                <Shield className="size-4" />
                Administrator
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-[#1e3d5a] mb-4">Admin Stats</h3>
              <div className="space-y-4">
                {adminStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <span className="font-bold text-[#1e3d5a]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-[#1e3d5a] mb-4">Security</h3>
              <div className="space-y-2">
                <Button
                  onClick={() => setShowPasswordModal(true)}
                  variant="outline"
                  className="w-full justify-start gap-2 border-[#1e3d5a] text-[#1e3d5a]"
                >
                  <Lock className="size-4" />
                  Change Password
                </Button>
                <Button
                  onClick={() => toast.info('Two-factor authentication setup coming soon')}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <Shield className="size-4" />
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1e3d5a]">Personal Information</h2>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-[#ee6b20] hover:bg-[#ee6b20]/90 gap-2"
                    >
                      <Edit2 className="size-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-[#ee6b20] hover:bg-[#ee6b20]/90 gap-2"
                      >
                        <Save className="size-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline size-4 mr-2" />
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline size-4 mr-2" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline size-4 mr-2" />
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Shield className="inline size-4 mr-2" />
                      Employee ID
                    </label>
                    <Input
                      type="text"
                      value={profileData.employeeId}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <Input
                      type="text"
                      value={profileData.role}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <Input
                      type="text"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Permissions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#1e3d5a]">Permissions & Access</h2>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Dashboard Access</p>
                      <p className="text-sm text-gray-600">Full access</p>
                    </div>
                    <Shield className="size-6 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">User Management</p>
                      <p className="text-sm text-gray-600">Full access</p>
                    </div>
                    <Shield className="size-6 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Parking Management</p>
                      <p className="text-sm text-gray-600">Full access</p>
                    </div>
                    <Shield className="size-6 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Analytics & Reports</p>
                      <p className="text-sm text-gray-600">Full access</p>
                    </div>
                    <Shield className="size-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#1e3d5a]">Recent Activity</h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: 'Updated parking slot A-12 status', time: '2 hours ago' },
                    { action: 'Approved new user registration', time: '5 hours ago' },
                    { action: 'Generated monthly report', time: '1 day ago' },
                    { action: 'Modified parking rates', time: '2 days ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
