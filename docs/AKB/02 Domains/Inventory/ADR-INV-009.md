---
id: adr-inv-009-bridge
title: 'ADR-INV-009 — Motor de Conteo Cíclico de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: cycle-count-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, cycle-count, reconciliation, approval, tolerance, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[ADR-INV-006]]'
  - '[[ADR-INV-007]]'
  - '[[ADR-INV-008]]'
  - '[[Business Rules Matrix — Inventory]]'
  - '[[Issue Register]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-009 — Motor de Conteo Cíclico de Inventario](../../../adr/ADR-INV-009-motor-de-conteo-ciclico-de-inventario.md).
**Estado: Propuesta.** Sexto ADR de la serie — el primero donde la mayoría de la base ya es código
real y probado (`ConteoFisico`/`AjusteStock`, `completar()` real), no solo schema. Invierte la
proporción habitual: la ejecución mecánica ya existe, la inteligencia de planificación y la
gobernanza de aprobación son diseño nuevo.

# Background

**Hallazgo central, encontrado leyendo `conteos.service.ts` línea por línea antes de diseñar**:
`completar()` real genera un `stock_adjustment` automáticamente para **cualquier discrepancia, sin
importar su magnitud, sin ningún paso de aprobación humana**. GORAZUS ya tiene un motor de conteo
funcional y bien probado (con tests e2e reales), pero sin tolerancia ni aprobación — el hallazgo que
reorienta todo el documento.

# Domain Model

`PropuestaDeConteo` (Aggregate Root nuevo) unifica `CycleCount`/`CountSession`/`CountTask` del
pedido original — mismo patrón que `SugerenciaDeCompra` (`ADR-INV-006 §4.1`): decisión persistida,
aprobación humana obligatoria antes de convertirse en un `ConteoFisico` real. `ConteoFisico`/
`AjusteStock` reales **no se reemplazan**, solo se extienden.

# Business Rules

Diseña `EvaluarTolerancia` como paso intermedio obligatorio antes de que `completar()` (ya real)
genere el ajuste — con compatibilidad hacia atrás explícita: sin tolerancia configurada, el
comportamiento actual continúa idéntico. Cierra el gap de ABC/rotación ya documentado en
`INVENTORY_CYCLE_COUNT.md §3` (reporte de una fase anterior) reutilizando
`product_abc_classifications`, ya propuesta en [[ADR-INV-006]] §3.4 — la tabla que ese reporte
predijo que haría falta ya está diseñada.

# Architecture

Aplica el mismo principio de "un motor, N puntos de entrada" ya usado en [[ADR-INV-008]] a los 23
tipos de conteo pedidos — ninguno es un mecanismo distinto, todos son filtros sobre un generador
único parametrizado.

# Risks

Deuda técnica más importante detectada: `core/scheduler` existe como infraestructura real sin ningún
consumidor todavía (ya documentado en `TECHNICAL_DEBT.md` de una fase anterior) — es el bloqueador
real entre este diseño y "conteo continuo" verdadero, señalado con honestidad en vez de fingir que ya
es posible.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]] · [[ADR-INV-008]]

# References

[ADR-INV-009 (documento real, `docs/adr/`)](../../../adr/ADR-INV-009-motor-de-conteo-ciclico-de-inventario.md)
