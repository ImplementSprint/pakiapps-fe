import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { SupabaseModule } from '../../shared/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
