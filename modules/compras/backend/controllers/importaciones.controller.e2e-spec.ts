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

describe('Importaciones (e2e)', () => {
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
        legal_name: `Empresa e2e imports ${Date.now()}`,
        tax_id: `NIT-IMP-${Date.now()}`,
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
        code: `SUC-IMP-${Date.now()}`,
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
      sessionId: 'e2e-test-session-compras-imp',
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
        code: `UND-IMP-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-IMP-${Date.now()}`,
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
        legal_name: `Proveedor e2e imports ${Date.now()}`,
        tax_id: `RNC-IMP-${Date.now()}`,
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

  it('POST /compras/importaciones contra una OC en draft devuelve 409', async () => {
    const crearOC = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitPrice: 20 }],
      });
    const respuesta = await request(app.getHttpServer())
      .post('/api/v1/compras/importaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: crearOC.body.data.id });
    expect(respuesta.status).toBe(409);
  });

  it('flujo completo: OC aprobada → abrir expediente → gastos → aduana → nacionalizar → cancelar rechazado', async () => {
    const crearOC = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 100, unitPrice: 5 }],
      });
    const ordenId = crearOC.body.data.id;

    await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const crearExpediente = await request(app.getHttpServer())
      .post('/api/v1/compras/importaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId });
    expect(crearExpediente.status).toBe(201);
    const importId = crearExpediente.body.data.id;

    const gastoFlete = await request(app.getHttpServer())
      .post(`/api/v1/compras/importaciones/${importId}/gastos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ expenseType: 'freight', amount: 200 });
    expect(gastoFlete.status).toBe(201);

    const avanzar = await request(app.getHttpServer())
      .post(`/api/v1/compras/importaciones/${importId}/avanzar-a-aduana`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(avanzar.status).toBe(201);

    const gastoAduana = await request(app.getHttpServer())
      .post(`/api/v1/compras/importaciones/${importId}/gastos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ expenseType: 'customs', amount: 80 });
    expect(gastoAduana.status).toBe(201);

    const nacionalizar = await request(app.getHttpServer())
      .post(`/api/v1/compras/importaciones/${importId}/nacionalizar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(nacionalizar.status).toBe(201);

    const cancelarLuegoDeCleared = await request(app.getHttpServer())
      .post(`/api/v1/compras/importaciones/${importId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelarLuegoDeCleared.status).toBe(409);

    const obtener = await request(app.getHttpServer())
      .get(`/api/v1/compras/importaciones/${importId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(obtener.body.data.import_expenses).toHaveLength(2);

    const historial = await request(app.getHttpServer())
      .get(`/api/v1/compras/importaciones/${importId}/historial`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(historial.body.data.length).toBeGreaterThanOrEqual(3); // in_transit, at_customs, cleared
  });
});
