/**
 * PakiPark Frontend API Client
 * Next.js version — uses NEXT_PUBLIC_API_URL env var
 */

const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, { ...options, headers: { ...this.getHeaders(), ...options.headers } });
      let data: any;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        if (!response.ok) {
          throw new Error(text === 'Internal Server Error' ? 'The server is temporarily unavailable. It might be restarting.' : text || 'An unexpected error occurred.');
        }
        data = { success: true }; // Fallback for 2xx empty responses
      }

      if (!response.ok || (data && data.success === false)) {
        // Global 401 handler: log out user ONLY if it wasn't the login endpoint itself failing
        if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/login')) {
          ['authToken', 'userRole', 'userName', 'userEmail', 'userId', 'userPhone', 'userProfilePic'].forEach(k => localStorage.removeItem(k));
          window.location.href = '/login';
        }
        throw new Error(data.message || `Request failed`);
      }
      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot reach the PakiPark API server. Make sure the backend is running: cd src/Backend && npm run dev');
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'GET' }); }
  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); }
  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }); }
  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }); }
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'DELETE' }); }
  async deleteWithBody<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }); }
}

export const api = new ApiClient(API_BASE_URL);
export type { ApiResponse };
