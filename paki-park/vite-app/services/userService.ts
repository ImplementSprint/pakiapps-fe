import { api } from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  profilePicture?: string | null;
  address?: { street?: string; city?: string; province?: string };
  dateOfBirth?: string;
  createdAt?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: { street?: string; city?: string; province?: string };
  profilePicture?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const res = await api.get<UserProfile>('/users/profile');
    // Cache key fields locally for quick access (e.g. nav display name)
    if (res.data) {
      if (res.data.name)           localStorage.setItem('userName',     res.data.name);
      if (res.data.email)          localStorage.setItem('userEmail',    res.data.email);
      if (res.data.role)           localStorage.setItem('userRole',     res.data.role);
      if (res.data.profilePicture) localStorage.setItem('userProfilePic', res.data.profilePicture);
    }
    return res.data!;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const res = await api.put<UserProfile>('/users/profile', payload);
    if (res.data) {
      if (res.data.name)           localStorage.setItem('userName',     res.data.name);
      if (payload.phone)           localStorage.setItem('userPhone',    payload.phone);
      if (payload.profilePicture !== undefined) {
        const role = localStorage.getItem('userRole');
        const pic  = payload.profilePicture || '';
        localStorage.setItem('userProfilePic', pic);
        if (role === 'admin') {
          localStorage.setItem('adminProfilePicture', pic);
        } else {
          localStorage.setItem('customerProfilePicture', pic);
        }
      }
    }
    return res.data!;
  },

  async changePassword(payload: ChangePasswordPayload) {
    return await api.put('/users/password', payload);
  },
};
