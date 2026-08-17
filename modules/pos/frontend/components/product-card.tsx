import { Card, CardContent } from '@gorazus/ui-kit';
import type { ProductoPosRecord } from '../hooks/use-pos';

/**
 * Tarjeta de catálogo (Fase 1 rediseño POS). `ProductoPosRecord` (GET
 * `/pos/productos`) solo trae `id`/`sku`/`listPrice`/`baseUnitId` — no hay
 * `name` ni imagen real todavía, así que no se inventan: el SKU es el
 * label principal y la imagen es un placeholder con las iniciales del SKU
 * (mismo patrón que Square/Toast cuando no hay foto cargada), listo para
 * mostrar una imagen real el día que el catálogo la tenga.
 */
export function ProductCard({
  producto,
  currencyCode,
  onSelect,
}: {
  producto: ProductoPosRecord;
  currencyCode: string;
  onSelect: (producto: ProductoPosRecord) => void;
}) {
  const iniciales = producto.sku.slice(0, 2).toUpperCase();
  const precio =
    producto.listPrice !== null
      ? new Intl.NumberFormat('es', { style: 'currency', currency: currencyCode }).format(
          producto.listPrice,
        )
      : 'Sin precio';

  return (
    <Card
      className="cursor-pointer overflow-hidden transition hover:border-primary hover:shadow-md active:scale-[0.98]"
      onClick={() => onSelect(producto)}
    >
      <div
        className="flex aspect-square items-center justify-center bg-muted/60 text-muted-foreground"
        aria-hidden
      >
        <span className="text-lg font-semibold tracking-wide">{iniciales}</span>
      </div>
      <CardContent className="space-y-0.5 p-2.5">
        <p className="truncate text-sm font-medium leading-tight">{producto.sku}</p>
        <p className="text-sm font-semibold tabular-nums text-primary">{precio}</p>
      </CardContent>
    </Card>
  );
}
