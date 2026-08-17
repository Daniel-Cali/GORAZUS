import { resolverSaludStock, ESTADO_COLOR } from './inventory-status';

export interface StockAvailabilityBarProps {
  quantityOnHand: number;
  quantityReserved: number;
  minQuantity?: number | null;
  className?: string;
}

/**
 * Barra compacta de disponibilidad para celdas de tabla — a mano vs.
 * reservado vs. mínimo, un vistazo sin abrir el detalle. Compañera de
 * `StockHealthBar` (esa es agregada/dashboard, esta es por fila/producto).
 */
export function StockAvailabilityBar({
  quantityOnHand,
  quantityReserved,
  minQuantity,
  className,
}: StockAvailabilityBarProps) {
  const disponible = Math.max(0, quantityOnHand - quantityReserved);
  const salud = resolverSaludStock({ quantityOnHand, quantityReserved, minQuantity });
  const pctReservado = quantityOnHand > 0 ? (quantityReserved / quantityOnHand) * 100 : 0;

  return (
    <div className={`min-w-[7rem] space-y-1 ${className ?? ''}`}>
      <div className="flex items-baseline justify-between text-xs tabular-nums">
        <span className="font-semibold text-foreground">{disponible.toLocaleString('es')}</span>
        <span className="text-muted-foreground">de {quantityOnHand.toLocaleString('es')}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${100 - pctReservado}%`, backgroundColor: ESTADO_COLOR[salud.nivel] }}
        />
      </div>
    </div>
  );
}
