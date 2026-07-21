import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_INK, seriesColor } from './chart-colors';
import { ChartTooltip } from './chart-tooltip';
import type { SeriesDef } from './line-chart';

export interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  stacked?: boolean;
}

/** `chart_type = 'bar'` — comparación de magnitud entre categorías. */
export function BarChart({ data, xKey, series, height = 280, stacked = false }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={CHART_INK.gridline} vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={CHART_INK.muted}
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.baseline }}
        />
        <YAxis
          stroke={CHART_INK.muted}
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: 'color-mix(in srgb, var(--chart-baseline) 20%, transparent)' }}
        />
        {series.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK.secondary }} />
        )}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={seriesColor(i)}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? 0 : [4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
