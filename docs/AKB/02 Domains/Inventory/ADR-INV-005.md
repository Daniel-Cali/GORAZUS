---
id: adr-inv-005-bridge
title: 'ADR-INV-005 — Motor de Disponibilidad de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: availability-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, availability-engine, reservation, allocation, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-INV-004]]'
  - '[[Stock]]'
  - '[[Reservation]]'
  - '[[Warehouse]]'
  - '[[Engineering Heuristics]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-005 — Motor de Disponibilidad de Inventario](../../../adr/ADR-INV-005-motor-de-disponibilidad-de-inventario.md).
**Estado: Propuesta.** Extiende [[Stock]]/[[Reservation]] (ya reales) sin reemplazarlos — verificado
que de los 22 estados de inventario pedidos, solo 4 ya son reales y operativos
(`On Hand`/`Reserved`/`Available`/`In Transit`), 6 son derivables de datos ya reales sin columna
propia, y 12 son diseño genuinamente nuevo.

# Background

Motivado por el mismo principio que ya gobierna [[Movement Engine]] ("nunca escribir el estado
actual fuera del ledger que lo sostiene", [[Engineering Heuristics]] #1) generalizado a consultas: la
disponibilidad debe calcularse en **un solo punto** del sistema, nunca duplicarse módulo por módulo —
regla explícita de la plataforma, no solo de este dominio.

# Domain Model

**Decisión de diseño central**: `DisponibilidadDeInventario` es un **Value Object calculado**, no un
Aggregate Root persistido — evita el anti-patrón de mantener un valor derivado de siete tablas
distintas sincronizado desde múltiples puntos de escritura (refuerza [[Engineering Heuristics]] #3,
no introduce una heurística nueva). `AvailabilitySnapshot` existe solo como cache periódico, marcado
explícitamente como no autoritativo.

# Business Rules

Formaliza la brecha ya conocida (`Reserved` sin distinguir de `Committed`, [[Reservation]]) como dos
estados nuevos (`Allocated`/`Committed`) con columnas propuestas sobre `stock_reservations` real, sin
tabla paralela. `ISSUE-10` (expiración de reservas) se formaliza como Release Policy (P20 propuesta)
en vez de quedar como issue suelto.

# Architecture

`v_available_stock` real (ya consumida por `sales`) **no se modifica** — `v_net_available_stock` es
la extensión, evitando romper un consumidor real ya en producción de desarrollo. Snapshot vía tabla
particionada (`RANGE` mensual + `BRIN`, mismo criterio de `ADR-DB-001`) en vez de `MATERIALIZED VIEW`
nativa, por el problema real de bloqueo de `REFRESH` sin `CONCURRENTLY`.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]]

# References

[ADR-INV-005 (documento real, `docs/adr/`)](../../../adr/ADR-INV-005-motor-de-disponibilidad-de-inventario.md)
