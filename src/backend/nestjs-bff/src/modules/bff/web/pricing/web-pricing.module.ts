import { Module } from '@nestjs/common';
import { WebPricingController } from './web-pricing.controller';
import { WebPricingService } from './web-pricing.service';
import { ParkingLotModule } from '../../../domain/parking-lot/parking-lot.module';
import { TellerModule } from '../../../domain/teller/teller.module';

@Module({
  imports: [ParkingLotModule, TellerModule],
  controllers: [WebPricingController],
  providers: [WebPricingService],
})
export class WebPricingModule {}
