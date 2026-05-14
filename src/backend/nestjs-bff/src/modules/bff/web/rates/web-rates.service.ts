import { Injectable } from '@nestjs/common';
import { ParkingLotService } from '../../../domain/parking-lot/parking-lot.service';

@Injectable()
export class WebRatesService {
  constructor(private readonly parkingLot: ParkingLotService) {}

  getPublicRates(locationId: string) {
    return this.parkingLot.getRates(locationId);
  }

  getPartnerRates(locationId: string, partnerId: string) {
    return this.parkingLot.getPartnerRates(locationId, partnerId);
  }

  createRate(locationId: string, data: { type: string; rate: number }, partnerId: string) {
    return this.parkingLot.createRate(locationId, data, partnerId);
  }

  updateRate(locationId: string, rateId: string, rate: number, partnerId: string) {
    return this.parkingLot.updateRate(locationId, rateId, rate, partnerId);
  }

  deleteRate(locationId: string, rateId: string, partnerId: string) {
    return this.parkingLot.deleteRate(locationId, rateId, partnerId);
  }
}
