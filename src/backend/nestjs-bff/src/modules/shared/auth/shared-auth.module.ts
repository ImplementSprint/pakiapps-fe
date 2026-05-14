import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SharedAuthService } from './shared-auth.service';

@Module({
  imports: [HttpModule],
  providers: [SharedAuthService],
  exports: [SharedAuthService],
})
export class SharedAuthModule {}
