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
// Ruta relativa — necesita la clase PrismaClient real (constructible) del cliente
// generado de `core`, no solo los tipos que reexporta @gorazus/core-database/index.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
import { SeguridadModule } from '../seguridad.module';

/**
 * Test de integración real sobre RBAC (FASE 02 Backend Enterprise) — arma
 * el JWT directamente con `jsonwebtoken` (mismo secreto que
 * `JWT_ACCESS_SECRET`) en vez de importar `AuthModule` para hacer un login
 * real: evita una dependencia cruzada de test entre módulos y es
 * equivalente, porque `JwtStrategy` solo verifica firma/expiración, nunca
 * vuelve a tocar `core.sessions` (docs/architecture/13-modulo-auth.md §2).
 * Usa el tenant/usuario de prueba ya sembrados (`seed-rbac.ts demo admin@demo.local`).
 *
 * `set_config` antes de tocar `core.users` — bug real encontrado en FASE 05
 * (2026-07-20, ver docs/database/SECURITY.md §2): con RLS realmente forzado,
 * `core.users` solo es visible para el tenant sentinela o el tenant activo de
 * la sesión — sin esto, `findFirst` por email simplemente no encuentra la
 * fila del tenant "demo" (RLS filtra en silencio, no es un error de permisos).
 */
describe('RolesController (e2e)', () => {
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
      sessionId: 'e2e-test-session',
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

  it('GET /seguridad/roles sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/seguridad/roles');
    expect(response.status).toBe(401);
  });

  it('GET /seguridad/roles con token de un usuario CON el permiso devuelve 200', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((r: { name: string }) => r.name === 'Administrador')).toBe(true);
  });

  it('GET /seguridad/roles con un JWT válido pero de un usuario SIN ningún rol asignado devuelve 403', async () => {
    const payloadSinPermiso: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: '00000000-0000-0000-0000-000000000001', // usuario "system" sembrado, sin roles asignados
      tenantId: '00000000-0000-0000-0000-000000000000',
      companyId: null,
      branchId: null,
      sessionId: 'e2e-test-session-2',
    };
    const tokenSinPermiso = jwt.sign(payloadSinPermiso, process.env['JWT_ACCESS_SECRET']!, {
      expiresIn: '5m',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${tokenSinPermiso}`);
    expect(response.status).toBe(403);
  });

  it('POST /seguridad/roles crea un rol nuevo y aparece en el listado', async () => {
    const nombre = `Rol de prueba e2e ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nombre });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.name).toBe(nombre);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listResponse.body.data.some((r: { name: string }) => r.name === nombre)).toBe(true);
  });

  it('POST /seguridad/roles con un nombre vacío devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });
    expect(response.status).toBe(400);
  });
});
