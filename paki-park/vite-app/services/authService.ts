import { api } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface RegisterAdminPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  accessCode: string;
  address?: { street: string; city: string; province: string };
  dateOfBirth?: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'teller' | 'business_partner';
  profilePicture?: string | null;
  token: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await api.post<AuthUser>('/auth/login', payload);
    if (res.data) {
      localStorage.setItem('authToken',  res.data.token);
      localStorage.setItem('userRole',   res.data.role);
      localStorage.setItem('userName',   res.data.name);
      localStorage.setItem('userEmail',  res.data.email);
      localStorage.setItem('userId',     res.data._id);
      if (res.data.profilePicture) {
        localStorage.setItem('userProfilePic', res.data.profilePicture);
      }
    }
    return res.data!;
  },

  async registerCustomer(payload: RegisterCustomerPayload): Promise<AuthUser> {
    const res = await api.post<AuthUser>('/auth/register/customer', payload);
    if (res.data) {
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('userRole',  res.data.role);
      localStorage.setItem('userName',  res.data.name);
      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('userId',    res.data._id);
    }
    return res.data!;
  },

  async registerAdmin(payload: RegisterAdminPayload): Promise<AuthUser> {
    const res = await api.post<AuthUser>('/auth/register/admin', payload);
    if (res.data) {
      localStorage.setItem('authToken', res.data.token);
      localStorage.setItem('userRole',  res.data.role);
      localStorage.setItem('userName',  res.data.name);
      localStorage.setItem('userEmail', res.data.email);
      localStorage.setItem('userId',    res.data._id);
    }
    return res.data!;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    // Clear every auth-related key so no session data leaks after sign-out
    const keysToRemove = [
      'authToken',
      'userRole',
      'userName',
      'userEmail',
      'userId',
      'userPhone',
      'userProfilePic',
      'adminProfilePicture',
      'customerProfilePicture',
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Hard redirect to /login so React Router re-mounts fresh with no stale state
    window.location.replace('/login');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  getRole(): string | null {
    return localStorage.getItem('userRole');
  },
};