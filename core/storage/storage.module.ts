import { Global, Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

/** @Global(): mismo criterio que el resto de core/* — ver core/config/config.module.ts. */
@Global()
@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
