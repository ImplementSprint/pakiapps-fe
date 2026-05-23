import { Module, Global } from '@nestjs/common';
import { LogService } from './log.service';

// LogService uses injected Sequelize directly — no SequelizeModule.forFeature needed
@Global()
@Module({
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
