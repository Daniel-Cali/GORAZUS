import { randomUUID } from 'crypto';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { CacheModule } from '@gorazus/core-cache';
import { DatabaseModule } from '@gorazus/core-database';
// eslint-disable-next-line @nx/enforce-module-boundaries -- ver login.usecase.ts, mismo motivo
import { hashPassword } from '../../../../packages/tooling/utils';
// Ruta relativa — necesita la clase PrismaClient real, ver roles.controller.e2e-spec.ts (seguridad).
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
import { AuthModule } from '../auth.module';
import { PasswordResetNotifier } from '../services/password-reset-notifier.port';

/**
 * `PasswordResetNotifier` real solo loguea el token (no existe canal email
 * todavía, ver `password-reset-notifier.port.ts`) — el test lo reemplaza
 * por un fake que captura el token en memoria para poder ejercer el flujo
 * completo (forgot → reset) sin necesitar un canal de entrega real.
 *
 * Usa un usuario descartable propio (no el `admin@demo.local` compartido
 * por el resto de la suite e2e) para no mutar su contraseña.
 */
class FakePasswordResetNotifier extends PasswordResetNotifier {
  lastToken: string | null = null;
  async enviarTokenReset(_email: string, token: string): Promise<void> {
    this.lastToken = token;
  }
}

describe('POST /auth/forgot-password + /auth/reset-password (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let fakeNotifier: FakePasswordResetNotifier;
  let tenantSlug: string;
  const testEmail = `password-reset-e2e-${Date.now()}@example.com`;
  const oldPassword = 'ViejaPassword123!';
  const newPassword = 'NuevaPassword456!';

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    tenantSlug = tenant.slug;
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    await prisma.users.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        email: testEmail,
        password_hash: await hashPassword(oldPassword),
        full_name: 'Usuario descartable e2e reset-password',
        is_active: true,
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule, HttpModule, CacheModule, DatabaseModule, AuthModule],
    })
      .overrideProvider(PasswordResetNotifier)
      .useClass(FakePasswordResetNotifier)
      .compile();

    fakeNotifier = moduleRef.get(PasswordResetNotifier);

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /auth/forgot-password siempre responde 200, exista o no el email', async () => {
    const responseReal = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ tenantSlug, email: testEmail });
    expect(responseReal.status).toBe(200);

    const responseInexistente = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ tenantSlug, email: 'no-existe@example.com' });
    expect(responseInexistente.status).toBe(200);
  });

  it('el flujo completo funciona: reset con el token entregado cambia la contraseña', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ tenantSlug, email: testEmail });
    const token = fakeNotifier.lastToken;
    expect(token).toEqual(expect.any(String));

    const resetResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ tenantSlug, token, newPassword });
    expect(resetResponse.status).toBe(200);

    const loginConNueva = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug, email: testEmail, password: newPassword });
    expect(loginConNueva.status).toBe(200);

    const loginConVieja = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug, email: testEmail, password: oldPassword });
    expect(loginConVieja.status).toBe(401);
  });

  it('reusar el mismo token de reset una segunda vez devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ tenantSlug, email: testEmail });
    const token = fakeNotifier.lastToken;

    const primerReset = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ tenantSlug, token, newPassword: 'OtraPassword789!' });
    expect(primerReset.status).toBe(200);

    const segundoReset = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ tenantSlug, token, newPassword: 'OtraMas000!' });
    expect(segundoReset.status).toBe(400);
  });

  it('un token inventado devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ tenantSlug, token: 'token-que-no-existe', newPassword: 'Cualquiera123!' });
    expect(response.status).toBe(400);
  });
});
