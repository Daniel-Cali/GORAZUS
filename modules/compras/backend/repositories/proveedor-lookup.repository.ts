import type { UserContext } from '@gorazus/contracts';

export interface ProveedorLookup {
  id: string;
  isBlocked: boolean;
}

/** Puerto — verificación de proveedor (existencia + bloqueo) al crear una orden de compra. Copia local de solo lectura sobre `suppliers.suppliers`, mismo motivo que el resto de los lookups de este módulo (fronteras de Nx entre módulos de negocio). */
export abstract class ProveedorLookupRepository {
  abstract obtenerProveedor(
    context: UserContext,
    supplierId: string,
  ): Promise<ProveedorLookup | null>;
}
