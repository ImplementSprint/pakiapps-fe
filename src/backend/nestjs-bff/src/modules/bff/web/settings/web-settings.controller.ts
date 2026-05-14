import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../../decorators/roles.decorator';
import { Public } from '../../../../decorators/public.decorator';
import { WebSettingsService } from './web-settings.service';

/**
 * Web BFF — Settings + Admin activity-logs controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   GET    /pakipark/web/settings                           [public]
 *   GET    /pakipark/web/admin/settings                    [admin]
 *   PATCH  /pakipark/web/admin/settings/:key               [admin]
 *   GET    /pakipark/web/admin/activity-logs               [admin|teller]
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web')
export class WebSettingsController {
  constructor(private readonly settingsService: WebSettingsService) {}

  @Get('settings')
  @Public()
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get('admin/settings')
  @Roles('admin')
  getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch('admin/settings/:key')
  @Roles('admin')
  updateSetting(@Param('key') key: string, @Body() body: { value: any }) {
    return this.settingsService.updateSetting(key, body.value);
  }

  @Get('admin/activity-logs')
  @Roles('admin', 'teller')
  getActivityLogs(
    @Query('targetType') targetType: 'booking' | 'location' | 'slot' | 'user',
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.settingsService.getActivityLogs({ targetType, page: +page, limit: +limit });
  }
}
