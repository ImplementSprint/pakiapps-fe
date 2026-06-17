// Vehicle Types Enum
export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  SEDAN = 'sedan',
  SUV = 'suv',
  VAN = 'van',
  TRUCK = 'truck',
  PUV_RELAY = 'puv_relay',
}

// Delivery Mode Enum
export enum DeliveryMode {
  DIRECT = 'direct',
  RELAY = 'relay',
  DROPOFF = 'dropoff',
}

// Service Option Enum
export enum ServiceOption {
  CHEAP = 'cheap',
  FAST = 'fast',
  BUSINESS = 'business',
}

// Pricing Configuration
export const PRICING_CONFIG = {
  VEHICLE_BASE_RATES: {
    MOTORCYCLE: 30,
    SEDAN: 50,
    SUV: 70,
    VAN: 100,
    TRUCK: 150,
    PUV_RELAY: 15,
  },
  DISTANCE_RATE_PER_KM: 8,
  HOP_RATE: 12,
  SURGE_MULTIPLIER: 1.5,
  DISCOUNT_RATE: 0.1,
  VAT_RATE: 0.12,
  PARCEL_MULTIPLIER: {
    1: 1.0,
    2: 1.05,
    3: 1.1,
    default: 1.15,
  },
};

// Service Branding
export const SERVICE_BRANDING = {
  CHEAP: {
    name: 'PakiShare',
    description: 'Shared relay service',
    tagline: 'Affordable multi-hop delivery',
  },
  FAST: {
    name: 'PakiExpress',
    description: 'Direct door-to-door',
    tagline: 'Fast and reliable',
  },
  BUSINESS: {
    name: 'PakiBusiness',
    description: 'Bulk delivery discount',
    tagline: 'For businesses',
  },
};

// Drop-off Points
export interface DropOffPoint {
  id: string;
  name: string;
  address: string;
  hours: string;
  distanceKm: number;
  coordinates: { lat: number; lng: number };
}

export const DROP_OFF_POINTS: DropOffPoint[] = [
  {
    id: 'dp1',
    name: 'PakiSHIP Hub - Makati',
    address: 'Ayala Ave, Makati City',
    hours: '8:00 AM - 8:00 PM',
    distanceKm: 2.5,
    coordinates: { lat: 14.5547, lng: 121.0244 },
  },
  {
    id: 'dp2',
    name: 'PakiSHIP Hub - BGC',
    address: 'Bonifacio Global City, Taguig',
    hours: '7:00 AM - 9:00 PM',
    distanceKm: 3.2,
    coordinates: { lat: 14.5515, lng: 121.0475 },
  },
  {
    id: 'dp3',
    name: 'PakiSHIP Hub - Ortigas',
    address: 'Ortigas Center, Pasig City',
    hours: '9:00 AM - 7:00 PM',
    distanceKm: 4.1,
    coordinates: { lat: 14.5866, lng: 121.0618 },
  },
];
