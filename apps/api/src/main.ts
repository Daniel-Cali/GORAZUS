import { initTracing, initMetrics } from '@gorazus/core-observability';

// DEBE ejecutarse antes de requerir cualquier módulo que OpenTelemetry
// instrumente (http, express) — ver core/observability/tracing.ts.
// Confirmado empíricamente que tsc preserva el orden textual en su
// output CommonJS (no hace hoisting estilo ESM puro), así que esta
// posición es la que realmente importa, no solo estética.
initTracing();
initMetrics();

import { ConfigService } from '@nestjs/config';
import { bootstrap } from '@gorazus/core-kernel';
import { AppModule } from './app/app.module';

async function main(): Promise<void> {
  const app = await bootstrap(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') ?? 3000;
  await app.listen(port);
}

void main();
