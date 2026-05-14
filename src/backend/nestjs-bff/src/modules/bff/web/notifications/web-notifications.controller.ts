import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { WebNotificationsService } from './web-notifications.service';

/**
 * Web BFF — Notifications controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   GET    /pakipark/web/notifications              [customer|partner|teller]
 *   PATCH  /pakipark/web/notifications/:id/read    [customer|partner|teller]
 *   PATCH  /pakipark/web/notifications/read-all    [customer|partner|teller]
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web/notifications')
export class WebNotificationsController {
  constructor(private readonly notificationsService: WebNotificationsService) {}

  @Get()
  getNotifications(@Req() req: any) {
    return this.notificationsService.getNotifications(req.user.sub);
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markOneRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markOneRead(id, req.user.sub);
  }
}
