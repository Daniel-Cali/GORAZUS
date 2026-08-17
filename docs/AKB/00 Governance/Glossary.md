---
id: governance-glossary
title: Glossary
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: glossary
created: 2026-07-27
updated: 2026-08-04
tags: [governance, glossary, ubiquitous-language]
related:
  - '[[Architecture Principles]]'
  - '[[Purchasing]]'
---

# Purpose

Glosario consolidado — cubre Inventario (Lenguaje Ubicuo completo en `ADR-INV-000 §4`) y, desde
2026-08-04, Compras; se extiende a otros dominios a medida que se documenten con el mismo rigor.

# Domain Model

**Inventario** — ver la tabla completa en [[ADR-INV-000]] §4: Stock, Warehouse, Lot, Serial Number,
Reservation, Transfer, Movement, Adjustment, Available/Committed/Reserved Quantity, Cost, Inventory
Value, Kardex, Replenishment, Cycle Count, Safety Stock.

**Compras** ([[Purchasing]]):

| Término                                    | Definición real                                                                                                                         | ADR             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Proveedor (Supplier)                       | Maestro único de proveedor — `suppliers.suppliers`, referenciado por ID desde `purchases`/`banks`, nunca duplicado                      | [[ADR-PUR-001]] |
| Solicitud de Compra (Purchase Requisition) | Solicitud interna sujeta a aprobación, sin precio — `purchases.purchase_requisitions`                                                   | [[ADR-PUR-002]] |
| Orden de Compra (Purchase Order)           | Orden confirmada hacia un proveedor, con precio por línea — `purchases.purchase_orders`                                                 | [[ADR-PUR-003]] |
| Recepción de Compra (Goods Receipt)        | Registro de lo físicamente llegado contra una Orden de Compra — `purchases.goods_receipt_notes`, sin flujo de estados en el schema real | [[ADR-PUR-004]] |
| Factura de Compra (Purchase Invoice)       | Factura del proveedor, ingresa como cuenta por pagar (CxP) — `purchases.purchase_invoices`, particionada por `received_at`              | [[ADR-PUR-005]] |
| 3-way match                                | Cotejo Orden↔Recepción↔Factura — tabla `purchase_invoice_matching` ya real, sin Aggregate Root todavía (Purchase Matching, sin código)  | [[Purchasing]]  |

# References

[[ADR-INV-000]] §4 · [[ADR-PUR-001]] · [[ADR-PUR-002]] · [[ADR-PUR-003]] · [[ADR-PUR-004]] ·
[[ADR-PUR-005]]
