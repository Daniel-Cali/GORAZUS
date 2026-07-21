import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication, Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { HealthService } from '@gorazus/core-health';

/**
 * Ver docs/architecture/32-core-platform/01-kernel-y-composicion.md §1.
 * Único punto de entrada de arranque del backend, consumido solo por
 * apps/api/src/main.ts (y, más adelante, por el harness de
 * apps/api-e2e, para no tener drift entre entorno de test y real).
 *
 * Fases (orden fijo, ver doc):
 *  1. Carga/validación de configuración        -> NestFactory.create + ConfigModule (dentro de rootModule)
 *  2. Conexión a infraestructura crítica        -> healthService.checkReadiness() con timeout
 *  3. Registro del Service Container            -> rootModule (vacío hasta que existan modules de negocio en backend)
 *  4. Middlewares/filtros globales de core/http -> ya registrados por HttpModule dentro de rootModule
 *  5. Exposición del Health Check de liveness   -> ya registrado por HealthModule dentro de rootModule
 *  6. Arranque del listener HTTP                -> app.listen()
 *
 * Fase 2 es intencionalmente un no-op útil hoy: no hay ningún
 * indicador registrado todavía (core/database no compila — cliente
 * Prisma bloqueado, ver informe EPIC 03 Prisma; core/cache y
 * core/messaging son FASE 5, todavía no existen) — cuando cada uno
 * exista y se registre en HealthService vía su propio onModuleInit,
 * esta misma llamada empieza a esperarlos de verdad, sin cambiar esta
 * función.
 */
const PHASE_2_TIMEOUT_MS = 5000;

export async function bootstrap(rootModule: unknown): Promise<INestApplication> {
  const logger = new Logger('Kernel');

  // Fase 1
  logger.log('kernel.phase.started: config');
  const app = await NestFactory.create(rootModule as never, { bufferLogs: true });
  const configService = app.get(ConfigService);
  logger.log('kernel.phase.completed: config');

  // Fase 2
  logger.log('kernel.phase.started: infra-connectivity');
  const healthService = app.get(HealthService);
  await Promise.race([
    healthService.checkReadiness(),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout esperando infraestructura crítica')),
        PHASE_2_TIMEOUT_MS,
      ),
    ),
  ]);
  logger.log('kernel.phase.completed: infra-connectivity');

  // Fase 3: el registro de módulos de negocio ocurre al declarar
  // `rootModule` (AppModule) — el Kernel no los conoce ni los importa
  // acá, solo orquesta el arranque de lo que AppModule ya declaró.

  // Fase 4: middlewares/filtros/interceptors globales — ya vienen
  // registrados por HttpModule (APP_FILTER/APP_INTERCEPTOR) dentro de
  // rootModule. Acá solo se agrega lo que es responsabilidad del
  // proceso de arranque, no de un módulo Nest: seguridad HTTP,
  // compresión, CORS, documentación, validación global.
  // Sin pipe de validación global: el proyecto usa Zod (no
  // class-validator, ver core/http/pipes/zod-validation.pipe.ts), y un
  // ZodValidationPipe necesita el schema de cada endpoint como
  // argumento — se aplica por controller/parámetro, no globalmente.
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  // Origen exacto + `credentials: true` — la cookie httpOnly de refresh
  // token (docs/architecture/13-modulo-auth.md §2) no viaja con `origin: '*'`,
  // el navegador la descarta si el servidor responde un wildcard junto a
  // `Access-Control-Allow-Credentials`.
  app.enableCors({ origin: configService.get<string>('CORS_ORIGIN'), credentials: true });

  // Versionado ya fijado en docs/architecture/07-convenciones-y-estandares.md §4:
  // prefijo /api/v1/..., un cambio breaking convive como /api/v2/... hasta
  // deprecar. `defaultVersion: '1'` evita que cada controller declare su
  // versión a mano mientras solo exista v1.
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GORAZUS ERP API')
      .setDescription('API del backend GORAZUS ERP')
      .setVersion('0.1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
    // Export del spec real a disco — FASE 02 (Backend Enterprise): Postman importa un
    // spec OpenAPI 3 directamente, no hace falta mantener una colección .json aparte
    // a mano que se desincroniza del código. Ver docs/architecture/12-backend-enterprise.md.
    try {
      writeFileSync(
        join(process.cwd(), 'docs', 'api', 'openapi.json'),
        JSON.stringify(document, null, 2),
      );
    } catch {
      // Best-effort — no bloquea el arranque si el path no existe en este entorno (p. ej. imagen de producción sin docs/).
    }
  }

  // Fase 5: HealthModule ya registró GET /health/live y /health/ready
  // dentro de rootModule — nada más que hacer acá.

  logger.log('kernel.phase.completed: assembly');

  return app;
}
