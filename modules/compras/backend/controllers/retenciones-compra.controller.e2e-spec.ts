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

describe('Retenciones de Compra (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let productsPrisma: ProductsPrismaClient;
  let suppliersPrisma: SuppliersPrismaClient;
  let adminToken: string;
  let companyId: string;
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
        legal_name: `Empresa e2e retenciones ${Date.now()}`,
        tax_id: `NIT-RET-${Date.now()}`,
        functional_currency_code: 'USD',
        fiscal_year_start_month: 1,
      },
    });
    companyId = empresa.id;

    // Alinea el contexto de empresa del usuario admin de e2e con la empresa
    // recién creada por este propio test — obligatorio desde que
    // `company_isolation` (RESTRICTIVE) está activa. Esta suite no crea
    // sucursal propia, así que se limpia branch_id para no arrastrar el de
    // otra suite ejecutada antes contra el mismo usuario sembrado.
    await prisma.users.update({
      where: { id: usuario.id },
      data: { company_id: companyId, branch_id: null },
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId,
      branchId: null,
      sessionId: 'e2e-test-session-compras-ret',
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
        code: `UND-RET-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-RET-${Date.now()}`,
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
        legal_name: `Proveedor e2e retenciones ${Date.now()}`,
        tax_id: `RNC-RET-${Date.now()}`,
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

  it('flujo completo: crear factura (100) → retener 60 → exceder rechazado → completar exacto (40) → anular', async () => {
    const crearFactura = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber: `FACT-RET-${Date.now()}`,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 10, unitCost: 10 }], // total 100
      });
    const facturaId = crearFactura.body.data.id;

    const retencion1 = await request(app.getHttpServer())
      .post('/api/v1/compras/retenciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseInvoiceId: facturaId, amount: 60 });
    expect(retencion1.status).toBe(201);

    const excede = await request(app.getHttpServer())
      .post('/api/v1/compras/retenciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseInvoiceId: facturaId, amount: 50 }); // 60+50 > 100
    expect(excede.status).toBe(409);

    const retencion2 = await request(app.getHttpServer())
      .post('/api/v1/compras/retenciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseInvoiceId: facturaId, amount: 40 }); // 60+40 = 100
    expect(retencion2.status).toBe(201);

    const anular = await request(app.getHttpServer())
      .post(`/api/v1/compras/retenciones/${retencion2.body.data.id}/anular`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(anular.status).toBe(201);
  });

  it('POST /compras/retenciones contra una factura cancelada devuelve 409', async () => {
    const crearFactura = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber: `FACT-RET-CANC-${Date.now()}`,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitCost: 10 }],
      });
    const facturaId = crearFactura.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/compras/facturas/${facturaId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const retencion = await request(app.getHttpServer())
      .post('/api/v1/compras/retenciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseInvoiceId: facturaId, amount: 5 });
    expect(retencion.status).toBe(409);
  });
});
