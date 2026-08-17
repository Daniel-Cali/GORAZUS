---
id: concept-stock
title: Stock
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: stock-management
created: 2026-07-27
updated: 2026-07-27
tags: [concept, stock, aggregate-root]
related:
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-000]]'
  - '[[Warehouse]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Cost Engine]]'
---

# Purpose

Saldo actual de un producto en un almacén (y opcionalmente una ubicación) — real en código (`Stock`,
`stock.entity.ts`). Nunca un histórico; el histórico es [[Movement Engine]].

# Domain Model

Aggregate Root con dos columnas de cantidad: `quantityOnHand`, `quantityReserved` — más
`quantityAvailable` como propiedad calculada (`get`), nunca almacenada
(`v_available_stock = on_hand − reserved`, vista real).

# Business Rules

Invariante real del constructor, **no forzado por la tabla física** (`NUMERIC` sin `CHECK` cruzado):
`quantityReserved ≤ quantityOnHand`. De los diez tipos de cantidad solicitados en
[[ADR-INV-002]] §5, solo `Available`/`Reserved` son reales tal cual — `Committed`, `Blocked`,
`Quality Inspection` no tienen bucket propio.

# Architecture

No particionada (`ADR-DB-001`) — crece con `# SKUs × # almacenes`, no con el tiempo, a diferencia de
[[Movement Engine]]. `quantityReserved` es un total **denormalizado**, mantenido por [[Reservation]]
en cada creación/liberación, nunca recalculado con `SUM` en cada lectura (decisión de rendimiento).

# Related ADRs

[[ADR-INV-002]] · [[ADR-INV-000]]

# References

[[ADR-INV-002]]
