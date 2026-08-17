---
id: concept-reservation
title: Reservation
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: stock-management
created: 2026-07-27
updated: 2026-07-27
tags: [concept, reservation, aggregate-root]
related:
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-000]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Inventory]]'
---

# Purpose

Cantidad de [[Stock]] apartada para un propósito específico (típicamente un pedido de venta), sin
haber salido físicamente todavía — real en código (`ReservaStock`, `reserva-stock.entity.ts`), con
`ReservasController`/`ReservasService` ya funcionales.

# Domain Model

Aggregate Root de una sola entidad. Reduce `v_available_stock` sin reducir `quantityOnHand`.
Polimórfica (`sourceModule`/`sourceEntityId`) — a diferencia de [[Movement Engine]], acá **ambos son
obligatorios**: "una reserva siempre tiene un dueño identificable, nunca es suelta" (cita literal del
código real).

# Business Rules

`quantity > 0`. **Brecha real señalada** ([[ADR-INV-002]] §5.2, [[ADR-INV-000]] Ubiquitous
Language): no distingue `Reserved` de `Committed` — un WMS de referencia separa "reservado para un
pedido" de "ya en proceso de picking, sin vuelta atrás"; GORAZUS usa la misma fila para ambos casos.
Sin columna de prioridad — el único orden real es de inserción.

# Integration

El mecanismo ya está listo para que Sales lo invoque automáticamente al confirmar un pedido — hoy
`sales` no lo hace (`ADR-INV-002 §4` "Automatic reservations", brecha de integración, no de
capacidad).

# Related ADRs

[[ADR-INV-002]] · [[ADR-INV-000]]

# References

[[ADR-INV-002]]
