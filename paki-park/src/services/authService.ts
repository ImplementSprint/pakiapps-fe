import { api } from '../lib/api';

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    if (!res.success) {
      throw new Error(res.message || 'Login failed');
    }
    const user = res.data;
    if (typeof window !== 'undefined' && user?.token) {
      localStorage.setItem('authToken',       user.token);
      localStorage.setItem('userRole',        user.role);
      localStorage.setItem('userFirstName',   user.firstName || '');
      localStorage.setItem('userLastName',    user.lastName  || '');
      localStorage.setItem('userName',        user.name || `${user.firstName} ${user.lastName}`.trim());
      localStorage.setItem('userIdentifier',  user.identifier || ''); // real phone or email
      localStorage.setItem('userEmail',       user.email || '');      // null for phone users
      localStorage.setItem('userPhone',       user.phone || '');      // null for email users
      localStorage.setItem('userId',          user._id);
      if (user.refreshToken) localStorage.setItem('refreshToken', user.refreshToken);
      if (user.profilePicture) localStorage.setItem('userProfilePic', user.profilePicture);
    }
    return user;
  },

  logout() {
    ['authToken', 'userRole', 'userName', 'userEmail', 'userId', 'userPhone', 'userProfilePic'].forEach(k => {
      if (typeof window !== 'undefined') localStorage.removeItem(k);
    });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  async register(data: { firstName: string; lastName: string; email?: string; phone?: string; password: string }) {
    const res = await api.post('/auth/register/customer', data);
    if (!res.success) {
      throw new Error(res.message || 'Registration failed');
    }
    return res.data;
  },

  getRole() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userRole');
  },

  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  },
};
