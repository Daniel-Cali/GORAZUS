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
import { StorageModule } from '@gorazus/core-storage';
import type { AccessTokenPayload } from '@gorazus/contracts';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as ProductsPrismaClient } from '../../../../core/database/prisma/schemas/products/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as SuppliersPrismaClient } from '../../../../core/database/prisma/schemas/suppliers/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ComprasModule } from '../compras.module';

/**
 * Test de integración real — mismo patrón que los e2e anteriores de
 * `compras`. NO EJECUTADO en el entorno donde se escribió (Docker/
 * Postgres inactivo) — pendiente de verificación real.
 */
// Timeout explícito: `beforeAll` levanta una app Nest real completa (Postgres/
// Redis/MinIO/RabbitMQ reales) y los flujos encadenan varias llamadas HTTP
// reales — el default de Jest (5000ms) es insuficiente incluso en corridas
// sanas (medido: hasta ~37s en frío).
jest.setTimeout(30000);

describe('Cotejos de Compra (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let productsPrisma: ProductsPrismaClient;
  let suppliersPrisma: SuppliersPrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let productId: string;
  let supplierId: string;

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    productsPrisma = new ProductsPrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
    });
    suppliersPrisma = new SuppliersPrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
    });
    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    for (const client of [prisma, productsPrisma, suppliersPrisma]) {
      await client.$executeRawUnsafe(
        "SELECT set_config('app.current_tenant_id', $1, false)",
        tenant.id,
      );
    }

    const usuario = await prisma.users.findFirst({
      where: { email: 'admin@demo.local', tenant_id: tenant.id },
    });
    if (!usuario)
      throw new Error('Falta el usuario de prueba admin@demo.local — correr seed-rbac.ts primero.');

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e cotejo ${Date.now()}`,
        tax_id: `NIT-COT-${Date.now()}`,
        functional_currency_code: 'USD',
        fiscal_year_start_month: 1,
      },
    });
    companyId = empresa.id;

    // `core.branches.company_id` es NOT NULL y tiene `company_isolation` real —
    // sin fijar el contexto acá, este INSERT lo rechaza Postgres, no solo lo
    // oculta en el SELECT.
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_company_ids', $1, false)",
      companyId,
    );
    const sucursal = await prisma.branches.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        name: 'Principal',
        code: `SUC-COT-${Date.now()}`,
      },
    });
    branchId = sucursal.id;

    // Alinea el contexto de empresa/sucursal del usuario admin de e2e con la
    // empresa recién creada por este propio test — obligatorio desde que
    // `company_isolation`/`branch_isolation` (RESTRICTIVE) están activas.
    await prisma.users.update({
      where: { id: usuario.id },
      data: { company_id: companyId, branch_id: branchId },
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId,
      branchId,
      sessionId: 'e2e-test-session-compras-cotejo',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    await productsPrisma.$executeRawUnsafe(
      "SELECT set_config('app.current_company_ids', $1, false)",
      companyId,
    );
    const unidad = await productsPrisma.units_of_measure.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        code: `UND-COT-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-COT-${Date.now()}`,
        product_type: 'good',
        base_unit_id: unidad.id,
        costing_method: 'average',
      },
    });
    productId = producto.id;

    await suppliersPrisma.$executeRawUnsafe(
      "SELECT set_config('app.current_company_ids', $1, false)",
      companyId,
    );
    const proveedor = await suppliersPrisma.suppliers.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        legal_name: `Proveedor e2e cotejo ${Date.now()}`,
        tax_id: `RNC-COT-${Date.now()}`,
      },
    });
    supplierId = proveedor.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        StorageModule,
        SeguridadModule,
        ComprasModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await productsPrisma.$disconnect();
    await suppliersPrisma.$disconnect();
    await app.close();
  });

  it('flujo completo: OC → aprobar → recibir → facturar → cotejar sin discrepancia → anular', async () => {
    const crearOC = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 10, unitPrice: 20 }],
      });
    const ordenId = crearOC.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const crearRecepcion = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 10 }] });
    const recepcionId = crearRecepcion.body.data.id;

    const crearFactura = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber: `FACT-COT-${Date.now()}`,
        purchaseOrderId: ordenId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 10, unitCost: 20 }],
      });
    const facturaId = crearFactura.body.data.id;

    const cotejar = await request(app.getHttpServer())
      .post('/api/v1/compras/cotejos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, receiptNoteId: recepcionId, purchaseInvoiceId: facturaId });
    expect(cotejar.status).toBe(201);
    // Prisma `Decimal.toString()` no rellena ceros de escala fija (confirmado
    // contra el mismo `SerializationInterceptor` en
    // ventas/facturas.controller.e2e-spec.ts, que ya asume este formato) —
    // '0', no '0.0000'.
    expect(cotejar.body.data.discrepancy_amount).toBe('0');
    expect(cotejar.body.data.is_within_tolerance).toBe(true);
    const cotejoId = cotejar.body.data.id;

    const obtener = await request(app.getHttpServer())
      .get(`/api/v1/compras/cotejos/${cotejoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(obtener.status).toBe(200);

    const anular = await request(app.getHttpServer())
      .post(`/api/v1/compras/cotejos/${cotejoId}/anular`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(anular.status).toBe(201);
  });

  it('POST /compras/cotejos con recepción de otra orden devuelve 400', async () => {
    const crearOC1 = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitPrice: 10 }],
      });
    const crearOC2 = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitPrice: 10 }],
      });
    await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${crearOC1.body.data.id}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const crearRecepcion = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: crearOC1.body.data.id, lines: [{ productId, quantity: 5 }] });

    const crearFactura = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber: `FACT-CRUZ-${Date.now()}`,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitCost: 10 }],
      });

    const cotejarCruzado = await request(app.getHttpServer())
      .post('/api/v1/compras/cotejos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: crearOC2.body.data.id,
        receiptNoteId: crearRecepcion.body.data.id,
        purchaseInvoiceId: crearFactura.body.data.id,
      });
    expect(cotejarCruzado.status).toBe(400);
  });
});
