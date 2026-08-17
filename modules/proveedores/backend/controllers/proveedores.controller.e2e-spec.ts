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
// PERMISSIONS_RESOLVER real (RBAC) solo queda registrado si SeguridadModule
// (Global) forma parte del árbol de este TestingModule — mismo motivo que
// modules/productos/backend/controllers/productos.controller.e2e-spec.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ProveedoresModule } from '../proveedores.module';

/**
 * Test de integración real (mismo patrón que
 * `modules/productos/backend/controllers/productos.controller.e2e-spec.ts`)
 * — usa el tenant/usuario de prueba ya sembrados (`seed-rbac.ts demo
 * admin@demo.local`), que a partir de esta parte también sostiene
 * `proveedores.gestionar_proveedores`. Empresa propia, creada directamente
 * vía Prisma — evita importar `ConfiguracionModule` acá.
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

describe('Proveedores (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;

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

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e proveedores ${Date.now()}`,
        tax_id: `NIT-PROV-${Date.now()}`,
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
      sessionId: 'e2e-test-session-proveedores',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        StorageModule,
        SeguridadModule,
        ProveedoresModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /proveedores sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/proveedores');
    expect(response.status).toBe(401);
  });

  it('POST /proveedores con companyId inexistente devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/proveedores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: '00000000-0000-0000-0000-000000000099',
        legalName: 'Proveedor X',
        taxId: `RNC-X-${Date.now()}`,
      });
    expect(response.status).toBe(400);
  });

  it('flujo completo: crear → obtener → listar → actualizar → bloquear → desbloquear', async () => {
    const taxId = `RNC-${Date.now()}`;
    const crear = await request(app.getHttpServer())
      .post('/api/v1/proveedores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, legalName: 'Ferretería El Tornillo SRL', taxId, paymentTermsDays: 30 });
    expect(crear.status).toBe(201);
    const proveedorId = crear.body.data.id;

    const obtener = await request(app.getHttpServer())
      .get(`/api/v1/proveedores/${proveedorId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(obtener.status).toBe(200);
    expect(obtener.body.data.tax_id).toBe(taxId);

    const listar = await request(app.getHttpServer())
      .get('/api/v1/proveedores?isBlocked=false')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listar.body.data.some((p: { id: string }) => p.id === proveedorId)).toBe(true);

    const actualizar = await request(app.getHttpServer())
      .patch(`/api/v1/proveedores/${proveedorId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentTermsDays: 45 });
    expect(actualizar.status).toBe(200);
    expect(actualizar.body.data.payment_terms_days).toBe(45);

    const bloquear = await request(app.getHttpServer())
      .post(`/api/v1/proveedores/${proveedorId}/bloquear`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Incumplimiento de entrega' });
    expect(bloquear.status).toBe(201);
    expect(bloquear.body.data.is_blocked).toBe(true);

    const bloquearDeNuevo = await request(app.getHttpServer())
      .post(`/api/v1/proveedores/${proveedorId}/bloquear`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(bloquearDeNuevo.status).toBe(409);

    const desbloquear = await request(app.getHttpServer())
      .post(`/api/v1/proveedores/${proveedorId}/desbloquear`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Regularizado' });
    expect(desbloquear.status).toBe(201);
    expect(desbloquear.body.data.is_blocked).toBe(false);
  });
});
