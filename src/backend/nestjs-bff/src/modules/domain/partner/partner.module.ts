import { Module } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { SupabaseModule } from '../../shared/supabase/supabase.module';
import { SharedAuthModule } from '../../shared/auth/shared-auth.module';

@Module({
  imports: [SupabaseModule, SharedAuthModule],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
