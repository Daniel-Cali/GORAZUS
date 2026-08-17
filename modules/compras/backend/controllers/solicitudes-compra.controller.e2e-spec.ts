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
// Ruta relativa — necesita la clase PrismaClient real (constructible) del cliente
// generado de `core`, no solo los tipos que reexporta @gorazus/core-database/index.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as ProductsPrismaClient } from '../../../../core/database/prisma/schemas/products/generated';
// PERMISSIONS_RESOLVER real (RBAC) solo queda registrado si SeguridadModule
// (Global) forma parte del árbol de este TestingModule — mismo motivo que
// modules/ventas/backend/controllers/pedidos-venta.controller.e2e-spec.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ComprasModule } from '../compras.module';

/**
 * Test de integración real (mismo patrón que
 * `modules/ventas/backend/controllers/pedidos-venta.controller.e2e-spec.ts`)
 * — usa el tenant/usuario de prueba ya sembrados (`seed-rbac.ts demo
 * admin@demo.local`), que a partir de esta parte también sostiene
 * `compras.gestionar_solicitudes`. Empresa/unidad de medida/producto
 * propios, creados directamente vía Prisma.
 *
 * NO EJECUTADO en el entorno donde se escribió (Docker/Postgres inactivo
 * en esta sesión) — queda pendiente de verificación real antes de cerrar
 * esta fase como probada de punta a punta.
 */
// Timeout explícito: `beforeAll` levanta una app Nest real completa (Postgres/
// Redis/MinIO/RabbitMQ reales) y los flujos encadenan varias llamadas HTTP
// reales — el default de Jest (5000ms) es insuficiente incluso en corridas
// sanas (medido: hasta ~37s en frío).
jest.setTimeout(30000);

describe('Solicitudes de Compra (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let productsPrisma: ProductsPrismaClient;
  let adminToken: string;
  let companyId: string;
  let branchId: string;
  let productId: string;

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    productsPrisma = new ProductsPrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
    });
    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );
    await productsPrisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    const usuario = await prisma.users.findFirst({
      where: { email: 'admin@demo.local', tenant_id: tenant.id },
    });
    if (!usuario)
      throw new Error('Falta el usuario de prueba admin@demo.local — correr seed-rbac.ts primero.');

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e compras ${Date.now()}`,
        tax_id: `NIT-COM-${Date.now()}`,
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
        code: `SUC-COM-${Date.now()}`,
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
      sessionId: 'e2e-test-session-compras',
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
        code: `UND-COM-${Date.now()}`,
      },
    });
    const producto = await productsPrisma.products.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        sku: `SKU-COM-${Date.now()}`,
        product_type: 'good',
        base_unit_id: unidad.id,
        costing_method: 'average',
      },
    });
    productId = producto.id;

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
    await app.close();
  });

  it('GET /compras/solicitudes sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get(
      `/api/v1/compras/solicitudes?companyId=${companyId}`,
    );
    expect(response.status).toBe(401);
  });

  it('POST /compras/solicitudes con producto inexistente devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/compras/solicitudes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        lines: [{ productId: '00000000-0000-0000-0000-000000000099', quantity: 5 }],
      });
    expect(response.status).toBe(400);
  });

  it('flujo completo: crear → enviar → aprobar → historial', async () => {
    const crear = await request(app.getHttpServer())
      .post('/api/v1/compras/solicitudes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, lines: [{ productId, quantity: 25 }] });
    expect(crear.status).toBe(201);
    const solicitudId = crear.body.data.id;

    const editarAntesDeEnviar = await request(app.getHttpServer())
      .put(`/api/v1/compras/solicitudes/${solicitudId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ productId, quantity: 30 }] });
    expect(editarAntesDeEnviar.status).toBe(200);

    const enviar = await request(app.getHttpServer())
      .post(`/api/v1/compras/solicitudes/${solicitudId}/enviar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(enviar.status).toBe(201);

    const editarLuegoDeEnviar = await request(app.getHttpServer())
      .put(`/api/v1/compras/solicitudes/${solicitudId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lines: [{ productId, quantity: 99 }] });
    expect(editarLuegoDeEnviar.status).toBe(409);

    const aprobar = await request(app.getHttpServer())
      .post(`/api/v1/compras/solicitudes/${solicitudId}/aprobar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(aprobar.status).toBe(201);

    const historial = await request(app.getHttpServer())
      .get(`/api/v1/compras/solicitudes/${solicitudId}/historial`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(historial.status).toBe(200);
    expect(historial.body.data.length).toBeGreaterThanOrEqual(3); // draft, submitted, approved
  });
});
