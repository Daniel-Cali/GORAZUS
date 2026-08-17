---
id: adr-pur-008
title: 'ADR-PUR-008 — Nota de Crédito de Compra (Purchase Credit Notes)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-credit-notes
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-credit-notes, purchasing]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-005]]'
  - '[[ADR-PUR-006]]'
  - '[[ADR-PUR-007]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Nota de crédito del proveedor contra una factura de compra ya registrada —
`purchases.purchase_credit_notes`/`purchase_credit_note_lines`.

# Domain Model

`NotaCreditoCompra`: `id`, `companyId`, `purchaseInvoiceId`, `totalAmount`, líneas `{productId,
quantity}`. A diferencia de `DevolucionCompra`, la cabecera exige `totalAmount` (`NOT NULL`, sin
default) — las líneas no llevan precio propio.

# Business Rules

Mismas reglas de existencia/estado de factura y límite de cantidad que Purchase Returns
([[ADR-PUR-007]]), con `sumarCantidadAcreditada` en vez de `sumarCantidadDevuelta`. **Monto total
calculado server-side**, nunca recibido del cliente: se deriva del `unit_cost` de la línea de factura
correspondiente (el schema no tiene precio propio en `purchase_credit_note_lines`) — misma fuente de
verdad que ya usa [[ADR-PUR-006]] (Purchase Matching) para calcular discrepancias.

# Architecture

Reutiliza `FacturaCompraRepository`/`EstadoFacturaCompraRepository`/`ProductoLookupRepository` —
mismo patrón que Purchase Returns, sin lookups nuevos. Sin `*_status`/`*_status_history` en el schema
real (mismo caso que Purchase Returns).

# Integration

Purchase Invoice (obligatoria, existencia + no cancelada). Sin relación con Purchase Returns —
tablas estructuralmente independientes, sin FK entre ellas; los pools de cantidad (`devuelto` vs.
`acreditado`) se validan por separado contra la factura, deliberadamente no combinados (no hay
requisito de negocio confirmado para combinarlos).

# Security

RBAC (`compras.gestionar_notas_credito`), tenant/company/branch vía RLS + `withTenantScope`,
auditoría, soft delete, `row_version`.

# Risks

Mismo hallazgo de duplicación de patrón `sumarCantidad*` que [[ADR-PUR-007]] (ver [[Issue Register]]
ISSUE-29). E2E escrito, no ejecutado.

# Future Improvements

Evaluar si Returns y Credit Notes deberían compartir un límite combinado contra la factura, si aparece
necesidad de negocio real que lo justifique.

# Related ADRs

[[ADR-PUR-005]] · [[ADR-PUR-006]] · [[ADR-PUR-007]]

# References

`docs/database/sql/08_purchases.sql` · `modules/compras/backend/` · [[Purchasing]]
