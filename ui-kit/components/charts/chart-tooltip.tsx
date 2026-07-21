import type { TooltipProps } from 'recharts';
import { cn } from '../../lib/cn';

/** Tooltip compartido por los 4 tipos de gráfico (dataviz skill, interaction.md: "un gráfico HTML/SVG ES interactivo, el hover no es opcional"). */
export function ChartTooltip({
  active,
  payload,
  label,
  className,
}: TooltipProps<number, string> & { className?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className={cn('rounded-md border bg-popover px-3 py-2 text-xs shadow-md', className)}
      style={{ background: 'var(--chart-surface)' }}
    >
      {label !== undefined && (
        <p className="mb-1 font-medium" style={{ color: 'var(--chart-ink-primary)' }}>
          {String(label)}
        </p>
      )}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.dataKey as string} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color }}
            />
            <span style={{ color: 'var(--chart-ink-secondary)' }}>{entry.name}:</span>
            <span
              className="font-medium tabular-nums"
              style={{ color: 'var(--chart-ink-primary)' }}
            >
              {typeof entry.value === 'number' ? entry.value.toLocaleString('es') : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
