import { Injectable } from '@nestjs/common';
import { SharedNotificationsService } from '../../../shared/notifications/shared-notifications.service';

/**
 * Pass-through to shared-service notifications.
 * pakipark-service never reads/writes notifications schema directly.
 */
@Injectable()
export class WebNotificationsService {
  constructor(private readonly sharedNotifications: SharedNotificationsService) {}

  getNotifications(userId: string) {
    return this.sharedNotifications.getForUser(userId);
  }

  markAllRead(userId: string) {
    return this.sharedNotifications.markAllRead(userId);
  }

  markOneRead(notificationId: string, userId: string) {
    return this.sharedNotifications.markOneRead(notificationId, userId);
  }
}
