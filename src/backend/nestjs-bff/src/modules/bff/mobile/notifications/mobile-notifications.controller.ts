import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { SharedNotificationsService } from '../../../shared/notifications/shared-notifications.service';

/**
 * Mobile BFF — Notifications controller
 * Prefix: /pakipark/mobile
 *
 * CONTRACT:
 *   GET    /pakipark/mobile/notifications
 *   PATCH  /pakipark/mobile/notifications/:id/read
 */
@UseGuards(JwtAuthGuard)
@Controller('pakipark/mobile/notifications')
export class MobileNotificationsController {
  constructor(private readonly notifications: SharedNotificationsService) {}

  @Get()
  get(@Req() req: any) {
    return this.notifications.getForUser(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.notifications.markOneRead(id, req.user.sub);
  }
}
