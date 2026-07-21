import cookieParser from 'cookie-parser';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { DatabaseModule } from '@gorazus/core-database';
import { AuthModule } from '../auth.module';

/**
 * Test de integración real (docs/architecture/15... / FASE 02 Backend
 * Enterprise, "Pruebas de Integración") — arranca la app completa
 * (guards/interceptors/filtro global reales) contra el Postgres/Redis/
 * RabbitMQ ya corriendo en Docker (`docker compose up postgres redis
 * rabbitmq minio`) y el tenant/usuario de prueba ya sembrados
 * (`slug=demo`, `admin@demo.local` / `Test1234!`, ver CHANGELOG.md). No usa
 * una base de test aislada todavía (Fase 2 de testing: contenedor Postgres
 * efímero por corrida) — corre contra el mismo Postgres de desarrollo, así
 * que no debe ejecutarse en CI sin antes levantar esa infraestructura.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // `MetricsInterceptor` (parte de `HttpModule`) exige `initMetrics()` ya
    // llamado — normalmente lo hace `apps/api/src/main.ts` antes de todo lo
    // demás; un test de integración que no arranca por `main.ts` tiene que
    // replicar ese mismo requisito de arranque.
    initMetrics();

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule, HttpModule, DatabaseModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login con credenciales válidas devuelve 200 + accessToken + cookie de refresh', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: 'demo', email: 'admin@demo.local', password: 'Test1234!' });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe('admin@demo.local');
    expect(response.headers['set-cookie']?.[0]).toMatch(/^refreshToken=.+HttpOnly/);
  });

  it('POST /auth/login con contraseña incorrecta devuelve 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: 'demo', email: 'admin@demo.local', password: 'contraseña-incorrecta' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('CREDENCIALES_INVALIDAS');
  });

  it('POST /auth/login con tenant inexistente devuelve el mismo 401 genérico (sin enumeración)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        tenantSlug: 'tenant-que-no-existe',
        email: 'admin@demo.local',
        password: 'Test1234!',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('CREDENCIALES_INVALIDAS');
  });

  it('POST /auth/login con body inválido (Zod) devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'no-es-un-email' });

    expect(response.status).toBe(400);
  });

  it('GET /auth/lo-que-sea sin token devuelve 401 (JwtAuthGuard global)', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/logout');
    expect(response.status).toBe(401);
  });

  it('flujo completo login → refresh: la cookie rotada permite obtener un nuevo access token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug: 'demo', email: 'admin@demo.local', password: 'Test1234!' });

    const cookie = loginResponse.headers['set-cookie']?.[0];
    expect(cookie).toBeDefined();

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie!);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));
    // El refresh token (aleatorio de 256 bits) SIEMPRE rota — a diferencia
    // del access token, cuyo `iat` es de resolución de segundos y puede
    // coincidir byte a byte con el anterior si login+refresh ocurren dentro
    // del mismo segundo (irrelevante para la seguridad real: sigue siendo
    // un JWT válido y correctamente firmado).
    const refreshCookie = refreshResponse.headers['set-cookie']?.[0];
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).not.toBe(cookie);
  });

  it('POST /auth/refresh sin cookie devuelve 401', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/refresh');
    expect(response.status).toBe(401);
  });
});
