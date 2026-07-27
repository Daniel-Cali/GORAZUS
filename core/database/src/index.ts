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
/** `payment_forms` ya sembrado (`docs/database/sql/22_seed_data.sql`) — consumido por `modules/pos/backend` (forma de pago del checkout, FASE 06 Parte 01). */
export type { payment_forms } from '../prisma/schemas/configuration/generated';
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
 * continuidad: `warehouses`/`warehouse_zones`/`warehouse_locations`).
 * FASE 05 Parte 02 agregó `stock`/`stock_movement_types`/
 * `stock_movements`. FASE 05 Parte 03 agregó `stock_reservations`/
 * `stock_transfers`/`stock_transfer_lines`. FASE 05 Parte 04 (Ajustes y
 * Conteos Físicos) agrega `stock_adjustment_reasons`/`stock_adjustments`/
 * `stock_adjustment_lines`/`physical_counts`/`physical_count_lines`/
 * `cycle_count_schedules` — el resto de las 34 tablas del schema
 * (recepciones, salidas, costeo, series, lotes, producción) sigue sin
 * código, ver `INVENTORY_NEXT_PHASE.md`.
 */
export type {
  PrismaClient as InventoryPrismaClient,
  Prisma as InventoryPrisma,
} from '../prisma/schemas/inventory/generated';
export type {
  warehouses,
  warehouse_zones,
  warehouse_locations,
  stock,
  stock_movement_types,
  stock_movements,
  stock_reservations,
  stock_transfers,
  stock_transfer_lines,
  stock_adjustment_reasons,
  stock_adjustments,
  stock_adjustment_lines,
  physical_counts,
  physical_count_lines,
  cycle_count_schedules,
} from '../prisma/schemas/inventory/generated';
/**
 * Cliente Prisma del schema `products` — sexto cliente independiente
 * (`PRISMA_PRODUCTS`), mismo criterio que los anteriores. Primer
 * consumidor: `modules/productos/backend` (FASE 04: Unidades de Medida,
 * Categorías, Marcas, Modelos, Productos — 5 de las 35 tablas del
 * schema, el resto — variantes vía `product_variant_attribute_values`,
 * atributos, combos, kits, BOM/recetas, imágenes, códigos de barra,
 * historial de precios, reseñas, proveedores, perfiles fiscales — sin
 * código todavía, ver `docs/architecture/18-modulo-products.md`).
 */
export type {
  PrismaClient as ProductsPrismaClient,
  Prisma as ProductsPrisma,
} from '../prisma/schemas/products/generated';
export type {
  units_of_measure,
  product_categories,
  brands,
  product_models,
  products,
} from '../prisma/schemas/products/generated';
/**
 * Cliente Prisma del schema `customers` — séptimo cliente independiente
 * (`PRISMA_CUSTOMERS`), mismo criterio que los anteriores. Primer
 * consumidor: `modules/clientes/backend` (FASE 06 Parte 01 — solo
 * `customers.customers`, 1 de las 17 tablas del schema; perfil de
 * crédito/clasificación/rutas/visitas/lealtad sin código todavía, ver
 * `POS_ARCHITECTURE.md §3`).
 */
export type {
  PrismaClient as CustomersPrismaClient,
  Prisma as CustomersPrisma,
} from '../prisma/schemas/customers/generated';
export type { customers } from '../prisma/schemas/customers/generated';
/**
 * Clientes Parte 02 (Customer 360) — se agregan bajo demanda las tablas
 * que ya existían en el schema desde Database Parte 02 pero seguían sin
 * código: contactos y direcciones (mismo criterio "una tabla a la vez"
 * que el resto de este archivo, ver `docs/architecture/01 §2`).
 */
export type { customer_contacts, customer_addresses } from '../prisma/schemas/customers/generated';
/**
 * Cliente Prisma del schema `sales` — octavo cliente independiente
 * (`PRISMA_SALES`), mismo criterio que los anteriores. Primer
 * consumidor: `modules/ventas/backend` (FASE 06 Parte 01 — la venta POS
 * es una factura directa, `sales_channel='pos'`: `invoice_status`,
 * `invoices`, `invoice_lines`, `receipts`, `receipt_allocations`, 5 de
 * las 55 tablas del schema; cotización/pedido/remito/devolución/
 * garantía/promociones/lealtad/tarjetas de regalo sin código todavía,
 * ver `POS_ARCHITECTURE.md §3`).
 */
