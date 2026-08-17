import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/**
 * Fila real de `inventory.warehouses` (`AlmacenesController.listar`) —
 * necesario solo para resolver `warehouseId` al convertir una cotización en
 * pedido (`POST /ventas/pedidos/desde-cotizacion/:id?warehouseId=`, reserva
 * de inventario obligatoria). Duplicado local por la misma razón que
 * `use-clientes-busqueda.ts`: `type:frontend` no puede importar otro
 * `type:frontend` (`modules/inventario/frontend` en este caso).
 */
export interface AlmacenSucursalRow {
  id: string;
  name: string;
}

export function useAlmacenesSucursal(branchId: string | undefined) {
  return useQuery({
    queryKey: ['ventas', 'almacenes-sucursal', branchId],
    queryFn: () =>
      apiClient.get<AlmacenSucursalRow[]>('/inventario/almacenes', {
        params: { branchId: branchId ?? undefined, page: 1, pageSize: 50 },
      }),
    enabled: !!branchId,
  });
}
