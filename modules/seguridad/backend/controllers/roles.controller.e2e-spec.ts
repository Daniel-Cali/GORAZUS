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

    // `admin@demo.local` es un admin de todo el tenant (`company_id` null) —
    // el test de scoping necesita una empresa real explícita, no puede
    // asumir la del actor.
    const empresa = await prisma.companies.findFirst({ where: { deleted_at: null } });
    if (!empresa)
      throw new Error('Falta al menos una empresa real en el tenant "demo" para este test.');
    companyId = empresa.id;

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
        // AvatarUsuarioService (dentro de SeguridadModule) inyecta
        // StorageService — @Global() igual que SeguridadModule, pero sin
        // este import explícito acá el árbol de testing queda incompleto
        // (mismo hallazgo que en clientes/crm — ver sus e2e-spec).
        StorageModule,
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
    expect(createResponse.body.data.role_type).toBe('custom');

    // `GET /seguridad/roles/:id` en vez de paginar el listado completo —
    // con muchos roles acumulados (uso repetido de este e2e), el nuevo
    // podía no caer en la página 1 sin depender de un orden explícito.
    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/roles/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.name).toBe(nombre);
  });

  it('POST /seguridad/roles con code/description/roleType los persiste', async () => {
    const nombre = `Rol con metadata e2e ${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: nombre,
        code: 'SALES_MANAGER',
        description: 'Gerencia de ventas',
        roleType: 'company',
      });
    expect(response.status).toBe(201);
    expect(response.body.data.code).toBe('SALES_MANAGER');
    expect(response.body.data.description).toBe('Gerencia de ventas');
    expect(response.body.data.role_type).toBe('company');
  });

  it('POST /seguridad/roles normaliza el código a mayúsculas', async () => {
    const nombre = `Rol normalizacion e2e ${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `  ${nombre}  `, code: '  sales_rep  ' });
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe(nombre);
    expect(response.body.data.code).toBe('SALES_REP');
  });

  it('POST /seguridad/roles con un código con caracteres inválidos devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Rol codigo invalido e2e ${Date.now()}`, code: 'SALES-REP!' });
    expect(response.status).toBe(400);
  });

  it('POST /seguridad/roles con roleType "system" devuelve 400 — solo el seed crea roles de fábrica', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Rol system e2e ${Date.now()}`, roleType: 'system' });
    expect(response.status).toBe(400);
  });

  it('POST /seguridad/roles con un nombre vacío devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });
    expect(response.status).toBe(400);
  });

  it('flujo completo: crear, obtener con permisos, renombrar, asignar/revocar permiso, eliminar', async () => {
    const nombre = `Rol de prueba e2e flujo ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nombre });
    expect(createResponse.status).toBe(201);
    const rolId = createResponse.body.data.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/roles/${rolId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.permissionCodes).toEqual([]);

    const asignarResponse = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/roles/${rolId}/permisos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permissionCode: 'seguridad.ver_auditoria' });
    expect(asignarResponse.status).toBe(201);

    const getConPermisoResponse = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/roles/${rolId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getConPermisoResponse.body.data.permissionCodes).toContain('seguridad.ver_auditoria');

    const nuevoNombre = `${nombre} (renombrado)`;
    const actualizarResponse = await request(app.getHttpServer())
      .patch(`/api/v1/seguridad/roles/${rolId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nuevoNombre });
    expect(actualizarResponse.status).toBe(200);
    expect(actualizarResponse.body.data.name).toBe(nuevoNombre);

    const revocarResponse = await request(app.getHttpServer())
      .delete(`/api/v1/seguridad/roles/${rolId}/permisos/seguridad.ver_auditoria`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revocarResponse.status).toBe(200);

    const eliminarResponse = await request(app.getHttpServer())
      .delete(`/api/v1/seguridad/roles/${rolId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(eliminarResponse.status).toBe(200);
    expect(eliminarResponse.body.data.deleted_at).not.toBeNull();
  });

  it('PATCH /seguridad/roles/:id sobre el rol de fábrica "Administrador" devuelve 409', async () => {
    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`);
    const admin = listResponse.body.data.find((r: { name: string }) => r.name === 'Administrador');
    expect(admin).toBeDefined();

    const response = await request(app.getHttpServer())
      .patch(`/api/v1/seguridad/roles/${admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Intento de renombrar' });
    expect(response.status).toBe(409);
  });

  it('GET /seguridad/roles/:id con id inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles/00000000-0000-0000-0000-000000000099')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });

  it('GET /seguridad/roles?companyId= filtra por empresa', async () => {
    const nombre = `Rol scoping e2e ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nombre, companyId });
    expect(createResponse.body.data.company_id).toBe(companyId);

    const filtradoResponse = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/roles?companyId=${companyId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(
      filtradoResponse.body.data.every(
        (r: { company_id: string | null }) => r.company_id === companyId,
      ),
    ).toBe(true);
    expect(filtradoResponse.body.data.some((r: { name: string }) => r.name === nombre)).toBe(true);

    const otraEmpresaResponse = await request(app.getHttpServer())
      .get('/api/v1/seguridad/roles?companyId=00000000-0000-0000-0000-000000000099')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(otraEmpresaResponse.body.data.some((r: { name: string }) => r.name === nombre)).toBe(
      false,
    );
  });

  it('POST /seguridad/roles con companyId null explícito crea un rol de todo el tenant', async () => {
    const nombre = `Rol tenant-wide e2e ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/seguridad/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: nombre, companyId: null });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.company_id).toBeNull();
  });
});
