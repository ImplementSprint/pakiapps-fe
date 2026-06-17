export type OperatorStatus = 'active' | 'limited' | 'inactive' | 'suspended' | 'deactivated';
export type OperatorAccountStanding = 'active' | 'suspended' | 'deactivated';

export interface BinCapacity {
  totalBins: number;
  occupiedBins: number;
  reservedBins: number;
  availableBins: number;
  utilizationRate: number;
}

export interface DropOffHistoryItem {
  id: string;
  date: string;
  parcelsReceived: number;
  parcelsReleased: number;
  exceptions: number;
  status: 'Completed' | 'In Progress' | 'Issue Logged';
}

export interface OperatorRatingItem {
  date: string;
  customer: string;
  rating: number;
  comment: string;
}

export interface DropOffOperatorRecord {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  region: string;
  address: string;
  status: OperatorStatus;
  accountStanding: OperatorAccountStanding;
  accountActionReason?: string;
  accountActionDate?: string;
  parcelsHandled: number;
  pendingParcels: number;
  lastActive: string;
  operatingHours: string;
  averageRating: number;
  issueRate: number;
  successfulHandoffRate: number;
  binCapacity: BinCapacity;
  dropOffHistory: DropOffHistoryItem[];
  customerRatings: OperatorRatingItem[];
}

