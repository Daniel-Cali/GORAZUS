import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';
import databaseConfig from './namespaces/database.config';
import redisConfig from './namespaces/redis.config';
import rabbitmqConfig from './namespaces/rabbitmq.config';
import storageConfig from './namespaces/storage.config';
import authConfig from './namespaces/auth.config';
import notificationsConfig from './namespaces/notifications.config';
import ollamaConfig from './namespaces/ollama.config';

/**
 * Envuelve el ConfigModule oficial de Nest en vez de reemplazarlo —
 * ver docs/architecture/12-backend-enterprise.md §7.4. `isGlobal: true`
 * ya lo registra como global y expone su propio ConfigService en toda
 * la app; este wrapper NO debe volver a declarar `@Global()` ni
 * reexportar ConfigService (Nest rechaza exportar un provider que no
 * es parte del módulo que lo procesa) — solo centraliza el `validate`
 * + los namespaces en un único punto de importación para AppModule.
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [
        databaseConfig,
        redisConfig,
        rabbitmqConfig,
        storageConfig,
        authConfig,
        notificationsConfig,
        ollamaConfig,
      ],
      envFilePath: ['.env'],
    }),
  ],
})
export class ConfigModule {}
