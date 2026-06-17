import { VehicleType, DeliveryMode, ServiceOption, PRICING_CONFIG } from '../config/businessRules';

export interface PricingBreakdown {
  baseRate: number;
  distanceFee?: number;
  hopFee?: number;
  subtotal: number;
  surgeCharge: number;
  discount: number;
  vat: number;
  finalTotal: number;
}

export interface PricingInput {
  vehicleType: VehicleType;
  deliveryMode: DeliveryMode;
  serviceOption: ServiceOption;
  distanceKm?: number;
  hops?: number;
  isSurgeActive?: boolean;
  applyDiscount?: boolean;
  packageSize?: string;
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const {
    vehicleType,
    deliveryMode,
    distanceKm = 0,
    hops = 0,
    isSurgeActive = false,
    applyDiscount = false,
  } = input;

  // Base rate based on vehicle type
  let baseRate = 0;
  switch (vehicleType) {
    case VehicleType.MOTORCYCLE:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.MOTORCYCLE;
      break;
    case VehicleType.SEDAN:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.SEDAN;
      break;
    case VehicleType.SUV:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.SUV;
      break;
    case VehicleType.VAN:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.VAN;
      break;
    case VehicleType.TRUCK:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.TRUCK;
      break;
    case VehicleType.PUV_RELAY:
      baseRate = PRICING_CONFIG.VEHICLE_BASE_RATES.PUV_RELAY;
      break;
  }

  // Calculate distance or hop fees
  let distanceFee = 0;
  let hopFee = 0;

  if (deliveryMode === DeliveryMode.RELAY) {
    hopFee = hops * PRICING_CONFIG.HOP_RATE;
  } else {
    distanceFee = distanceKm * PRICING_CONFIG.DISTANCE_RATE_PER_KM;
  }

  // Subtotal
  const subtotal = baseRate + (distanceFee || hopFee);

  // Surge charge
  const surgeCharge = isSurgeActive ? subtotal * (PRICING_CONFIG.SURGE_MULTIPLIER - 1) : 0;

  // Discount
  const discount = applyDiscount ? subtotal * PRICING_CONFIG.DISCOUNT_RATE : 0;

  // Calculate pre-tax total
  const preTaxTotal = subtotal + surgeCharge - discount;

  // VAT
  const vat = preTaxTotal * PRICING_CONFIG.VAT_RATE;

  // Final total
  const finalTotal = preTaxTotal + vat;

  return {
    baseRate,
    distanceFee: deliveryMode !== DeliveryMode.RELAY ? distanceFee : undefined,
    hopFee: deliveryMode === DeliveryMode.RELAY ? hopFee : undefined,
    subtotal,
    surgeCharge,
    discount,
    vat,
    finalTotal: Math.round(finalTotal),
  };
}

// Helper function to check if current time is in surge hours
export function isSurgeHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  // Peak hours: 7-9 AM and 5-7 PM
  return (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
}

// Helper function to format price in PHP
export function formatPrice(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}
