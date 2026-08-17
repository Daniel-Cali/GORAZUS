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
import { CrmModule } from '../crm.module';

/**
 * Test de integración real del flujo completo de un Lead: crear →
 * cambiar estado → convertir en cliente. La conversión es la integración
 * real entre `crm` y `clientes` (`LeadsService.convertir()` invoca
 * `ClientesService.crear()`, nunca escribe directo en
 * `customers.customers` — `CRM_ARCHITECTURE.md §1.2`), por eso este test
 * verifica también que el cliente resultante exista de verdad.
 */
describe('LeadsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
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

    const empresa = await prisma.companies.findFirst({ where: { deleted_at: null } });
    if (!empresa)
      throw new Error('Falta al menos una empresa real en el tenant "demo" para este test.');
    companyId = empresa.id;

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-crm-leads',
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
        CrmModule,
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

  it('GET /crm/leads sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/crm/leads');
    expect(response.status).toBe(401);
  });

  it('flujo completo: crear lead, cambiar estado, convertir en cliente real', async () => {
    const email = `lead-e2e-${Date.now()}@example.com`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/crm/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, fullName: 'Lead de prueba e2e', email });
    expect(createResponse.status).toBe(201);
    const leadId = createResponse.body.data.id;

    const cambiarEstadoResponse = await request(app.getHttpServer())
      .patch(`/api/v1/crm/leads/${leadId}/estado`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statusCode: 'contactado' });
    expect(cambiarEstadoResponse.status).toBe(200);

    const taxId = `LEAD-E2E-${Date.now()}`;
    const convertirResponse = await request(app.getHttpServer())
      .post(`/api/v1/crm/leads/${leadId}/convertir`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ legalName: 'Cliente convertido e2e', taxId, preferredCurrencyCode: 'USD' });
    expect(convertirResponse.status).toBe(201);
    const clienteId = convertirResponse.body.data.converted_customer_id;
    expect(clienteId).toBeTruthy();

    // Integración real: el cliente resultante existe de verdad en `clientes`.
    const clienteResponse = await request(app.getHttpServer())
      .get(`/api/v1/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(clienteResponse.status).toBe(200);
    expect(clienteResponse.body.data.tax_id).toBe(taxId);

    const getLeadResponse = await request(app.getHttpServer())
      .get(`/api/v1/crm/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getLeadResponse.body.data.converted_customer_id).toBe(clienteId);
  });

  it('POST /crm/leads sin email ni teléfono devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/crm/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, fullName: 'Lead sin contacto' });
    expect(response.status).toBe(400);
  });

  it('PATCH /crm/leads/:id/estado con lead inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/crm/leads/00000000-0000-0000-0000-000000000099/estado')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statusCode: 'contactado' });
    expect(response.status).toBe(404);
  });
});
