---
id: adr-pur-009
title: 'ADR-PUR-009 — Retención de Compra (Purchase Withholdings)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-withholdings
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-withholdings, purchasing]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-005]]'
  - '[[ADR-PUR-007]]'
  - '[[ADR-PUR-008]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Retención fiscal aplicada a una factura de compra ya registrada —
`purchases.purchase_withholdings`. Único aggregate de Compras **sin líneas propias** — registro a
nivel de cabecera de factura, no por producto.

# Domain Model

`RetencionCompra`: `id`, `purchaseInvoiceId`, `withholdingRuleId` (opcional), `amount`. Invariantes:
factura requerida, monto > 0.

# Business Rules

No retener contra una factura inexistente ni cancelada. **No exceder el total de la factura** — mismo
algoritmo `sumar...` ya usado en Returns/Credit Notes ([[ADR-PUR-007]]/[[ADR-PUR-008]]), aplicado aquí
a `sumarMontoRetenido` contra el monto total de la factura en vez de cantidad por producto (no hay
líneas ni productos en esta tabla). `withholdingRuleId` (referencia a `taxes.withholding_rules`) se
acepta como UUID opcional **sin validar su existencia** — ese schema no tiene FK real ni código
todavía; integración fiscal completa fuera de alcance, mismo criterio que `taxId` en
[[ADR-PUR-005]] (Purchase Invoice).

# Architecture

Reutiliza `FacturaCompraRepository`/`EstadoFacturaCompraRepository` — sin `ProductoLookupRepository`
(no hay productos involucrados), sin lookups nuevos. Sin `*_status`/`*_status_history` en el schema
real ni tabla de líneas — el más simple de los 10 aggregates de Compras.

# Integration

Purchase Invoice (obligatoria, existencia + no cancelada).

# Security

RBAC (`compras.gestionar_retenciones`), tenant/company/branch vía RLS + `withTenantScope`, auditoría,
soft delete, `row_version`.

# Risks

Mismo hallazgo de duplicación de patrón `sumarCantidad*/sumarMonto*` (ver [[Issue Register]]
ISSUE-29). E2E escrito, no ejecutado.

# Future Improvements

Validar `withholdingRuleId` contra `taxes.withholding_rules` cuando ese schema tenga código real de
aplicación.

# Related ADRs

[[ADR-PUR-005]] · [[ADR-PUR-007]] · [[ADR-PUR-008]]

# References

`docs/database/sql/08_purchases.sql` · `modules/compras/backend/` · [[Purchasing]]
