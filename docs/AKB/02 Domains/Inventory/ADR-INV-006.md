---
id: adr-inv-006-bridge
title: 'ADR-INV-006 — Motor de Reabastecimiento de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: replenishment-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, replenishment, eoq, abc-xyz, purchase-suggestions, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-INV-003]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[Innovation Report — 2026-07-28]]'
  - '[[Engineering Heuristics]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-006 — Motor de Reabastecimiento de Inventario](../../../adr/ADR-INV-006-motor-de-reabastecimiento-de-inventario.md).
**Estado: Propuesta.** Cierra la trilogía de motores de Inventario (Costeo `ADR-INV-004`,
Disponibilidad `ADR-INV-005`, Reabastecimiento `ADR-INV-006`) — de las 30 capacidades pedidas, 7 ya
son reales, 7 parciales (mecanismo genérico existe, sin especializar para inventario), 16 nuevas.

# Background

**Corrige un hallazgo previo de esta misma sesión**: [[Innovation Report — 2026-07-28]] marcó
"pronóstico de demanda" como sin ningún dato ni código real — verificación más profunda para este
ADR encontró `bi.forecast_models`/`bi.forecasts` (infraestructura genérica real de BI, sin
`product_id`/`warehouse_id` propio) — corregido explícitamente en el documento real §2, no repetido
sin verificar.

# Domain Model

Introduce tres Aggregate Roots nuevos (`SugerenciaDeCompra`, `ClasificacionABC`/`XYZ`,
`DesempeñoDeProveedor`). Decisión de diseño central, simétrica y opuesta a `ADR-INV-005 §4.1`:
`SugerenciaDeCompra` **sí** se persiste (a diferencia de `DisponibilidadDeInventario`) porque es una
decisión tomada en un momento específico que debe auditarse tal como se generó, no un valor siempre
recalculable sin pérdida de información.

# Business Rules

Toda sugerencia de compra requiere aprobación humana **sin excepción**, incluso las "obviamente
correctas" (clase `AX` de la matriz ABC-XYZ) — descartado explícitamente el reorden automático sin
revisión, consistente con el requisito propio del pedido ("Human approval remains mandatory for
critical operations").

# Architecture

EOQ y clasificación ABC/XYZ diseñadas como fórmulas de investigación de operaciones clásicas
(determinísticas, auditables), no como modelos de IA — mismo veredicto ya emitido en
[[Innovation Report — 2026-07-28]] (sin evidencia de necesidad de negocio confirmada para IA). Todas
las fórmulas nuevas leen `Available`/Costo vigente vía `ADR-INV-005`/`ADR-INV-004`, nunca recalculan
por su cuenta.

# Risks

Deuda nueva registrada: `bi.forecasts` requiere extensión de columnas (nulables, sin ruptura) antes
de que el análisis de patrón de demanda sea implementable — sin ticket formal aplicado directamente
al Issue Register de Inventario, mismo límite de coordinación ya respetado en `ADR-INV-004`/`005`.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]]

# References

[ADR-INV-006 (documento real, `docs/adr/`)](../../../adr/ADR-INV-006-motor-de-reabastecimiento-de-inventario.md)
