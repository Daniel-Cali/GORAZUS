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
 * Test de integración real — mismo patrón que
 * `modules/compras/backend/controllers/solicitudes-compra.controller.e2e-spec.ts`.
 * NO EJECUTADO en el entorno donde se escribió (Docker/Postgres inactivo
 * en esta sesión) — queda pendiente de verificación real.
 */
// Timeout explícito: `beforeAll` levanta una app Nest real completa (Postgres/
// Redis/MinIO/RabbitMQ reales) y los flujos encadenan varias llamadas HTTP
// reales — el default de Jest (5000ms) es insuficiente incluso en corridas
// sanas (medido: hasta ~37s en frío).
jest.setTimeout(30000);

describe('Órdenes de Compra (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let productsPrisma: ProductsPrismaClient;
  let suppliersPrisma: SuppliersPrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let productId: string;
  let supplierId: string;
  let blockedSupplierId: string;

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
        legal_name: `Empresa e2e OC ${Date.now()}`,
        tax_id: `NIT-OC-${Date.now()}`,
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
        code: `SUC-OC-${Date.now()}`,
      },
    });
    branchId = sucursal.id;

    // Alinea el contexto de empresa/sucursal del usuario admin de e2e con la
    // empresa recién creada por este propio test — obligatorio desde que
    // `company_isolation`/`branch_isolation` (RESTRICTIVE) están activas: el
    // JWT debe cargar la MISMA empresa que las filas que este test va a
    // escribir, o Postgres rechaza el INSERT (WITH CHECK).
    await prisma.users.update({
      where: { id: usuario.id },
      data: { company_id: companyId, branch_id: branchId },
    });

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId,
      branchId,
      sessionId: 'e2e-test-session-compras-oc',
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
        code: `UND-OC-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-OC-${Date.now()}`,
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
        legal_name: `Proveedor e2e OC ${Date.now()}`,
        tax_id: `RNC-OC-${Date.now()}`,
      },
    });
    supplierId = proveedor.id;

    const proveedorBloqueado = await suppliersPrisma.suppliers.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        legal_name: `Proveedor bloqueado e2e OC ${Date.now()}`,
        tax_id: `RNC-OC-BLOQ-${Date.now()}`,
        is_blocked: true,
      },
    });
    blockedSupplierId = proveedorBloqueado.id;

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

  it('POST /compras/ordenes con proveedor bloqueado devuelve 409', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId: blockedSupplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 5, unitPrice: 10 }],
      });
    expect(response.status).toBe(409);
  });

  it('flujo completo: crear → aprobar → historial → cancelar rechazado tras aprobar y luego permitido', async () => {
    const crear = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 20, unitPrice: 15.5 }],
      });
    expect(crear.status).toBe(201);
    // Prisma `Decimal.toString()` no rellena ceros de escala fija (confirmado
    // contra el mismo `SerializationInterceptor` en
    // ventas/facturas.controller.e2e-spec.ts, que ya asume este formato) —
    // '310', no '310.0000'.
    expect(crear.body.data.total_amount).toBe('310');
    const ordenId = crear.body.data.id;

    const aprobar = await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aprobar.status).toBe(201);

    const editarLuegoDeAprobar = await request(app.getHttpServer())
      .put(`/api/v1/compras/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ productId, quantity: 1, unitPrice: 1 }] });
    expect(editarLuegoDeAprobar.status).toBe(409);

    const cancelar = await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/cancelar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cancelar.status).toBe(201);

    const historial = await request(app.getHttpServer())
      .get(`/api/v1/compras/ordenes/${ordenId}/historial`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(historial.body.data.length).toBeGreaterThanOrEqual(3); // draft, approved, cancelled
  });
});
