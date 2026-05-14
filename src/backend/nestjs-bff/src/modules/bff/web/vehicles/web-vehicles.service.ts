import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { TellerService } from '../../../domain/teller/teller.service';
import { ReservationService } from '../../../domain/reservation/reservation.service';

@Injectable()
export class WebVehiclesService {
  constructor(
    private readonly teller: TellerService,
    private readonly reservation: ReservationService,
  ) {}

  getVehicles(userId: string) {
    return this.teller.getVehicles(userId);
  }

  addVehicle(data: object, userId: string) {
    return this.teller.addVehicle(data, userId);
  }

  updateVehicle(vehicleId: string, data: object, userId: string) {
    return this.teller.updateVehicle(vehicleId, data, userId);
  }

  async deleteVehicle(vehicleId: string, userId: string) {
    // Business rule: cannot delete if vehicle has upcoming/active booking
    const hasActive = await this.reservation.vehicleHasActiveBooking(vehicleId);
    if (hasActive) {
      throw new BadRequestException(
        'Cannot delete vehicle with an upcoming or active booking.',
      );
    }
    return this.teller.deleteVehicle(vehicleId, userId);
  }

  async verifyByPlate(plateNumber: string) {
    // Calls internal /internal/auth/:userId/summary to resolve userId → name
    return this.teller.verifyVehicleByPlate(plateNumber);
  }
}
