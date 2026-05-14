import { Injectable } from '@nestjs/common';
import { ParkingLotService } from '../../../domain/parking-lot/parking-lot.service';
import { PartnerService } from '../../../domain/partner/partner.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class WebLocationsService {
  constructor(
    private readonly parkingLot: ParkingLotService,
    private readonly partner: PartnerService,
  ) {}

  searchLocations(filters: { lat: number; lng: number; radiusKm: number; date?: string; timeSlot?: string }) {
    return this.parkingLot.searchLocations(filters);
  }

  getLocation(locationId: string) {
    return this.parkingLot.getLocationDetail(locationId);
  }

  getLocationReviews(locationId: string, pagination: { page: number; limit: number }) {
    return this.partner.getLocationReviews(locationId, pagination);
  }

  createLocation(dto: CreateLocationDto, partnerId: string) {
    return this.parkingLot.createLocation({ ...dto, partnerId });
  }

  updateLocation(locationId: string, dto: UpdateLocationDto, partnerId: string) {
    return this.parkingLot.updateLocation(locationId, dto, partnerId);
  }

  getPartnerLocations(partnerId: string) {
    return this.parkingLot.getPartnerLocations(partnerId);
  }

  getLocationDashboard(locationId: string, partnerId: string) {
    return this.parkingLot.getLocationDashboard(locationId, partnerId);
  }

  getPartnerLocationReviews(locationId: string, partnerId: string) {
    return this.partner.getPartnerLocationReviews(locationId, partnerId);
  }
}
