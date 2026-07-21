import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/** @Global(): mismo criterio que ConfigModule — ver core/config/config.module.ts. */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggingModule {}
