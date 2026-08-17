import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@gorazus/ui-kit';

/**
 * Fila real de `products.products` (`ProductosController.listar`) — no hay
 * columna `name` en el schema (solo `sku`), mismo criterio que
 * `ProductoPosRecord` del POS. `GET /productos` no soporta búsqueda de texto
 * todavía (solo `categoryId`) — el filtro por texto en `producto-selector.tsx`
 * es del lado del cliente sobre esta página, limitación real documentada,
 * no una búsqueda inventada.
 */
export interface ProductoBusquedaRow {
  id: string;
  sku: string;
  list_price: string | null;
  base_unit_id: string;
}

export function useProductosBusqueda() {
  return useQuery({
    queryKey: ['ventas', 'productos-busqueda'],
    queryFn: () =>
      apiClient.get<ProductoBusquedaRow[]>('/productos', { params: { page: 1, pageSize: 100 } }),
    staleTime: 60 * 1000,
  });
}
