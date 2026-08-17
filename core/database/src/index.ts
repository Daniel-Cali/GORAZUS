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
 * Recepciones de Inventario (Inventario Parte 05, Subfase 1) — cierra el
 * gap real Compras→Inventario (`RecepcionesCompraService` deja
 * `inventory_receipt_id` en null a propósito). Agrega `goods_receipts`/
 * `goods_receipt_lines`, mismo criterio "una tabla a la vez" del resto de
 * este archivo — el resto de las 34 tablas (salidas, series, lotes,
 * producción) sigue sin código, ver `INVENTORY_NEXT_PHASE.md`.
 */
export type { goods_receipts, goods_receipt_lines } from '../prisma/schemas/inventory/generated';
/**
 * Salidas de Inventario (Inventario Parte 05, Subfase 2) — `goods_issues`/
 * `goods_issue_lines`/`goods_issue_reasons`, mismo criterio que Recepciones.
 */
export type {
  goods_issues,
  goods_issue_lines,
  goods_issue_reasons,
} from '../prisma/schemas/inventory/generated';
/**
 * Inventario Parte 05, Subfase 3 (Lotes y Series) — `inventory_lots`/
 * `inventory_serials` nunca habían sido consumidas por código de aplicación.
 */
export type { inventory_lots, inventory_serials } from '../prisma/schemas/inventory/generated';
/**
 * Prompt 1 (Foundation Completion) — WMS Basic. Tablas certificadas nunca
 * antes consumidas por código de aplicación.
 */
export type {
  putaway_rules,
  picking_rules,
  replenishment_rules,
} from '../prisma/schemas/inventory/generated';
/**
 * Motor de Costeo (FIFO/LIFO/Promedio Ponderado, `ADR-INV-004` fase 1) —
 * agrega las tres tablas de costeo que ya existían en el schema desde
 * Database Parte 02 pero seguían sin código de aplicación (`fifo_cost_layers`/
 * `lifo_cost_layers`/`average_cost_history`), mismo criterio "una tabla a
 * la vez" que el resto de este archivo. Standard/Specific/Landed/
 * Replacement Cost siguen sin tabla real (`ADR-INV-004 §2`), no se
 * exportan tipos que no existen todavía.
 */
export type {
  fifo_cost_layers,
  lifo_cost_layers,
  average_cost_history,
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
 * Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura) —
 * 8 tablas más del schema `sales` (13 de 55 en total). `quotes`/
 * `quote_lines`/`sales_orders`/`sales_order_lines` NO están particionadas
 * (a diferencia de `invoices`) y SÍ tienen relación real de Prisma hacia
 * sus líneas — aceptan `create` anidado, mismo criterio que
 * `accounting_rules`/`accounting_rule_lines`.
 */
export type {
  quotes,
  quote_lines,
  quote_status,
  quote_status_history,
  sales_orders,
  sales_order_lines,
  sales_order_status,
  sales_order_status_history,
} from '../prisma/schemas/sales/generated';
/**
 * P0-1 (auditoría POS) — ledger de idempotencia de `POST /pos/ventas`, ver
 * `docs/database/sql/48_pos_checkout_idempotency_keys.sql`. Mismo criterio
 * que `movement_idempotency_keys` (schema `inventory`): tabla separada
 * porque `invoices` está particionada por `issued_at`.
 */
export type { pos_checkout_idempotency_keys } from '../prisma/schemas/sales/generated';
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
/**
 * Cliente Prisma del schema `suppliers` — cliente independiente
 * (`PRISMA_SUPPLIERS`), ya generado y wireado en `database.module.ts`
 * desde el inicio de este archivo, pero sin consumidor hasta ahora.
 * Primer consumidor: `modules/proveedores/backend` (Compras FASE 2 —
 * solo `suppliers.suppliers` + `supplier_block_history`, 2 de las 13
 * tablas del schema; contactos/direcciones/cuentas bancarias/crédito/
 * evaluaciones/clasificación/contratos sin código todavía, ver
 * `docs/AKB/02 Domains/Purchasing.md`).
 */
export type {
  PrismaClient as SuppliersPrismaClient,
  Prisma as SuppliersPrisma,
} from '../prisma/schemas/suppliers/generated';
export type { suppliers, supplier_block_history } from '../prisma/schemas/suppliers/generated';
/**
 * Cliente Prisma del schema `purchases` — cliente independiente
 * (`PRISMA_PURCHASES`), ya generado y wireado en `database.module.ts`
 * desde el inicio de este archivo, pero sin consumidor hasta ahora.
 * Primer consumidor: `modules/compras/backend` (Compras FASE 3 —
 * Purchase Requisition: `purchase_requisitions`/`purchase_requisition_lines`/
 * `purchase_requisition_status`/`purchase_requisition_status_history`, 4 de
 * las 27 tablas del schema; Purchase Order/Goods Receipt/Purchase Invoice
 * y el resto sin código todavía, ver `docs/AKB/02 Domains/Purchasing.md`).
 */
