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
// Ruta relativa — necesita la clase PrismaClient real (constructible) del cliente
// generado de `core`, no solo los tipos que reexporta @gorazus/core-database/index.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// PERMISSIONS_RESOLVER real (RBAC) solo queda registrado si SeguridadModule
// (Global) forma parte del árbol de este TestingModule — ver seguridad.module.ts
// cabecera. Sin esto, el guard usa el resolver noop por defecto y todo da 403.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ConfiguracionModule } from '../configuracion.module';

/**
 * Test de integración real (mismo patrón que `roles.controller.e2e-spec.ts` —
 * ver docs/architecture/13-modulo-auth.md §2 para por qué se arma el JWT
 * directamente en vez de hacer un login real). Usa el tenant/usuario de
 * prueba ya sembrados por `seed-rbac.ts demo admin@demo.local`, que a partir
 * de este módulo también sostiene los permisos `configuracion.gestionar_*`.
 */
describe('EmpresasController / SucursalesController (e2e)', () => {
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
      sessionId: 'e2e-test-session-configuracion',
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

  it('GET /configuracion/empresas sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/configuracion/empresas');
    expect(response.status).toBe(401);
  });

  it('POST /configuracion/empresas con datos válidos crea la empresa y aparece en el listado', async () => {
    const legalName = `Empresa de prueba e2e ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/empresas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        legalName,
        taxId: `NIT-${Date.now()}`,
        functionalCurrencyCode: 'USD',
        fiscalYearStartMonth: 1,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.legal_name).toBe(legalName);
    const empresaId = createResponse.body.data.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/empresas/${empresaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.legal_name).toBe(legalName);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/configuracion/empresas')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.body.data.some((e: { id: string }) => e.id === empresaId)).toBe(true);

    // Sucursal ligada a la empresa recién creada.
    const branchCode = `SUC-${Date.now()}`;
    const createBranchResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/sucursales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: empresaId,
        name: 'Sucursal Centro',
        code: branchCode,
        isMainBranch: true,
      });

    expect(createBranchResponse.status).toBe(201);
    expect(createBranchResponse.body.data.company_id).toBe(empresaId);

    const listBranchesResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/sucursales?companyId=${empresaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(
      listBranchesResponse.body.data.some((b: { code: string }) => b.code === branchCode),
    ).toBe(true);
  });

  it('POST /configuracion/empresas con datos inválidos devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/empresas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ legalName: '', taxId: '', functionalCurrencyCode: 'US' });
    expect(response.status).toBe(400);
  });

  it('POST /configuracion/sucursales con companyId inexistente devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/sucursales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: '00000000-0000-0000-0000-000000000099',
        name: 'Sucursal Fantasma',
        code: `SUC-X-${Date.now()}`,
      });
    expect(response.status).toBe(400);
  });
});
