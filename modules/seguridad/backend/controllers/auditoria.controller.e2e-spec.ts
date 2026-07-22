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
// Ruta relativa — ver roles.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
import { SeguridadModule } from '../seguridad.module';

/**
 * `core.audit_logs` se llena vía trigger de base de datos en cada
 * INSERT/UPDATE/DELETE sobre una tabla auditada (docs/database/sql/26_triggers.sql,
 * `fn_audit_log`) — no hace falta ningún fixture manual: crear un rol vía
 * `POST /seguridad/roles` ya deja una fila `table_name = 'roles'` lista
 * para leer acá.
 */
describe('AuditoriaController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let prisma: PrismaClient;

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

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-auditoria',
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

  it('GET /seguridad/auditoria sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/seguridad/auditoria');
    expect(response.status).toBe(401);
  });

  it('crear un rol deja un registro de auditoría visible filtrando por tableName=roles', async () => {
    const nombre = `Rol auditado e2e ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nombre });
    expect(createResponse.status).toBe(201);

    const auditResponse = await request(app.getHttpServer())
      .get('/api/v1/seguridad/auditoria')
      .query({ tableName: 'roles', operation: 'INSERT', pageSize: 50 })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditResponse.status).toBe(200);
    expect(Array.isArray(auditResponse.body.data)).toBe(true);
    expect(
      auditResponse.body.data.every(
        (r: { table_name: string; operation: string }) =>
          r.table_name === 'roles' && r.operation === 'INSERT',
      ),
    ).toBe(true);
    expect(auditResponse.body.data.length).toBeGreaterThan(0);
  });

  it('un query inválido (operation fuera del enum) devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/auditoria')
      .query({ operation: 'TRUNCATE' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(400);
  });
});
