---
id: adr-pur-007
title: 'ADR-PUR-007 — Devolución de Compra (Purchase Returns)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-returns
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-returns, purchasing, schema-gap]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-004]]'
  - '[[ADR-PUR-005]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Devolución a proveedor contra una factura de compra ya registrada — `purchases.purchase_returns`/
`purchase_return_lines`.

# Background

Mismo hallazgo que [[ADR-PUR-004]] (Goods Receipt), verificado de nuevo en `schema.prisma` antes de
diseñar: `purchase_returns`/`purchase_return_lines` **no tienen `*_status`/`*_status_history`**.
`purchase_return_lines.return_id` **sí tiene FK real** hacia la cabecera (`purchase_returns` no está
particionada) — admite `create` anidado.

# Domain Model

`DevolucionCompra`: `id`, `companyId`, `purchaseInvoiceId`, `reason` (opcional), líneas `{productId,
quantity}`. Invariantes: al menos una línea, cantidad > 0 por línea.

# Business Rules

No devolver contra una factura inexistente ni contra una factura cancelada. No devolver productos
fuera de las líneas de la factura. **No exceder la cantidad facturada** (suma devoluciones activas +
nueva cantidad, excluyendo la propia devolución al editar — mismo algoritmo que
`sumarCantidadRecibida` de Goods Receipt, aplicado aquí a `sumarCantidadDevuelta`). Anular una
devolución libera esa cantidad para futuras devoluciones. Sin flujo de estados — "anular" usa
`deleted_at`.

# Architecture

Reutiliza `FacturaCompraRepository`/`EstadoFacturaCompraRepository`/`ProductoLookupRepository` (los
tres ya existentes desde Fase 6) — sin lookups nuevos.

# Integration

Purchase Invoice (obligatoria, existencia + no cancelada).

# Security

RBAC (`compras.gestionar_devoluciones`), tenant/company/branch vía RLS + `withTenantScope`, auditoría,
soft delete, `row_version`.

# Risks

Mismo patrón `sumarCantidad*` duplicado en 4 repositorios distintos (Goods Receipt, Returns, Credit
Notes, Withholdings) — candidato real a extracción compartida dentro de `compras`, ver [[Issue
Register]] ISSUE-29 (hallazgo de la auditoría de cierre). E2E escrito, no ejecutado.

# Future Improvements

Evaluar si la devolución debería correlacionarse con Goods Receipt (¿qué se devuelve físicamente?) si
aparece necesidad de negocio real — hoy es independiente, solo contra la factura.

# Related ADRs

[[ADR-PUR-004]] · [[ADR-PUR-005]]

# References

`docs/database/sql/08_purchases.sql` · `modules/compras/backend/` · [[Purchasing]]
