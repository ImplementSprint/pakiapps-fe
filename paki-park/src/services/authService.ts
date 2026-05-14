import { api } from '../lib/api';

export const authService = {
  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const user = res.data;
    if (typeof window !== 'undefined' && user?.token) {
      localStorage.setItem('authToken', user.token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userId', user._id);
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

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    const res = await api.post('/auth/register/customer', data);
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
