import { Module } from '@nestjs/common';
import { TellerService } from './teller.service';
import { SupabaseModule } from '../../shared/supabase/supabase.module';
import { SharedAuthModule } from '../../shared/auth/shared-auth.module';

@Module({
  imports: [SupabaseModule, SharedAuthModule],
  providers: [TellerService],
  exports: [TellerService],
})
export class TellerModule {}
