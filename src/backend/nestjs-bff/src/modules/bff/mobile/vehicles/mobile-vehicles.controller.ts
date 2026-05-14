import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../../decorators/roles.decorator';
import { TellerService } from '../../../domain/teller/teller.service';
import { ReservationService } from '../../../domain/reservation/reservation.service';
import { BadRequestException } from '@nestjs/common';

/**
 * Mobile BFF — Vehicles controller
 * Prefix: /pakipark/mobile
 *
 * CONTRACT:
 *   GET    /pakipark/mobile/customer/vehicles
 *   POST   /pakipark/mobile/customer/vehicles
 *   PATCH  /pakipark/mobile/customer/vehicles/:vehicleId
 *   DELETE /pakipark/mobile/customer/vehicles/:vehicleId
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pakipark/mobile/customer/vehicles')
export class MobileVehiclesController {
  constructor(
    private readonly teller: TellerService,
    private readonly reservation: ReservationService,
  ) {}

  @Get()
  @Roles('customer')
  getVehicles(@Req() req: any) {
    return this.teller.getVehicles(req.user.sub);
  }

  @Post()
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  addVehicle(@Body() body: any, @Req() req: any) {
    return this.teller.addVehicle(body, req.user.sub);
  }

  @Patch(':vehicleId')
  @Roles('customer')
  updateVehicle(@Param('vehicleId') vehicleId: string, @Body() body: any, @Req() req: any) {
    return this.teller.updateVehicle(vehicleId, body, req.user.sub);
  }

  @Delete(':vehicleId')
  @Roles('customer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVehicle(@Param('vehicleId') vehicleId: string, @Req() req: any) {
    const hasActive = await this.reservation.vehicleHasActiveBooking(vehicleId);
    if (hasActive) {
      throw new BadRequestException('Cannot delete vehicle with an upcoming or active booking.');
    }
    return this.teller.deleteVehicle(vehicleId, req.user.sub);
  }
}