export const MOCK_OPERATORS: DropOffOperatorRecord[] = [
  {
    id: 'DOP-001',
    businessName: 'Mabuhay Express Drop-Off',
    ownerName: 'Maria Lourdes Santos',
    email: 'maria.santos@mabuhayexpress.ph',
    phone: '+63 917 482 1039',
    location: 'Makati City',
    region: 'Metro Manila',
    address: 'Kalayaan Avenue, Barangay Poblacion, Makati City',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 3284,
    pendingParcels: 18,
    lastActive: 'Active now',
    operatingHours: '8:00 AM - 8:00 PM',
    averageRating: 4.8,
    issueRate: 1.7,
    successfulHandoffRate: 98.4,
    binCapacity: {
      totalBins: 64,
      occupiedBins: 41,
      reservedBins: 7,
      availableBins: 16,
      utilizationRate: 75,
    },
    dropOffHistory: [
      { id: 'DOH-2411', date: '2026-05-14', parcelsReceived: 96, parcelsReleased: 91, exceptions: 1, status: 'Completed' },
      { id: 'DOH-2402', date: '2026-05-13', parcelsReceived: 88, parcelsReleased: 84, exceptions: 0, status: 'Completed' },
      { id: 'DOH-2398', date: '2026-05-12', parcelsReceived: 103, parcelsReleased: 97, exceptions: 2, status: 'Completed' },
      { id: 'DOH-2387', date: '2026-05-11', parcelsReceived: 72, parcelsReleased: 69, exceptions: 0, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'R. Manalo', rating: 5.0, comment: 'Counter staff processed the parcel quickly.' },
      { date: '2026-05-13', customer: 'J. Garcia', rating: 4.7, comment: 'Clean drop-off area and clear handoff process.' },
      { date: '2026-05-11', customer: 'A. Villamor', rating: 4.8, comment: 'Smooth pickup confirmation.' },
    ],
  },
  {
    id: 'DOP-002',
    businessName: 'Cebu Parcel Hub',
    ownerName: 'Roberto Lim',
    email: 'roberto.lim@cebuhub.ph',
    phone: '+63 922 641 5590',
    location: 'Cebu City',
    region: 'Central Visayas',
    address: 'F. Ramos Street, Barangay Cogon Ramos, Cebu City',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 2871,
    pendingParcels: 12,
    lastActive: '9 mins ago',
    operatingHours: '9:00 AM - 7:00 PM',
    averageRating: 4.6,
    issueRate: 2.1,
    successfulHandoffRate: 97.6,
    binCapacity: {
      totalBins: 58,
      occupiedBins: 35,
      reservedBins: 6,
      availableBins: 17,
      utilizationRate: 71,
    },
    dropOffHistory: [
      { id: 'DOH-2354', date: '2026-05-14', parcelsReceived: 81, parcelsReleased: 78, exceptions: 1, status: 'Completed' },
      { id: 'DOH-2348', date: '2026-05-13', parcelsReceived: 77, parcelsReleased: 74, exceptions: 0, status: 'Completed' },
      { id: 'DOH-2336', date: '2026-05-12', parcelsReceived: 69, parcelsReleased: 64, exceptions: 1, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'K. Yu', rating: 4.8, comment: 'Fast acceptance and organized bins.' },
      { date: '2026-05-12', customer: 'M. Alinsonorin', rating: 4.5, comment: 'Good counter service during peak hours.' },
      { date: '2026-05-10', customer: 'T. Ramos', rating: 4.6, comment: 'Pickup notification was accurate.' },
    ],
  },
  {
    id: 'DOP-003',
    businessName: 'Davao QuickDrop Center',
    ownerName: 'Angela Dizon',
    email: 'angela.dizon@quickdropdavao.ph',
    phone: '+63 915 338 7742',
    location: 'Davao City',
    region: 'Davao Region',
    address: 'J.P. Laurel Avenue, Bajada, Davao City',
    status: 'limited',
    accountStanding: 'active',
    parcelsHandled: 1562,
    pendingParcels: 34,
    lastActive: '21 mins ago',
    operatingHours: '10:00 AM - 6:00 PM',
    averageRating: 4.2,
    issueRate: 5.4,
    successfulHandoffRate: 93.8,
    binCapacity: {
      totalBins: 42,
      occupiedBins: 33,
      reservedBins: 5,
      availableBins: 4,
      utilizationRate: 90,
    },
    dropOffHistory: [
      { id: 'DOH-2291', date: '2026-05-14', parcelsReceived: 64, parcelsReleased: 55, exceptions: 3, status: 'Issue Logged' },
      { id: 'DOH-2284', date: '2026-05-13', parcelsReceived: 58, parcelsReleased: 53, exceptions: 1, status: 'Completed' },
      { id: 'DOH-2279', date: '2026-05-12', parcelsReceived: 60, parcelsReleased: 49, exceptions: 2, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'N. Bautista', rating: 4.1, comment: 'Longer wait time, but staff was helpful.' },
      { date: '2026-05-13', customer: 'C. Tan', rating: 4.3, comment: 'Parcel was accepted and tracked properly.' },
      { date: '2026-05-11', customer: 'L. Moreno', rating: 4.2, comment: 'Busy counter during afternoon drop-off.' },
    ],
  },
  {
    id: 'DOP-004',
    businessName: 'Baguio Pine Drop-Off',
    ownerName: 'Elena Cruz',
    email: 'elena.cruz@pinedrop.ph',
    phone: '+63 918 775 0204',
    location: 'Baguio City',
    region: 'Cordillera',
    address: 'Lower Session Road, Barangay Salud Mitra, Baguio City',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 2047,
    pendingParcels: 9,
    lastActive: 'Active now',
    operatingHours: '8:30 AM - 7:30 PM',
    averageRating: 4.7,
    issueRate: 1.9,
    successfulHandoffRate: 98.1,
    binCapacity: {
      totalBins: 46,
      occupiedBins: 24,
      reservedBins: 5,
      availableBins: 17,
      utilizationRate: 63,
    },
    dropOffHistory: [
      { id: 'DOH-2268', date: '2026-05-14', parcelsReceived: 71, parcelsReleased: 70, exceptions: 0, status: 'Completed' },
      { id: 'DOH-2257', date: '2026-05-13', parcelsReceived: 68, parcelsReleased: 65, exceptions: 1, status: 'Completed' },
      { id: 'DOH-2244', date: '2026-05-12', parcelsReceived: 59, parcelsReleased: 57, exceptions: 0, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'D. Flores', rating: 4.9, comment: 'Quick counter handoff.' },
      { date: '2026-05-12', customer: 'P. Agustin', rating: 4.6, comment: 'Good handling and friendly staff.' },
      { date: '2026-05-10', customer: 'S. Lao', rating: 4.7, comment: 'Smooth drop-off experience.' },
    ],
  },
  {
    id: 'DOP-005',
    businessName: 'Quezon City Padala Point',
    ownerName: 'Mark Anthony Reyes',
    email: 'mark.reyes@padalapoint.ph',
    phone: '+63 927 551 6632',
    location: 'Quezon City',
    region: 'Metro Manila',
    address: 'Tomas Morato Avenue, Barangay Sacred Heart, Quezon City',
    status: 'inactive',
    accountStanding: 'active',
    parcelsHandled: 934,
    pendingParcels: 0,
    lastActive: '2 days ago',
    operatingHours: 'Closed',
    averageRating: 3.9,
    issueRate: 6.8,
    successfulHandoffRate: 91.2,
    binCapacity: {
      totalBins: 34,
      occupiedBins: 0,
      reservedBins: 0,
      availableBins: 34,
      utilizationRate: 0,
    },
    dropOffHistory: [
      { id: 'DOH-2191', date: '2026-05-11', parcelsReceived: 12, parcelsReleased: 12, exceptions: 0, status: 'Completed' },
      { id: 'DOH-2172', date: '2026-05-10', parcelsReceived: 17, parcelsReleased: 14, exceptions: 2, status: 'Issue Logged' },
      { id: 'DOH-2158', date: '2026-05-09', parcelsReceived: 19, parcelsReleased: 17, exceptions: 1, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-11', customer: 'B. Santiago', rating: 4.0, comment: 'Counter was closed earlier than posted.' },
      { date: '2026-05-10', customer: 'E. Ong', rating: 3.8, comment: 'Pickup confirmation took longer than expected.' },
      { date: '2026-05-09', customer: 'V. Pineda', rating: 3.9, comment: 'Staff assisted after queue delay.' },
    ],
  },
  {
    id: 'DOP-006',
    businessName: 'Lipa Express Counter',
    ownerName: 'Danica Mendoza',
    email: 'danica.mendoza@lipaexpress.ph',
    phone: '+63 916 204 8841',
    location: 'Lipa City',
    region: 'CALABARZON',
    address: 'C.M. Recto Avenue, Barangay 7, Lipa City',
    status: 'active',
    accountStanding: 'active',
    parcelsHandled: 1188,
    pendingParcels: 7,
    lastActive: '14 mins ago',
    operatingHours: '8:00 AM - 6:00 PM',
    averageRating: 4.5,
    issueRate: 2.8,
    successfulHandoffRate: 96.7,
    binCapacity: {
      totalBins: 40,
      occupiedBins: 21,
      reservedBins: 4,
      availableBins: 15,
      utilizationRate: 63,
    },
    dropOffHistory: [
      { id: 'DOH-2112', date: '2026-05-14', parcelsReceived: 47, parcelsReleased: 44, exceptions: 1, status: 'Completed' },
      { id: 'DOH-2104', date: '2026-05-13', parcelsReceived: 43, parcelsReleased: 41, exceptions: 0, status: 'Completed' },
      { id: 'DOH-2098', date: '2026-05-12', parcelsReceived: 51, parcelsReleased: 46, exceptions: 1, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-14', customer: 'H. Mercado', rating: 4.6, comment: 'Helpful counter staff.' },
      { date: '2026-05-12', customer: 'M. Reyes', rating: 4.4, comment: 'Drop-off was handled properly.' },
      { date: '2026-05-10', customer: 'A. Lazaro', rating: 4.5, comment: 'Good location and organized queue.' },
    ],
  },
  {
    id: 'DOP-007',
    businessName: 'Iloilo Bayanihan Logistics',
    ownerName: 'Paolo Villanueva',
    email: 'paolo.villanueva@bayanihanlogistics.ph',
    phone: '+63 920 114 8061',
    location: 'Iloilo City',
    region: 'Western Visayas',
    address: 'Commission Civil Street, Jaro, Iloilo City',
    status: 'suspended',
    accountStanding: 'suspended',
    accountActionReason: 'Repeated handoff exceptions and unresolved release delays.',
    accountActionDate: '2026-05-10',
    parcelsHandled: 721,
    pendingParcels: 0,
    lastActive: '5 days ago',
    operatingHours: 'Suspended',
    averageRating: 3.6,
    issueRate: 9.5,
    successfulHandoffRate: 88.9,
    binCapacity: {
      totalBins: 30,
      occupiedBins: 0,
      reservedBins: 0,
      availableBins: 30,
      utilizationRate: 0,
    },
    dropOffHistory: [
      { id: 'DOH-2044', date: '2026-05-09', parcelsReceived: 22, parcelsReleased: 18, exceptions: 3, status: 'Issue Logged' },
      { id: 'DOH-2031', date: '2026-05-08', parcelsReceived: 28, parcelsReleased: 21, exceptions: 4, status: 'Issue Logged' },
      { id: 'DOH-2020', date: '2026-05-07', parcelsReceived: 25, parcelsReleased: 20, exceptions: 2, status: 'Completed' },
    ],
    customerRatings: [
      { date: '2026-05-09', customer: 'G. Soriano', rating: 3.5, comment: 'Several parcels were delayed for release.' },
      { date: '2026-05-08', customer: 'F. Dela Cruz', rating: 3.7, comment: 'Counter staff located the parcel after escalation.' },
      { date: '2026-05-07', customer: 'J. Molina', rating: 3.6, comment: 'Pickup process needs tighter coordination.' },
    ],
  },
];
