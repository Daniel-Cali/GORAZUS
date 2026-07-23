/**
 * Siembra el catálogo mínimo de `inventory.stock_movement_types` que
 * necesita Parte 03 en adelante (`INVENTORY_NEXT_PHASE.md`) — no es un
 * `CHECK` fijo, agregar un tipo nuevo más adelante es un `INSERT` vía
 * `POST /inventario/tipos-movimiento`, este script solo desbloquea el
 * arranque (mismo patrón operativo que `seed-rbac.ts`/
 * `seed-tax-jurisdictions.ts`).
 *
 * Uso: `npx ts-node --transpile-only modules/inventario/backend/scripts/seed-stock-movement-types.ts <slug-tenant>`
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient as CorePrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo
import { PrismaClient as InventoryPrismaClient } from '../../../../core/database/prisma/schemas/inventory/generated';

const TIPOS: Array<{ code: string; direction: 'in' | 'out' }> = [
  { code: 'receipt', direction: 'in' },
  { code: 'issue', direction: 'out' },
  { code: 'transfer_out', direction: 'out' },
  { code: 'transfer_in', direction: 'in' },
  { code: 'adjustment_increase', direction: 'in' },
  { code: 'adjustment_decrease', direction: 'out' },
  { code: 'production_output', direction: 'in' },
  { code: 'production_consumption', direction: 'out' },
];

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  if (!tenantSlug) {
    console.error('Uso: seed-stock-movement-types.ts <slug-tenant>');
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

    for (const tipo of TIPOS) {
      const existente = await inventoryClient.stock_movement_types.findFirst({
        where: { tenant_id: tenant.id, code: tipo.code, deleted_at: null },
      });
      if (existente) {
        console.log(`Ya existe "${tipo.code}" (${existente.id}), se omite.`);
        continue;
      }
      const creado = await inventoryClient.stock_movement_types.create({
        data: { tenant_id: tenant.id, code: tipo.code, direction: tipo.direction },
      });
      console.log(`Creado "${tipo.code}" (${creado.id}).`);
    }

    console.log('Listo.');
  } finally {
    await coreClient.$disconnect();
    await inventoryClient.$disconnect();
  }
}

void main();
