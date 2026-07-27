import jwt from 'jsonwebtoken';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { CacheModule } from '@gorazus/core-cache';
import { StorageModule } from '@gorazus/core-storage';
import { DatabaseModule } from '@gorazus/core-database';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — necesita la clase PrismaClient real (constructible) del cliente
// generado de `core`, no solo los tipos que reexporta @gorazus/core-database/index.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { VentasModule } from '../ventas.module';

/**
 * Flujo real completo: cotización → aprobar → convertir en pedido (con
 * reserva real de inventario) → convertir a factura parcial → convertir
 * el saldo restante → pedido queda `completed` y la reserva se libera.
 * Contra Postgres/Redis/RabbitMQ reales, mismo patrón que
 * `facturas.controller.e2e-spec.ts`.
 */
describe('Cotizaciones y Pedidos de Venta (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
  let companyId: string;
  let branchId: string;
  let customerId: string;
  let productId: string;
  let warehouseId: string;

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

    const empresa = await prisma.companies.findFirst({ where: { deleted_at: null } });
    if (!empresa) throw new Error('Falta al menos una empresa real en el tenant "demo".');
    companyId = empresa.id;

    const sucursal = await prisma.branches.findFirst({
      where: { company_id: companyId, deleted_at: null },
    });
    if (!sucursal) throw new Error('Falta al menos una sucursal real de esa empresa.');
    branchId = sucursal.id;

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-pedidos',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        StorageModule,
        DatabaseModule,
        SeguridadModule,
        VentasModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    const cliente = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM customers.customers WHERE deleted_at IS NULL LIMIT 1',
    );
    if (!cliente[0]) throw new Error('Falta al menos un cliente real para este test.');
    customerId = cliente[0].id;

    const producto = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM products.products WHERE deleted_at IS NULL LIMIT 1',
    );
    if (!producto[0]) throw new Error('Falta al menos un producto real para este test.');
    productId = producto[0].id;

    const almacen = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM inventory.warehouses WHERE deleted_at IS NULL LIMIT 1',
    );
    if (!almacen[0]) throw new Error('Falta al menos un almacén real para este test.');
    warehouseId = almacen[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /ventas/cotizaciones sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/ventas/cotizaciones');
    expect(response.status).toBe(401);
  });

  it('flujo completo: cotización → aprobar → pedido (con reserva) → factura parcial → factura completa', async () => {
    const crearCotResponse = await request(app.getHttpServer())
      .post('/api/v1/ventas/cotizaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        customerId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 4, unitPrice: 25, discountPercentage: 0 }],
      });
    expect(crearCotResponse.status).toBe(201);
    const cotizacionId = crearCotResponse.body.data.id;

    const aprobarResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/cotizaciones/${cotizacionId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aprobarResponse.status).toBe(201);

    const pedidoResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/pedidos/desde-cotizacion/${cotizacionId}?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pedidoResponse.status).toBe(201);
    const pedidoId = pedidoResponse.body.data.id;
    const lineaId = pedidoResponse.body.data.sales_order_lines[0].id;
    expect(pedidoResponse.body.data.quote_id).toBe(cotizacionId);

    const reservaResponse = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM inventory.stock_reservations WHERE source_entity_id = $1::uuid AND released_at IS NULL',
      pedidoId,
    );
    expect(reservaResponse.length).toBe(1);

    // Convertir dos de las cuatro unidades — el pedido debe quedar "partial".
    const facturaParcialResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/pedidos/${pedidoId}/convertir-a-factura`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ salesOrderLineId: lineaId, quantity: 2 }] });
    expect(facturaParcialResponse.status).toBe(201);
    expect(facturaParcialResponse.body.data.sales_order_id).toBe(pedidoId);
    expect(facturaParcialResponse.body.data.subtotal_amount).toBe('50');

    const pedidoParcialResponse = await request(app.getHttpServer())
      .get(`/api/v1/ventas/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pedidoParcialResponse.body.data.sales_order_lines[0].invoiced_quantity).toBe('2');

    // Sin "lines" — factura el saldo pendiente completo (las 2 unidades restantes).
    const facturaCompletaResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/pedidos/${pedidoId}/convertir-a-factura`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(facturaCompletaResponse.status).toBe(201);

    const pedidoFinalResponse = await request(app.getHttpServer())
      .get(`/api/v1/ventas/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pedidoFinalResponse.body.data.sales_order_lines[0].invoiced_quantity).toBe('4');

    // Facturado por completo — no queda ninguna reserva activa.
    const reservaLiberadaResponse = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM inventory.stock_reservations WHERE source_entity_id = $1::uuid AND released_at IS NULL',
      pedidoId,
    );
    expect(reservaLiberadaResponse.length).toBe(0);

    // Ya no queda saldo pendiente — una tercera conversión debe rechazarse.
    const sinSaldoResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/pedidos/${pedidoId}/convertir-a-factura`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(sinSaldoResponse.status).toBe(409);
  });

  it('POST /ventas/pedidos/:id/cancelar libera la reserva de un pedido sin facturar', async () => {
    const crearPedResponse = await request(app.getHttpServer())
      .post('/api/v1/ventas/pedidos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        customerId,
        currencyCode: 'USD',
        warehouseId,
        lines: [{ productId, quantity: 1, unitPrice: 10, discountPercentage: 0 }],
      });
    expect(crearPedResponse.status).toBe(201);
    const pedidoId = crearPedResponse.body.data.id;

    const cancelarResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/pedidos/${pedidoId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelarResponse.status).toBe(201);

    const reservaResponse = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM inventory.stock_reservations WHERE source_entity_id = $1::uuid AND released_at IS NULL',
      pedidoId,
    );
    expect(reservaResponse.length).toBe(0);
  });
});
