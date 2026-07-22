import jwt from 'jsonwebtoken';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { CacheModule } from '@gorazus/core-cache';
import { DatabaseModule } from '@gorazus/core-database';
import type { AccessTokenPayload } from '@gorazus/contracts';
// Ruta relativa — ver empresas.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient as TaxesPrismaClient } from '../../../../core/database/prisma/schemas/taxes/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ConfiguracionModule } from '../configuracion.module';

const JURISDICTION_NAME = 'Colombia - Nacional';

describe('ImpuestosController / TasasImpuestoController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
  let taxesPrisma: TaxesPrismaClient;
  let jurisdictionId: string;

  beforeAll(async () => {
    initMetrics();

    prisma = new PrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } });
    taxesPrisma = new TaxesPrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
    });

    const tenant = await prisma.tenants.findFirst({ where: { slug: 'demo', deleted_at: null } });
    if (!tenant)
      throw new Error('Falta el tenant de prueba "demo" — sembrarlo primero (ver seed-rbac.ts).');
    await prisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );
    await taxesPrisma.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    const usuario = await prisma.users.findFirst({
      where: { email: 'admin@demo.local', tenant_id: tenant.id },
    });
    if (!usuario)
      throw new Error('Falta el usuario de prueba admin@demo.local — correr seed-rbac.ts primero.');

    const jurisdiccion = await taxesPrisma.tax_jurisdictions.findFirst({
      where: { tenant_id: tenant.id, name: JURISDICTION_NAME, deleted_at: null },
    });
    if (!jurisdiccion) {
      throw new Error(
        `Falta la jurisdicción fiscal de prueba "${JURISDICTION_NAME}" — correr ` +
          'seed-tax-jurisdictions.ts primero (`... demo CO "Colombia - Nacional"`).',
      );
    }
    jurisdictionId = jurisdiccion.id;

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-impuestos',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        SeguridadModule,
        ConfiguracionModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await taxesPrisma.$disconnect();
    await app.close();
  });

  it('crea un impuesto, lo lee por id, aparece en el listado y admite una tasa', async () => {
    const code = `IVA-E2E-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/impuestos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, jurisdictionId, taxKind: 'sales_tax' });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.code).toBe(code);
    const taxId = createResponse.body.data.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/impuestos/${taxId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/configuracion/impuestos')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.body.data.some((t: { id: string }) => t.id === taxId)).toBe(true);

    const createRateResponse = await request(app.getHttpServer())
      .post('/api/v1/configuracion/tasas-impuesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ taxId, ratePercentage: 19, effectiveFrom: '2026-01-01' });
    expect(createRateResponse.status).toBe(201);
    expect(Number(createRateResponse.body.data.rate_percentage)).toBe(19);

    const listRatesResponse = await request(app.getHttpServer())
      .get(`/api/v1/configuracion/tasas-impuesto?taxId=${taxId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRatesResponse.body.data.some((r: { tax_id: string }) => r.tax_id === taxId)).toBe(
      true,
    );
  });

  it('crear un impuesto con jurisdictionId inexistente devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/impuestos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: `IVA-E2E-BAD-${Date.now()}`,
        jurisdictionId: '00000000-0000-0000-0000-000000000099',
        taxKind: 'sales_tax',
      });
    expect(response.status).toBe(400);
  });

  it('crear un impuesto con código duplicado devuelve 409', async () => {
    const code = `IVA-E2E-DUP-${Date.now()}`;
    await request(app.getHttpServer())
      .post('/api/v1/configuracion/impuestos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, jurisdictionId, taxKind: 'sales_tax' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/impuestos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, jurisdictionId, taxKind: 'sales_tax' });
    expect(response.status).toBe(409);
  });

  it('crear una tasa para un impuesto inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/configuracion/tasas-impuesto')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        taxId: '00000000-0000-0000-0000-000000000099',
        ratePercentage: 19,
        effectiveFrom: '2026-01-01',
      });
    expect(response.status).toBe(404);
  });
});
