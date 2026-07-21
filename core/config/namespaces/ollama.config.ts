import { registerAs } from '@nestjs/config';

/** Namespace `ollama` (FASE 04 — infraestructura de IA) — mismo patrón que `storage.config.ts`. Ver core/ollama/ollama.service.ts. */
export default registerAs('ollama', () => ({
  baseUrl: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
  defaultModel: process.env['OLLAMA_DEFAULT_MODEL'],
}));
