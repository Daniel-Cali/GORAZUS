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
// modules/inventario/backend/controllers/almacenes.controller.e2e-spec.ts.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
import { ProductosModule } from '../productos.module';

/**
 * Test de integración real (mismo patrón que
 * `modules/inventario/backend/controllers/almacenes.controller.e2e-spec.ts`)
 * — usa el tenant/usuario de prueba ya sembrados (`seed-rbac.ts demo
 * admin@demo.local`), que a partir de esta parte también sostiene
 * `productos.gestionar_productos`. Empresa propia, creada directamente
 * vía Prisma — evita importar `ConfiguracionModule` acá.
 */
describe('Productos (e2e) — Unidades / Categorías / Marcas / Modelos / Productos', () => {
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

    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      sub: usuario.id,
      tenantId: usuario.tenant_id,
      companyId: usuario.company_id,
      branchId: usuario.branch_id,
      sessionId: 'e2e-test-session-productos',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e productos ${Date.now()}`,
        tax_id: `NIT-PROD-${Date.now()}`,
        functional_currency_code: 'USD',
        fiscal_year_start_month: 1,
      },
    });
    companyId = empresa.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        // StorageModule (Global) — bug real preexistente encontrado en esta fase:
        // SeguridadModule usa AvatarUsuarioService, que desde FASE 03 Parte 03
        // depende de StorageService; este test nunca la importó, así que
        // Test.createTestingModule() fallaba con "Nest can't resolve
        // dependencies of AvatarUsuarioService" — no relacionado con esta fase
        // de base de datos, pero se corrige acá para poder verificar sin ruido
        // que la migración 35 no rompió nada. Mismo gap probable en
        // almacenes.controller.e2e-spec.ts (no corregido acá, ver TECHNICAL_DEBT.md).
        StorageModule,
        SeguridadModule,
        ProductosModule,
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

  it('GET /productos sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/productos');
    expect(response.status).toBe(401);
  });

  it('POST /productos con companyId inexistente devuelve 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId: '00000000-0000-0000-0000-000000000099',
        sku: `SKU-X-${Date.now()}`,
        productType: 'good',
        baseUnitId: '00000000-0000-0000-0000-000000000099',
      });
    expect(response.status).toBe(400);
  });

  it('flujo completo: unidad → categoría → marca → modelo → producto', async () => {
    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, code: `UND-${Date.now()}` });
    expect(crearUnidad.status).toBe(201);
    const baseUnitId = crearUnidad.body.data.id;

    const crearCategoria = await request(app.getHttpServer())
      .post('/api/v1/productos/categorias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, code: `HERR-${Date.now()}` });
    expect(crearCategoria.status).toBe(201);
    const categoryId = crearCategoria.body.data.id;

    const crearSubcategoria = await request(app.getHttpServer())
      .post('/api/v1/productos/categorias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, code: `HERR-MAN-${Date.now()}`, parentCategoryId: categoryId });
    expect(crearSubcategoria.status).toBe(201);
    expect(crearSubcategoria.body.data.parent_category_id).toBe(categoryId);

    const crearMarca = await request(app.getHttpServer())
      .post('/api/v1/productos/marcas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, name: `Marca e2e ${Date.now()}` });
    expect(crearMarca.status).toBe(201);
    const brandId = crearMarca.body.data.id;

    const crearModelo = await request(app.getHttpServer())
      .post('/api/v1/productos/modelos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, brandId, name: `Modelo e2e ${Date.now()}` });
    expect(crearModelo.status).toBe(201);
    const modelId = crearModelo.body.data.id;

    // Modelo de otra marca — para probar la validación cruzada marca↔modelo.
    const crearOtraMarca = await request(app.getHttpServer())
      .post('/api/v1/productos/marcas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, name: `Otra marca e2e ${Date.now()}` });
    const otraMarcaId = crearOtraMarca.body.data.id;

    const productoConMarcaCruzada = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        sku: `SKU-CRUZADO-${Date.now()}`,
        productType: 'good',
        baseUnitId,
        brandId: otraMarcaId,
        modelId,
      });
    expect(productoConMarcaCruzada.status).toBe(400);

    const sku = `SKU-${Date.now()}`;
    const crearProducto = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        sku,
        productType: 'good',
        baseUnitId,
        categoryId,
        brandId,
        modelId,
        tracksSerial: true,
        listPrice: 149.99,
      });
    expect(crearProducto.status).toBe(201);
    expect(crearProducto.body.data.sku).toBe(sku);
    const productId = crearProducto.body.data.id;

    const obtenerProducto = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(obtenerProducto.status).toBe(200);
    expect(obtenerProducto.body.data.tracks_serial).toBe(true);

    const listarPorCategoria = await request(app.getHttpServer())
      .get(`/api/v1/productos?categoryId=${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listarPorCategoria.body.data.some((p: { id: string }) => p.id === productId)).toBe(true);

    const actualizarProducto = await request(app.getHttpServer())
      .patch(`/api/v1/productos/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ listPrice: 199.99 });
    expect(actualizarProducto.status).toBe(200);
    expect(actualizarProducto.body.data.list_price).toBe(199.99);
  });

  it('POST /productos con producto tipo "service" que rastrea serie devuelve 400 (invariante de entidad)', async () => {
    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, code: `UND-SVC-${Date.now()}` });
    const baseUnitId = crearUnidad.body.data.id;

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        companyId,
        sku: `SKU-SVC-${Date.now()}`,
        productType: 'service',
        baseUnitId,
        tracksSerial: true,
      });
    expect(response.status).toBe(400);
  });
});