export type {
  PrismaClient as SalesPrismaClient,
  Prisma as SalesPrisma,
} from '../prisma/schemas/sales/generated';
export type {
  invoice_status,
  invoices,
  invoice_lines,
  receipts,
  receipt_allocations,
} from '../prisma/schemas/sales/generated';
/**
 * Cliente Prisma del schema `cash` — noveno cliente independiente
 * (`PRISMA_CASH`), mismo criterio que los anteriores. Primer consumidor:
 * `modules/caja/backend` (FASE 06 Parte 01 — `cash_registers`,
 * `cash_register_openings`, `cash_register_closings`,
 * `cash_movement_types`, `cash_movements`, 5 de las 11 tablas del
 * schema; arqueo por denominación/transferencias entre cajas/caja chica
 * sin código todavía, ver `POS_ARCHITECTURE.md §3`).
 */
export type {
  PrismaClient as CashPrismaClient,
  Prisma as CashPrisma,
} from '../prisma/schemas/cash/generated';
export type {
  cash_registers,
  cash_register_openings,
  cash_register_closings,
  cash_movement_types,
  cash_movements,
} from '../prisma/schemas/cash/generated';
/**
 * Cliente Prisma del schema `crm` — cliente independiente (`PRISMA_CRM`),
 * mismo criterio que los anteriores. Primer consumidor:
 * `modules/crm/backend` (Parte 02 — solo `leads`/`lead_status`/
 * `lead_sources`/`lead_status_history`, 4 de las 17 tablas del schema;
 * oportunidades/campañas/agenda/seguimientos sin código todavía, ver
 * `docs/reports/crm/CRM_ROADMAP.md`).
 */
export type {
  PrismaClient as CrmPrismaClient,
  Prisma as CrmPrisma,
} from '../prisma/schemas/crm/generated';
export type {
  leads,
  lead_status,
  lead_sources,
  lead_status_history,
} from '../prisma/schemas/crm/generated';
/** Parte 03 — Oportunidades. */
export type {
  opportunities,
  opportunity_lines,
  opportunity_loss_reasons,
  sales_funnels,
  sales_funnel_stages,
} from '../prisma/schemas/crm/generated';
/** Parte 04 — Campañas y Agenda. */
export type {
  campaigns,
  campaign_members,
  calendar_events,
  calendar_event_attendees,
} from '../prisma/schemas/crm/generated';
/**
 * Cliente Prisma del schema `accounting` — cliente independiente
 * (`PRISMA_ACCOUNTING`), mismo criterio que los anteriores. Primer
 * consumidor: `modules/contabilidad/backend` (Contabilidad Enterprise
 * Parte 1 — Núcleo contable + Estados financieros: `chart_of_accounts`/
 * `account_types`, `accounting_rules`/`accounting_rule_lines`,
 * `journal_entries`/`journal_entry_lines`/`journal_entry_status`,
 * `cost_centers`, `fiscal_years`/`fiscal_periods`,
 * `balance_sheet_snapshots`/`income_statement_snapshots`/
 * `cash_flow_snapshots` — 17 de las 28 tablas del schema. CxC/CxP
 * avanzadas, Bancos/Conciliación, Activos Fijos/Depreciaciones,
 * Impuestos, Presupuestos-ejecución, Cierre contable, dimensiones
 * contables, revaluación de moneda, intercompañía e IFRS quedan sin
 * código todavía, ver `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md`).
 */
export type {
  PrismaClient as AccountingPrismaClient,
  Prisma as AccountingPrisma,
} from '../prisma/schemas/accounting/generated';
export type {
  account_types,
  chart_of_accounts,
  cost_centers,
  fiscal_years,
  fiscal_periods,
  journal_entry_status,
  journal_entries,
  journal_entry_lines,
  accounting_rules,
  accounting_rule_lines,
  balance_sheet_snapshots,
  income_statement_snapshots,
  cash_flow_snapshots,
} from '../prisma/schemas/accounting/generated';
// prisma.service.ts (cliente único monolítico) queda superado por el
// enfoque de 21 clientes por schema en database.module.ts — ver el
// comentario de cabecera de ese archivo. No se elimina el archivo
// (regla del proyecto), pero deja de exportarse: su import a
// '../prisma/generated' apunta a un cliente que ya no se genera.
