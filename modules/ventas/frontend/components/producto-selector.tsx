import * as React from 'react';
import { Input } from '@gorazus/ui-kit';
import { useProductosBusqueda, type ProductoBusquedaRow } from '../hooks/use-productos-busqueda';

export interface ProductoSelectorProps {
  onSelect: (producto: ProductoBusquedaRow) => void;
  disabled?: boolean;
}

/**
 * Buscador de productos para líneas de Cotización — filtro por SKU del lado
 * del cliente sobre la primera página del catálogo real (`GET /productos`),
 * no una búsqueda de texto real: ese endpoint todavía no soporta `query`
 * (solo `categoryId`). Limitación real documentada, no inventada.
 */
export function ProductoSelector({ onSelect, disabled }: ProductoSelectorProps) {
  const [filtro, setFiltro] = React.useState('');
  const productos = useProductosBusqueda();

  const resultados = React.useMemo(() => {
    const lista = productos.data?.data ?? [];
    if (!filtro) return lista.slice(0, 8);
    const q = filtro.trim().toLowerCase();
    return lista.filter((p) => p.sku.toLowerCase().includes(q)).slice(0, 8);
  }, [productos.data, filtro]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Filtrar por SKU…"
        value={filtro}
        disabled={disabled}
        onChange={(e) => setFiltro(e.target.value)}
      />
      <div className="max-h-48 overflow-y-auto rounded-md border border-border">
        {productos.isLoading && (
          <p className="p-2 text-xs text-muted-foreground">Cargando catálogo…</p>
        )}
        {!productos.isLoading && resultados.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">Sin productos que coincidan.</p>
        )}
        {resultados.map((p: ProductoBusquedaRow) => (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
            onClick={() => onSelect(p)}
          >
            <span className="font-mono">{p.sku}</span>
            <span className="tabular-nums text-muted-foreground">
              {p.list_price ? Number(p.list_price).toFixed(2) : 'Sin precio'}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Catálogo limitado a los primeros 100 productos — el backend todavía no soporta búsqueda de
        texto en <code>/productos</code>.
      </p>
    </div>
  );
}
