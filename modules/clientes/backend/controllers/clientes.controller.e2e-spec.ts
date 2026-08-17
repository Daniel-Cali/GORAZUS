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
// PERMISSIONS_RESOLVER real (RBAC) solo queda registrado si SeguridadModule
// (Global) forma parte del árbol de este TestingModule — ver seguridad.module.ts
// cabecera. Sin esto, el guard usa el resolver noop por defecto y todo da 403.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ClientesModule } from '../clientes.module';

/**
 * Test de integración real de todo el flujo Cliente → Contacto/Dirección
 * → Cuentas por Cobrar (mismo patrón que
 * `configuracion/backend/controllers/empresas.controller.e2e-spec.ts`).
 * Usa el tenant/usuario de prueba ya sembrados por `seed-rbac.ts demo
 * admin@demo.local` y una empresa real ya existente en ese tenant (no
 * hace falta crear una — cualquier empresa activa sirve).
 */
describe('ClientesController / ContactosController / DireccionesController / CuentasPorCobrarController (e2e)', () => {
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
      sessionId: 'e2e-test-session-clientes',
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
        // (a diferencia de apps/api/app.module.ts, que sí lo importa).
        StorageModule,
        DatabaseModule,
        SeguridadModule,
        ClientesModule,
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

  it('GET /clientes sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/clientes');
    expect(response.status).toBe(401);
  });

  it('flujo completo: crear cliente, agregar contacto y dirección, verificar cuentas por cobrar vacías', async () => {
    const taxId = `E2E-${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        legalName: 'Cliente de prueba e2e',
        taxId,
        preferredCurrencyCode: 'USD',
      });
    expect(createResponse.status).toBe(201);
    const clienteId = createResponse.body.data.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/clientes/${clienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.tax_id).toBe(taxId);

    // Contacto — crear, listar, marcar principal a uno nuevo desmarca el anterior.
    const contacto1Response = await request(app.getHttpServer())
      .post(`/api/v1/clientes/${clienteId}/contactos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Contacto Uno', isPrimary: true });
    expect(contacto1Response.status).toBe(201);
    expect(contacto1Response.body.data.is_primary).toBe(true);

    const contacto2Response = await request(app.getHttpServer())
      .post(`/api/v1/clientes/${clienteId}/contactos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Contacto Dos', isPrimary: true });
    expect(contacto2Response.status).toBe(201);
    expect(contacto2Response.body.data.is_primary).toBe(true);

    const listContactosResponse = await request(app.getHttpServer())
      .get(`/api/v1/clientes/${clienteId}/contactos`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listContactosResponse.status).toBe(200);
    const contactoUno = listContactosResponse.body.data.find(
      (c: { id: string }) => c.id === contacto1Response.body.data.id,
    );
    expect(contactoUno.is_primary).toBe(false); // desmarcado al crear el segundo como principal

    // Dirección.
    const direccionResponse = await request(app.getHttpServer())
      .post(`/api/v1/clientes/${clienteId}/direcciones`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ addressType: 'billing', line1: 'Calle Falsa 123', isDefault: true });
    expect(direccionResponse.status).toBe(201);
    const direccionId = direccionResponse.body.data.id;

    const eliminarDireccionResponse = await request(app.getHttpServer())
      .delete(`/api/v1/clientes/${clienteId}/direcciones/${direccionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(eliminarDireccionResponse.status).toBe(200);
    expect(eliminarDireccionResponse.body.data.deleted_at).not.toBeNull();

    // Cuentas por cobrar — integración real con `sales`, cliente recién
    // creado sin facturas emitidas todavía: lista vacía, no error.
    const cuentasPorCobrarResponse = await request(app.getHttpServer())
      .get(`/api/v1/clientes/${clienteId}/cuentas-por-cobrar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(cuentasPorCobrarResponse.status).toBe(200);
    expect(cuentasPorCobrarResponse.body.data).toEqual([]);
  });

  it('POST /clientes/:id/contactos con cliente inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/clientes/00000000-0000-0000-0000-000000000099/contactos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Contacto Fantasma' });
    expect(response.status).toBe(404);
  });

  it('GET /clientes/:id/cuentas-por-cobrar con cliente inexistente devuelve 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/clientes/00000000-0000-0000-0000-000000000099/cuentas-por-cobrar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });

  it('POST /clientes con taxId vacío devuelve 400 (validación Zod)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/clientes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, legalName: 'Sin tax id', taxId: '' });
    expect(response.status).toBe(400);
  });
});
