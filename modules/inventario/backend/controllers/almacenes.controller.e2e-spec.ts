import jwt from 'jsonwebtoken';
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
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — necesita la clase PrismaClient real (constructible) del cliente
// generado de `core`, no solo los tipos que reexporta @gorazus/core-database/index.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// PERMISSIONS_RESOLVER real (RBAC) solo queda registrado si SeguridadModule
// (Global) forma parte del árbol de este TestingModule — mismo motivo que
// empresas.controller.e2e-spec.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { InventarioModule } from '../inventario.module';

/**
 * Test de integración real (mismo patrón que
 * `configuracion/backend/controllers/empresas.controller.e2e-spec.ts`) —
 * usa el tenant/usuario de prueba ya sembrados (`seed-rbac.ts demo
 * admin@demo.local`), que a partir de esta parte también sostiene
 * `inventario.gestionar_almacenes`. Empresa/sucursal propias, creadas
 * directamente vía Prisma (no hace falta pasar por `configuracion` para
 * probar `inventario`) — evita importar `ConfiguracionModule` acá.
 */
describe('AlmacenesController / ZonasAlmacenController / UbicacionesAlmacenController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;

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
      sessionId: 'e2e-test-session-inventario',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    // Empresa + sucursal descartables propias — un almacén exige ambas ya
    // existentes (`company_id`/`branch_id` NOT NULL en inventory.warehouses).
    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e almacenes ${Date.now()}`,
        tax_id: `NIT-INV-${Date.now()}`,
        functional_currency_code: 'USD',
        fiscal_year_start_month: 1,
      },
    });
    companyId = empresa.id;

    const sucursal = await prisma.branches.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        name: 'Sucursal e2e almacenes',
        code: `SUC-INV-${Date.now()}`,
        is_main_branch: true,
      },
    });
    branchId = sucursal.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        SeguridadModule,
        InventarioModule,
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

  it('GET /inventario/almacenes sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/inventario/almacenes');
    expect(response.status).toBe(401);
  });

  it('POST /inventario/almacenes con companyId/branchId inexistentes devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: '00000000-0000-0000-0000-000000000099',
        branchId: '00000000-0000-0000-0000-000000000099',
        name: 'Almacén Fantasma',
        code: `ALM-X-${Date.now()}`,
      });
    expect(response.status).toBe(400);
  });

  it('flujo completo: crear almacén → zona → ubicación (con jerarquía)', async () => {
    const warehouseCode = `ALM-${Date.now()}`;
    const crearAlmacen = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén Central', code: warehouseCode });
    expect(crearAlmacen.status).toBe(201);
    expect(crearAlmacen.body.data.warehouse_type).toBe('physical');
    const warehouseId = crearAlmacen.body.data.id;

    const obtenerAlmacen = await request(app.getHttpServer())
      .get(`/api/v1/inventario/almacenes/${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(obtenerAlmacen.status).toBe(200);
    expect(obtenerAlmacen.body.data.code).toBe(warehouseCode);

    const listarPorSucursal = await request(app.getHttpServer())
      .get(`/api/v1/inventario/almacenes?branchId=${branchId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listarPorSucursal.body.data.some((a: { id: string }) => a.id === warehouseId)).toBe(
      true,
    );

    const actualizarAlmacen = await request(app.getHttpServer())
      .patch(`/api/v1/inventario/almacenes/${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Almacén Central Renombrado' });
    expect(actualizarAlmacen.status).toBe(200);
    expect(actualizarAlmacen.body.data.name).toBe('Almacén Central Renombrado');

    // Zona
    const crearZona = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, name: 'Recepción', zoneFunction: 'receiving' });
    expect(crearZona.status).toBe(201);
    expect(crearZona.body.data.warehouse_id).toBe(warehouseId);
    const zoneId = crearZona.body.data.id;

    const zonaConFuncionInvalida = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, name: 'Zona rara', zoneFunction: 'lo-que-sea' });
    expect(zonaConFuncionInvalida.status).toBe(400);

    // Ubicación raíz + ubicación hija (jerarquía real)
    const crearUbicacionRaiz = await request(app.getHttpServer())
      .post('/api/v1/inventario/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId, code: 'PASILLO-A' });
    expect(crearUbicacionRaiz.status).toBe(201);
    expect(crearUbicacionRaiz.body.data.parent_location_id).toBeNull();
    const parentLocationId = crearUbicacionRaiz.body.data.id;

    const crearUbicacionHija = await request(app.getHttpServer())
      .post('/api/v1/inventario/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId, code: 'ESTANTE-A1', parentLocationId });
    expect(crearUbicacionHija.status).toBe(201);
    expect(crearUbicacionHija.body.data.parent_location_id).toBe(parentLocationId);

    const listarUbicacionesPorZona = await request(app.getHttpServer())
      .get(`/api/v1/inventario/ubicaciones?zoneId=${zoneId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listarUbicacionesPorZona.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /inventario/ubicaciones con un padre de otra zona devuelve 400', async () => {
    const crearAlmacen = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén B', code: `ALM-B-${Date.now()}` });
    const warehouseId = crearAlmacen.body.data.id;

    const crearZonaA = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, name: 'Zona A', zoneFunction: 'storage' });
    const crearZonaB = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, name: 'Zona B', zoneFunction: 'picking' });

    const ubicacionEnZonaA = await request(app.getHttpServer())
      .post('/api/v1/inventario/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId: crearZonaA.body.data.id, code: 'BIN-A1' });

    const ubicacionCruzada = await request(app.getHttpServer())
      .post('/api/v1/inventario/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        zoneId: crearZonaB.body.data.id,
        code: 'BIN-B1',
        parentLocationId: ubicacionEnZonaA.body.data.id,
      });
    expect(ubicacionCruzada.status).toBe(400);
  });
});
