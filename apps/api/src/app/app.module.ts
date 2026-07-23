import { Module } from '@nestjs/common';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { HttpModule } from '@gorazus/core-http';
import { HealthModule } from '@gorazus/core-health';
import { CacheModule } from '@gorazus/core-cache';
import { StorageModule } from '@gorazus/core-storage';
import { MessagingModule } from '@gorazus/core-messaging';
import { SchedulerModule } from '@gorazus/core-scheduler';
import { DatabaseModule } from '@gorazus/core-database';
import { NotificationsModule } from '@gorazus/core-notifications';
import { OllamaModule } from '@gorazus/core-ollama';
// eslint-disable-next-line @nx/enforce-module-boundaries -- no hay alias @gorazus/modules/* para backend/ (ver docs/architecture/01-estructura-monorepo.md §3)
import { AuthModule } from '../../../../modules/auth/backend/auth.module';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo que arriba
import { SeguridadModule } from '../../../../modules/seguridad/backend/seguridad.module';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo que arriba
import { ConfiguracionModule } from '../../../../modules/configuracion/backend/configuracion.module';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo que arriba
import { InventarioModule } from '../../../../modules/inventario/backend/inventario.module';

/**
 * Composition root — ver docs/architecture/01-estructura-monorepo.md §3:
 * "apps/api no contiene lógica de negocio, es donde se ensamblan los
 * módulos en una aplicación ejecutable". Los módulos `core/*` de arriba
 * son @Global() (se registran una sola vez, quedan disponibles en toda
 * la app sin reimportar). Los módulos de negocio (`modules/<x>/backend`)
 * se importan por ruta relativa — no hay alias `@gorazus/modules/*` para
 * `backend/` (el alias de tsconfig.base.json solo resuelve `index.ts` a
 * nivel de módulo, pensado para el barrel de `frontend/` que consume
 * `apps/web`, ver `docs/frontend/FOLDER_STRUCTURE.md §6`).
 */
@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    HttpModule,
    HealthModule,
    CacheModule,
    StorageModule,
    MessagingModule,
    SchedulerModule,
    DatabaseModule,
    NotificationsModule,
    OllamaModule,
    AuthModule,
    SeguridadModule,
    ConfiguracionModule,
    InventarioModule,
  ],
})
export class AppModule {}
