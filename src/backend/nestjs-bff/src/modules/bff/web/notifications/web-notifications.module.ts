import { Module } from '@nestjs/common';
import { WebNotificationsController } from './web-notifications.controller';
import { WebNotificationsService } from './web-notifications.service';
import { SharedNotificationsModule } from '../../../shared/notifications/shared-notifications.module';

@Module({
  imports: [SharedNotificationsModule],
  controllers: [WebNotificationsController],
  providers: [WebNotificationsService],
})
export class WebNotificationsModule {}
