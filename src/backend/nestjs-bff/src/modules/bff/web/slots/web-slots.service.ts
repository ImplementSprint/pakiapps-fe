import { Injectable } from '@nestjs/common';
import { ParkingLotService } from '../../../domain/parking-lot/parking-lot.service';

@Injectable()
export class WebSlotsService {
  constructor(private readonly parkingLot: ParkingLotService) {}

  getPublicSlots(locationId: string, date: string, timeSlot: string) {
    return this.parkingLot.getAvailableSlots(locationId, date, timeSlot);
  }

  getPartnerSlots(locationId: string, partnerId: string) {
    return this.parkingLot.getAllSlots(locationId, partnerId);
  }

  createSlot(locationId: string, data: object, partnerId: string) {
    return this.parkingLot.createSlot(locationId, data, partnerId);
  }

  updateSlot(locationId: string, slotId: string, data: object, partnerId: string) {
    return this.parkingLot.updateSlot(locationId, slotId, data, partnerId);
  }

  getTellerSlots(locationId: string) {
    return this.parkingLot.getTellerView(locationId);
  }
}
