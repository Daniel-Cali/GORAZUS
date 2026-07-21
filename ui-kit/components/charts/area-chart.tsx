import {
  Area,
  AreaChart as RechartsAreaChart,
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

export interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  stacked?: boolean;
}

/** `chart_type = 'area'` — magnitud acumulada en el tiempo (p. ej. stock, saldo). */
export function AreaChart({ data, xKey, series, height = 280, stacked = false }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
          cursor={{ stroke: CHART_INK.baseline, strokeWidth: 1 }}
        />
        {series.length > 1 && (
          <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK.secondary }} />
        )}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={seriesColor(i)}
            fill={seriesColor(i)}
            fillOpacity={0.15}
            strokeWidth={2}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
