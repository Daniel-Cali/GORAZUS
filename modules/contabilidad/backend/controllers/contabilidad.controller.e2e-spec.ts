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
import { ContabilidadModule } from '../contabilidad.module';

/**
 * Flujo real: plan de cuentas → año fiscal → asiento manual balanceado
 * → contabilizar → Balance General. Contra Postgres/Redis/RabbitMQ
 * reales, mismo patrón que `facturas.controller.e2e-spec.ts`.
 */
describe('Contabilidad (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;
  let companyId: string;
  let branchId: string;

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
    if (!empresa) throw new Error('Falta al menos una empresa real en el tenant "demo".');
    companyId = empresa.id;

    const sucursal = await prisma.branches.findFirst({
      where: { company_id: companyId, deleted_at: null },
    });
    if (!sucursal) throw new Error('Falta al menos una sucursal real de esa empresa.');
    branchId = sucursal.id;

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-contabilidad',
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
        ContabilidadModule,
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

  it('GET /contabilidad/cuentas sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/contabilidad/cuentas');
    expect(response.status).toBe(401);
  });

  it('flujo completo: plan de cuentas → año fiscal → asiento manual → contabilizar → balance general', async () => {
    const tipoActivo = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      "SELECT id FROM accounting.account_types WHERE code = 'asset' LIMIT 1",
    );
    if (!tipoActivo[0])
      throw new Error('Falta el tipo de cuenta "asset" — correr seed-contabilidad.ts primero.');
    const tipoIngreso = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      "SELECT id FROM accounting.account_types WHERE code = 'income' LIMIT 1",
    );
    if (!tipoIngreso[0]) throw new Error('Falta el tipo de cuenta "income".');

    const sufijo = Date.now().toString(36).toUpperCase();

    const cuentaActivoResponse = await request(app.getHttpServer())
      .post('/api/v1/contabilidad/cuentas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        code: `E2E-A-${sufijo}`,
        name: 'Caja E2E',
        accountTypeId: tipoActivo[0].id,
      });
    expect(cuentaActivoResponse.status).toBe(201);
    const cuentaActivoId = cuentaActivoResponse.body.data.id;

    const cuentaIngresoResponse = await request(app.getHttpServer())
      .post('/api/v1/contabilidad/cuentas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        code: `E2E-I-${sufijo}`,
        name: 'Ingresos E2E',
        accountTypeId: tipoIngreso[0].id,
      });
    expect(cuentaIngresoResponse.status).toBe(201);
    const cuentaIngresoId = cuentaIngresoResponse.body.data.id;

    // Año fiscal — puede ya existir de una corrida anterior, un 201 o un error de duplicado son ambos aceptables acá.
    await request(app.getHttpServer())
      .post('/api/v1/contabilidad/anios-fiscales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        yearLabel: `E2E-${new Date().getUTCFullYear()}`,
        startsOn: `${new Date().getUTCFullYear()}-01-01`,
        endsOn: `${new Date().getUTCFullYear()}-12-31`,
      });

    const crearAsientoResponse = await request(app.getHttpServer())
      .post('/api/v1/contabilidad/asientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        branchId,
        description: 'Asiento manual de prueba e2e',
        lines: [
          { accountId: cuentaActivoId, debitAmount: 50, creditAmount: 0 },
          { accountId: cuentaIngresoId, debitAmount: 0, creditAmount: 50 },
        ],
      });
    expect(crearAsientoResponse.status).toBe(201);
    const asientoId = crearAsientoResponse.body.data.id;
    expect(crearAsientoResponse.body.data.journal_entry_lines).toHaveLength(2);

    const contabilizarResponse = await request(app.getHttpServer())
      .post(`/api/v1/contabilidad/asientos/${asientoId}/contabilizar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(contabilizarResponse.status).toBe(201);

    // Contabilizar dos veces debe rechazarse — ya no está en draft/pending.
    const segundaContabilizacion = await request(app.getHttpServer())
      .post(`/api/v1/contabilidad/asientos/${asientoId}/contabilizar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(segundaContabilizacion.status).toBe(409);

    const balanceResponse = await request(app.getHttpServer())
      .get(
        `/api/v1/contabilidad/reportes/balance-general?companyId=${companyId}&fechaCorte=2099-12-31`,
      )
      .set('Authorization', `Bearer ${adminToken}`);
    expect(balanceResponse.status).toBe(200);
    const cuentaEnBalance = balanceResponse.body.data.activos.find(
      (a: { accountId: string }) => a.accountId === cuentaActivoId,
    );
    expect(cuentaEnBalance.balance).toBe(50);
  });

  it('POST /contabilidad/asientos con un asiento desbalanceado devuelve 400', async () => {
    const tipoActivo = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      "SELECT id FROM accounting.account_types WHERE code = 'asset' LIMIT 1",
    );
    const cuenta = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT id FROM accounting.chart_of_accounts WHERE company_id = $1::uuid LIMIT 2',
      companyId,
    );
    const [cuentaA, cuentaB] = cuenta;
    if (!tipoActivo[0] || !cuentaA || !cuentaB) return;

    const response = await request(app.getHttpServer())
      .post('/api/v1/contabilidad/asientos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        lines: [
          { accountId: cuentaA.id, debitAmount: 100, creditAmount: 0 },
          { accountId: cuentaB.id, debitAmount: 0, creditAmount: 40 },
        ],
      });
    expect(response.status).toBe(400);
  });
});
