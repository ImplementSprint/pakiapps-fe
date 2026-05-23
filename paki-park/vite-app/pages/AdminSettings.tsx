import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Bell,
  UserCog,
  Sliders,
  Save,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { settingsService } from '../services/settingsService';

interface AdminSettingsProps {
  activeSettingsPage: string | null;
  setActiveSettingsPage: (page: string | null) => void;
  parkingRates: any[];
  setParkingRates: (rates: any[]) => void;
  paymentMethods: any[];
  setPaymentMethods: (methods: any[]) => void;
  securitySettings: any;
  setSecuritySettings: (settings: any) => void;
  notificationSettings: any;
  setNotificationSettings: (settings: any) => void;
  adminUsers: any[];
  setAdminUsers: (users: any[]) => void;
  systemPreferences: any;
  setSystemPreferences: (prefs: any) => void;
  editingRate?: any;
  setEditingRate?: (rate: any) => void;
  showRateModal?: boolean;
  setShowRateModal?: (show: boolean) => void;
}

export function AdminSettings({
  activeSettingsPage,
  setActiveSettingsPage,
  parkingRates,
  setParkingRates,
  paymentMethods,
  setPaymentMethods,
  securitySettings,
  setSecuritySettings,
  notificationSettings,
  setNotificationSettings,
  adminUsers,
  setAdminUsers,
  systemPreferences,
  setSystemPreferences,
}: AdminSettingsProps) {
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  const [rateFormData, setRateFormData] = useState({
    vehicleType: '',
    hourlyRate: 0,
    dailyRate: 0,
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'Staff',
    status: 'Active',
  });

  // Fetch settings from API on mount
  useEffect(() => {
    settingsService.getParkingRates().then((data) => {
      if (data && data.length > 0) setParkingRates(data);
    }).catch(() => {});
    settingsService.getAdminUsers().then((data) => {
      if (data && data.length > 0) setAdminUsers(data);
    }).catch(() => {});
    settingsService.getSettings('security').then((data) => {
      if (data && Object.keys(data).length > 0) setSecuritySettings((prev: any) => ({ ...prev, ...data }));
    }).catch(() => {});
    settingsService.getSettings('notifications').then((data) => {
      if (data && Object.keys(data).length > 0) setNotificationSettings((prev: any) => ({ ...prev, ...data }));
    }).catch(() => {});
    settingsService.getSettings('system').then((data) => {
      if (data && Object.keys(data).length > 0) setSystemPreferences((prev: any) => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  // Parking Rates Handlers
  const handleAddRate = () => {
    setRateFormData({ vehicleType: '', hourlyRate: 0, dailyRate: 0 });
    setEditingRate(null);
    setShowRateModal(true);
  };

  const handleEditRate = (rate: any) => {
    setRateFormData(rate);
    setEditingRate(rate);
    setShowRateModal(true);
  };

  const handleSaveRate = async () => {
    if (!rateFormData.vehicleType || rateFormData.hourlyRate <= 0 || rateFormData.dailyRate <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    let updatedRates;
    if (editingRate) {
      try {
        if (editingRate._id) await settingsService.updateParkingRate(editingRate._id, rateFormData);
      } catch { /* fallback */ }
      updatedRates = parkingRates.map(r => (r.id || r._id) === (editingRate.id || editingRate._id) ? { ...editingRate, ...rateFormData } : r);
      toast.success('Parking rate updated successfully');
    } else {
      const newRate = { ...rateFormData, id: Date.now() };
      updatedRates = [...parkingRates, newRate];
      toast.success('Parking rate added successfully');
    }

    setParkingRates(updatedRates);
    localStorage.setItem('parkingRates', JSON.stringify(updatedRates));
    setShowRateModal(false);
  };

  const handleDeleteRate = (id: number | string) => {
    const updatedRates = parkingRates.filter(r => (r.id || r._id) !== id);
    setParkingRates(updatedRates);
    localStorage.setItem('parkingRates', JSON.stringify(updatedRates));
    toast.success('Parking rate deleted successfully');
  };

  const togglePaymentMethod = (id: number) => {
    const updatedMethods = paymentMethods.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    setPaymentMethods(updatedMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    toast.success('Payment method updated');
  };

  const handleSecuritySave = async () => {
    try { await settingsService.updateSettings('security', securitySettings); } catch {}
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
    toast.success('Security settings saved successfully');
  };

  const handleNotificationSave = async () => {
    try { await settingsService.updateSettings('notifications', notificationSettings); } catch {}
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    toast.success('Notification settings saved successfully');
  };

  const handleAddUser = () => {
    setUserFormData({ name: '', email: '', role: 'Staff', status: 'Active' });
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setUserFormData(user);
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userFormData.name || !userFormData.email) {
      toast.error('Please fill in all fields');
      return;
    }
    let updatedUsers;
    if (editingUser) {
      updatedUsers = adminUsers.map(u => (u.id || u._id) === (editingUser.id || editingUser._id) ? { ...editingUser, ...userFormData } : u);
      toast.success('User updated successfully');
    } else {
      const newUser = { ...userFormData, id: Date.now() };
      updatedUsers = [...adminUsers, newUser];
      toast.success('User added successfully');
    }
    setAdminUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: number | string) => {
    const updatedUsers = adminUsers.filter(u => (u.id || u._id) !== id);
    setAdminUsers(updatedUsers);
    localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
    toast.success('User deleted successfully');
  };

  const handlePreferencesSave = async () => {
    try { await settingsService.updateSettings('system', systemPreferences); } catch {}
    localStorage.setItem('systemPreferences', JSON.stringify(systemPreferences));
    toast.success('System preferences saved successfully');
  };

  const settingsMenuItems = [
    { id: 'rates', label: 'Parking Rates', icon: DollarSign, desc: 'Configure hourly and daily parking rates' },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard, desc: 'Manage accepted payment methods' },
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Authentication and access control' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email, SMS, and push notification settings' },
    { id: 'users', label: 'User Management', icon: UserCog, desc: 'Manage admin users and roles' },
    { id: 'preferences', label: 'System Preferences', icon: Sliders, desc: 'General system configuration' },
  ];

  return (
    <>
      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#1e3d5a] mb-4">
              {editingRate ? 'Edit Parking Rate' : 'Add Parking Rate'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <Input type="text" placeholder="e.g., Sedan, SUV, Motorcycle" value={rateFormData.vehicleType} onChange={(e) => setRateFormData({ ...rateFormData, vehicleType: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (₱)</label>
                <Input type="number" value={rateFormData.hourlyRate} onChange={(e) => setRateFormData({ ...rateFormData, hourlyRate: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (₱)</label>
                <Input type="number" value={rateFormData.dailyRate} onChange={(e) => setRateFormData({ ...rateFormData, dailyRate: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowRateModal(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSaveRate} className="flex-1 bg-[#ee6b20] hover:bg-[#ee6b20]/90">{editingRate ? 'Update' : 'Add Rate'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#1e3d5a] mb-4">
              {editingUser ? 'Edit User' : 'Add Admin User'}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <Input type="text" value={userFormData.name} onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input type="email" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                  <option value="Super Admin">Super Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowUserModal(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleSaveUser} className="flex-1 bg-[#ee6b20] hover:bg-[#ee6b20]/90">{editingUser ? 'Update' : 'Add User'}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {activeSettingsPage && (
            <button onClick={() => setActiveSettingsPage(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="size-5 text-[#1e3d5a]" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[#1e3d5a]">
              {activeSettingsPage ? settingsMenuItems.find(i => i.id === activeSettingsPage)?.label : 'Settings'}
            </h1>
            <p className="text-gray-600">
              {activeSettingsPage ? settingsMenuItems.find(i => i.id === activeSettingsPage)?.desc : 'Manage your parking facility configuration'}
            </p>
          </div>
        </div>

        {/* Settings Menu */}
        {!activeSettingsPage && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settingsMenuItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSettingsPage(item.id)} className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md hover:border-[#ee6b20]/30 border-2 border-transparent transition-all group">
                <div className="size-12 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#ee6b20]/10 transition-colors">
                  <item.icon className="size-6 text-[#1e3d5a] group-hover:text-[#ee6b20] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#1e3d5a] mb-1">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Parking Rates */}
        {activeSettingsPage === 'rates' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e3d5a]">Parking Rate Configuration</h3>
              <Button onClick={handleAddRate} className="bg-[#ee6b20] hover:bg-[#ee6b20]/90 gap-2"><Plus className="size-4" /> Add Rate</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehicle Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Daily Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parkingRates.map((rate) => (
                    <tr key={rate.id || rate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-[#1e3d5a]">{rate.vehicleType}</td>
                      <td className="px-6 py-4 text-[#ee6b20] font-semibold">₱{rate.hourlyRate}</td>
                      <td className="px-6 py-4 text-gray-600">₱{rate.dailyRate}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditRate(rate)} className="gap-1"><Edit className="size-3" /> Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRate(rate.id || rate._id)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="size-3" /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        {activeSettingsPage === 'payment' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#1e3d5a] mb-6">Payment Methods</h3>
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-[#1e3d5a]">{method.name}</p>
                    <p className="text-sm text-gray-500">Processing Fee: {method.processingFee}</p>
                  </div>
                  <button onClick={() => togglePaymentMethod(method.id)} className={`w-12 h-6 rounded-full transition-colors relative ${method.enabled ? 'bg-[#ee6b20]' : 'bg-gray-300'}`}>
                    <div className={`size-5 bg-white rounded-full absolute top-0.5 transition-transform ${method.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        {activeSettingsPage === 'security' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#1e3d5a] mb-6">Security Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div><p className="font-semibold text-[#1e3d5a]">Two-Factor Authentication</p><p className="text-sm text-gray-500">Require 2FA for admin login</p></div>
                <button onClick={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })} className={`w-12 h-6 rounded-full transition-colors relative ${securitySettings.twoFactorAuth ? 'bg-[#ee6b20]' : 'bg-gray-300'}`}>
                  <div className={`size-5 bg-white rounded-full absolute top-0.5 transition-transform ${securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label><Input type="number" value={securitySettings.sessionTimeout} onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label><Input type="number" value={securitySettings.passwordExpiry} onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: Number(e.target.value) })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label><Input type="number" value={securitySettings.loginAttempts} onChange={(e) => setSecuritySettings({ ...securitySettings, loginAttempts: Number(e.target.value) })} /></div>
              <Button onClick={handleSecuritySave} className="bg-[#1e3d5a] hover:bg-[#1e3d5a]/90 gap-2"><Save className="size-4" /> Save Security Settings</Button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeSettingsPage === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#1e3d5a] mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-[#1e3d5a] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <button onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })} className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-[#ee6b20]' : 'bg-gray-300'}`}>
                    <div className={`size-5 bg-white rounded-full absolute top-0.5 transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              <Button onClick={handleNotificationSave} className="bg-[#1e3d5a] hover:bg-[#1e3d5a]/90 gap-2"><Save className="size-4" /> Save Notification Settings</Button>
            </div>
          </div>
        )}

        {/* User Management */}
        {activeSettingsPage === 'users' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1e3d5a]">Admin Users</h3>
              <Button onClick={handleAddUser} className="bg-[#ee6b20] hover:bg-[#ee6b20]/90 gap-2"><Plus className="size-4" /> Add User</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminUsers.map((user) => (
                    <tr key={user.id || user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-[#1e3d5a]">{user.name}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1e3d5a]/10 text-[#1e3d5a]">{user.role}</span></td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">{user.status || 'Active'}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} className="gap-1"><Edit className="size-3" /> Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user.id || user._id)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="size-3" /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Preferences */}
        {activeSettingsPage === 'preferences' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#1e3d5a] mb-6">System Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Parking Facility Name</label><Input value={systemPreferences.parkingName} onChange={(e) => setSystemPreferences({ ...systemPreferences, parkingName: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label><Input value={systemPreferences.timezone} onChange={(e) => setSystemPreferences({ ...systemPreferences, timezone: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Currency</label><Input value={systemPreferences.currency} onChange={(e) => setSystemPreferences({ ...systemPreferences, currency: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label><Input value={systemPreferences.operatingHours} onChange={(e) => setSystemPreferences({ ...systemPreferences, operatingHours: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Max Booking Days Ahead</label><Input type="number" value={systemPreferences.maxBookingDays} onChange={(e) => setSystemPreferences({ ...systemPreferences, maxBookingDays: Number(e.target.value) })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Window (hours)</label><Input type="number" value={systemPreferences.cancellationWindow} onChange={(e) => setSystemPreferences({ ...systemPreferences, cancellationWindow: Number(e.target.value) })} /></div>
            </div>
            <div className="mt-6">
              <Button onClick={handlePreferencesSave} className="bg-[#1e3d5a] hover:bg-[#1e3d5a]/90 gap-2"><Save className="size-4" /> Save Preferences</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
