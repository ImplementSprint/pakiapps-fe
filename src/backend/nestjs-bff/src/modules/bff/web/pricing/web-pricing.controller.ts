import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Public } from '../../../../decorators/public.decorator';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { WebPricingService } from './web-pricing.service';

/**
 * Web BFF — Pricing controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   POST   /pakipark/web/pricing/calculate   [public]
 */
@UseGuards(JwtAuthGuard)
@Controller('pakipark/web/pricing')
export class WebPricingController {
  constructor(private readonly pricingService: WebPricingService) {}

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
    return this.pricingService.calculate(body);
  }
}
