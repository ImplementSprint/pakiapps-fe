import { Module } from '@nestjs/common';
import { MobileBookingsController } from './bookings/mobile-bookings.controller';
import { MobileLocationsController } from './locations/mobile-locations.controller';
import { MobileVehiclesController } from './vehicles/mobile-vehicles.controller';
import { MobileNotificationsController } from './notifications/mobile-notifications.controller';
import { MobilePricingController } from './pricing/mobile-pricing.controller';
import { ReservationModule } from '../../domain/reservation/reservation.module';
import { ParkingLotModule } from '../../domain/parking-lot/parking-lot.module';
import { PartnerModule } from '../../domain/partner/partner.module';
import { TellerModule } from '../../domain/teller/teller.module';
import { SharedNotificationsModule } from '../../shared/notifications/shared-notifications.module';
import { WebPricingModule } from '../web/pricing/web-pricing.module';

@Module({
  imports: [
    ReservationModule,
    ParkingLotModule,
    PartnerModule,
    TellerModule,
    SharedNotificationsModule,
    WebPricingModule,   // reuses the same pricing service
  ],
  controllers: [
    MobileBookingsController,
    MobileLocationsController,
    MobileVehiclesController,
    MobileNotificationsController,
    MobilePricingController,
  ],
})
export class MobileBffModule {}
