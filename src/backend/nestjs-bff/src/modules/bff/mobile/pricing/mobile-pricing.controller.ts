import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Public } from '../../../../decorators/public.decorator';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { WebPricingService } from '../../web/pricing/web-pricing.service';

/**
 * Mobile BFF — Pricing controller
 * Prefix: /pakipark/mobile
 * Reuses WebPricingService — same calculation logic.
 *
 * CONTRACT:
 *   POST   /pakipark/mobile/pricing/calculate   [public]
 */
@UseGuards(JwtAuthGuard)
@Controller('pakipark/mobile/pricing')
export class MobilePricingController {
  constructor(private readonly pricing: WebPricingService) {}

  @Post('calculate')
  @Public()
  calculate(
    @Body()
    body: {
      locationId: string;
      rateType: 'hourly' | 'daily' | 'monthly';
      duration: number;
      applyPwdDiscount: boolean;
      applySeniorDiscount: boolean;
    },
  ) {
    return this.pricing.calculate(body);
  }
}
