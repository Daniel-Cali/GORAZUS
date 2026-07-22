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
import {
  hashPassword,
  encrypt,
  generateTotpSecret,
  generateTotpCode,
} from '../../../../packages/tooling/utils';
// Ruta relativa — necesita la clase PrismaClient real, ver empresas.controller.e2e-spec.ts (configuracion).
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as SecurityPrismaClient } from '../../../../core/database/prisma/schemas/security/generated';
import { AuthModule } from '../auth.module';

const PASSWORD = 'Test1234!';
// Mismo keyId/algoritmo que `modules/seguridad/backend/services/dos-factores.service.ts`
// — este test inserta la credencial 2FA directamente en la tabla (sin pasar
// por /seguridad/2fa/setup+confirmar) para no depender de SeguridadModule acá.
const KEY_ID = 'seguridad-v1';

describe('Login con 2FA (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let securityPrisma: SecurityPrismaClient;
  let tenantSlug: string;
  let email: string;
  let totpSecret: string;

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    securityPrisma = new SecurityPrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
    });

    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    tenantSlug = tenant.slug;
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );
    await securityPrisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    email = `login-2fa-e2e-${Date.now()}@example.com`;
    const passwordHash = await hashPassword(PASSWORD);
    const usuario = await prisma.users.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        email,
        password_hash: passwordHash,
        full_name: 'Usuario descartable e2e login+2FA',
        is_active: true,
      },
    });

    totpSecret = generateTotpSecret();
    const encryptionKey = Buffer.from(process.env['SEGURIDAD_ENCRYPTION_KEY']!, 'hex');
    const encryptedSecret = JSON.stringify(encrypt(totpSecret, KEY_ID, encryptionKey));
    await securityPrisma.two_factor_credentials.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        user_id: usuario.id,
        method: 'totp',
        encrypted_secret: encryptedSecret,
        confirmed_at: new Date(),
      },
    });

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule, HttpModule, CacheModule, DatabaseModule, AuthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await securityPrisma.$disconnect();
    await app.close();
  });

  it('login con contraseña correcta y 2FA confirmado devuelve requiresTwoFactor, sin tokens ni cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug, email, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.requiresTwoFactor).toBe(true);
    expect(response.body.data.challengeToken).toEqual(expect.any(String));
    expect(response.body.data.accessToken).toBeUndefined();
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('código TOTP incorrecto devuelve 400 y consume el challengeToken (de un solo uso)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug, email, password: PASSWORD });
    const challengeToken = loginResponse.body.data.challengeToken as string;

    const wrongCodeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login/2fa')
      .send({ challengeToken, code: '000000' });
    expect(wrongCodeResponse.status).toBe(400);
    expect(wrongCodeResponse.body.error.code).toBe('CODIGO_DOS_FACTORES_INVALIDO');

    // Mismo challengeToken, ahora con el código correcto — ya se consumió
    // en el intento anterior (equivocado o no, se borra al leerlo).
    const retryResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login/2fa')
      .send({ challengeToken, code: generateTotpCode(totpSecret) });
    expect(retryResponse.status).toBe(401);
    expect(retryResponse.body.error.code).toBe('DESAFIO_DOS_FACTORES_INVALIDO');
  });

  it('código TOTP correcto completa el login: emite accessToken + cookie de refresh', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ tenantSlug, email, password: PASSWORD });
    const challengeToken = loginResponse.body.data.challengeToken as string;

    const completeResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login/2fa')
      .send({ challengeToken, code: generateTotpCode(totpSecret) });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(completeResponse.body.data.user.email).toBe(email);
    expect(completeResponse.headers['set-cookie']?.[0]).toMatch(/^refreshToken=.+HttpOnly/);
  });

  it('un challengeToken inexistente devuelve 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login/2fa')
      .send({ challengeToken: 'no-existe', code: '123456' });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('DESAFIO_DOS_FACTORES_INVALIDO');
  });
});
