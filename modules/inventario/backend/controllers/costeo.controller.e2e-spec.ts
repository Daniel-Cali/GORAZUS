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
import type { AccessTokenPayload } from '@gorazus/contracts';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SeguridadModule } from '../../../seguridad/backend/seguridad.module';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ProductosModule } from '../../../productos/backend/productos.module';
import { InventarioModule } from '../inventario.module';

/**
 * Test de integración real del Motor de Costeo — Fase 1 de `ADR-INV-004`
 * (FIFO/LIFO/Promedio Ponderado). Mismo patrón que
 * `ajustes-conteos.controller.e2e-spec.ts`. Contra Postgres real: si el
 * contenedor no está disponible en el entorno donde corre, este archivo
 * falla al conectar, no silenciosamente — sin mock de base de datos.
 */
describe('CosteoController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let companyId: string;
  let warehouseId: string;
  let productoFifoId: string;
  let productoLifoId: string;
  let productoPromedioId: string;
  let productoStandardId: string;

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
      sessionId: 'e2e-test-session-inventario-costeo',
    };
    adminToken = jwt.sign(payload, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '5m' });

    const empresa = await prisma.companies.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        legal_name: `Empresa e2e costeo ${Date.now()}`,
        tax_id: `NIT-COS-${Date.now()}`,
        functional_currency_code: 'USD',
        fiscal_year_start_month: 1,
      },
    });
    companyId = empresa.id;

    const sucursal = await prisma.branches.create({
      data: {
        id: randomUUID(),
        tenant_id: tenant.id,
        company_id: companyId,
        name: 'Sucursal e2e costeo',
        code: `SUC-COS-${Date.now()}`,
        is_main_branch: true,
      },
    });
    const branchId = sucursal.id;

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        LoggingModule,
        HttpModule,
        CacheModule,
        DatabaseModule,
        SeguridadModule,
        InventarioModule,
        ProductosModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();

    const crearAlmacen = await request(app.getHttpServer())
      .post('/api/v1/inventario/almacenes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ companyId, branchId, name: 'Almacén e2e costeo', code: `ALM-COS-${Date.now()}` });
    warehouseId = crearAlmacen.body.data.id;

    const crearUnidad = await request(app.getHttpServer())
      .post('/api/v1/productos/unidades-medida')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `UN-COS-${Date.now()}` });
    const unitId = crearUnidad.body.data.id;

    async function crearProducto(sku: string, costingMethod: string): Promise<string> {
      const respuesta = await request(app.getHttpServer())
        .post('/api/v1/productos/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ companyId, sku, productType: 'good', baseUnitId: unitId, costingMethod });
      return respuesta.body.data.id;
    }

    productoFifoId = await crearProducto(`SKU-COS-FIFO-${Date.now()}`, 'fifo');
    productoLifoId = await crearProducto(`SKU-COS-LIFO-${Date.now()}`, 'lifo');
    productoPromedioId = await crearProducto(`SKU-COS-AVG-${Date.now()}`, 'average');
    productoStandardId = await crearProducto(`SKU-COS-STD-${Date.now()}`, 'standard');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /inventario/costeo/entradas sin token devuelve 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .send({ productId: productoFifoId, warehouseId, quantity: 10, unitCost: 5 });
    expect(response.status).toBe(401);
  });

  it('FIFO: consume la capa más antigua primero y reparte costo ponderado al cruzar capas', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId, quantity: 10, unitCost: 5 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId, quantity: 5, unitCost: 8 })
      .expect(201);

    // Salida de 12: agota la capa de 10@5 y toma 2 de la capa de 5@8.
    // Costo ponderado = (10×5 + 2×8) / 12 = 66/12 = 5.5.
    const salida = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/salidas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId, quantity: 12 })
      .expect(201);
    expect(salida.body.data.costingMethod).toBe('fifo');
    expect(salida.body.data.costoUnitarioPonderado).toBeCloseTo(5.5, 6);
    expect(salida.body.data.capasConsumidas).toHaveLength(2);

    const capas = await request(app.getHttpServer())
      .get(`/api/v1/inventario/costeo/productos/${productoFifoId}/capas?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(capas.body.data.layers).toHaveLength(1);
    expect(capas.body.data.layers[0].remainingQuantity).toBe(3);
    expect(capas.body.data.layers[0].unitCost).toBe(8);
  });

  it('LIFO: consume la capa más reciente primero', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoLifoId, warehouseId, quantity: 10, unitCost: 5 })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoLifoId, warehouseId, quantity: 5, unitCost: 8 })
      .expect(201);

    // Salida de 12: agota la capa más nueva (5@8) y toma 7 de la más vieja (10@5).
    // Costo ponderado = (5×8 + 7×5) / 12 = 75/12 = 6.25.
    const salida = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/salidas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoLifoId, warehouseId, quantity: 12 })
      .expect(201);
    expect(salida.body.data.costingMethod).toBe('lifo');
    expect(salida.body.data.costoUnitarioPonderado).toBeCloseTo(6.25, 6);

    const capas = await request(app.getHttpServer())
      .get(`/api/v1/inventario/costeo/productos/${productoLifoId}/capas?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(capas.body.data.layers).toHaveLength(1);
    expect(capas.body.data.layers[0].remainingQuantity).toBe(3);
    expect(capas.body.data.layers[0].unitCost).toBe(5);
  });

  it('Promedio Ponderado: recalcula en cada entrada, sin capas', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoPromedioId, warehouseId, quantity: 10, unitCost: 4 })
      .expect(201);

    // Sin movimiento de stock real registrado, quantity_on_hand es 0 —
    // el promedio nuevo es simplemente el costo de esta primera entrada.
    const segundaEntrada = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoPromedioId, warehouseId, quantity: 10, unitCost: 6 })
      .expect(201);
    expect(segundaEntrada.body.data.costingMethod).toBe('average');

    const capas = await request(app.getHttpServer())
      .get(
        `/api/v1/inventario/costeo/productos/${productoPromedioId}/capas?warehouseId=${warehouseId}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(capas.body.data.layers).toEqual([]);

    const costoVigente = await request(app.getHttpServer())
      .get(
        `/api/v1/inventario/costeo/productos/${productoPromedioId}/costo-vigente?warehouseId=${warehouseId}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(costoVigente.body.data.costingMethod).toBe('average');
    expect(typeof costoVigente.body.data.unitCost).toBe('number');
  });

  it('Standard Cost no está soportado en esta fase — rechaza con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoStandardId, warehouseId, quantity: 10, unitCost: 5 });
    expect(response.status).toBe(400);
  });

  it('salida sin capas suficientes rechaza con 409 (política estricta)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId, quantity: 1, unitCost: 5 })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/salidas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId, quantity: 999999 });
    expect(response.status).toBe(409);
  });

  it('producto inexistente rechaza con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: randomUUID(), warehouseId, quantity: 10, unitCost: 5 });
    expect(response.status).toBe(400);
  });

  it('almacén inexistente rechaza con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventario/costeo/entradas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: productoFifoId, warehouseId: randomUUID(), quantity: 10, unitCost: 5 });
    expect(response.status).toBe(400);
  });
});
