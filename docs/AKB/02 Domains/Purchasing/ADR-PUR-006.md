---
id: adr-pur-006
title: 'ADR-PUR-006 — Cotejo de Compra (Purchase Matching)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-matching
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-matching, purchasing]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-003]]'
  - '[[ADR-PUR-004]]'
  - '[[ADR-PUR-005]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

3-way match (Orden de Compra ↔ Recepción ↔ Factura) — `purchases.purchase_invoice_matching`. A
diferencia del resto de los aggregates de Compras, no representa un documento en construcción: es el
**resultado calculado** de cotejar tres documentos ya existentes de fases anteriores.

# Domain Model

`CotejoCompra`: `id`, `purchaseOrderId`, `receiptNoteId`, `purchaseInvoiceId`, `discrepancyAmount`,
`isWithinTolerance`. Sin líneas propias — el cálculo opera sobre las líneas de la orden/recepción/
factura ya persistidas, no las duplica.

# Business Rules

Por cada línea de la factura: `montoFacturado = cantidad × costo_facturado` vs. `montoEsperado =
cantidad_recibida(por producto, sumada entre líneas de la recepción) × precio_ordenado(de la línea de
la orden)`; la diferencia absoluta se acumula en `discrepancyAmount`. Un producto facturado pero no
recibido cuenta como discrepancia total de esa línea. **Tolerancia: 2% del total de la factura —
placeholder documentado explícitamente en el código, no una configuración real** (no existe todavía
perfil de tolerancia por empresa/proveedor en el schema ni en el AKB). Verifica que la recepción
pertenezca a la orden indicada, y que la factura (si tiene `purchase_order_id`) no esté asociada a
otra orden.

# Architecture

Reutiliza `OrdenCompraRepository`/`RecepcionCompraRepository`/`FacturaCompraRepository` (los tres ya
existentes) solo para lectura — no crea ningún lookup nuevo. Repositorio propio simple (`crear`/
`obtener`/`listar`/`anular`), sin catálogo de estado ni historial — `purchase_invoice_matching` no
tiene `*_status`/`*_status_history` en el schema real.

# Integration

Suppliers (indirecta, vía factura/orden). Purchase Order + Goods Receipt + Purchase Invoice
(obligatorias las tres, mismo módulo, sin cruzar fronteras).

# Security

RBAC (`compras.gestionar_cotejos`), tenant/company/branch vía RLS + `withTenantScope`, auditoría,
soft delete (`anular`), `row_version`.

# Risks

Tolerancia fija sin configuración real ([[Issue Register]] — nuevo hallazgo de la auditoría de cierre,
ver ISSUE-30). Sin acción automática al detectar discrepancia fuera de tolerancia (p. ej. bloquear la
factura) — no pedido explícitamente, no inventado. E2E escrito, no ejecutado.

# Future Improvements

Perfil de tolerancia configurable por empresa/proveedor cuando exista necesidad de negocio real.
Acción automática ante discrepancia fuera de tolerancia, si se solicita explícitamente.

# Related ADRs

[[ADR-PUR-003]] · [[ADR-PUR-004]] · [[ADR-PUR-005]]

# References

`docs/database/sql/08_purchases.sql` · `modules/compras/backend/` · [[Purchasing]]
