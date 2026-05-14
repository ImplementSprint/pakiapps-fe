import { Injectable } from '@nestjs/common';
import { TellerService } from '../../../domain/teller/teller.service';
import { PartnerService } from '../../../domain/partner/partner.service';

@Injectable()
export class WebSettingsService {
  constructor(
    private readonly teller: TellerService,
    private readonly partner: PartnerService,
  ) {}

  /** Public subset: cancellationPenaltyRate, pwdDiscountRate, seniorDiscountRate, maxAdvanceBookingDays */
  getPublicSettings() {
    return this.teller.getPublicSettings();
  }

  getAllSettings() {
    return this.teller.getAllSettings();
  }

  updateSetting(key: string, value: any) {
    return this.teller.updateSetting(key, value);
  }

  getActivityLogs(filters: { targetType?: string; page: number; limit: number }) {
    return this.partner.getActivityLogs(filters);
  }
}
