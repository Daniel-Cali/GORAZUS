---
id: adr-inv-008-bridge
title: 'ADR-INV-008 — Motor de Trazabilidad de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: traceability-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, traceability, genealogy, timeline, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[ADR-INV-006]]'
  - '[[ADR-INV-007]]'
  - '[[Movement Engine]]'
  - '[[Issue Register]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-008 — Motor de Trazabilidad de Inventario](../../../adr/ADR-INV-008-motor-de-trazabilidad-de-inventario.md).
**Estado: Propuesta.** Quinto ADR de la serie — a diferencia de los cuatro anteriores, no introduce
un motor de decisión nuevo: es la capa de consulta unificada sobre los cuatro motores ya diseñados
más [[Movement Engine]] y la auditoría universal real.

# Background

**Hereda, no descubre, el hallazgo central**: [[Movement Engine]] ya documentó
_"ningún movimiento carga `lot_id`/`serial_id` — la trazabilidad real hoy es de costo, no de unidad
física"_ durante la fase de Second Brain de esta sesión. Este ADR cierra esa brecha (§6.1: tres
columnas nulables sobre `stock_movements`) en vez de volver a descubrirla.

# Domain Model

**Decisión central**: de las 25 "genealogías" pedidas, ninguna es un mecanismo distinto — todas son
el mismo grafo de referencias ya real (`source_module`/`source_entity_id` + FK + auditoría universal)
recorrido desde un punto de entrada distinto. Un solo Domain Service (`RecorrerGenealogia`) con
parámetros resuelve los 25 puntos de entrada, no 25 implementaciones — aplicación estricta de la
Regla Empresarial del propio pedido ("No module may implement traceability independently") a nivel
de diseño interno.

# Business Rules

`EslabonDeGenealogia` (único Aggregate de escritura nueva) se usa solo donde una relación causal no
es ya derivable de datos reales (caso acotado: producción, componente↔salida) — nunca como copia
general del grafo, evitando una segunda fuente de verdad.

# Architecture

Retención propuesta **más larga**, no más corta, que el resto de la serie — un recall de años
después necesita la genealogía completa, no solo la ventana operativa reciente. Justificado
explícitamente como diferencia intencional, no como desviación accidental del criterio de
`ADR-DB-001 §11`.

# Risks

Refuerza (sin resolver) `ISSUE-01` (I4) — la genealogía física depende de que
`tracksSerial`/`tracksLot` sean mutuamente excluyentes; este ADR documenta por qué esa brecha importa
más de lo que parecía antes de diseñarlo, sin corregirla (fuera de su alcance).

# Update — Digital Twin (§15, agregado 2026-07-28)

Extiende `ReconstruirEnPuntoDelTiempo` (§4.5) a las 8 capacidades de reconstrucción histórica
pedidas explícitamente (inventario/valuación/estado de almacén/disponibilidad/reservas/asignaciones
en un punto del tiempo, snapshots, replay). **Hallazgo real nuevo**: `remaining_quantity` en
`fifo_cost_layers`/`lifo_cost_layers` es una columna **mutable, decrementada in-place** — no
reconstruible históricamente sin una tabla de consumo append-only nueva
(`fifo_cost_layer_consumptions`, propuesta). Hallazgo positivo: Point-in-Time Reservations ya es
100% reconstruible hoy sin ningún cambio de schema (`created_at`/`released_at` ya reales).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]]

# References

[ADR-INV-008 (documento real, `docs/adr/`)](../../../adr/ADR-INV-008-motor-de-trazabilidad-de-inventario.md)
