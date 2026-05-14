import { Module } from '@nestjs/common';
import { WebSlotsRatesController } from './web-slots-rates.controller';
import { WebSlotsService } from './web-slots.service';
import { WebRatesService } from '../rates/web-rates.service';
import { ParkingLotModule } from '../../../domain/parking-lot/parking-lot.module';

@Module({
  imports: [ParkingLotModule],
  controllers: [WebSlotsRatesController],
  providers: [WebSlotsService, WebRatesService],
})
export class WebSlotsRatesModule {}
