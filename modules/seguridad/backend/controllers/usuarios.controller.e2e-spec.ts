import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigModule } from '@gorazus/core-config';
import { LoggingModule } from '@gorazus/core-logging';
import { initMetrics } from '@gorazus/core-observability';
import { HttpModule } from '@gorazus/core-http';
import { DatabaseModule } from '@gorazus/core-database';
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

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule, HttpModule, DatabaseModule, SeguridadModule],
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
});
