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

  // Intencionalmente afuera de este schema: POSTGRES_PASSWORD/POSTGRES_BACKUP_PASSWORD/
  // RABBITMQ_PASSWORD/PGADMIN_PASSWORD (ver .env.example). Esas variables las consume
  // Docker Compose para interpolar DATABASE_URL/RABBITMQ_URL y arrancar los contenedores
  // de infraestructura (infra/docker/docker-compose.yml) — el proceso Node de apps/api
  // nunca lee process.env de esos nombres, solo la URL ya compuesta de abajo. Agregarlas
  // acá las haría "requeridas" para el proceso de la app sin que este las use jamás.
  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  RABBITMQ_URL: z.string().url(),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive(),
  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),

  /**
   * Parte 2.1 (infraestructura del módulo `auth`) — los valores reales
   * (TTL de 15m/7 días, umbral de bloqueo 5/15min, TTL de desafío 2FA
   * 5min) siguen hardcodeados como constantes en `LoginUseCase`/
   * `RefreshTokenUseCase`/`CompleteTwoFactorLoginUseCase` (Parte 2 —
   * Backend Core), sin leer todavía estas variables. Quedan acá,
   * validadas y con default idéntico al valor hardcodeado actual, listas
   * para que Parte 2.2 las conecte sin cambiar comportamiento por
   * default. Fail-fast igual que el resto del schema si alguien pone un
   * valor inválido, aunque nada las lea todavía.
   */
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  LOGIN_LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(5),
  LOGIN_LOCKOUT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  TWO_FACTOR_CHALLENGE_TTL_MINUTES: z.coerce.number().int().positive().default(5),

  /** FASE 03 Parte 02 — TTL largo de refresh token para "recordar sesión" (`rememberMe` en `POST /auth/login`). */
  JWT_REMEMBER_ME_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /**
   * Protección de session-hijacking en `POST /auth/refresh`: `false`
   * (default) solo registra un warning si la IP/User-Agent no coinciden
   * con los guardados al emitir la sesión; `true` además rechaza el
   * refresh. Apagado por default porque IP/UA cambian legítimamente
   * (redes móviles, actualizaciones de navegador) y activar el rechazo
   * sin datos reales de falsos positivos podría bloquear usuarios
   * legítimos — decisión de producto, no técnica.
   */
  // z.coerce.boolean() NO sirve acá — coerciona cualquier string no vacío
  // (incluido literalmente "false") a `true`. `z.enum` + `transform` es el
  // primer booleano de env.schema.ts, sin precedente previo que seguir.
  AUTH_STRICT_SESSION_VALIDATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

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
   * Clave AES-256-GCM (hex, 32 bytes = 64 caracteres) para
   * `packages/tooling/utils/encryption.ts` — cifra
   * `security.two_factor_credentials.encrypted_secret` (2FA TOTP, Fase 02
   * "preparado" — ver `modules/seguridad/backend/services/dos-factores.service.ts`).
   * Clave propia, separada de `NOTIFICATIONS_ENCRYPTION_KEY`, mismo criterio
   * de "una clave por feature" que ya usa Notification Center.
   */
  SEGURIDAD_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'debe ser una clave AES-256 en hexadecimal de 64 caracteres (32 bytes)',
    ),

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
