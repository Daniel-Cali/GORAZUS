---
id: adr-inv-007-bridge
title: 'ADR-INV-007 — Motor de Optimización de Almacenes'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: warehouse-optimization
created: 2026-07-28
updated: 2026-07-28
tags: [adr, warehouse, wms, picking, putaway, slotting, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[ADR-INV-006]]'
  - '[[Warehouse]]'
  - '[[Engineering Heuristics]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-007 — Motor de Optimización de Almacenes](../../../adr/ADR-INV-007-motor-de-optimizacion-de-almacenes.md).
**Estado: Propuesta.** Cuarto y último ADR de la serie de motores de Inventario — a diferencia de
`ADR-INV-004/005/006`, no cruza a ningún schema ajeno, todo lo que necesita ya vive en `inventory`.
Primer ADR de la serie que lee las tres entidades de dominio reales completas
(`almacen`/`zona-almacen`/`ubicacion-almacen.entity.ts`) antes de diseñar, no solo el schema.

# Background

De 25 capacidades pedidas: 5 ya reales con código, 6 parciales (tabla real sin aplicación o concepto
cubierto por otro mecanismo), 14 nuevas. **Hallazgo más importante**: ni `warehouses` ni
`warehouse_zones` ni `warehouse_locations` tienen ninguna columna de capacidad (volumen/peso/
unidades) — un WMS real no puede optimizar sin eso.

# Domain Model

Respeta explícitamente la decisión de diseño real ya tomada: la jerarquía de ubicación
(`parent_location_id`, auto-referenciada) se mantiene sin cambio — el comentario real en
`ubicacion-almacen.entity.ts` ya decía "sin fijar una profundidad rígida, mismo patrón que
`product_categories`". Este ADR **no** propone tablas separadas por nivel (aisle/rack/shelf/bin);
propone un discriminador `location_level` nulable sobre la misma tabla, preservando la decisión
original.

# Business Rules

`WarehouseTask` unifica Put Away/Picking/Relocation/Cycle Count en un solo Aggregate con
discriminador — mismo criterio ya aplicado a `stock_quality_holds` (`ADR-INV-005 §3.7`). Cross
Docking se resuelve como regla de decisión dentro de Put Away (si existe una salida pendiente real
para el mismo producto), no como flujo separado.

# Architecture

Distingue explícitamente `putaway_rules` (real, decide la zona) de `slotting_rules` (propuesta,
decide la ubicación específica dentro de la zona) — una distinción que el pedido original no hacía
con claridad y que este ADR formaliza. Slotting reutiliza la clasificación ABC/XYZ ya diseñada en
`ADR-INV-006`, sin recalcularla.

# Risks

`products.products` no modela condiciones especiales de almacenamiento (refrigeración, etc.) —
brecha real identificada, fuera del alcance de este ADR (pertenecería a `ADR-INV-001`, no reabierto
sin autorización).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]]

# References

[ADR-INV-007 (documento real, `docs/adr/`)](../../../adr/ADR-INV-007-motor-de-optimizacion-de-almacenes.md)
