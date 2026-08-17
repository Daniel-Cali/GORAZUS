---
id: concept-cost-engine
title: Cost Engine
version: 1.0.0
status: proposed
owner: Financial Systems Architect
domain: inventory
subdomain: costing
created: 2026-07-27
updated: 2026-07-27
tags: [concept, cost, fifo, average-cost, domain-service]
related:
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-001]]'
  - '[[Product]]'
  - '[[Movement Engine]]'
---

# Purpose

Domain Service responsable de resolver el costo de una salida de [[Stock]] según el
`costingMethod` declarado por [[Product]] (FIFO o Promedio Ponderado, [[ADR-INV-001]] §7).

# Domain Model

**Diseñado, no implementado**: `docs/ddd/08_domain_services.md §1.1-1.2` ya nombra formalmente
`AplicarFIFO` y `CalcularCostoPromedio` como Domain Services — sin código de aplicación todavía
([[ADR-INV-000]] §8.1, corregido tras revisión de gobernanza). Sus tablas de apoyo sí son reales:
`fifo_cost_layers` (capas con `sourceReceiptLineId` — trazabilidad real hacia la recepción origen) y
`average_cost_history` (snapshot recalculado en cada entrada, sin capas).

# Business Rules

FIFO: consume la capa más antigua con `remainingQuantity > 0` primero; si no alcanza, continúa en la
siguiente. Promedio: `nuevo_promedio = (cantidad_actual×promedio_actual + cantidad_recibida×costo_recibido) / (cantidad_actual+cantidad_recibida)`,
recalculado en cada entrada, sin capas.

# Architecture

Es, hoy, la **única** cadena de trazabilidad real del dominio — `fifo_cost_layers.sourceReceiptLineId`
conecta cada salida con la recepción exacta que la originó. Distinto de la trazabilidad de unidad
física (lote/serie), que no existe ([[ADR-INV-002]] §10.1, hallazgo central de esa sección).

# Related ADRs

[[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-000]]

# References

[[ADR-INV-001]] §7 · [[ADR-INV-002]] §10.1
