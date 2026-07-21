/**
 * Fase 1 (infraestructura técnica reutilizable, sin asistentes específicos —
 * decisión de alcance confirmada, ver docs/architecture/42-integraciones-plan-fase-8.md §4):
 * superficie mínima sobre el cliente oficial `ollama` (generate/chat/embed/listModels,
 * sin streaming) — cualquier asistente concreto (Ventas/Compras/Inventario/Contabilidad/
 * CRM/Reportes) decide su propio prompt/modelo/streaming cuando exista, no esta capa.
 */
export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaCallOptions {
  /** Modelo a usar — si se omite, usa `OLLAMA_DEFAULT_MODEL` (ver core/config/namespaces/ollama.config.ts). */
  model?: string;
}
