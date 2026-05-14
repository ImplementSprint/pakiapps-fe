import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../../decorators/roles.decorator';
import { WebVehiclesService } from './web-vehicles.service';

/**
 * Web BFF — Vehicles + Teller verify controller
 * Prefix: /pakipark/web
 *
 * CONTRACT:
 *   GET    /pakipark/web/customer/vehicles              [customer]
 *   POST   /pakipark/web/customer/vehicles              [customer]
 *   PATCH  /pakipark/web/customer/vehicles/:vehicleId   [customer]
 *   DELETE /pakipark/web/customer/vehicles/:vehicleId   [customer]
 *   GET    /pakipark/web/teller/vehicles/verify         [teller]
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/web')
export class WebVehiclesController {
  constructor(private readonly vehiclesService: WebVehiclesService) {}

  @Get('customer/vehicles')
  @Roles('customer')
  getVehicles(@Req() req: any) {
    return this.vehiclesService.getVehicles(req.user.sub);
  }

  @Post('customer/vehicles')
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  addVehicle(
    @Body() body: {
      brand: string;
      model: string;
      plateNumber: string;
      type: string;
      color: string;
      isDefault: boolean;
    },
    @Req() req: any,
  ) {
    return this.vehiclesService.addVehicle(body, req.user.sub);
  }

  @Patch('customer/vehicles/:vehicleId')
  @Roles('customer')
  updateVehicle(
    @Param('vehicleId') vehicleId: string,
    @Body() body: { brand?: string; model?: string; type?: string; color?: string; isDefault?: boolean },
    @Req() req: any,
  ) {
    return this.vehiclesService.updateVehicle(vehicleId, body, req.user.sub);
  }

  @Delete('customer/vehicles/:vehicleId')
  @Roles('customer')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteVehicle(@Param('vehicleId') vehicleId: string, @Req() req: any) {
    return this.vehiclesService.deleteVehicle(vehicleId, req.user.sub);
  }

  /**
   * Teller plate lookup — web-only per contract.
   * Returns vehicle + hasActiveBooking + activeBooking snapshot.
   */
  @Get('teller/vehicles/verify')
  @Roles('teller')
  verifyVehicle(@Query('plateNumber') plateNumber: string) {
    return this.vehiclesService.verifyByPlate(plateNumber);
  }
}
