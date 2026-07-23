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
// almacenes.controller.e2e-spec.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
// Producto real vía la API de Productos (no un insert crudo) — flujo de
// integración real entre los dos módulos de negocio nuevos de esta rama.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ProductosModule } from '../../../productos/backend/productos.module';
import { InventarioModule } from '../inventario.module';

/**
 * Test de integración real del motor de stock/movimientos (FASE 05,
 * Parte 02) — mismo patrón que `almacenes.controller.e2e-spec.ts`.
 * Empresa/sucursal/almacén/unidad de medida/producto propios, creados
 * antes de cada corrida.
 */
describe('TiposMovimientoController / StockController / MovimientosController / KardexController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let warehouseId: string;
  let productId: string;

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
      sessionId: 'e2e-test-session-inventario-stock',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e stock ${Date.now()}`,
        tax_id: `NIT-STK-${Date.now()}`,
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
        name: 'Sucursal e2e stock',
        code: `SUC-STK-${Date.now()}`,
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
      .send({ companyId, branchId, name: 'Almacén e2e stock', code: `ALM-STK-${Date.now()}` });
    warehouseId = crearAlmacen.body.data.id;

    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `UN-STK-${Date.now()}` });

    const crearProducto = await request(app.getHttpServer())
      .post('/api/v1/productos/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        sku: `SKU-STK-${Date.now()}`,
        productType: 'good',
        baseUnitId: crearUnidad.body.data.id,
      });
    productId = crearProducto.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /inventario/tipos-movimiento sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/inventario/tipos-movimiento');
    expect(response.status).toBe(401);
  });

  it('flujo completo: tipo de movimiento → entrada → salida → stock → kardex', async () => {
    const codeEntrada = `E2E-IN-${Date.now()}`;
    const codeSalida = `E2E-OUT-${Date.now()}`;

    const crearTipoEntrada = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: codeEntrada, direction: 'in' });
    expect(crearTipoEntrada.status).toBe(201);
    const tipoEntradaId = crearTipoEntrada.body.data.id;

    const crearTipoSalida = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: codeSalida, direction: 'out' });
    expect(crearTipoSalida.status).toBe(201);
    const tipoSalidaId = crearTipoSalida.body.data.id;

    const duplicado = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: codeEntrada, direction: 'in' });
    expect(duplicado.status).toBe(409);

    // Entrada de 100
    const entrada = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        warehouseId,
        movementTypeId: tipoEntradaId,
        quantity: 100,
        unitCost: 5.5,
      });
    expect(entrada.status).toBe(201);

    const disponibleTrasEntrada = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleTrasEntrada.body.data.quantityOnHand).toBe(100);
    expect(disponibleTrasEntrada.body.data.quantityAvailable).toBe(100);

    // Salida de 30
    const salida = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, warehouseId, movementTypeId: tipoSalidaId, quantity: 30 });
    expect(salida.status).toBe(201);

    const disponibleTrasSalida = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleTrasSalida.body.data.quantityOnHand).toBe(70);

    // Salida que excede el disponible
    const salidaExcesiva = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, warehouseId, movementTypeId: tipoSalidaId, quantity: 1000 });
    expect(salidaExcesiva.status).toBe(409);

    // El stock no debe haber cambiado tras el rechazo
    const disponibleTrasRechazo = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleTrasRechazo.body.data.quantityOnHand).toBe(70);

    // Kardex — 2 movimientos, saldo corrido final 70
    const kardex = await request(app.getHttpServer())
      .get(`/api/v1/inventario/kardex?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(kardex.status).toBe(200);
    expect(kardex.body.data).toHaveLength(2);
    expect(Number(kardex.body.data[0].runningBalance)).toBe(70);

    // Listado de movimientos
    const movimientos = await request(app.getHttpServer())
      .get(`/api/v1/inventario/movimientos?productId=${productId}&warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(movimientos.body.data).toHaveLength(2);

    // No se puede cambiar la dirección de un tipo que ya tiene movimientos
    const cambiarDireccion = await request(app.getHttpServer())
      .patch(`/api/v1/inventario/tipos-movimiento/${tipoEntradaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ direction: 'out' });
    expect(cambiarDireccion.status).toBe(409);
  });

  it('POST /inventario/movimientos con producto inexistente devuelve 400', async () => {
    const crearTipo = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `E2E-PROD-X-${Date.now()}`, direction: 'in' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId: '00000000-0000-0000-0000-000000000099',
        warehouseId,
        movementTypeId: crearTipo.body.data.id,
        quantity: 10,
      });
    expect(response.status).toBe(400);
  });

  it('POST /inventario/movimientos con almacén inexistente devuelve 400', async () => {
    const crearTipo = await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `E2E-WH-X-${Date.now()}`, direction: 'in' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        warehouseId: '00000000-0000-0000-0000-000000000099',
        movementTypeId: crearTipo.body.data.id,
        quantity: 10,
      });
    expect(response.status).toBe(400);
  });
});
