import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { CacheModule } from '@gorazus/core-cache';
import { DatabaseModule } from '@gorazus/core-database';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — ver roles.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
import { SeguridadModule } from '../seguridad.module';

describe('SesionesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
  let usuarioId: string;
  let sesionId: string;

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

    const usuario = await prisma.users.findFirst({
      where: { email: 'admin@demo.local', tenant_id: tenant.id },
    });
    if (!usuario)
      throw new Error('Falta el usuario de prueba admin@demo.local — correr seed-rbac.ts primero.');
    usuarioId = usuario.id;

    // Fixture mínima: una sesión real para poder listarla/revocarla — el
    // flujo de login real vive en `modules/auth/backend` (fuera de este módulo).
    const sesion = await prisma.sessions.create({
      data: {
        tenant_id: tenant.id,
        user_id: usuario.id,
        refresh_token_hash: randomBytes(32).toString('hex'),
        expires_at: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    sesionId = sesion.id;

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-sesiones',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        SeguridadModule,
      ],
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

  it('GET /seguridad/sesiones sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/seguridad/sesiones');
    expect(response.status).toBe(401);
  });

  it('lista las sesiones del usuario y encuentra la sesión sembrada', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/sesiones')
      .query({ userId: usuarioId, pageSize: 100 })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.some((s: { id: string }) => s.id === sesionId)).toBe(true);
  });

  it('revoca la sesión y queda con revoked_at fijado', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/sesiones/${sesionId}/revocar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(201);
    expect(response.body.data.revoked_at).not.toBeNull();
  });

  it('revocar una sesión ya revocada devuelve 409', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/sesiones/${sesionId}/revocar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(409);
  });

  it('revocar una sesión inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/sesiones/00000000-0000-0000-0000-000000000099/revocar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
