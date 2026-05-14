import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SharedNotificationsService } from './shared-notifications.service';

@Module({
  imports: [HttpModule],
  providers: [SharedNotificationsService],
  exports: [SharedNotificationsService],
})
export class SharedNotificationsModule {}
