import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_INK, seriesColor } from './chart-colors';
import { ChartTooltip } from './chart-tooltip';

export interface PieChartDatum {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: PieChartDatum[];
  height?: number;
}

/**
 * `chart_type = 'pie'` — composición de un todo en partes. Tope de 8
 * categorías (una por slot del orden categórico fijo, dataviz skill
 * §palette) — más de 8 pliega a "Otros" antes de graficar, no genera un
 * 9no color.
 */
export function PieChart({ data, height = 280 }: PieChartProps) {
  const capped =
    data.length > 8
      ? [
          ...data.slice(0, 7),
          { name: 'Otros', value: data.slice(7).reduce((sum, d) => sum + d.value, 0) },
        ]
      : data;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK.secondary }} />
        <Pie
          data={capped}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {capped.map((entry, i) => (
            <Cell
              key={entry.name}
              fill={seriesColor(i)}
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
