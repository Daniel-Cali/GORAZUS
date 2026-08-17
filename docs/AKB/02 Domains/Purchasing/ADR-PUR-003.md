---
id: adr-pur-003
title: 'ADR-PUR-003 — Orden de Compra (Purchase Order)'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: purchasing
subdomain: purchase-order
created: 2026-08-04
updated: 2026-08-04
tags: [adr, purchase-order, purchasing, state-machine]
related:
  - '[[Purchasing]]'
  - '[[ADR-PUR-001]]'
  - '[[ADR-PUR-002]]'
  - '[[ADR-PUR-004]]'
  - '[[ADR-PUR-005]]'
  - '[[Suppliers]]'
  - '[[Business Rules Matrix — Purchasing]]'
---

# Purpose

Orden confirmada hacia un proveedor (`purchases.purchase_orders`/`purchase_order_lines`), con precio
por línea — a diferencia de Purchase Requisition ([[ADR-PUR-002]]).

# Domain Model

`OrdenCompra`: `id`, `companyId`, `branchId` (ambos `NOT NULL`, a diferencia de la solicitud),
`supplierId`, líneas `{productId, quantity, unitPrice}`. Invariantes: al menos una línea, cantidad > 0,
precio unitario ≥ 0.

# Business Rules

**Flujo de estados — propuesto e implementado, sin precedente**: `draft` → `approved`; `cancelled`
alcanzable desde `draft` o `approved`. Deliberadamente **sin** `partially_received`/`received`/
`closed` — dependen de Goods Receipt ([[ADR-PUR-004]]), fuera de alcance de esta fase por regla
explícita ("no integrar con Goods Receipt" en esta parte). El catálogo admite agregarlos después sin
migración (resolución en caliente por código, mismo mecanismo que [[ADR-PUR-002]]).

Primera regla de negocio real que conecta dos fases: **proveedor debe existir y no estar bloqueado**
(`is_blocked`, ver [[Suppliers]]/[[ADR-PUR-001]]) — `ProveedorBloqueadoException` (409). Relación
opcional con Purchase Requisition: si se indica, debe existir (sin exigir un estado concreto de la
solicitud). Edición/eliminación solo en `draft`. Total calculado server-side, nunca confiado del
cliente.

# Architecture

Mismo patrón "aggregate con líneas + catálogo + historial" que [[ADR-PUR-002]]. Nuevo repositorio de
solo lectura `ProveedorLookupRepository` (sobre `PRISMA_SUPPLIERS`, sin FK real entre schemas —
"IDs sueltos, nunca FK real entre schemas de distintos módulos") — primera vez que Compras consulta
Suppliers.

# Integration

Suppliers (existencia + no bloqueado, obligatorio). Purchase Requisition (existencia, opcional, mismo
módulo — sin lookup aparte, ambos aggregates viven en `PRISMA_PURCHASES`). Explícitamente **sin**
integración con Goods Receipt, Costeo, Contabilidad ni eventos hacia Inventario en esta fase.

# Security

RBAC (`compras.gestionar_ordenes`), tenant/company/branch vía RLS + `withTenantScope`, auditoría, soft
delete, `row_version`.

# Risks

Sin `partially_received`/`received`/`closed` — [[ADR-PUR-004]] (Goods Receipt) decide si esos estados
se agregan a este mismo catálogo o si Goods Receipt maneja su propio estado sin tocar el de la orden;
resuelto en la práctica: Goods Receipt terminó sin estado propio (ver [[ADR-PUR-004]] Risks), así que
la Orden de Compra sigue sin saber cuánto de sí misma fue recibido a nivel de su propio `status_id` —
esa información vive en `RecepcionCompraRepository.sumarCantidadRecibida`, consultada bajo demanda, no
reflejada en el estado de la orden. E2E escrito, no ejecutado.

# Future Improvements

Evaluar si conviene reflejar en el estado de la orden que ya fue recibida parcial/totalmente (hoy solo
calculable bajo demanda desde Goods Receipt) cuando exista necesidad de negocio real.

# Related ADRs

[[ADR-PUR-001]] · [[ADR-PUR-002]]

# References

`docs/database/logico/08-purchases.md` · `modules/compras/backend/` · [[Purchasing]]
