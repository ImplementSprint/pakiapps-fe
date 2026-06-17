import { DeliveryMode, ServiceOption, VehicleType } from "../../src/features/config/businessRules";
import { calculatePricing, formatPrice, isSurgeHours } from "../../src/features/utils/pricingCalculations";

describe("PakiShip pricing", () => {
  it("calculates direct delivery pricing", () => {
    const price = calculatePricing({
      vehicleType: VehicleType.MOTORCYCLE,
      deliveryMode: DeliveryMode.DIRECT,
      serviceOption: ServiceOption.FAST,
      distanceKm: 5
    });

    expect(price).toMatchObject({
      baseRate: 30,
      distanceFee: 40,
      subtotal: 70,
      surgeCharge: 0,
      discount: 0,
      finalTotal: 78
    });
  });

  it("calculates relay pricing with surge and discount", () => {
    const price = calculatePricing({
      vehicleType: VehicleType.PUV_RELAY,
      deliveryMode: DeliveryMode.RELAY,
      serviceOption: ServiceOption.CHEAP,
      hops: 2,
      isSurgeActive: true,
      applyDiscount: true
    });

    expect(price).toMatchObject({
      baseRate: 15,
      hopFee: 24,
      subtotal: 39,
      surgeCharge: 19.5,
      discount: 3.9000000000000004,
      finalTotal: 61
    });
  });

  it("detects configured surge hours", () => {
    expect(isSurgeHours(new Date("2026-06-12T08:00:00"))).toBe(true);
    expect(isSurgeHours(new Date("2026-06-12T18:00:00"))).toBe(true);
    expect(isSurgeHours(new Date("2026-06-12T14:00:00"))).toBe(false);
  });

  it("supports every vehicle base rate", () => {
    const expectedBaseRates: Record<VehicleType, number> = {
      [VehicleType.MOTORCYCLE]: 30,
      [VehicleType.SEDAN]: 50,
      [VehicleType.SUV]: 70,
      [VehicleType.VAN]: 100,
      [VehicleType.TRUCK]: 150,
      [VehicleType.PUV_RELAY]: 15
    };

    for (const [vehicleType, baseRate] of Object.entries(expectedBaseRates) as [VehicleType, number][]) {
      expect(calculatePricing({
        vehicleType,
        deliveryMode: DeliveryMode.DROPOFF,
        serviceOption: ServiceOption.BUSINESS
      }).baseRate).toBe(baseRate);
    }
  });

  it("formats prices with fixed cents", () => {
    expect(formatPrice(125)).toContain("125.00");
  });
});
