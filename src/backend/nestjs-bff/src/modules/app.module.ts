import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

// Guards
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

// Shared infrastructure
import { SupabaseModule } from './shared/supabase/supabase.module';
import { SharedAuthModule } from './shared/auth/shared-auth.module';
import { SharedPaymentModule } from './shared/payment/shared-payment.module';
import { SharedNotificationsModule } from './shared/notifications/shared-notifications.module';

// Domain modules
import { ReservationModule } from './domain/reservation/reservation.module';
import { ParkingLotModule } from './domain/parking-lot/parking-lot.module';
import { PartnerModule } from './domain/partner/partner.module';
import { TellerModule } from './domain/teller/teller.module';

// Web BFF modules
import { WebBookingsModule } from './bff/web/bookings/web-bookings.module';
import { WebLocationsModule } from './bff/web/locations/web-locations.module';
import { WebSlotsRatesModule } from './bff/web/slots/web-slots-rates.module';
import { WebVehiclesModule } from './bff/web/vehicles/web-vehicles.module';
import { WebNotificationsModule } from './bff/web/notifications/web-notifications.module';
import { WebPricingModule } from './bff/web/pricing/web-pricing.module';
import { WebSettingsModule } from './bff/web/settings/web-settings.module';

// Mobile BFF module
import { MobileBffModule } from './bff/mobile/mobile-bff.module';

@Module({
  imports: [
    // JWT — validates tokens locally using shared public key (RS256)
    JwtModule.register({
      secret: process.env.JWT_PUBLIC_KEY,   // RS256 public key from shared-service
      signOptions: { algorithm: 'RS256' },
      verifyOptions: { algorithms: ['RS256'] },
    }),

    // Shared infrastructure (global)
    SupabaseModule,
    SharedAuthModule,
    SharedPaymentModule,
    SharedNotificationsModule,

    // Domain
    ReservationModule,
    ParkingLotModule,
    PartnerModule,
    TellerModule,

    // Web BFF
    WebBookingsModule,
    WebLocationsModule,
    WebSlotsRatesModule,
    WebVehiclesModule,
    WebNotificationsModule,
    WebPricingModule,
    WebSettingsModule,

    // Mobile BFF
    MobileBffModule,
  ],
  providers: [
    // Apply guards globally — @Public() overrides for unauthenticated routes
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
