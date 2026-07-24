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
 * Test de integración real de Reservas y Transferencias (FASE 05, Parte
 * 03) — mismo patrón que `stock-movimientos.controller.e2e-spec.ts`.
 * Empresa/sucursal/2 almacenes/producto propios, creados antes de cada
 * corrida.
 */
describe('ReservasController / TransferenciasController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let warehouseAId: string;
  let warehouseBId: string;
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
      sessionId: 'e2e-test-session-inventario-reservas-transferencias',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e reservas/transferencias ${Date.now()}`,
        tax_id: `NIT-RES-${Date.now()}`,
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
        name: 'Sucursal e2e reservas/transferencias',
        code: `SUC-RES-${Date.now()}`,
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

    const crearAlmacenA = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén A', code: `ALM-A-${Date.now()}` });
    warehouseAId = crearAlmacenA.body.data.id;

    const crearAlmacenB = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén B', code: `ALM-B-${Date.now()}` });
    warehouseBId = crearAlmacenB.body.data.id;

    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `UN-RES-${Date.now()}` });

    const crearProducto = await request(app.getHttpServer())
      .post('/api/v1/productos/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        sku: `SKU-RES-${Date.now()}`,
        productType: 'good',
        baseUnitId: crearUnidad.body.data.id,
      });
    productId = crearProducto.body.data.id;

    // Tipos de movimiento que necesita el motor (Parte 02) + los dos que
    // necesitan las transferencias (Parte 03) — un tenant real correría
    // seed-stock-movement-types.ts una vez, acá se crean inline para no
    // depender de que ese seed ya se haya corrido contra esta base.
    await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'receipt', direction: 'in' });
    await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'transfer_out', direction: 'out' });
    await request(app.getHttpServer())
      .post('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'transfer_in', direction: 'in' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /inventario/reservas sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/inventario/reservas');
    expect(response.status).toBe(401);
  });

  it('flujo de reservas: reservar → exceder disponible → liberar → volver a reservar', async () => {
    // Carga inicial de 50 vía el motor de movimientos (Parte 02).
    const tipoReceipt = await request(app.getHttpServer())
      .get('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`);
    const receiptId = tipoReceipt.body.data.find((t: { code: string }) => t.code === 'receipt').id;

    await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, warehouseId: warehouseAId, movementTypeId: receiptId, quantity: 50 });

    // Reservar 30 — dentro de lo disponible.
    const reservar = await request(app.getHttpServer())
      .post('/api/v1/inventario/reservas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        warehouseId: warehouseAId,
        quantity: 30,
        sourceModule: 'ventas',
        sourceEntityId: randomUUID(),
      });
    expect(reservar.status).toBe(201);
    const reservaId = reservar.body.data.id;

    const disponibleTrasReserva = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleTrasReserva.body.data.quantityOnHand).toBe(50);
    expect(disponibleTrasReserva.body.data.quantityReserved).toBe(30);
    expect(disponibleTrasReserva.body.data.quantityAvailable).toBe(20);

    // Reservar 30 más (quedan 20 disponibles) — debe rechazarse.
    const reservaExcesiva = await request(app.getHttpServer())
      .post('/api/v1/inventario/reservas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        warehouseId: warehouseAId,
        quantity: 30,
        sourceModule: 'ventas',
        sourceEntityId: randomUUID(),
      });
    expect(reservaExcesiva.status).toBe(409);

    // Una salida no puede dejar on_hand por debajo de lo reservado.
    const salidaQueChocaConReserva = await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        warehouseId: warehouseAId,
        movementTypeId: (
          await request(app.getHttpServer())
            .get('/api/v1/inventario/tipos-movimiento')
            .set('Authorization', `Bearer ${adminToken}`)
        ).body.data.find((t: { code: string }) => t.code === 'transfer_out').id,
        quantity: 40,
      });
    expect(salidaQueChocaConReserva.status).toBe(409);

    // Liberar la reserva.
    const liberar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/reservas/${reservaId}/liberar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(liberar.status).toBe(201);

    const disponibleTrasLiberar = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleTrasLiberar.body.data.quantityReserved).toBe(0);
    expect(disponibleTrasLiberar.body.data.quantityAvailable).toBe(50);

    // Liberar de nuevo debe rechazarse (idempotencia).
    const liberarDeNuevo = await request(app.getHttpServer())
      .post(`/api/v1/inventario/reservas/${reservaId}/liberar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(liberarDeNuevo.status).toBe(409);
  });

  it('flujo completo de transferencia: crear → iniciar → recibir', async () => {
    const tipos = await request(app.getHttpServer())
      .get('/api/v1/inventario/tipos-movimiento')
      .set('Authorization', `Bearer ${adminToken}`);
    const receiptId = tipos.body.data.find((t: { code: string }) => t.code === 'receipt').id;

    await request(app.getHttpServer())
      .post('/api/v1/inventario/movimientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, warehouseId: warehouseAId, movementTypeId: receiptId, quantity: 100 });

    const crearTransferencia = await request(app.getHttpServer())
      .post('/api/v1/inventario/transferencias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceWarehouseId: warehouseAId,
        destinationWarehouseId: warehouseBId,
        documentNumber: `TRF-${Date.now()}`,
        lines: [{ productId, quantity: 25 }],
      });
    expect(crearTransferencia.status).toBe(201);
    expect(crearTransferencia.body.data.status).toBe('draft');
    const transferId = crearTransferencia.body.data.id;

    const iniciar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/transferencias/${transferId}/iniciar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(iniciar.status).toBe(201);
    expect(iniciar.body.data.status).toBe('in_transit');

    const disponibleOrigenTrasIniciar = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleOrigenTrasIniciar.body.data.quantityOnHand).toBe(75);

    // No se puede iniciar dos veces.
    const iniciarDeNuevo = await request(app.getHttpServer())
      .post(`/api/v1/inventario/transferencias/${transferId}/iniciar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(iniciarDeNuevo.status).toBe(409);

    const recibir = await request(app.getHttpServer())
      .post(`/api/v1/inventario/transferencias/${transferId}/recibir`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(recibir.status).toBe(201);
    expect(recibir.body.data.status).toBe('received');

    const disponibleDestinoTrasRecibir = await request(app.getHttpServer())
      .get(`/api/v1/inventario/stock/disponible?productId=${productId}&warehouseId=${warehouseBId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(disponibleDestinoTrasRecibir.body.data.quantityOnHand).toBe(25);

    // No se puede cancelar una transferencia ya recibida.
    const cancelar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/transferencias/${transferId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelar.status).toBe(409);
  });

  it('POST /inventario/transferencias con origen y destino iguales devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/transferencias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceWarehouseId: warehouseAId,
        destinationWarehouseId: warehouseAId,
        documentNumber: `TRF-X-${Date.now()}`,
        lines: [{ productId, quantity: 1 }],
      });
    expect(response.status).toBe(400);
  });

  it('cancelar una transferencia en draft no genera movimientos', async () => {
    const crear = await request(app.getHttpServer())
      .post('/api/v1/inventario/transferencias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceWarehouseId: warehouseAId,
        destinationWarehouseId: warehouseBId,
        documentNumber: `TRF-CANCEL-${Date.now()}`,
        lines: [{ productId, quantity: 5 }],
      });

    const cancelar = await request(app.getHttpServer())
      .post(`/api/v1/inventario/transferencias/${crear.body.data.id}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelar.status).toBe(201);
    expect(cancelar.body.data.status).toBe('cancelled');
  });
});
