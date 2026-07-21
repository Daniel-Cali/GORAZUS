import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

/** @Global(): mismo criterio que el resto de core/* — ver core/config/config.module.ts. */
@Global()
@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class MessagingModule {}
