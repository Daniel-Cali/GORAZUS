---
id: concept-warehouse
title: Warehouse
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: warehouse-management
created: 2026-07-27
updated: 2026-07-27
tags: [concept, warehouse, aggregate-root]
related:
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-000]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Inventory]]'
---

# Purpose

Unidad física o virtual de custodia de existencias — real en código (`Almacen`,
`almacen.entity.ts`), siempre perteneciente a una Empresa y una Sucursal concretas (`branchId`
`NOT NULL`, a diferencia de la mayoría de entidades del sistema).

# Domain Model

Aggregate Root, raíz de la jerarquía Empresa→Sucursal→**Almacén**→Zona→Ubicación
([[ADR-INV-002]] §2). Zona y Ubicación son Aggregate Roots **separados** (propio servicio/controller
cada uno), no hijos cargados a través de Warehouse — confirmado en código real.

# Business Rules

Invariantes reales del constructor: `name`/`code` no vacíos, `warehouseType ∈ {physical, virtual}`.
Clasificación de negocio de 8 tipos solicitados (Main, Retail, Transit, Returns, Damaged,
Consignment, Production, Virtual) mapeada sobre esas 2 mecánicas reales, sin ampliar el `CHECK`
([[ADR-INV-002]] §3).

# Architecture

`code` único por sucursal, no por empresa. Configuración pedida y su estado real
([[ADR-INV-002]] §4): rastreo de ubicación es lo único completamente operativo; almacén por defecto,
stock negativo y código de barras de ubicación no existen en ninguna forma.

# Related ADRs

[[ADR-INV-002]] · [[ADR-INV-000]]

# References

[[ADR-INV-002]]
