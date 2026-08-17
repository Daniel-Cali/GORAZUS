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

describe('Facturas de Compra (e2e)', () => {
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
        legal_name: `Empresa e2e FC ${Date.now()}`,
        tax_id: `NIT-FC-${Date.now()}`,
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
      sessionId: 'e2e-test-session-compras-fc',
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
        code: `UND-FC-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-FC-${Date.now()}`,
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
        legal_name: `Proveedor e2e FC ${Date.now()}`,
        tax_id: `RNC-FC-${Date.now()}`,
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

  it('flujo completo: crear → duplicada rechazada → aprobar → contabilizar → cancelar rechazado', async () => {
    const supplierDocumentNumber = `FACT-${Date.now()}`;
    const crear = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 3, unitCost: 40 }],
      });
    expect(crear.status).toBe(201);
    // Prisma `Decimal.toString()` no rellena ceros de escala fija (confirmado
    // contra el mismo `SerializationInterceptor` en
    // ventas/facturas.controller.e2e-spec.ts, que ya asume este formato) —
    // '120', no '120.0000'.
    expect(crear.body.data.total_amount).toBe('120');
    const facturaId = crear.body.data.id;

    const duplicada = await request(app.getHttpServer())
      .post('/api/v1/compras/facturas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        supplierId,
        supplierDocumentNumber,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 1, unitCost: 1 }],
      });
    expect(duplicada.status).toBe(409);

    const aprobar = await request(app.getHttpServer())
      .post(`/api/v1/compras/facturas/${facturaId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aprobar.status).toBe(201);

    const contabilizar = await request(app.getHttpServer())
      .post(`/api/v1/compras/facturas/${facturaId}/contabilizar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(contabilizar.status).toBe(201);

    const cancelarContabilizada = await request(app.getHttpServer())
      .post(`/api/v1/compras/facturas/${facturaId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelarContabilizada.status).toBe(409);

    const historial = await request(app.getHttpServer())
      .get(`/api/v1/compras/facturas/${facturaId}/historial`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(historial.body.data.length).toBeGreaterThanOrEqual(3); // draft, approved, posted
  });
});
