---
id: governance-engineering-review-adr-inv-007
title: 'Engineering Review — ADR-INV-007 (Motor de Optimización de Almacenes)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, warehouse-engine]
related:
  - '[[ADR-INV-007]]'
  - '[[Warehouse]]'
  - '[[Engineering Heuristics]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-007`, mismo formato
consolidado ya usado para `ADR-INV-004/005/006`. Cierra la serie completa de motores de Inventario
(4 ADRs: Movimientos, Costeo, Disponibilidad, Reabastecimiento, Optimización de Almacenes — 5 en
total contando `ADR-INV-003`).

# Engineering Review

- **Consistencia con el código real, no solo el schema**: primer ADR de la serie que leyó las tres
  entidades de dominio completas (`almacen`/`zona-almacen`/`ubicacion-almacen.entity.ts`) antes de
  diseñar — confirmó que `zone_function` tiene exactamente 4 valores reales
  (`receiving`/`storage`/`picking`/`shipping`), no más, y que la jerarquía de ubicación ya es
  auto-referenciada sin profundidad fija por decisión de diseño explícita y documentada en el propio
  código.
- **Respeto de una decisión de diseño real ya tomada**: en vez de proponer tablas separadas por
  nivel de ubicación (lo que el pedido original insinuaba con "Aisle/Rack/Shelf/Bin" como conceptos
  separados), se verificó primero el comentario real del código (`ubicacion-almacen.entity.ts`) antes
  de diseñar, y se preservó la decisión ya tomada.
- **Consistencia con la trilogía**: verificado que `Capacity Policy` (física) no se solapa con
  `Available` (`ADR-INV-005`, comprometido) ni con costo (`ADR-INV-004`) — tres conceptos
  ortogonales, cada uno con su propio dueño de cálculo.
- **Sin cruce de dominio ajeno**: a diferencia de `ADR-INV-004/005/006` (que cruzan a `accounting`/
  `purchases`/`bi`), `ADR-INV-007` opera enteramente dentro de `inventory` — verificado
  explícitamente, señalado como diferencia real en la nota puente.

# Enterprise Quality Report

| Criterio                             | Cumplido                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Determinístico, auditable            | ✅ Travel Optimization vía `sequence_number` simple, no algoritmo de grafos sin evidencia                      |
| 25 capacidades solicitadas diseñadas | ✅ Las 25, cada una con estado real/parcial/propuesto declarado                                                |
| Sin duplicar servicios existentes    | ✅ Picking respeta FIFO/FEFO/LIFO ya reales, Slotting reutiliza ABC/XYZ ya diseñado, sin reimplementar ninguno |
| Extensión sin ruptura                | ✅ 7 columnas nuevas nulables sobre 3 tablas reales, comportamiento actual preservado exactamente              |
| Hallazgo de capacidad física         | ✅ Ninguna tabla real de almacén tenía columna de capacidad — hallazgo genuino, no asumido                     |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-007]] creada, enlazada a los 6 ADRs previos de la serie y a [[Warehouse]]
  (nota que este ADR extiende con las columnas de capacidad/nivel/tipo de asignación).
- [[Engineering Heuristics]] **no se modificó** — ninguna heurística genuinamente nueva; la decisión
  de "discriminador sobre tabla existente en vez de tablas paralelas" ya está cubierta por el patrón
  ya aplicado repetidamente (`stock_quality_holds`, `warehouse_tasks` en este mismo ADR).
- `Home.md` y `ADR Index.md` actualizados de forma aditiva.

# New Reusable Patterns Discovered

Ninguno nuevo — todos los patrones aplicados (discriminador sobre tabla existente, valor calculado
vs. Aggregate persistido, extensión nulable sin ruptura) ya estaban documentados antes de este ADR.

# New Engineering Heuristics

Ninguna nueva.

# New Lessons Learned

**Leer el código real, no solo el schema, cambia el diseño**: verificar `ubicacion-almacen.entity.ts`
antes de diseñar evitó proponer una migración estructural (tablas separadas por nivel de ubicación)
que habría contradicho una decisión de diseño real ya tomada y documentada en el propio comentario
del código fuente. El schema por sí solo (`parent_location_id UUID?`) no comunica esa intención —
solo el comentario de la entidad de dominio la hace explícita. Lección para ADRs futuros: cuando el
pedido original insinúa una estructura que el schema podría soportar de más de una forma, leer el
código de dominio real antes de diseñar, no solo las columnas.

# New Issues Detected

Ninguna nueva más allá de la ya señalada en `ADR-INV-007 §14` (falta de modelado de condiciones
especiales de almacenamiento en `products.products`) — severidad Baja, pertenece a `ADR-INV-001`, no
a este ADR.

# Recommended ADR-INV-008

Ninguna arquitectura nueva de Inventario justificada por evidencia — con `ADR-INV-007` se completan
los cinco motores del dominio (Movimientos, Costeo, Disponibilidad, Reabastecimiento, Almacenes). La
recomendación real, reafirmada por tercera vez consecutiva ([[Engineering Review — ADR-INV-005]],
[[Engineering Review — ADR-INV-006]]), es dejar de diseñar Inventario y **empezar a implementar**.
Si se continúa la serie hacia otro dominio, `GEMM` ya identificó `Compras` como la prioridad de
construcción real — y ahora tiene una razón adicional: `purchase_suggestions` (`ADR-INV-006`) y
`warehouse_docks`/`dock_type='receiving'` (`ADR-INV-007`) ya son puntos de integración reales
esperando del lado de Compras.

# Related ADRs

[[ADR-INV-007]] · [[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]]

# References

[ADR-INV-007 (documento real)](../../adr/ADR-INV-007-motor-de-optimizacion-de-almacenes.md)
