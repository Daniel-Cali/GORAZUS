import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@gorazus/ui-kit';
import { ESTADO_COLOR, type NivelEstado } from './sales-status';

export interface SalesKpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  nivel?: NivelEstado;
  contexto?: string;
  trend?: number;
  onAction?: () => void;
  actionLabel?: string;
}

/** Mismo componente insignia de KPI que Inventario (`InventoryKpiCard`) — barra de acento a la izquierda, número grande + contexto. */
export function SalesKpiCard({
  label,
  value,
  icon: Icon,
  nivel = 'neutral',
  contexto,
  trend,
  onAction,
  actionLabel,
}: SalesKpiCardProps) {
  const color = ESTADO_COLOR[nivel];
  const tendenciaPositiva = trend !== undefined && trend >= 0;

  return (
    <Card className="relative overflow-hidden py-0">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-start justify-between gap-3 p-4 pl-5">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {label}
          </div>
          <p className="text-2xl font-semibold tabular-nums leading-none text-foreground">
            {value}
          </p>
          {(contexto || trend !== undefined) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {trend !== undefined && (
                <span
                  className="inline-flex items-center gap-0.5 font-medium"
                  style={{ color: tendenciaPositiva ? ESTADO_COLOR.good : ESTADO_COLOR.critical }}
                >
                  {tendenciaPositiva ? (
                    <TrendingUp aria-hidden className="h-3 w-3" />
                  ) : (
                    <TrendingDown aria-hidden className="h-3 w-3" />
                  )}
                  {Math.abs(trend).toLocaleString('es', { maximumFractionDigits: 1 })}%
                </span>
              )}
              {contexto && <span>{contexto}</span>}
            </div>
          )}
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </Card>
  );
}
