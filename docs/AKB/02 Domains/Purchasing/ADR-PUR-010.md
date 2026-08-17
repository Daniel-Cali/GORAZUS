---
id: adr-pur-010
title: 'ADR-PUR-010 — Expediente de Importación (Imports)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: imports
created: 2026-08-04
updated: 2026-08-04
tags: [adr, imports, purchasing, state-machine]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-003]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Expediente de importación que agrupa una Orden de Compra al exterior + sus gastos —
`purchases.imports`/`import_status`/`import_status_history`/`import_expenses`. Última fase del
roadmap autorizado — con esta parte, las 27 tablas del schema `purchases` tienen código en algún
grado (24/27 con aggregate completo; `purchase_quotes`/`purchase_quote_lines`/`purchase_expenses`
quedan fuera del roadmap autorizado, nunca mencionadas en ninguna de las 10 fases).

# Background

**Hallazgo verificado antes de diseñar**: `import_status` es el único catálogo de estado de Compras
**sin columna `is_final`** (confirmado en `schema.prisma`, a diferencia de
`purchase_requisition_status`/`purchase_order_status`/`purchase_invoice_status`, los tres con
`is_final Boolean @default(false)`) — se omitió ese campo al crear estados nuevos en caliente, en vez
de asumir simetría con los demás catálogos. `purchase_order_id` en `imports` **sí tiene FK real** (no
está particionada, a diferencia de `purchase_invoice_id` en Returns/Credit Notes/Withholdings).

# Domain Model

`ExpedienteImportacion`: `id`, `companyId`, `purchaseOrderId`. `GastoImportacion`: `id`, `importId`,
`expenseType` (`freight|insurance|customs|other`, refleja el `CHECK` real de
`import_expenses.expense_type`), `amount`. Los gastos se agregan **incrementalmente** durante la vida
del expediente (flete conocido primero, aduana después) — no se fijan al crear la cabecera, a
diferencia de las líneas de Requisition/Order/Invoice.

# Business Rules

**Flujo de estados — propuesto e implementado, basado en el comentario real del schema** ("en
tránsito, en aduana, nacionalizado"): `in_transit` → `at_customs` → `cleared`; `cancelled` alcanzable
desde `in_transit`/`at_customs`, nunca desde `cleared`. La orden de compra debe existir y estar
`approved` para abrir el expediente (mismo criterio que Goods Receipt con su orden). No se pueden
agregar gastos a un expediente cancelado. Anular el expediente completo no permitido si ya está
`cleared`.

# Architecture

Mismo patrón `resolverEstadoPorCodigo`/`obtenerCodigoEstado`/`transicionar` que Requisition/Order/
Invoice, adaptado solo para omitir `is_final` (columna inexistente en `import_status`). Repositorio de
gastos (`GastoImportacionRepository`) independiente del repositorio del expediente — los gastos no son
"líneas" reemplazables en bloque, son registros append/anular individuales, más parecido al patrón de
`RetencionCompraRepository` que al de líneas de Requisition/Order/Invoice.

# Integration

Purchase Order (obligatoria, existencia + `approved`).

# Security

RBAC (`compras.gestionar_importaciones`), tenant/company/branch vía RLS + `withTenantScope`,
auditoría, soft delete, `row_version`.

# Risks

Cuarto servicio con el patrón `resolverEstadoPorCodigo`/`transicionar` duplicado (ver [[Issue
Register]] ISSUE-28). E2E escrito, no ejecutado. `purchase_quotes`/`purchase_quote_lines`/
`purchase_expenses` quedan sin código — nunca formaron parte del roadmap autorizado, no son deuda
técnica de esta fase.

# Future Improvements

`purchase_expenses` (gasto no ligado a importación) y `purchase_quotes`/`purchase_quote_lines` (RFQ) —
próximos candidatos naturales si se autoriza una fase nueva; ninguno tiene precedente de diseño en
este roadmap.

# Related ADRs

[[ADR-PUR-003]]

# References

`docs/database/sql/08_purchases.sql` · `modules/compras/backend/` · [[Purchasing]]
