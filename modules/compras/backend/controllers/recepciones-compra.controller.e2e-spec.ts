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

describe('Recepciones de Compra (e2e)', () => {
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
        legal_name: `Empresa e2e GR ${Date.now()}`,
        tax_id: `NIT-GR-${Date.now()}`,
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
        code: `SUC-GR-${Date.now()}`,
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
      sessionId: 'e2e-test-session-compras-gr',
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
        code: `UND-GR-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-GR-${Date.now()}`,
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
        legal_name: `Proveedor e2e GR ${Date.now()}`,
        tax_id: `RNC-GR-${Date.now()}`,
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

  it('flujo completo: crear OC → aprobar → recibir parcial → exceder rechazado → recibir el resto', async () => {
    const crearOC = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 10, unitPrice: 5 }],
      });
    const ordenId = crearOC.body.data.id;

    const crearSinAprobar = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 1 }] });
    expect(crearSinAprobar.status).toBe(409);

    await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);

    const recepcion1 = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 6 }] });
    expect(recepcion1.status).toBe(201);

    const excede = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 5 }] }); // 6+5 > 10
    expect(excede.status).toBe(409);

    const recepcion2 = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 4 }] }); // 6+4 = 10, exacto
    expect(recepcion2.status).toBe(201);

    const listar = await request(app.getHttpServer())
      .get(`/api/v1/compras/recepciones?companyId=${companyId}&purchaseOrderId=${ordenId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listar.body.data).toHaveLength(2);

    const anular = await request(app.getHttpServer())
      .post(`/api/v1/compras/recepciones/${recepcion2.body.data.id}/anular`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(anular.status).toBe(201);

    // Tras anular la segunda, vuelve a caber recibir 4 más.
    const recepcion3 = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ purchaseOrderId: ordenId, lines: [{ productId, quantity: 4 }] });
    expect(recepcion3.status).toBe(201);
  });

  /**
   * ISSUE-07 — idempotencia real contra Postgres (índice único parcial
   * `uq_purchases_goods_receipt_notes_idempotency_key`,
   * `44_idempotency_key_goods_receipt_notes.sql`). Casos 1/3 solo requieren
   * secuencialidad; el Caso 2 es la única prueba real de la ventana de
   * carrera que el lookup previo del servicio, por sí solo, no cierra —
   * dos solicitudes concurrentes deben resolver a exactamente un registro,
   * nunca dos.
   */
  it('ISSUE-07: idempotencyKey evita duplicados en Recepciones de Compra', async () => {
    const crearOC = await request(app.getHttpServer())
      .post('/api/v1/compras/ordenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        supplierId,
        currencyCode: 'USD',
        lines: [{ productId, quantity: 10, unitPrice: 5 }],
      });
    const ordenId = crearOC.body.data.id;
    await request(app.getHttpServer())
      .post(`/api/v1/compras/ordenes/${ordenId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Caso 1: misma clave, secuencial — segunda llamada devuelve el mismo registro, no crea uno nuevo.
    const primeraAbc = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: ordenId,
        lines: [{ productId, quantity: 1 }],
        idempotencyKey: 'abc',
      });
    expect(primeraAbc.status).toBe(201);

    const segundaAbc = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: ordenId,
        lines: [{ productId, quantity: 1 }],
        idempotencyKey: 'abc',
      });
    expect(segundaAbc.status).toBe(201);
    expect(segundaAbc.body.data.id).toBe(primeraAbc.body.data.id);

    // Caso 2: misma clave, concurrente — nunca dos inserts (índice único parcial + catch de P2002 en el repositorio).
    const [concurrenteA, concurrenteB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/compras/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderId: ordenId,
          lines: [{ productId, quantity: 1 }],
          idempotencyKey: 'xyz',
        }),
      request(app.getHttpServer())
        .post('/api/v1/compras/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          purchaseOrderId: ordenId,
          lines: [{ productId, quantity: 1 }],
          idempotencyKey: 'xyz',
        }),
    ]);
    expect(concurrenteA.status).toBe(201);
    expect(concurrenteB.status).toBe(201);
    expect(concurrenteA.body.data.id).toBe(concurrenteB.body.data.id);

    // Caso 3: claves diferentes — dos operaciones independientes, dos registros reales.
    const claveUno = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: ordenId,
        lines: [{ productId, quantity: 1 }],
        idempotencyKey: 'key-1',
      });
    const claveDos = await request(app.getHttpServer())
      .post('/api/v1/compras/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        purchaseOrderId: ordenId,
        lines: [{ productId, quantity: 1 }],
        idempotencyKey: 'key-2',
      });
    expect(claveUno.status).toBe(201);
    expect(claveDos.status).toBe(201);
    expect(claveUno.body.data.id).not.toBe(claveDos.body.data.id);

    // Verificación final: exactamente 4 recepciones reales para esta orden
    // (abc x1, xyz x1, key-1, key-2) — nunca 6, pese a 6 solicitudes HTTP.
    const listar = await request(app.getHttpServer())
      .get(`/api/v1/compras/recepciones?companyId=${companyId}&purchaseOrderId=${ordenId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listar.body.data).toHaveLength(4);
  });
});