export type {
  PrismaClient as PurchasesPrismaClient,
  Prisma as PurchasesPrisma,
} from '../prisma/schemas/purchases/generated';
export type {
  purchase_requisitions,
  purchase_requisition_lines,
  purchase_requisition_status,
  purchase_requisition_status_history,
} from '../prisma/schemas/purchases/generated';
/** Compras FASE 4 — Purchase Order: `purchase_orders`/`purchase_order_lines`/`purchase_order_status`/`purchase_order_status_history`, 4 tablas más del schema `purchases` (8 de 27 en total). */
export type {
  purchase_orders,
  purchase_order_lines,
  purchase_order_status,
  purchase_order_status_history,
} from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 5 — Goods Receipt: `goods_receipt_notes`/
 * `goods_receipt_note_lines`, 2 tablas más (10 de 27 en total).
 * **A diferencia de los demás aggregates de Compras, este par NO tiene
 * `*_status`/`*_status_history` en el schema real** — verificado leyendo
 * `schema.prisma` completo, no solo asumido; sin flujo de estados
 * catalogado, solo `deleted_at` (activa/anulada). No confundir con
 * `inventory.goods_receipts`/`goods_receipt_lines` (movimiento físico,
 * dueño Inventario, sin código de aplicación todavía) — dos tablas
 * distintas para el mismo hecho, documentado en `08_purchases.sql`.
 */
export type {
  goods_receipt_notes,
  goods_receipt_note_lines,
} from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 6 — Purchase Invoice: `purchase_invoices`/
 * `purchase_invoice_lines`/`purchase_invoice_status`/
 * `purchase_invoice_status_history`, 4 tablas más (14 de 27 en total).
 * **`purchase_invoices` está particionada por rango de `received_at`,
 * PK compuesta `(id, received_at)`** — no admite `findUnique`/`update`
 * por `id` solo (`purchase_invoicesWhereUniqueInput` solo expone
 * `id_received_at`/`local_id_received_at`); los repositorios usan
 * `findFirst`/`updateMany` en su lugar. `purchase_invoice_lines`/
 * `purchase_invoice_status_history` **no tienen FK real** hacia
 * `purchase_invoices` por el mismo motivo (una tabla particionada no
 * admite FK simple desde una columna no particionada) — la integridad
 * se valida en el service, nunca a nivel de Prisma `include`/`create`
 * anidado.
 */
export type {
  purchase_invoices,
  purchase_invoice_lines,
  purchase_invoice_status,
  purchase_invoice_status_history,
} from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 7 — Purchase Matching: `purchase_invoice_matching` (3-way
 * match OC↔Recepción↔Factura), 1 tabla más (15 de 27 en total). Sin
 * `*_status`/`*_status_history` — es un resultado calculado, no un
 * documento con flujo de aprobación propio.
 */
export type { purchase_invoice_matching } from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 8 — Purchase Returns: `purchase_returns`/
 * `purchase_return_lines`, 2 tablas más (17 de 27 en total). Mismo
 * patrón que Goods Receipt ([[ADR-PUR-004]]) — sin `*_status`/
 * `*_status_history` en el schema real, `purchase_invoice_id` sin FK
 * real (misma limitación de partición que en `purchase_invoice_lines`).
 */
export type {
  purchase_returns,
  purchase_return_lines,
} from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 9 — Purchase Credit Notes: `purchase_credit_notes`/
 * `purchase_credit_note_lines`, 2 tablas más (19 de 27 en total). Mismo
 * patrón sin estado que Purchase Returns; a diferencia de Returns, la
 * cabecera exige `total_amount` (`NOT NULL`, sin default) — las líneas
 * no llevan precio propio, se deriva del `unit_cost` de la línea de
 * factura correspondiente (mismo criterio que Purchase Matching).
 */
export type {
  purchase_credit_notes,
  purchase_credit_note_lines,
} from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 10 — Purchase Withholdings: `purchase_withholdings`, 1
 * tabla más (20 de 27 en total). Sin líneas propias (registro a nivel
 * de cabecera de factura, no por producto) y sin `*_status`/
 * `*_status_history`. `withholding_rule_id` referencia
 * `taxes.withholding_rules` (schema distinto, sin FK real ni código
 * todavía) — integración fiscal completa fuera de alcance, mismo
 * criterio que `purchase_invoice_lines.tax_id` en [[ADR-PUR-005]].
 */
export type { purchase_withholdings } from '../prisma/schemas/purchases/generated';
/**
 * Compras FASE 11 — Imports (última fase del roadmap autorizado):
 * `imports`/`import_status`/`import_status_history`/`import_expenses`,
 * 4 tablas más (27 de 27 — schema `purchases` completo). Único par de
 * catálogo/historial de Compras donde el catálogo (`import_status`) no
 * tiene columna `is_final` (verificado en `schema.prisma`, a diferencia
 * de `purchase_requisition_status`/`purchase_order_status`/
 * `purchase_invoice_status`) — se omite ese campo al crear estados
 * nuevos en caliente, el resto del patrón es idéntico.
 * `purchase_order_id` en `imports` **sí tiene FK real** (no está
 * particionada, a diferencia de `purchase_invoice_id` en otras tablas
 * hijas). `import_expenses` no son "líneas" fijadas al crear — se
 * agregan incrementalmente durante la vida del expediente (flete
 * conocido primero, aduana después).
 */
export type {
  imports,
  import_status,
  import_status_history,
  import_expenses,
} from '../prisma/schemas/purchases/generated';
// prisma.service.ts (cliente único monolítico) queda superado por el
// enfoque de 21 clientes por schema en database.module.ts — ver el
// comentario de cabecera de ese archivo. No se elimina el archivo
// (regla del proyecto), pero deja de exportarse: su import a
// '../prisma/generated' apunta a un cliente que ya no se genera.
