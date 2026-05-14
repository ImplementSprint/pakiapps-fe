import { Module } from '@nestjs/common';
import { WebSettingsController } from './web-settings.controller';
import { WebSettingsService } from './web-settings.service';
import { TellerModule } from '../../../domain/teller/teller.module';
import { PartnerModule } from '../../../domain/partner/partner.module';

@Module({
  imports: [TellerModule, PartnerModule],
  controllers: [WebSettingsController],
  providers: [WebSettingsService],
})
export class WebSettingsModule {}
