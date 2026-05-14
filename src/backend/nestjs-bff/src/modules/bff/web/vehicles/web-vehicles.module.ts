import { Module } from '@nestjs/common';
import { WebVehiclesController } from './web-vehicles.controller';
import { WebVehiclesService } from './web-vehicles.service';
import { TellerModule } from '../../../domain/teller/teller.module';
import { ReservationModule } from '../../../domain/reservation/reservation.module';

@Module({
  imports: [TellerModule, ReservationModule],
  controllers: [WebVehiclesController],
  providers: [WebVehiclesService],
})
export class WebVehiclesModule {}
