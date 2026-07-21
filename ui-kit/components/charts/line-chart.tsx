import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_INK, seriesColor } from './chart-colors';
import { ChartTooltip } from './chart-tooltip';

export interface SeriesDef {
  key: string;
  label: string;
}

export interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
}

/** `chart_type = 'line'` (docs/architecture/29-frontend-enterprise.md §8.1) — tendencia en el tiempo. */
export function LineChart({ data, xKey, series, height = 280 }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={seriesColor(i)}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
