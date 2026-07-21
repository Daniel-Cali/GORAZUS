import { z } from 'zod';

/**
 * Ver docs/architecture/12-backend-enterprise.md §7: valida el proceso
 * completo al boot — variable faltante o inválida = la aplicación no
 * arranca (fail fast), nunca un error críptico en producción a mitad
 * de request. La forma del schema es idéntica en local/staging/production
 * (docs/architecture/08-infraestructura-y-despliegue.md §6) — solo
 * cambian los valores.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  RABBITMQ_URL: z.string().url(),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),

  API_PORT: z.coerce.number().int().positive().default(3000),

  /** Origen exacto del frontend — CORS con `credentials: true` (cookie httpOnly de refresh token, docs/architecture/13-modulo-auth.md §2) exige un origen explícito, nunca `*`. */
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),

  /**
   * Clave AES-256-GCM (hex, 32 bytes = 64 caracteres) para `packages/tooling/utils/encryption.ts`
   * (`EncryptionUtils` de 32-core-platform/10-utilidades-comunes.md §7, ya construida) —
   * cifra `core.integration_credentials.encrypted_value`. Fase 1 (núcleo mínimo de
   * Notification Center, ver 42-integraciones-plan-fase-8.md §2): una sola clave por
   * variable de entorno con `keyId` fijo, sin el `security.data_encryption_keys` + KMS
   * externo con rotación multi-clave que describe el mismo §7 — documentado como Fase 2.
   */
  NOTIFICATIONS_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'debe ser una clave AES-256 en hexadecimal de 64 caracteres (32 bytes)',
    ),

  /** Versión de Graph API de Meta usada por el canal WhatsApp Business — no es secreto, solo versión de API. */
  WHATSAPP_GRAPH_API_VERSION: z.string().min(1).default('v21.0'),

  /**
   * Ollama (FASE 04 — infraestructura de IA, `core/ollama`) — sin necesidad de
   * negocio confirmada todavía para ningún asistente específico (Ventas/Compras/
   * Inventario/Contabilidad/CRM/Reportes, Predicciones, Alertas, Automatizaciones),
   * mismo criterio de gobernanza que el resto de integraciones sin diseño
   * especulativo (`42-integraciones-plan-fase-8.md §3-4`) — solo la infraestructura
   * técnica reutilizable. Sin `default` para `OLLAMA_DEFAULT_MODEL`: qué modelo usar
   * es una decisión de implementación de cada futuro asistente, no de esta capa.
   */
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_DEFAULT_MODEL: z.string().min(1),
});

export type EnvSchema = z.infer<typeof envSchema>;

/**
 * Invocado por ConfigModule.forRoot({ validate }) — NestJS llama esta
 * función una vez al boot con process.env crudo. Lanzar acá aborta el
 * arranque con el detalle exacto de qué variable falta o es inválida
 * (fail fast), en vez de que el error aparezca recién cuando algo la
 * use en producción.
 */
export function validateEnv(config: Record<string, unknown>): EnvSchema {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${result.error.toString()}`);
  }
  return result.data;
}
