---
id: adr-pur-002
title: 'ADR-PUR-002 — Solicitud de Compra (Purchase Requisition)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-requisition
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-requisition, purchasing, state-machine]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-001]]'
  - '[[ADR-PUR-003]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Primer Aggregate Root del schema `purchases` — solicitud interna de compra sujeta a aprobación
(`purchases.purchase_requisitions`/`purchase_requisition_lines`), sin precio (el precio aparece
recién en la Orden de Compra).

# Background

Cliente Prisma del schema `purchases` (`PRISMA_PURCHASES`) ya estaba generado y wireado en
`database.module.ts`, sin ningún tipo re-exportado en `@gorazus/core-database` — primer consumidor
real.

# Domain Model

`SolicitudCompra`: `id`, `companyId`, `branchId` (nullable — solicitud puede ser a nivel de empresa),
líneas `{productId, quantity}`. Invariantes: al menos una línea, cantidad > 0 por línea.

# Business Rules

**Flujo de estados — sin definición previa en el schema real ni en el AKB, propuesto e implementado
en esta fase**: `draft` → `submitted` → `approved` | `rejected`; `cancelled` alcanzable desde `draft`
o `submitted`. Catálogo de estados (`purchase_requisition_status`) resuelto en caliente por código
(get-or-create), mismo patrón que `CotizacionesService` de Ventas — sin necesidad de seed aparte. Cada
transición se registra en `purchase_requisition_status_history`.

Edición/eliminación solo en `draft`. Solicitante siempre el usuario autenticado (`context.userId`),
nunca un campo editable por el cliente.

# Architecture

Patrón "aggregate con líneas + catálogo de estado + historial" replicado de `CotizacionRepository`/
`EstadoCotizacionRepository` (Ventas) — `purchase_requisition_lines` **sí tiene** relación real de
Prisma hacia la cabecera (acepta `create` anidado, a diferencia de Purchase Invoice, ver
[[ADR-PUR-005]]). Primer módulo NestJS de Compras (`ComprasModule`, `modules/compras/backend`) — un
módulo dueño único por schema, crece con cada fase siguiente en vez de crear un módulo nuevo por
aggregate.

# Integration

Empresa/sucursal (`core.companies`/`core.branches`, lookup local) y producto (`products.products`,
lookup local) — ambas copias de solo lectura, nunca importadas entre módulos de negocio.

# Security

RBAC (`compras.gestionar_solicitudes`), tenant/company/branch vía RLS + `withTenantScope`, auditoría,
soft delete, `row_version`.

# Risks

Flujo de estados es una propuesta sin precedente — si Purchase Order necesitara un estado adicional en
la solicitud (p. ej. "convertida" al generar una OC, como hace Cotización→Pedido en Ventas), se agrega
sin romper lo ya construido (mismo criterio de extensión en caliente del catálogo). E2E escrito, no
ejecutado (Docker inactivo).

# Future Improvements

Purchase Order ([[ADR-PUR-003]]) ya consume esta relación de forma opcional — evaluar si conviene
marcar la solicitud como "convertida"/"cerrada" cuando se emite una orden desde ella, si aparece
necesidad de negocio real.

# Related ADRs

[[ADR-PUR-001]]

# References

`docs/database/logico/08-purchases.md` · `modules/compras/backend/` · [[Purchasing]]
