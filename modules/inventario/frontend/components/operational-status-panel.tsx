import type { LucideIcon } from 'lucide-react';
import { Card } from '@gorazus/ui-kit';

export interface OperationalStatusItem {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
  onClick?: () => void;
}

export interface OperationalStatusPanelProps {
  items: OperationalStatusItem[];
}

/**
 * "Estado operativo" — fila compacta de contadores accionables (no tarjetas
 * grandes de KPI, esas ya viven arriba en `InventoryKpiCard`). Cada ítem en
 * cero se atenúa visualmente en vez de ocultarse — un operador debe poder
 * confirmar de un vistazo "no hay nada pendiente aquí", no adivinar por
 * ausencia.
 */
export function OperationalStatusPanel({ items }: OperationalStatusPanelProps) {
  return (
    <Card>
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {items.map((item) => {
          const Icon = item.icon;
          const enCero = item.count === 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              disabled={!item.onClick}
              className="flex flex-col items-start gap-1.5 p-4 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default disabled:hover:bg-transparent"
            >
              <Icon
                aria-hidden
                className={`h-4 w-4 ${enCero ? 'text-muted-foreground/50' : 'text-primary'}`}
              />
              <span
                className={`text-xl font-semibold tabular-nums ${enCero ? 'text-muted-foreground/60' : 'text-foreground'}`}
              >
                {item.count.toLocaleString('es')}
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
