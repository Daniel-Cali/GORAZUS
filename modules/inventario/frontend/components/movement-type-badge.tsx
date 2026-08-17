import { resolverMovimientoVisual, ESTADO_COLOR } from './inventory-status';

export interface MovementTypeBadgeProps {
  code: string;
  className?: string;
}

/**
 * Insignia de tipo de movimiento — punto de color + texto (nunca solo
 * color, WCAG). Estilo propio de GORAZUS: cápsula con borde y fondo tenue
 * en vez del `Badge` genérico relleno de `ui-kit` — reservamos ese para
 * conteos/badges neutrales, este es el vocabulario visual específico de
 * trazabilidad de movimientos.
 */
export function MovementTypeBadge({ code, className }: MovementTypeBadgeProps) {
  const { etiqueta, nivel } = resolverMovimientoVisual(code);
  const color = ESTADO_COLOR[nivel];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums ${className ?? ''}`}
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
