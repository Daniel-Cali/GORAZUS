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
// Ruta relativa — ver roles.controller.e2e-spec.ts para la justificación completa.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- ver login.usecase.ts, mismo motivo
import { hashPassword } from '../../../../packages/tooling/utils';
import { SeguridadModule } from '../seguridad.module';

describe('UsuariosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let selfToken: string;
  let selfUserId: string;
  let empresaActivaId: string;
  let rolPruebaId: string;
  const oldPassword = 'ViejaPassword123!';
  const newPassword = 'NuevaPassword456!';

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

    const admin = await prisma.users.findFirst({
      where: { email: 'admin@demo.local', tenant_id: tenant.id },
    });
    if (!admin)
      throw new Error('Falta el usuario de prueba admin@demo.local — correr seed-rbac.ts primero.');
    adminToken = jwt.sign(
      {
        sub: admin.id,
        tenantId: admin.tenant_id,
        companyId: admin.company_id,
        branchId: admin.branch_id,
        sessionId: 'e2e-test-session-usuarios-admin',
      } as Omit<AccessTokenPayload, 'iat' | 'exp'>,
      process.env['JWT_ACCESS_SECRET']!,
      { expiresIn: '5m' },
    );

    // Usuario descartable propio para self-service (perfil/contraseña) — no
    // se reusa admin@demo.local porque el test de cambio de contraseña
    // mutaría permanentemente sus credenciales compartidas.
    const selfUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        email: `usuarios-e2e-${Date.now()}@example.com`,
        password_hash: await hashPassword(oldPassword),
        full_name: 'Usuario descartable e2e perfil',
        is_active: true,
      },
    });
    selfUserId = selfUser.id;
    selfToken = jwt.sign(
      {
        sub: selfUser.id,
        tenantId: selfUser.tenant_id,
        companyId: selfUser.company_id,
        branchId: selfUser.branch_id,
        sessionId: 'e2e-test-session-usuarios-self',
      } as Omit<AccessTokenPayload, 'iat' | 'exp'>,
      process.env['JWT_ACCESS_SECRET']!,
      { expiresIn: '5m' },
    );

    const empresa = await prisma.companies.findFirst({
      where: { tenant_id: tenant.id, is_active: true, deleted_at: null },
    });
    if (!empresa)
      throw new Error('Falta una empresa activa de prueba — sembrarla primero (ver seed-rbac.ts).');
    empresaActivaId = empresa.id;

    const rolPrueba = await prisma.roles.create({
      data: {
        tenant_id: tenant.id,
        company_id: admin.company_id,
        name: `rol-e2e-usuarios-${Date.now()}`,
      },
    });
    rolPruebaId = rolPrueba.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        StorageModule,
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

  it('GET /seguridad/usuarios/me devuelve el perfil del usuario autenticado', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/usuarios/me')
      .set('Authorization', `Bearer ${selfToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(selfUserId);
  });

  it('PATCH /seguridad/usuarios/me actualiza mi nombre', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/seguridad/usuarios/me')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ fullName: 'Nombre actualizado e2e' });
    expect(response.status).toBe(200);
    expect(response.body.data.full_name).toBe('Nombre actualizado e2e');
  });

  it('PATCH /seguridad/usuarios/me/password con la contraseña actual incorrecta devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/seguridad/usuarios/me/password')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ currentPassword: 'incorrecta', newPassword });
    expect(response.status).toBe(400);
  });

  it('PATCH /seguridad/usuarios/me/password con la contraseña actual correcta la actualiza', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/seguridad/usuarios/me/password')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ currentPassword: oldPassword, newPassword });
    expect(response.status).toBe(200);
  });

  it('POST /seguridad/usuarios/:id/desactivar y /activar (admin) cambian is_active', async () => {
    const desactivarResponse = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/desactivar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(desactivarResponse.status).toBe(201);
    expect(desactivarResponse.body.data.is_active).toBe(false);

    const activarResponse = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/activar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(activarResponse.status).toBe(201);
    expect(activarResponse.body.data.is_active).toBe(true);
  });

  it('GET /seguridad/usuarios/:id/historial (admin) muestra los cambios auditados', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/usuarios/${selfUserId}/historial`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ pageSize: 50 });
    expect(response.status).toBe(200);
    expect(
      response.body.data.every(
        (r: { table_name: string; row_id: string }) => r.row_id === selfUserId,
      ),
    ).toBe(true);
    // Al menos el desactivar/activar de más arriba debería quedar registrado.
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('GET /seguridad/usuarios/me nunca incluye password_hash', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/usuarios/me')
      .set('Authorization', `Bearer ${selfToken}`);
    expect(response.body.data).not.toHaveProperty('password_hash');
  });

  it('GET /seguridad/usuarios (admin) lista usuarios sin password_hash', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/seguridad/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.some((u: { id: string }) => u.id === selfUserId)).toBe(true);
    expect(response.body.data.every((u: object) => !('password_hash' in u))).toBe(true);
  });

  it('POST /seguridad/usuarios (admin) crea un usuario con contraseña temporal', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/seguridad/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: `usuarios-e2e-crear-${Date.now()}@example.com`, fullName: 'Creado e2e' });
    expect(response.status).toBe(201);
    expect(response.body.data.passwordTemporal).toEqual(expect.any(String));
    expect(response.body.data.usuario).not.toHaveProperty('password_hash');
    expect(response.body.data.usuario.status).toBe('active');
  });

  it('PUT /seguridad/usuarios/:id (admin) edita nombre y correo de cualquier usuario', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/seguridad/usuarios/${selfUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Editado por admin e2e' });
    expect(response.status).toBe(200);
    expect(response.body.data.full_name).toBe('Editado por admin e2e');
  });

  it('PATCH /seguridad/usuarios/:id/status cambia el estado agregado', async () => {
    const suspendido = await request(app.getHttpServer())
      .patch(`/api/v1/seguridad/usuarios/${selfUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' });
    expect(suspendido.status).toBe(200);
    expect(suspendido.body.data.is_active).toBe(false);
    expect(suspendido.body.data.status).toBe('suspended');

    const reactivado = await request(app.getHttpServer())
      .patch(`/api/v1/seguridad/usuarios/${selfUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });
    expect(reactivado.body.data.status).toBe('active');
  });

  it('PATCH /seguridad/usuarios/:id/password (admin) resetea con una contraseña temporal', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/seguridad/usuarios/${selfUserId}/password`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.passwordTemporal).toEqual(expect.any(String));
  });

  it('DELETE /seguridad/usuarios/:id (soft delete) + POST /:id/restore', async () => {
    const eliminado = await request(app.getHttpServer())
      .delete(`/api/v1/seguridad/usuarios/${selfUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(eliminado.status).toBe(204);

    const filaEliminada = await prisma.users.findFirst({ where: { id: selfUserId } });
    expect(filaEliminada?.deleted_at).not.toBeNull();

    const restaurado = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(restaurado.status).toBe(201);
    expect(restaurado.body.data.status).toBe('active');
  });

  it('POST /:id/roles asigna, DELETE /:id/roles/:rolId revoca', async () => {
    const asignado = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rolId: rolPruebaId });
    expect(asignado.status).toBe(201);

    const revocado = await request(app.getHttpServer())
      .delete(`/api/v1/seguridad/usuarios/${selfUserId}/roles/${rolPruebaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(revocado.status).toBe(204);
  });

  it('empresas: listar/asignar/desasignar (multiempresa)', async () => {
    const vacia = await request(app.getHttpServer())
      .get(`/api/v1/seguridad/usuarios/${selfUserId}/empresas`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(vacia.status).toBe(200);

    const asignada = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/empresas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: empresaActivaId });
    expect(asignada.status).toBe(201);

    const duplicada = await request(app.getHttpServer())
      .post(`/api/v1/seguridad/usuarios/${selfUserId}/empresas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId: empresaActivaId });
    expect(duplicada.status).toBe(409);

    const desasignada = await request(app.getHttpServer())
      .delete(`/api/v1/seguridad/usuarios/${selfUserId}/empresas/${empresaActivaId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(desasignada.status).toBe(204);
  });

  it('preferencias: GET devuelve defaults, PATCH persiste y no pierde lo ya guardado', async () => {
    const defaults = await request(app.getHttpServer())
      .get('/api/v1/seguridad/usuarios/me/preferencias')
      .set('Authorization', `Bearer ${selfToken}`);
    expect(defaults.status).toBe(200);
    expect(defaults.body.data.idioma).toBe('es');

    const primerPatch = await request(app.getHttpServer())
      .patch('/api/v1/seguridad/usuarios/me/preferencias')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ tema: 'dark' });
    expect(primerPatch.status).toBe(200);
    expect(primerPatch.body.data.tema).toBe('dark');

    const segundoPatch = await request(app.getHttpServer())
      .patch('/api/v1/seguridad/usuarios/me/preferencias')
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ registrosPorPagina: 50 });
    expect(segundoPatch.body.data.tema).toBe('dark');
    expect(segundoPatch.body.data.registrosPorPagina).toBe(50);
  });

  it('avatar: sube, devuelve URL firmada, y se puede borrar', async () => {
    const subida = await request(app.getHttpServer())
      .post('/api/v1/seguridad/usuarios/me/avatar')
      .set('Authorization', `Bearer ${selfToken}`)
      .attach('file', Buffer.from('contenido-de-prueba'), 'avatar.png');
    expect(subida.status).toBe(201);
    expect(subida.body.data.avatarUrl).toEqual(expect.any(String));

    const borrado = await request(app.getHttpServer())
      .delete('/api/v1/seguridad/usuarios/me/avatar')
      .set('Authorization', `Bearer ${selfToken}`);
    expect(borrado.status).toBe(204);
  });
});
