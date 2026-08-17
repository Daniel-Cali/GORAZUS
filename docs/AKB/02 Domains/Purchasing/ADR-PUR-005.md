---
id: adr-pur-005
title: 'ADR-PUR-005 — Factura de Compra (Purchase Invoice)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-invoice
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-invoice, purchasing, state-machine, partitioning]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-001]]'
  - '[[ADR-PUR-003]]'
  - '[[ADR-PUR-004]]'
  - '[[ADR-DB-001]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Factura del proveedor registrada, ingresa como cuenta por pagar (CxP) —
`purchases.purchase_invoices`/`purchase_invoice_lines`.

# Background

**Hallazgo central de esta fase, verificado antes de diseñar**: `purchase_invoices` está
**particionada por rango de `received_at`** (`docs/database/sql/08_purchases.sql`), con PK compuesta
`(id, received_at)` — coherente con la estrategia general de particionamiento de [[ADR-DB-001]], igual
que `sales.invoices`. Consecuencia real en Prisma: `purchase_invoicesWhereUniqueInput` solo expone
`id_received_at`/`local_id_received_at`, nunca `id` solo. `purchase_invoice_lines`/
`purchase_invoice_status_history` **no tienen FK real** hacia la cabecera por el mismo motivo (una
tabla particionada no admite FK simple desde una columna no particionada).

# Domain Model

`FacturaCompra`: `id`, `companyId`, `supplierId`, `supplierDocumentNumber`, líneas `{productId,
quantity, unitCost, taxId?}`. Invariantes: número de documento del proveedor no vacío, al menos una
línea, cantidad > 0, costo unitario ≥ 0.

# Business Rules

**Flujo de estados — propuesto e implementado, sin precedente**: `draft` → `approved` → `posted`
(contabilizada); `cancelled` desde `draft`/`approved`, **nunca desde `posted`** ("no modificar
facturas contabilizadas"). `posted` no dispara ningún asiento contable real — es solo la marca de
inmutabilidad; integración contable/fiscal queda fuera de alcance de esta fase.

Proveedor debe existir — **a diferencia de Purchase Order, no se rechaza por proveedor bloqueado**
(se registra una deuda ya generada, no se decide comprar más). Orden de compra opcional, debe existir
si se indica. **Duplicidad de referencia fiscal**: no se permite otra factura activa del mismo
proveedor con el mismo número de documento — sin constraint de BD para esto (verificado: no existe),
se valida en el service. Subtotal/total calculados server-side; impuesto queda en 0 (motor de
impuestos fuera de alcance, documentado explícitamente en el código, no fingido).

# Architecture

Repositorio adaptado a la partición, a diferencia de todos los demás aggregates de Compras: `findFirst`
en vez de `findUnique` para lecturas por `id`; `updateMany` en vez de `update` para escrituras
(verificando existencia con `findFirst` antes, mismo patrón de "no encontrado" que el resto de
`compras`). Sin `create`/`include` anidado — cabecera y líneas se crean por separado, dentro de la
misma transacción de `withTenantScope`.

# Integration

Suppliers (existencia, obligatorio, sin chequeo de bloqueo). Purchase Order (existencia, opcional).
**Sin relación directa con Goods Receipt** — esa correlación es `purchase_invoice_matching` (Purchase
Matching, todavía sin código, ver [[Purchasing]] Future Improvements).

# Security

RBAC (`compras.gestionar_facturas`), tenant/company/branch vía RLS + `withTenantScope` (adaptado a
`updateMany`), auditoría, soft delete, `row_version`.

# Risks

- `purchase_invoice_lines`/`purchase_invoice_status_history` sin FK real — integridad depende
  enteramente de la capa de aplicación, nunca de Postgres.
- Sin motor de impuestos ni integración contable real — documentado, no simulado.
- E2E escrito, no ejecutado.

# Future Improvements

Purchase Matching (3-way match OC↔Recepción↔Factura, `purchase_invoice_matching`, ya tiene tabla real
sin aggregate) es el siguiente paso natural — depende de [[ADR-PUR-003]] y [[ADR-PUR-004]] ya
construidos.

# Related ADRs

[[ADR-PUR-001]] · [[ADR-PUR-003]] · [[ADR-PUR-004]] · [[ADR-DB-001]]

# References

`docs/database/logico/08-purchases.md` · `docs/database/sql/08_purchases.sql` ·
`modules/compras/backend/` · [[Purchasing]]
