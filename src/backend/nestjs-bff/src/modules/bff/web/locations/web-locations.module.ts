import { Module } from '@nestjs/common';
import { WebLocationsController } from './web-locations.controller';
import { WebLocationsService } from './web-locations.service';
import { ParkingLotModule } from '../../../domain/parking-lot/parking-lot.module';
import { PartnerModule } from '../../../domain/partner/partner.module';

@Module({
  imports: [ParkingLotModule, PartnerModule],
  controllers: [WebLocationsController],
  providers: [WebLocationsService],
})
export class WebLocationsModule {}
