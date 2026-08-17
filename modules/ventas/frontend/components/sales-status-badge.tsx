import { resolverEstadoVisual, ESTADO_COLOR, type EstadoVisual } from './sales-status';

export interface SalesStatusBadgeProps {
  catalogo: Record<string, EstadoVisual>;
  code: string | undefined;
  className?: string;
}

/**
 * Insignia de estado de documento de venta — mismo estilo visual que
 * `MovementTypeBadge` de Inventario (punto de color + texto, nunca solo
 * color, WCAG), aplicado sobre los 3 catálogos de estado de Ventas.
 */
export function SalesStatusBadge({ catalogo, code, className }: SalesStatusBadgeProps) {
  const { etiqueta, nivel } = resolverEstadoVisual(catalogo, code);
  const color = ESTADO_COLOR[nivel];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${className ?? ''}`}
      style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {etiqueta}
    </span>
  );
}
