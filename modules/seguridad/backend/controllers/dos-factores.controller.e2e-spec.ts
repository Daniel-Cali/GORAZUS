import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { DatabaseModule } from '@gorazus/core-database';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — ver roles.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- packages/tooling no tiene project.json propio, ver dos-factores.service.ts
import { generateTotpCode } from '../../../../packages/tooling/utils';
import { SeguridadModule } from '../seguridad.module';

/**
 * Usa un usuario descartable propio (no `admin@demo.local`) porque
 * `security.two_factor_credentials` admite una sola credencial activa por
 * usuario — reusar el admin compartido rompería en una segunda corrida
 * contra la misma base de dev persistente.
 */
describe('DosFactoresController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    const usuario = await prisma.users.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        email: `dos-factores-e2e-${Date.now()}@example.com`,
        full_name: 'Usuario descartable e2e 2FA',
        is_active: true,
      },
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-2fa',
    };
    token = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule, HttpModule, DatabaseModule, SeguridadModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /seguridad/2fa/setup sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/seguridad/2fa/setup');
    expect(response.status).toBe(401);
  });

  it('setup → confirmar con un código TOTP real activa 2FA', async () => {
    const setupResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(setupResponse.status).toBe(201);
    const secret: string = setupResponse.body.data.secret;
    expect(secret).toEqual(expect.any(String));

    const code = generateTotpCode(secret);
    const confirmResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/confirmar')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });
    expect(confirmResponse.status).toBe(200);
  });

  it('un segundo setup para el mismo usuario devuelve 409 (ya configurado)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(409);
  });

  it('confirmar con un código incorrecto devuelve 400', async () => {
    // El setup anterior ya quedó confirmado, así que este intento choca primero
    // con "ya configurado" (409) — se prueba con un usuario nuevo, sin confirmar.
    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    const otroUsuario = await prisma.users.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant!.id,
        email: `dos-factores-e2e-codigo-invalido-${Date.now()}@example.com`,
        full_name: 'Usuario descartable e2e 2FA (código inválido)',
        is_active: true,
      },
    });
    const otroToken = jwt.sign(
      {
        sub: otroUsuario.id,
        tenantId: otroUsuario.tenant_id,
        companyId: otroUsuario.company_id,
        branchId: otroUsuario.branch_id,
        sessionId: 'e2e-test-session-2fa-invalido',
      } as Omit<AccessTokenPayload, 'iat' | 'exp'>,
      process.env['JWT_ACCESS_SECRET']!,
      { expiresIn: '5m' },
    );

    await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/setup')
      .set('Authorization', `Bearer ${otroToken}`);

    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/confirmar')
      .set('Authorization', `Bearer ${otroToken}`)
      .send({ code: '000000' });
    expect(response.status).toBe(400);
  });

  it('DELETE /seguridad/2fa deshabilita la configuración activa', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/v1/seguridad/2fa')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(204);

    // Ahora que fue deshabilitada, un setup nuevo debe ser posible de nuevo.
    const setupDeNuevo = await request(app.getHttpServer())
      .post('/api/v1/seguridad/2fa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(setupDeNuevo.status).toBe(201);
  });
});
