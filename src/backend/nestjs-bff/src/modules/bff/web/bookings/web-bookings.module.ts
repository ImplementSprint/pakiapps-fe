import { Module } from '@nestjs/common';
import { WebBookingsController } from './web-bookings.controller';
import { WebBookingsService } from './web-bookings.service';
import { ReservationModule } from '../../../domain/reservation/reservation.module';
import { PartnerModule } from '../../../domain/partner/partner.module';

@Module({
  imports: [ReservationModule, PartnerModule],
  controllers: [WebBookingsController],
  providers: [WebBookingsService],
})
export class WebBookingsModule {}
