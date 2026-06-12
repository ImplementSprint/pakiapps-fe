import { Module, Global } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransactionLogModel } from '../models/transaction-log.model';
import { ActivityLogModel } from '../models/activity-log.model';
import { LogService } from './log.service';
import { LogsController } from './logs.controller';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([TransactionLogModel, ActivityLogModel])],
  providers: [LogService],
  controllers: [LogsController],
  exports: [LogService],
})
export class LogsModule {}
