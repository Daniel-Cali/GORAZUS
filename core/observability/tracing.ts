import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

/**
 * Ver docs/architecture/32-core-platform/07-observabilidad-y-gobernanza.md §7:
 * el trace ID reutiliza el mismo `requestId` que ya genera
 * core/logging/request-context.ts (AsyncLocalStorage) — acá solo se
 * instrumenta el runtime (HTTP entrante/saliente, etc.) para que
 * existan spans que correlacionar, no se reimplementa la propagación.
 *
 * Backend real (Jaeger vía OTLP) es trabajo de Fase 9 de infra
 * (docs/architecture/31-infraestructura-completa.md §9) — todavía no
 * desplegado. Por eso el exporter es condicional: si
 * `OTEL_EXPORTER_OTLP_ENDPOINT` no está configurado (caso de hoy, dev
 * local), las trazas van a consola (`ConsoleSpanExporter`) en vez de
 * fallar o intentar conectarse a un colector que no existe — la
 * instrumentación queda lista, el destino se activa con una variable
 * de entorno el día que Jaeger esté desplegado, sin cambiar código.
 *
 * DEBE llamarse antes de importar cualquier otro módulo que
 * OpenTelemetry necesite parchear (http, express) — se invoca desde
 * apps/api/src/main.ts como el primer import/llamada del proceso, no
 * desde un provider de NestJS (demasiado tarde en el ciclo de carga).
 */
export function initTracing(): NodeSDK {
  const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'gorazus-api',
    }),
    traceExporter: otlpEndpoint
      ? new OTLPTraceExporter({ url: otlpEndpoint })
      : new ConsoleSpanExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  return sdk;
}
