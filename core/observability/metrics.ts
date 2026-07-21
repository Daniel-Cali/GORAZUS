import { Counter, Histogram } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

/**
 * Ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md §6
 * (Monitoring depende de Metrics) y 31-infraestructura-completa.md §9
 * (OpenTelemetry -> Prometheus -> Grafana, stack ya elegido).
 *
 * A diferencia de Tracing, el exporter de Prometheus no necesita un
 * colector externo desplegado: expone su propio endpoint HTTP
 * (`/metrics` en el puerto configurado) para que Prometheus lo
 * scrapee cuando exista — funciona igual en dev que en producción, sin
 * integración condicional. Puerto separado del listener principal de
 * la API (patrón estándar de Prometheus exporters, evita mezclar
 * tráfico de negocio con scraping de métricas).
 */
const METRICS_PORT = Number(process.env['METRICS_PORT'] ?? 9464);

export interface HttpMetrics {
  requestsTotal: Counter;
  requestDurationMs: Histogram;
}

let httpMetrics: HttpMetrics | undefined;

export function initMetrics(): PrometheusExporter {
  const exporter = new PrometheusExporter({ port: METRICS_PORT });

  const meterProvider = new MeterProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'gorazus-api',
    }),
    readers: [exporter],
  });

  const meter = meterProvider.getMeter('gorazus-api');
  httpMetrics = {
    requestsTotal: meter.createCounter('http_requests_total', {
      description: 'Total de requests HTTP procesadas',
    }),
    requestDurationMs: meter.createHistogram('http_request_duration_ms', {
      description: 'Duración de requests HTTP en milisegundos',
    }),
  };

  return exporter;
}

/** Disponible recién después de initMetrics() — ver apps/api/src/main.ts. */
export function getHttpMetrics(): HttpMetrics {
  if (!httpMetrics) {
    throw new Error('initMetrics() no fue llamado todavía');
  }
  return httpMetrics;
}
