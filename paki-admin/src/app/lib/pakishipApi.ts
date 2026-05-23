export type ShipmentStatus = 'In Transit' | 'Pending' | 'Delivered' | 'Cancelled';

export interface PakiShipProfile {
  address: string;
  adminId: string;
  dob: string;
  email: string;
  lastLogin: string;
  name: string;
  phone: string;
  profilePicture: string | null;
  role: 'Admin';
  updatedAt: string;
}

export interface ShipmentStatusHistoryItem {
  id: string;
  fromStatus: ShipmentStatus;
  reason: string;
  timestamp: string;
  toStatus: ShipmentStatus;
  updatedBy: string;
}

export interface ShipmentRecord {
  id: string;
  store: string;
  sender: string;
  receiver: string;
  location: string;
  destination: string;
  quantity: string;
  amount: string;
  status: ShipmentStatus;
  driver: string;
  eta: string;
  date: string;
  statusHistory: ShipmentStatusHistoryItem[];
}

export interface ShipmentListResponse {
  data: ShipmentRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_PAKISHIP_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getPakiShipProfile() {
  return request<PakiShipProfile>('/pakiship/profile');
}

export function updatePakiShipProfile(profile: Pick<PakiShipProfile, 'address' | 'dob' | 'email' | 'name' | 'phone'>) {
  return request<PakiShipProfile>('/pakiship/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}

export function updatePakiShipProfilePhoto(profilePicture: string) {
  return request<{ profilePicture: string | null; updatedAt: string }>('/pakiship/profile/photo', {
    method: 'PATCH',
    body: JSON.stringify({ profilePicture }),
  });
}

export function changePakiShipPassword(currentPassword: string, newPassword: string) {
  return request<{ message: string; updatedAt: string }>('/pakiship/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function getPakiShipShipments(params: {
  driver?: string;
  endDate?: string;
  limit?: number;
  page?: number;
  search?: string;
  startDate?: string;
  status?: ShipmentStatus | 'All';
}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });

  return request<ShipmentListResponse>(`/pakiship/shipments?${query.toString()}`);
}

export function getPakiShipShipment(id: string) {
  return request<ShipmentRecord>(`/pakiship/shipments/${encodeURIComponent(id)}`);
}

export function getPakiShipDrivers() {
  return request<{ data: string[] }>('/pakiship/shipments/drivers');
}

export function updatePakiShipShipmentStatus(
  id: string,
  payload: {
    reason: string;
    status: ShipmentStatus;
    updatedBy?: string;
  },
) {
  return request<ShipmentRecord>(`/pakiship/shipments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
