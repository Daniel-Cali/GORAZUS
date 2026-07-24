/**
 * Siembra el catálogo mínimo de `inventory.stock_adjustment_reasons`
 * pedido para Fase 05 Parte 04 — no es un enum fijo, agregar un motivo
 * nuevo más adelante es un `INSERT` vía `POST /inventario/motivos-ajuste`,
 * este script solo desbloquea el arranque (mismo patrón operativo que
 * `seed-stock-movement-types.ts`, Parte 02).
 *
 * Uso: `npx ts-node --transpile-only modules/inventario/backend/scripts/seed-stock-adjustment-reasons.ts <slug-tenant>`
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient as CorePrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo
import { PrismaClient as InventoryPrismaClient } from '../../../../core/database/prisma/schemas/inventory/generated';

const MOTIVOS = [
  'Daño',
  'Pérdida',
  'Robo',
  'Error Humano',
  'Diferencia de Conteo',
  'Regularización',
  'Producción',
  'Consumo Interno',
  'Donación',
  'Vencimiento',
  'Ajuste Administrativo',
  'Inventario Inicial',
  'Otro',
];

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  if (!tenantSlug) {
    console.error('Uso: seed-stock-adjustment-reasons.ts <slug-tenant>');
    process.exit(1);
  }

  const coreClient = new CorePrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });
  const inventoryClient = new InventoryPrismaClient({
    datasources: { db: { url: process.env['DATABASE_URL'] } },
  });

  try {
    console.log(`Resolviendo tenant "${tenantSlug}"...`);
    const tenant = await coreClient.tenants.findFirst({
      where: { slug: tenantSlug, deleted_at: null },
    });
    if (!tenant) {
      throw new Error(`No existe ningún tenant con slug "${tenantSlug}".`);
    }

    await inventoryClient.$executeRawUnsafe(
      "SELECT set_config('app.current_tenant_id', $1, false)",
      tenant.id,
    );

    for (const nombre of MOTIVOS) {
      const existente = await inventoryClient.stock_adjustment_reasons.findFirst({
        where: { tenant_id: tenant.id, name: nombre, deleted_at: null },
      });
      if (existente) {
        console.log(`Ya existe "${nombre}" (${existente.id}), se omite.`);
        continue;
      }
      const creado = await inventoryClient.stock_adjustment_reasons.create({
        data: { tenant_id: tenant.id, name: nombre },
      });
      console.log(`Creado "${nombre}" (${creado.id}).`);
    }

    console.log('Listo.');
  } finally {
    await coreClient.$disconnect();
    await inventoryClient.$disconnect();
  }
}

void main();
