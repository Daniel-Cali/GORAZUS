import jwt from 'jsonwebtoken';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { DatabaseModule } from '@gorazus/core-database';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — ver empresas.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ConfiguracionModule } from '../configuracion.module';

describe('ParametrosController / ConfiguracionController (e2e)', () => {
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
      sessionId: 'e2e-test-session-parametros',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
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

  it('crea un parámetro, lee su default y luego fija/lee un override', async () => {
    const key = `test.parametro.${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/parametros')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, dataType: 'string', defaultValue: 'valor-por-defecto' });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.key).toBe(key);

    const defaultResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/valores/${key}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(defaultResponse.status).toBe(200);
    expect(defaultResponse.body.data.value).toBe('valor-por-defecto');

    const setResponse = await request(app.getHttpServer())
      .put('/api/v1/configuracion/valores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, value: 'valor-override' });
    expect(setResponse.status).toBe(200);
    expect(setResponse.body.data.value).toBe('valor-override');

    const overrideResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/valores/${key}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overrideResponse.body.data.value).toBe('valor-override');

    // Fijar de nuevo el mismo parámetro actualiza el override existente en vez de duplicarlo.
    const setAgainResponse = await request(app.getHttpServer())
      .put('/api/v1/configuracion/valores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, value: 'valor-override-2' });
    expect(setAgainResponse.body.data.value).toBe('valor-override-2');
  });

  it('crear un parámetro con clave duplicada devuelve 409', async () => {
    const key = `test.parametro.duplicado.${Date.now()}`;
    await request(app.getHttpServer())
      .post('/api/v1/configuracion/parametros')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, dataType: 'string' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/parametros')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, dataType: 'string' });
    expect(response.status).toBe(409);
  });

  it('obtener el valor de una clave inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/configuracion/valores/clave.que.no.existe')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
