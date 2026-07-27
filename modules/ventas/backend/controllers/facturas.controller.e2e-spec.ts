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
 * Test de integración real del Motor de Facturación Enterprise — Parte 1:
 * crear (borrador) → editar → duplicar → confirmar → anular, más el
 * rechazo de transiciones inválidas (editar/eliminar algo que ya no es
 * borrador, anular dos veces). Contra Postgres/Redis/RabbitMQ reales,
 * mismo patrón que `roles.controller.e2e-spec.ts`/`clientes.controller.e2e-spec.ts`.
 */
describe('FacturasController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
  let companyId: string;
  let branchId: string;
  let customerId: string;
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
      sessionId: 'e2e-test-session-facturas',
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

    // Cliente y producto reales — consulta directa (schemas `customers`/
    // `products`, fuera del árbol de `VentasModule`) en vez de crearlos vía
    // HTTP, para no depender de importar `ClientesModule` en este test.
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /ventas/facturas sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/ventas/facturas');
    expect(response.status).toBe(401);
  });

  it('flujo completo: crear borrador, editar, listar con filtros, confirmar', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/ventas/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        customerId,
        salesChannel: 'store',
        currencyCode: 'USD',
        generalDiscountPercentage: 10,
        lines: [{ productId, quantity: 2, unitPrice: 50, discountPercentage: 0 }],
      });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.subtotal_amount).toBe('90'); // 100 - 10% general
    const facturaId = createResponse.body.data.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.invoice_lines).toHaveLength(1);

    const actualizarResponse = await request(app.getHttpServer())
      .put(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        generalDiscountPercentage: 0,
        lines: [{ productId, quantity: 3, unitPrice: 40, discountPercentage: 0 }],
      });
    expect(actualizarResponse.status).toBe(200);
    expect(actualizarResponse.body.data.subtotal_amount).toBe('120');

    // Verificación directa por id, no por paginación por defecto —
    // `customerId` acumula facturas de corridas repetidas de este mismo
    // e2e a lo largo de la sesión (38+ hoy), la página por defecto
    // (pageSize=20) puede no incluir la recién creada; mismo hallazgo y
    // mismo fix que `roles.controller.e2e-spec.ts` (`v0.19.0`).
    const listResponse = await request(app.getHttpServer())
      .get(`/api/v1/ventas/facturas?customerId=${customerId}&sortBy=total_amount&sortDir=asc`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.status).toBe(200);

    const facturaEnListaResponse = await request(app.getHttpServer())
      .get(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(facturaEnListaResponse.status).toBe(200);
    expect(facturaEnListaResponse.body.data.customer_id).toBe(customerId);

    const confirmarResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/facturas/${facturaId}/confirmar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmarResponse.status).toBe(201);

    // Ya no es borrador — editar/eliminar debe rechazarse con 409.
    const editarConfirmadaResponse = await request(app.getHttpServer())
      .put(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ generalDiscountPercentage: 0, lines: [{ productId, quantity: 1, unitPrice: 10 }] });
    expect(editarConfirmadaResponse.status).toBe(409);

    const eliminarConfirmadaResponse = await request(app.getHttpServer())
      .delete(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(eliminarConfirmadaResponse.status).toBe(409);

    // Anular una factura confirmada sí es válido.
    const anularResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/facturas/${facturaId}/anular`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(anularResponse.status).toBe(201);

    // Anular dos veces no.
    const anularDeNuevoResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/facturas/${facturaId}/anular`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(anularDeNuevoResponse.status).toBe(409);
  });

  it('flujo de borrador: crear, editar, duplicar, eliminar', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/ventas/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        customerId,
        salesChannel: 'store',
        currencyCode: 'USD',
        lines: [{ productId, quantity: 1, unitPrice: 25, discountPercentage: 0 }],
      });
    expect(createResponse.status).toBe(201);
    const facturaId = createResponse.body.data.id;

    const duplicarResponse = await request(app.getHttpServer())
      .post(`/api/v1/ventas/facturas/${facturaId}/duplicar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(duplicarResponse.status).toBe(201);
    expect(duplicarResponse.body.data.id).not.toBe(facturaId);
    expect(duplicarResponse.body.data.customer_id).toBe(customerId);

    const eliminarResponse = await request(app.getHttpServer())
      .delete(`/api/v1/ventas/facturas/${facturaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(eliminarResponse.status).toBe(200);
    expect(eliminarResponse.body.data.deleted_at).not.toBeNull();
  });

  it('POST /ventas/facturas con un descuento general fuera de rango devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ventas/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        customerId,
        currencyCode: 'USD',
        generalDiscountPercentage: 150,
        lines: [{ productId, quantity: 1, unitPrice: 10 }],
      });
    expect(response.status).toBe(400);
  });

  it('GET /ventas/facturas/:id con id inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/ventas/facturas/00000000-0000-0000-0000-000000000099')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
