/**
 * Siembra el catálogo mínimo de `inventory.goods_issue_reasons` pedido para
 * Inventario Parte 05 Subfase 2 (Salidas) — no es un enum fijo, agregar un
 * motivo nuevo más adelante requeriría su propio endpoint (no existe
 * todavía, fuera de alcance de esta subfase); este script solo desbloquea
 * el arranque, mismo patrón operativo que `seed-stock-adjustment-reasons.ts`.
 *
 * Uso: `npx ts-node --transpile-only modules/inventario/backend/scripts/seed-stock-issue-reasons.ts <slug-tenant>`
 */
// eslint-disable-next-line @nx/enforce-module-boundaries -- script standalone, ver comentario de cabecera
import { PrismaClient as CorePrismaClient } from '../../../../core/database/prisma/schemas/core/generated';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo
import { PrismaClient as InventoryPrismaClient } from '../../../../core/database/prisma/schemas/inventory/generated';

const MOTIVOS = ['Venta', 'Consumo Interno', 'Ajuste', 'Devolución', 'Producción'];

async function main(): Promise<void> {
  const tenantSlug = process.argv[2];
  if (!tenantSlug) {
    console.error('Uso: seed-stock-issue-reasons.ts <slug-tenant>');
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
      const existente = await inventoryClient.goods_issue_reasons.findFirst({
        where: { tenant_id: tenant.id, name: nombre, deleted_at: null },
      });
      if (existente) {
        console.log(`Ya existe "${nombre}" (${existente.id}), se omite.`);
        continue;
      }
      const creado = await inventoryClient.goods_issue_reasons.create({
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
