import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CHART_STATUS_COLORS } from './chart-colors';

export interface KpiNumberProps {
  label: string;
  value: string;
  /** % de variación vs. el período anterior — positivo/negativo determina el ícono y el color (good/critical), nunca solo color (dataviz skill: "un color de estado nunca lleva significado solo"). */
  trend?: number;
  className?: string;
}

/** `chart_type = 'number'` — no todo KPI necesita gráfico (docs/architecture/29 §8.1). Hero number + tendencia. */
export function KpiNumber({ label, value, trend, className }: KpiNumberProps) {
  const isPositive = trend !== undefined && trend >= 0;
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {trend !== undefined && (
        <p
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: isPositive ? CHART_STATUS_COLORS.good : CHART_STATUS_COLORS.critical }}
        >
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{Math.abs(trend).toLocaleString('es', { maximumFractionDigits: 1 })}%</span>
          <span className="font-normal text-muted-foreground">vs. período anterior</span>
        </p>
      )}
    </div>
  );
}
