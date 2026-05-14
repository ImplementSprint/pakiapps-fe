import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Shared-service payment client.
 * pakipark-service NEVER calls GREENOVATE directly.
 * All payment operations proxied through shared-service /payment/*.
 */
@Injectable()
export class SharedPaymentService {
  private readonly logger = new Logger(SharedPaymentService.name);
  private readonly baseUrl = process.env.SHARED_SERVICE_URL ?? 'http://shared-service:3000';
  private readonly serviceKey = process.env.INTERNAL_SERVICE_KEY ?? '';

  constructor(private readonly http: HttpService) {}

  private get headers() {
    return { 'X-Service-Key': this.serviceKey };
  }

  async initiate(data: {
    userId: string;
    sourceService: 'pakipark';
    referenceId: string;
    amount: number;
    currency: 'PHP';
    paymentMethod: 'gcash' | 'maya' | 'card' | 'cash';
    description: string;
  }) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/payment/initiate`, data, { headers: this.headers }),
    );
    return res.data as {
      transactionId: string;
      status: 'pending';
      paymentUrl: string | null;
      holdId: string | null;
      expiresAt: string;
    };
  }

  async capture(transactionId: string, holdId: string) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/payment/capture`, { transactionId, holdId }, { headers: this.headers }),
    );
    return res.data as { transactionId: string; status: 'captured'; capturedAt: string };
  }

  async refund(data: {
    transactionId: string;
    refundAmount: number;
    reason: string;
    initiatedBy: string;
  }) {
    const res = await firstValueFrom(
      this.http.post(`${this.baseUrl}/payment/refund`, data, { headers: this.headers }),
    );
    return res.data as {
      refundId: string;
      status: 'pending';
      refundAmount: number;
      processedAt: string | null;
    };
  }

  async getTransaction(transactionId: string) {
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl}/payment/transaction/${transactionId}`, { headers: this.headers }),
    );
    return res.data;
  }
}
