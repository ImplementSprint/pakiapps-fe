import { Injectable } from '@nestjs/common';
import { ParkingLotService } from '../../../domain/parking-lot/parking-lot.service';
import { TellerService } from '../../../domain/teller/teller.service';

/**
 * Pricing calculation — reads parking_rates + settings.
 * When ShoTeam pricing engine is ready, only this service changes.
 * Contract response shape stays the same.
 */
@Injectable()
export class WebPricingService {
  constructor(
    private readonly parkingLot: ParkingLotService,
    private readonly teller: TellerService,
  ) {}

  async calculate(input: {
    locationId: string;
    rateType: 'hourly' | 'daily' | 'monthly';
    duration: number;
    applyPwdDiscount: boolean;
    applySeniorDiscount: boolean;
  }) {
    const [rates, settings] = await Promise.all([
      this.parkingLot.getRates(input.locationId),
      this.teller.getPublicSettings(),
    ]);

    const matched = rates.find((r: any) => r.type === input.rateType);
    const baseRate: number = matched?.rate ?? 0;
    const subtotal = baseRate * input.duration;

    let discountRate = 0;
    let discountType: string | null = null;

    if (input.applyPwdDiscount) {
      discountRate = settings.pwdDiscountRate ?? 0;
      discountType = 'pwd';
    } else if (input.applySeniorDiscount) {
      discountRate = settings.seniorDiscountRate ?? 0;
      discountType = 'senior';
    }

    const discount = subtotal * discountRate;
    const finalTotal = subtotal - discount;

    return { baseRate, duration: input.duration, subtotal, discount, discountType, finalTotal };
  }
}
