import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SharedPaymentService } from './shared-payment.service';

@Module({
  imports: [HttpModule],
  providers: [SharedPaymentService],
  exports: [SharedPaymentService],
})
export class SharedPaymentModule {}
