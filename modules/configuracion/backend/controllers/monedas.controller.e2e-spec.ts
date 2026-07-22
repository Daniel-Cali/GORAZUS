import jwt from 'jsonwebtoken';
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
// Ruta relativa — ver empresas.controller.e2e-spec.ts para la justificación completa
// (acá se usa el cliente Prisma de `core` solo para resolver tenant/usuario de prueba,
// aunque las monedas mismas viven en el cliente de `configuration`).
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ConfiguracionModule } from '../configuracion.module';

describe('MonedasController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;

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

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-monedas',
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
        ConfiguracionModule,
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

  it('crea una moneda, la lee por código y aparece en el listado', async () => {
    // Código ISO ficticio de 3 letras para no chocar con monedas reales ya sembradas.
    const isoCode = `Z${Date.now().toString(36).slice(-2).toUpperCase()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/monedas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isoCode, symbol: 'Z$', decimalPlaces: 2 });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.iso_code).toBe(isoCode);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/monedas/${isoCode}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.iso_code).toBe(isoCode);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/configuracion/monedas')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.body.data.some((m: { iso_code: string }) => m.iso_code === isoCode)).toBe(
      true,
    );
  });

  it('crear una moneda con código ISO duplicado devuelve 409', async () => {
    const isoCode = `Y${Date.now().toString(36).slice(-2).toUpperCase()}`;
    await request(app.getHttpServer())
      .post('/api/v1/configuracion/monedas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isoCode });

    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/monedas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isoCode });
    expect(response.status).toBe(409);
  });

  it('crear una moneda con código ISO inválido devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/monedas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isoCode: 'US' });
    expect(response.status).toBe(400);
  });

  it('obtener una moneda con código inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/configuracion/monedas/XXX')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
