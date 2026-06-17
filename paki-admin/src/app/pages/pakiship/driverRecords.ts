export type DriverStatus = 'available' | 'on_delivery' | 'offline' | 'suspended' | 'deactivated';
export type AccountStanding = 'active' | 'suspended' | 'deactivated';

export interface RatingHistoryItem {
  comment: string;
  customer: string;
  date: string;
  rating: number;
}

export interface DeliveryRecordItem {
  completedAt: string;
  destination: string;
  id: string;
  issue?: string;
  rating: number;
  region: string;
  status: 'Delivered' | 'Delayed' | 'Cancelled';
}

export interface DriverRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  city: string;
  rating: number;
  status: DriverStatus;
  accountStanding: AccountStanding;
  accountActionReason?: string;
  accountActionDate?: string;
  completedDeliveries: number;
  vehicleType: string;
  lastActive: string;
  onTimeRate: number;
  cancellationRate: number;
  acceptanceRate: number;
  averageDeliveryTime: string;
  ratingsHistory: RatingHistoryItem[];
  deliveryRecord: DeliveryRecordItem[];
}

export const MOCK_DRIVERS: DriverRecord[] = [
  {
    id: 'DRV-001',
    name: 'Maria Santos',
    email: 'maria.santos@pakiship.ph',
    phone: '+63 917 123 4567',
    region: 'Metro Manila',
    city: 'Makati City',
    rating: 4.9,
    status: 'available',
    accountStanding: 'active',
    completedDeliveries: 1248,
    vehicleType: 'Motorcycle',
    lastActive: '12 mins ago',
    onTimeRate: 97,
    cancellationRate: 1.2,
    acceptanceRate: 94,
    averageDeliveryTime: '28 mins',
    ratingsHistory: [
      { date: '2026-05-13', rating: 5.0, customer: 'Carla Mendoza', comment: 'Parcel arrived early and in good condition.' },
      { date: '2026-05-11', rating: 4.8, customer: 'Miguel Santos', comment: 'Professional handoff and quick update.' },
      { date: '2026-05-09', rating: 4.9, customer: 'Ana Reyes', comment: 'Smooth delivery experience.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-120', destination: 'Sampaloc, Manila', region: 'Metro Manila', completedAt: '2026-05-13', status: 'Delivered', rating: 5.0 },
      { id: 'PKS-2026-118', destination: 'Makati City', region: 'Metro Manila', completedAt: '2026-05-12', status: 'Delivered', rating: 4.8 },
      { id: 'PKS-2026-109', destination: 'Taguig City', region: 'Metro Manila', completedAt: '2026-05-10', status: 'Delivered', rating: 4.9 },
    ],
  },
  {
    id: 'DRV-002',
    name: 'Carlos Reyes',
    email: 'carlos.reyes@pakiship.ph',
    phone: '+63 918 234 5678',
    region: 'Central Visayas',
    city: 'Cebu City',
    rating: 4.7,
    status: 'on_delivery',
    accountStanding: 'active',
    completedDeliveries: 986,
    vehicleType: 'Van',
    lastActive: 'Active now',
    onTimeRate: 93,
    cancellationRate: 2.4,
    acceptanceRate: 91,
    averageDeliveryTime: '34 mins',
    ratingsHistory: [
      { date: '2026-05-14', rating: 4.7, customer: 'Noel Ramirez', comment: 'Handled a bulky package carefully.' },
      { date: '2026-05-12', rating: 4.6, customer: 'Leah Cortes', comment: 'Delivery was good, slight delay from traffic.' },
      { date: '2026-05-10', rating: 4.8, customer: 'Ramon Guevarra', comment: 'Clear updates from pickup to delivery.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-128', destination: 'Cebu City', region: 'Central Visayas', completedAt: '2026-05-14', status: 'Delivered', rating: 4.7 },
      { id: 'PKS-2026-122', destination: 'Mandaue City', region: 'Central Visayas', completedAt: '2026-05-12', status: 'Delayed', rating: 4.6, issue: 'Traffic delay noted.' },
      { id: 'PKS-2026-117', destination: 'Lapu-Lapu City', region: 'Central Visayas', completedAt: '2026-05-10', status: 'Delivered', rating: 4.8 },
    ],
  },
  {
    id: 'DRV-003',
    name: 'Angela Dizon',
    email: 'angela.dizon@pakiship.ph',
    phone: '+63 915 338 7742',
    region: 'Davao Region',
    city: 'Davao City',
    rating: 4.6,
    status: 'available',
    accountStanding: 'active',
    completedDeliveries: 812,
    vehicleType: 'Motorcycle',
    lastActive: '8 mins ago',
    onTimeRate: 92,
    cancellationRate: 2.1,
    acceptanceRate: 89,
    averageDeliveryTime: '31 mins',
    ratingsHistory: [
      { date: '2026-05-13', rating: 4.6, customer: 'Bea Flores', comment: 'Polite and reliable.' },
      { date: '2026-05-11', rating: 4.5, customer: 'Rico Tan', comment: 'Good delivery timing.' },
      { date: '2026-05-08', rating: 4.7, customer: 'Jessa Rivera', comment: 'Package was handled well.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-220', destination: 'Davao City', region: 'Davao Region', completedAt: '2026-05-13', status: 'Delivered', rating: 4.6 },
      { id: 'PKS-2026-214', destination: 'Bajada, Davao City', region: 'Davao Region', completedAt: '2026-05-11', status: 'Delivered', rating: 4.5 },
      { id: 'PKS-2026-207', destination: 'Matina, Davao City', region: 'Davao Region', completedAt: '2026-05-08', status: 'Delivered', rating: 4.7 },
    ],
  },
  {
    id: 'DRV-004',
    name: 'Paolo Villanueva',
    email: 'paolo.villanueva@pakiship.ph',
    phone: '+63 920 114 8061',
    region: 'Western Visayas',
    city: 'Iloilo City',
    rating: 4.3,
    status: 'offline',
    accountStanding: 'active',
    completedDeliveries: 541,
    vehicleType: 'Motorcycle',
    lastActive: '2 hrs ago',
    onTimeRate: 87,
    cancellationRate: 4.6,
    acceptanceRate: 83,
    averageDeliveryTime: '39 mins',
    ratingsHistory: [
      { date: '2026-05-12', rating: 4.3, customer: 'Monique Cruz', comment: 'Delivery completed but updates were late.' },
      { date: '2026-05-09', rating: 4.1, customer: 'Lester Villanueva', comment: 'Package arrived after expected window.' },
      { date: '2026-05-07', rating: 4.5, customer: 'Kristine Ramos', comment: 'Good service overall.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-222', destination: 'Jaro, Iloilo City', region: 'Western Visayas', completedAt: '2026-05-12', status: 'Delivered', rating: 4.3 },
      { id: 'PKS-2026-216', destination: 'Mandurriao, Iloilo City', region: 'Western Visayas', completedAt: '2026-05-09', status: 'Delayed', rating: 4.1, issue: 'Late status updates.' },
      { id: 'PKS-2026-211', destination: 'Molo, Iloilo City', region: 'Western Visayas', completedAt: '2026-05-07', status: 'Delivered', rating: 4.5 },
    ],
  },
  {
    id: 'DRV-005',
    name: 'Elena Cruz',
    email: 'elena.cruz@pakiship.ph',
    phone: '+63 918 775 0204',
    region: 'Cordillera',
    city: 'Baguio City',
    rating: 4.8,
    status: 'on_delivery',
    accountStanding: 'active',
    completedDeliveries: 1094,
    vehicleType: 'Van',
    lastActive: 'Active now',
    onTimeRate: 95,
    cancellationRate: 1.6,
    acceptanceRate: 92,
    averageDeliveryTime: '36 mins',
    ratingsHistory: [
      { date: '2026-05-14', rating: 4.8, customer: 'Patricia Ong', comment: 'Careful with fragile items.' },
      { date: '2026-05-12', rating: 4.9, customer: 'Nico Fernandez', comment: 'Excellent communication.' },
      { date: '2026-05-09', rating: 4.7, customer: 'Oscar Medina', comment: 'Fast pickup and delivery.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-151', destination: 'Baguio City', region: 'Cordillera', completedAt: '2026-05-14', status: 'Delivered', rating: 4.8 },
      { id: 'PKS-2026-145', destination: 'La Trinidad, Benguet', region: 'Cordillera', completedAt: '2026-05-12', status: 'Delivered', rating: 4.9 },
      { id: 'PKS-2026-139', destination: 'Session Road, Baguio City', region: 'Cordillera', completedAt: '2026-05-09', status: 'Delivered', rating: 4.7 },
    ],
  },
  {
    id: 'DRV-006',
    name: 'Mark Anthony Reyes',
    email: 'mark.reyes@pakiship.ph',
    phone: '+63 927 551 6632',
    region: 'Metro Manila',
    city: 'Quezon City',
    rating: 3.9,
    status: 'suspended',
    accountStanding: 'suspended',
    accountActionReason: 'Repeated late delivery windows and missed customer callbacks.',
    accountActionDate: '2026-05-11',
    completedDeliveries: 433,
    vehicleType: 'Motorcycle',
    lastActive: '3 days ago',
    onTimeRate: 78,
    cancellationRate: 9.8,
    acceptanceRate: 71,
    averageDeliveryTime: '47 mins',
    ratingsHistory: [
      { date: '2026-05-10', rating: 3.8, customer: 'Marco David', comment: 'Repeated delay and missed call.' },
      { date: '2026-05-07', rating: 4.0, customer: 'Rachel Co', comment: 'Delivery completed late.' },
      { date: '2026-05-04', rating: 3.9, customer: 'Kevin Yu', comment: 'Package was fine but communication was poor.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-149', destination: 'Quezon City', region: 'Metro Manila', completedAt: '2026-05-10', status: 'Delayed', rating: 3.8, issue: 'Missed customer callback.' },
      { id: 'PKS-2026-144', destination: 'Caloocan City', region: 'Metro Manila', completedAt: '2026-05-07', status: 'Delayed', rating: 4.0, issue: 'Late delivery window.' },
      { id: 'PKS-2026-140', destination: 'Manila City', region: 'Metro Manila', completedAt: '2026-05-04', status: 'Delivered', rating: 3.9 },
    ],
  },
  {
    id: 'DRV-007',
    name: 'Danica Mendoza',
    email: 'danica.mendoza@pakiship.ph',
    phone: '+63 916 204 8841',
    region: 'CALABARZON',
    city: 'Lipa City',
    rating: 4.5,
    status: 'available',
    accountStanding: 'active',
    completedDeliveries: 756,
    vehicleType: 'Motorcycle',
    lastActive: '22 mins ago',
    onTimeRate: 90,
    cancellationRate: 3.3,
    acceptanceRate: 88,
    averageDeliveryTime: '33 mins',
    ratingsHistory: [
      { date: '2026-05-13', rating: 4.5, customer: 'Janelle Reyes', comment: 'Reliable delivery.' },
      { date: '2026-05-10', rating: 4.4, customer: 'Harvey Lim', comment: 'Good handling and pickup.' },
      { date: '2026-05-06', rating: 4.6, customer: 'Grace Morales', comment: 'Arrived within estimated time.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-176', destination: 'Lipa City', region: 'CALABARZON', completedAt: '2026-05-13', status: 'Delivered', rating: 4.5 },
      { id: 'PKS-2026-171', destination: 'Batangas City', region: 'CALABARZON', completedAt: '2026-05-10', status: 'Delivered', rating: 4.4 },
      { id: 'PKS-2026-167', destination: 'Tanauan City', region: 'CALABARZON', completedAt: '2026-05-06', status: 'Delivered', rating: 4.6 },
    ],
  },
  {
    id: 'DRV-008',
    name: 'Roberto Lim',
    email: 'roberto.lim@pakiship.ph',
    phone: '+63 922 641 5590',
    region: 'Central Luzon',
    city: 'Angeles City',
    rating: 3.6,
    status: 'offline',
    accountStanding: 'active',
    completedDeliveries: 368,
    vehicleType: 'Van',
    lastActive: 'Yesterday',
    onTimeRate: 74,
    cancellationRate: 11.4,
    acceptanceRate: 69,
    averageDeliveryTime: '52 mins',
    ratingsHistory: [
      { date: '2026-05-09', rating: 3.5, customer: 'Daniel Torres', comment: 'Delivery was cancelled after delay.' },
      { date: '2026-05-06', rating: 3.7, customer: 'Faith Herrera', comment: 'Late handoff.' },
      { date: '2026-05-02', rating: 3.6, customer: 'Jose Navarro', comment: 'Needs better status updates.' },
    ],
    deliveryRecord: [
      { id: 'PKS-2026-181', destination: 'Angeles City', region: 'Central Luzon', completedAt: '2026-05-09', status: 'Cancelled', rating: 3.5, issue: 'Driver cancelled after pickup delay.' },
      { id: 'PKS-2026-173', destination: 'San Fernando, Pampanga', region: 'Central Luzon', completedAt: '2026-05-06', status: 'Delayed', rating: 3.7, issue: 'Late handoff.' },
      { id: 'PKS-2026-168', destination: 'Mabalacat City', region: 'Central Luzon', completedAt: '2026-05-02', status: 'Delivered', rating: 3.6 },
    ],
  },
];
