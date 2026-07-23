import type { UserContext } from '@gorazus/contracts';

/** Fila de `inventory.v_kardex` (docs/database/sql/24_views.sql) — vista, no tabla, no modelada por Prisma (sin `previewFeatures = ["views"]`). */
export interface KardexEntry {
  productId: string;
  warehouseId: string;
  movementTypeId: string;
  direction: 'in' | 'out';
  quantity: string;
  unitCost: string | null;
  movementValue: string;
  movementDate: Date;
  runningBalance: string;
}

/**
 * Adaptador de solo lectura sobre la vista `inventory.v_kardex` — saldo
 * corrido calculado con función de ventana en la base
 * (`SUM(...) OVER (PARTITION BY product_id, warehouse_id ORDER BY
 * created_at)`), reusada tal cual vía `$queryRaw` en vez de reimplementar
 * la misma lógica en la aplicación (`INVENTORY_ARCHITECTURE.md §2`). RLS
 * se aplica igual que sobre cualquier tabla real: la vista no es
 * `SECURITY DEFINER`, resuelve con el mismo contexto de tenant que
 * `withTenantScope` ya fija dentro de la misma transacción.
 */
export abstract class KardexRepository {
  abstract consultar(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; desde?: Date; hasta?: Date },
    pagination: { page: number; pageSize: number },
  ): Promise<KardexEntry[]>;
}
