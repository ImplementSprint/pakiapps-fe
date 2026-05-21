import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BookingModel } from '../models/booking.model';
import { SchedulerService } from './scheduler.service';

// LocationModel removed — available_spots updated via raw SQL on parking_lot.locations
@Module({
  imports: [SequelizeModule.forFeature([BookingModel])],
  providers: [SchedulerService],
})
export class SchedulerModule {}
