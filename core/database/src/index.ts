export * from './database.module';
export * from './base.repository';
export * from './tenant-scope';

/**
 * Re-export de tipo del cliente Prisma de `core` (identidad/RBAC base:
 * `users`, `roles`, `permissions`, `sessions`...) — ruta pública para que
 * `modules/<x>/backend` tipe su adaptador Prisma sin un import relativo
 * profundo hacia `core/database/prisma/schemas/core/generated` (que
 * cruzaría el límite del paquete de forma no idiomática). Se agrega acá
 * bajo demanda, un schema a la vez, según qué módulo lo necesita — no se
 * exportan los 21 de una (`01-estructura-monorepo.md §2`, "alcance real,
 * no simetría"). Primer consumidor: `modules/auth/backend`,
 * `modules/seguridad/backend` (Paso 3, ver docs/architecture/13-modulo-auth.md §0).
 */
export type {
  PrismaClient as CorePrismaClient,
  Prisma as CorePrisma,
} from '../prisma/schemas/core/generated';
/** Tipos de modelo puntuales de `core` — se agregan acá, uno a la vez, a medida que un módulo los necesita (mismo criterio que arriba). */
export type {
  users,
  roles,
  permissions,
  role_permissions,
  user_roles,
  sessions,
  tenants,
} from '../prisma/schemas/core/generated';
/** Consumidos por `core/notifications` (Notification Center, Fase 1 — canal WhatsApp). */
export type {
  integrations,
  integration_credentials,
  notification_channels,
  notification_preferences,
  notifications,
  notification_delivery_logs,
} from '../prisma/schemas/core/generated';
/** Consumidos por `modules/configuracion/backend` (Fase 02 — Empresas, Sucursales, Parámetros). */
export type {
  companies,
  branches,
  system_parameters,
  system_settings,
} from '../prisma/schemas/core/generated';
// prisma.service.ts (cliente único monolítico) queda superado por el
// enfoque de 21 clientes por schema en database.module.ts — ver el
// comentario de cabecera de ese archivo. No se elimina el archivo
// (regla del proyecto), pero deja de exportarse: su import a
// '../prisma/generated' apunta a un cliente que ya no se genera.
