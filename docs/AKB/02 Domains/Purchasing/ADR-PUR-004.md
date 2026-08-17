---
id: adr-pur-004
title: 'ADR-PUR-004 — Recepción de Compra (Goods Receipt)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: goods-receipt
created: 2026-08-04
updated: 2026-08-04
tags: [adr, goods-receipt, purchasing, schema-gap]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-003]]'
  - '[[ADR-PUR-005]]'
  - '[[Inventory]]'
  - '[[Business Rules Matrix — Purchasing]]'
  - '[[Architecture Principles]]'
---

# Purpose

Registro de lo que físicamente llegó contra una Orden de Compra
(`purchases.goods_receipt_notes`/`goods_receipt_note_lines`) — documento de **compras** para el
3-way match, distinto de `inventory.goods_receipts` (movimiento físico, dueño Inventario).

# Background

**Hallazgo central de esta fase, verificado antes de diseñar** (`schema.prisma` completo, no
asumido): el schema real **no define `goods_receipt_status` ni `goods_receipt_status_history`** —
solo existen las dos tablas de arriba, sin columna de estado. La especificación de la fase asumía un
flujo de estados (endpoints "buscar por estado", "actualizar recepción pendiente", "cancelar
recepción"); el schema no lo soporta. No se creó ninguna tabla nueva para simular el estado que no
existe ("no duplicar tablas existentes", "no modificar schemas fuera de alcance").

**Segundo hallazgo**: `inventory.goods_receipts`/`goods_receipt_lines` (el movimiento físico real, ver
[[Inventory]]) **no tiene código de aplicación todavía** (`INVENTORY_NEXT_PHASE.md`) — no hay ningún
servicio real que reutilizar, y escribir ahí directamente violaría "un módulo dueño único por
Aggregate Root" (Domain Policy P1, [[Architecture Principles]]).

# Domain Model

`RecepcionCompra`: `id`, `companyId`, `purchaseOrderId`, líneas `{productId, quantity}`. Sin flujo de
estados — una recepción es un hecho consumado al crearse; "anular" usa `deleted_at` (soft delete), no
una transición de catálogo.

# Business Rules

- No recibir contra una orden inexistente ni contra una que no esté `approved` (ni `draft` ni
  `cancelled` — inferencia razonada, documentada, no en el texto literal de la fase).
- No recibir productos fuera de las líneas de la orden.
- **No exceder la cantidad ordenada** — suma cantidades ya recibidas (recepciones activas) + lo nuevo,
  contra la línea de la orden; al editar, excluye la propia recepción del cálculo
  (`sumarCantidadRecibida`, con `excludingReceiptId`).
- Anular una recepción libera esa cantidad para futuras recepciones.

# Architecture

Sin catálogo de estado ni historial (a diferencia de [[ADR-PUR-002]]/[[ADR-PUR-003]]) — repositorio
más simple, con un método propio (`sumarCantidadRecibida`) que no tiene equivalente en los otros
aggregates de Compras.

# Integration

**Ninguna con Inventario en esta fase** — `inventory_receipt_id` queda `null`; correlacionar ambos
lados es trabajo futuro de Inventario, no de Compras. Con Purchase Order: obligatoria (existencia +
estado `approved`).

# Security

RBAC (`compras.gestionar_recepciones`), tenant/company/branch vía RLS + `withTenantScope`, auditoría,
soft delete, `row_version`.

# Risks

La ausencia de estado en el schema real es una limitación heredada, no una elección de diseño de esta
fase — si más adelante se necesita un flujo de aprobación de recepciones, hace falta una migración
nueva (`goods_receipt_status`/`goods_receipt_status_history`, fuera de alcance de esta serie). Sin
integración con Inventario — el stock físico no se mueve todavía. E2E escrito, no ejecutado.

# Future Improvements

Cuando Inventario construya código real de recepciones (`INVENTORY_NEXT_PHASE.md`), correlacionar
`goods_receipt_notes.inventory_receipt_id` vía evento, nunca escritura directa cross-módulo.

# Related ADRs

[[ADR-PUR-001]] · [[ADR-PUR-002]] · [[ADR-PUR-003]]

# References

`docs/database/logico/08-purchases.md` · `INVENTORY_NEXT_PHASE.md` · `modules/compras/backend/` ·
[[Purchasing]] · [[Inventory]]
