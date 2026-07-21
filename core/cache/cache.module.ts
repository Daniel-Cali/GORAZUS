import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { LockService } from './lock.service';

/** @Global(): mismo criterio que el resto de core/* — ver core/config/config.module.ts. */
@Global()
@Module({
  providers: [CacheService, LockService],
  exports: [CacheService, LockService],
})
export class CacheModule {}
