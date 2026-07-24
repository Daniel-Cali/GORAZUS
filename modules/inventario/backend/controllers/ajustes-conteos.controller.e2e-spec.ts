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
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ProductosModule } from '../../../productos/backend/productos.module';
import { InventarioModule } from '../inventario.module';

/**
 * Test de integración real de Ajustes, Conteos Físicos y Programación
 * de Conteos Cíclicos (FASE 05, Parte 04) — mismo patrón que
 * `reservas-transferencias.controller.e2e-spec.ts`.
 */
describe('MotivosAjusteController / AjustesController / ConteosController / ProgramacionConteosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let warehouseId: string;
  let zoneId: string;
  let locationId: string;
  let productId: string;
  let productIdZona: string;
  let receiptTypeId: string;
  let motivoDiferenciaId: string;

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
      sessionId: 'e2e-test-session-inventario-ajustes-conteos',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e ajustes ${Date.now()}`,
        tax_id: `NIT-AJU-${Date.now()}`,
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
        name: 'Sucursal e2e ajustes',
        code: `SUC-AJU-${Date.now()}`,
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
        ProductosModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    const crearAlmacen = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén e2e ajustes', code: `ALM-AJU-${Date.now()}` });
    warehouseId = crearAlmacen.body.data.id;

    const crearZona = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, name: 'Zona e2e ajustes', zoneFunction: 'storage' });
    zoneId = crearZona.body.data.id;

    const crearUbicacion = await request(app.getHttpServer())
      .post('/api/v1/inventario/ubicaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId, code: `BIN-AJU-${Date.now()}` });
    locationId = crearUbicacion.body.data.id;

    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `UN-AJU-${Date.now()}` });
    const unitId = crearUnidad.body.data.id;

    const crearProducto = await request(app.getHttpServer())
      .post('/api/v1/productos/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, sku: `SKU-AJU-${Date.now()}`, productType: 'good', baseUnitId: unitId });
    productId = crearProducto.body.data.id;

    const crearProductoZona = await request(app.getHttpServer())
      .post('/api/v1/productos/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, sku: `SKU-AJU-Z-${Date.now()}`, productType: 'good', baseUnitId: unitId });
    productIdZona = crearProductoZona.body.data.id;

    const crearTipoReceipt = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `receipt-aju-${Date.now()}`, direction: 'in' });
    receiptTypeId = crearTipoReceipt.body.data.id;

    await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'adjustment_increase', direction: 'in' });
    await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'adjustment_decrease', direction: 'out' });

    const crearMotivo = await request(app.getHttpServer())
      .post('/api/v1/inventario/motivos-ajuste')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Diferencia de Conteo' });
    motivoDiferenciaId = crearMotivo.body.data.id;

    // Stock a nivel de almacén (sin ubicación) — 50 unidades del producto principal.
    await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, warehouseId, movementTypeId: receiptTypeId, quantity: 50 });

    // Stock dentro de la zona/ubicación específica — 30 unidades del producto de zona.
    await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: productIdZona,
        warehouseId,
        locationId,
        movementTypeId: receiptTypeId,
        quantity: 30,
      });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /inventario/motivos-ajuste sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/inventario/motivos-ajuste');
    expect(response.status).toBe(401);
  });

  it('flujo completo de ajuste: crear (resuelve previousQuantity real) → confirmar → verificar stock', async () => {
    const crearAjuste = await request(app.getHttpServer())
      .post('/api/v1/inventario/ajustes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouseId,
        reasonId: motivoDiferenciaId,
        lines: [{ productId, newQuantity: 40 }],
      });
    expect(crearAjuste.status).toBe(201);
    expect(crearAjuste.body.data.stock_adjustment_lines[0].previous_quantity).toBe('50');
    const ajusteId = crearAjuste.body.data.id;

    const confirmar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/ajustes/${ajusteId}/confirmar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmar.status).toBe(201);
    expect(confirmar.body.data.status).toBe('confirmed');

    const disponible = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponible.body.data.quantityOnHand).toBe(40);

    // No se puede confirmar dos veces.
    const confirmarDeNuevo = await request(app.getHttpServer())
      .post(`/api/v1/inventario/ajustes/${ajusteId}/confirmar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmarDeNuevo.status).toBe(409);
  });

  it('flujo completo de conteo: crear → iniciar → capturar (ciego) → completar → genera ajuste → confirmar', async () => {
    const crearConteo = await request(app.getHttpServer())
      .post('/api/v1/inventario/conteos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, scheduledDate: '2026-08-01', productIds: [productId] });
    expect(crearConteo.status).toBe(201);
    expect(crearConteo.body.data.physical_count_lines[0].system_quantity).toBe('40');
    const conteoId = crearConteo.body.data.id;
    const lineaId = crearConteo.body.data.physical_count_lines[0].id;

    const iniciar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/conteos/${conteoId}/iniciar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(iniciar.status).toBe(201);
    expect(iniciar.body.data.status).toBe('in_progress');

    const capturar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/conteos/${conteoId}/lineas/${lineaId}/capturar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ countedQuantity: 35 });
    expect(capturar.status).toBe(201);
    expect(capturar.body.data).toEqual({ id: lineaId, productId, countedQuantity: 35 });
    expect(capturar.body.data.systemQuantity).toBeUndefined();

    const completar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/conteos/${conteoId}/completar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(completar.status).toBe(201);
    expect(completar.body.data.status).toBe('completed');
    expect(completar.body.ajusteGeneradoId).toBeTruthy();

    const confirmarAjusteGenerado = await request(app.getHttpServer())
      .post(`/api/v1/inventario/ajustes/${completar.body.ajusteGeneradoId}/confirmar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmarAjusteGenerado.status).toBe(201);

    const disponible = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponible.body.data.quantityOnHand).toBe(35);
  });

  it('conteo con líneas sin capturar no se puede completar (409)', async () => {
    const crearConteo = await request(app.getHttpServer())
      .post('/api/v1/inventario/conteos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, scheduledDate: '2026-08-01', productIds: [productId] });
    const conteoId = crearConteo.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/inventario/conteos/${conteoId}/iniciar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const completar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/conteos/${conteoId}/completar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(completar.status).toBe(409);
  });

  it('crear conteo con una zona que no pertenece al almacén devuelve 400', async () => {
    const crearOtroAlmacen = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Otro almacén', code: `ALM-OTRO-${Date.now()}` });
    const crearOtraZona = await request(app.getHttpServer())
      .post('/api/v1/inventario/zonas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouseId: crearOtroAlmacen.body.data.id,
        name: 'Zona ajena',
        zoneFunction: 'storage',
      });

    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/conteos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ warehouseId, scheduledDate: '2026-08-01', zoneId: crearOtraZona.body.data.id });
    expect(response.status).toBe(400);
  });

  it('flujo de programación de conteo cíclico: crear → generar (filtrado por zona real)', async () => {
    const crearPrograma = await request(app.getHttpServer())
      .post('/api/v1/inventario/programacion-conteos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ zoneId, frequencyDays: 7 });
    expect(crearPrograma.status).toBe(201);
    const programaId = crearPrograma.body.data.id;
    expect(crearPrograma.body.data.next_run_date).toBeNull();

    const generar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/programacion-conteos/${programaId}/generar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(generar.status).toBe(201);
    expect(generar.body.programa.next_run_date).not.toBeNull();

    const productosDelConteo = generar.body.data.physical_count_lines.map(
      (l: { product_id: string }) => l.product_id,
    );
    expect(productosDelConteo).toContain(productIdZona);
    expect(productosDelConteo).not.toContain(productId); // el producto principal no está en esa zona
  });
});
