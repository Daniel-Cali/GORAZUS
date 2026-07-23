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
  audit_logs,
  tokens,
  user_companies,
  user_profiles,
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
/**
 * Cliente Prisma del schema `configuration` — a diferencia de `core` de
 * arriba, este es OTRO cliente independiente (`PRISMA_CONFIGURATION`, no
 * `PRISMA_CORE`), ver comentario de cabecera de `database.module.ts`.
 * Primer consumidor: `modules/configuracion/backend` (Monedas, Fase 02).
 */
export type {
  PrismaClient as ConfigurationPrismaClient,
  Prisma as ConfigurationPrisma,
} from '../prisma/schemas/configuration/generated';
export type { currencies, countries } from '../prisma/schemas/configuration/generated';
/**
 * Cliente Prisma del schema `taxes` — tercer cliente independiente
 * (`PRISMA_TAXES`), mismo criterio que `ConfigurationPrismaClient` de
 * arriba. Primer consumidor: `modules/configuracion/backend` (Impuestos,
 * Fase 02 — alcance mínimo: perfiles de impuesto + tasas, no el motor de
 * cálculo/reglas completo, ver `services/impuestos.service.ts`).
 */
export type {
  PrismaClient as TaxesPrismaClient,
  Prisma as TaxesPrisma,
} from '../prisma/schemas/taxes/generated';
export type { taxes, tax_rates, tax_jurisdictions } from '../prisma/schemas/taxes/generated';
/**
 * Cliente Prisma del schema `security` — cuarto cliente independiente
 * (`PRISMA_SECURITY`), mismo criterio que `ConfigurationPrismaClient`/
 * `TaxesPrismaClient` de arriba. Primer consumidor:
 * `modules/seguridad/backend` (2FA "preparado", Fase 02).
 */
export type {
  PrismaClient as SecurityPrismaClient,
  Prisma as SecurityPrisma,
} from '../prisma/schemas/security/generated';
export type { two_factor_credentials } from '../prisma/schemas/security/generated';
/**
 * Cliente Prisma del schema `inventory` — quinto cliente independiente
 * (`PRISMA_INVENTORY`), mismo criterio que los anteriores. Primer
 * consumidor: `modules/inventario/backend` (Almacenes — FASE 03,
 * continuidad: `warehouses`/`warehouse_zones`/`warehouse_locations`
 * únicamente, el resto de las 32 tablas del schema `inventory` — stock,
 * movimientos, costeo, conteos, producción — es la fase "Inventario"
 * siguiente, sin código todavía, ver `docs/architecture/19-modulo-inventory.md`).
 */
export type {
  PrismaClient as InventoryPrismaClient,
  Prisma as InventoryPrisma,
} from '../prisma/schemas/inventory/generated';
export type {
  warehouses,
  warehouse_zones,
  warehouse_locations,
} from '../prisma/schemas/inventory/generated';
// prisma.service.ts (cliente único monolítico) queda superado por el
// enfoque de 21 clientes por schema en database.module.ts — ver el
// comentario de cabecera de ese archivo. No se elimina el archivo
// (regla del proyecto), pero deja de exportarse: su import a
// '../prisma/generated' apunta a un cliente que ya no se genera.
