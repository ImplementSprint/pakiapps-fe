/**
 * PakiPark Frontend API Client
 * 
 * Base API utility for communicating with the backend.
 * Set VITE_API_URL in your .env file (defaults to http://localhost:5000/api)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 (token expired / unauthorized) — clear ALL session keys
        if (response.status === 401) {
          const keysToRemove = [
            'authToken', 'userRole', 'userName', 'userEmail', 'userId',
            'userPhone', 'userProfilePic', 'adminProfilePicture', 'customerProfilePicture',
            'pakipark_bookings', 'pakipark_vehicles',
          ];
          keysToRemove.forEach((k) => localStorage.removeItem(k));
          window.location.href = '/login';
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      // If backend is unreachable, throw a clear error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Cannot reach the PakiPark API server. ' +
          'Make sure the backend is running: cd src/Backend && npm run dev  ' +
          '(It must have DATABASE_URL pointing to your Supabase project in src/Backend/.env)'
        );
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse };