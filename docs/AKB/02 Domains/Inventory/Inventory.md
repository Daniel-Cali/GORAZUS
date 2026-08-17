---
id: concept-inventory
title: Inventory
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: bounded-context
created: 2026-07-27
updated: 2026-07-27
tags: [concept, inventory, bounded-context]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-002]]'
  - '[[Product]]'
  - '[[Warehouse]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Cost Engine]]'
---

# Purpose

**Nota de desambiguación deliberada**: "Inventory" es el nombre del **Bounded Context** completo
([[ADR-INV-000]] §3), no un Aggregate Root. Este ADR (§5.3) recomienda explícitamente **no**
modelarlo como un agregado único — sería el antipatrón de "agregado dios": no existe ninguna
operación de negocio real que necesite bloquear simultáneamente todos los almacenes, todo el stock y
todos los movimientos a la vez.

# Domain Model

Inventory = subdominio [[Product]] (identidad y capacidad) + subdominio de ejecución:
[[Warehouse]] (estructura física), [[Stock]] (saldo actual), [[Movement Engine]] (fuente de verdad
de cambio), [[Reservation]] (apartado sin salida física), [[Cost Engine]] (valuación FIFO/promedio).

# Architecture

Dos patrones de crecimiento incompatibles si se mezclan ([[ADR-INV-000]] §1.3): la estructura física
crece con la infraestructura del negocio, las cantidades/movimientos crecen con cada transacción,
órdenes de magnitud más rápido — la independencia de schema (`inventory` propio, separado de
`sales`/`purchases`) es lo que permite escalar cada uno a su propio ritmo.

# Integration

Purchasing y Sales se integran vía FK polimórfica (`source_module`/`source_entity_id`), nunca FK
directa — ningún otro dominio escribe `stock` directamente, todos piden un movimiento vía
[[Movement Engine]].

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]]

# References

[[ADR-INV-000]]
