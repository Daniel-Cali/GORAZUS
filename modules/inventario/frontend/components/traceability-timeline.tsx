import type { LucideIcon } from 'lucide-react';
import { ESTADO_COLOR, type NivelEstado } from './inventory-status';
import { formatDateTime } from '@gorazus/ui-kit';

export interface TraceabilityEvent {
  id: string;
  icon: LucideIcon;
  titulo: string;
  fecha: string | Date;
  usuario?: string;
  documento?: string;
  cantidad?: string;
  ubicacion?: string;
  nivel?: NivelEstado;
}

export interface TraceabilityTimelineProps {
  eventos: TraceabilityEvent[];
  emptyMessage?: string;
}

/**
 * "Inventory Trace" — componente insignia de GORAZUS (única experiencia
 * pedida explícitamente que "no se sienta como un componente ERP estándar").
 * Línea vertical continua conectando nodos — cada nodo es un evento real de
 * `stock_movements` (fecha, usuario, documento, cantidad, ubicación), nunca
 * una ilustración genérica de "timeline de actividad". Reutilizado sin
 * modificación en Detalle de Lote, Detalle de Serie y el Centro de
 * Trazabilidad del dashboard — un solo componente, tres contextos.
 */
export function TraceabilityTimeline({ eventos, emptyMessage }: TraceabilityTimelineProps) {
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {emptyMessage ?? 'Todavía no hay movimientos registrados para trazar.'}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {eventos.map((evento, index) => {
        const color = ESTADO_COLOR[evento.nivel ?? 'neutral'];
        const esUltimo = index === eventos.length - 1;
        const Icon = evento.icon;
        return (
          <li key={evento.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!esUltimo && (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
              />
            )}
            <span
              aria-hidden
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background"
              style={{ borderColor: color }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-semibold text-foreground">{evento.titulo}</p>
                <time
                  dateTime={new Date(evento.fecha).toISOString()}
                  className="text-xs tabular-nums text-muted-foreground"
                >
                  {formatDateTime(new Date(evento.fecha))}
                </time>
              </div>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {evento.documento && <span>Doc. {evento.documento}</span>}
                {evento.cantidad && <span className="tabular-nums">{evento.cantidad}</span>}
                {evento.ubicacion && <span>{evento.ubicacion}</span>}
                {evento.usuario && <span>{evento.usuario}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
