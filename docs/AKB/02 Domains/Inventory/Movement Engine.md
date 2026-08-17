---
id: concept-movement-engine
title: Movement Engine
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: stock-management
created: 2026-07-27
updated: 2026-07-27
tags: [concept, movement, kardex, aggregate-root]
related:
  - '[[ADR-INV-002]]'
  - '[[ADR-DB-001]]'
  - '[[Stock]]'
  - '[[Warehouse]]'
  - '[[Cost Engine]]'
  - '[[Reservation]]'
---

# Purpose

La única fuente de verdad de todo cambio de cantidad — real en código (`MovimientoStock`,
`movimiento-stock.entity.ts`). Toda otra operación (transferencia, ajuste, conteo, recepción,
salida, consumo de producción) termina generando una o más filas acá, nunca modifica [[Stock]]
directamente sin dejar rastro.

# Domain Model

Aggregate Root de una sola entidad, **append-only** — nunca se actualiza ni se elimina una vez
creado. Kardex (`inventory.v_kardex`) es una vista derivada sobre esta tabla, nunca una tabla propia
([[ADR-INV-002]] §12).

# Business Rules

`quantity > 0` siempre — la dirección (`in`/`out`) la determina el tipo de movimiento, nunca el
signo. `sourceModule`/`sourceEntityId`: o los dos presentes, o ninguno. Trece tipos de movimiento
solicitados mapeados sobre ocho ya reales + motivos de ajuste sembrados ([[ADR-INV-002]] §11).

# Architecture

Particionada `RANGE (created_at)`, mensual, índice `BRIN` — la tabla de mayor volumen del sistema
(`ADR-DB-001`). Debe ser inmutable por construcción matemática: `running_balance` es una suma
acumulada recalculada en cada consulta — borrar una fila reescribe en silencio el saldo de todas las
posteriores ([[ADR-INV-002]] §12.3). Hallazgo central de trazabilidad: ningún movimiento carga
`lot_id`/`serial_id` — la trazabilidad real hoy es de costo (vía [[Cost Engine]]), no de unidad
física ([[ADR-INV-002]] §10.1).

# Related ADRs

[[ADR-INV-002]] · [[ADR-DB-001]]

# References

[[ADR-INV-002]]
