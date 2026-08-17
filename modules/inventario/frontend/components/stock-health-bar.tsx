import { ESTADO_COLOR } from './inventory-status';

export interface StockHealthSegment {
  etiqueta: string;
  cantidad: number;
  color: string;
}

export interface StockHealthBarProps {
  saludable: number;
  bajo: number;
  critico: number;
  sobreStock: number;
  porVencer: number;
  vencido: number;
  onSegmentClick?: (segmento: string) => void;
}

/**
 * "Salud del inventario" — una sola barra segmentada horizontal en vez de
 * un gráfico de torta decorativo (regla de la misión: "avoid decorative
 * charts, every visualization must support an operational decision"). Cada
 * segmento es proporcional y clickeable — clickear filtra Stock por ese
 * estado, la barra ES la navegación, no solo una ilustración.
 */
export function StockHealthBar({
  saludable,
  bajo,
  critico,
  sobreStock,
  porVencer,
  vencido,
  onSegmentClick,
}: StockHealthBarProps) {
  const segmentos: StockHealthSegment[] = [
    { etiqueta: 'Saludable', cantidad: saludable, color: ESTADO_COLOR.good },
    { etiqueta: 'Bajo mínimo', cantidad: bajo, color: ESTADO_COLOR.warning },
    { etiqueta: 'Sobre stock', cantidad: sobreStock, color: ESTADO_COLOR.serious },
    { etiqueta: 'Por vencer', cantidad: porVencer, color: ESTADO_COLOR.warning },
    { etiqueta: 'Vencido', cantidad: vencido, color: ESTADO_COLOR.critical },
    { etiqueta: 'Crítico', cantidad: critico, color: ESTADO_COLOR.critical },
  ].filter((s) => s.cantidad > 0);

  const total = segmentos.reduce((sum, s) => sum + s.cantidad, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de stock para evaluar salud.</p>;
  }

  return (
    <div className="space-y-3">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label="Distribución de salud del inventario"
      >
        {segmentos.map((segmento) => (
          <button
            key={segmento.etiqueta}
            type="button"
            title={`${segmento.etiqueta}: ${segmento.cantidad.toLocaleString('es')}`}
            onClick={() => onSegmentClick?.(segmento.etiqueta)}
            className="h-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              width: `${(segmento.cantidad / total) * 100}%`,
              backgroundColor: segmento.color,
            }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {segmentos.map((segmento) => (
          <div key={segmento.etiqueta} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: segmento.color }}
            />
            <dt className="text-muted-foreground">{segmento.etiqueta}</dt>
            <dd className="ml-auto font-medium tabular-nums text-foreground">
              {segmento.cantidad.toLocaleString('es')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
