---
id: governance-engineering-review-adr-inv-006
title: 'Engineering Review — ADR-INV-006 (Motor de Reabastecimiento de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, replenishment-engine]
related:
  - '[[ADR-INV-006]]'
  - '[[Innovation Report — 2026-07-28]]'
  - '[[Engineering Heuristics]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-006`, mismo formato
consolidado ya usado en [[Engineering Review — ADR-INV-004]]/[[Engineering Review — ADR-INV-005]].
Cierra la trilogía de motores de Inventario — esta revisión también evalúa la consistencia **entre
los tres**, no solo dentro de este ADR.

# Engineering Review

- **Consistencia entre los tres motores**: verificado explícitamente que `ADR-INV-006` no recalcula
  disponibilidad (`ADR-INV-005`) ni costo (`ADR-INV-004`) por su cuenta — Reorder Point y EOQ leen
  ambos vía los Domain Services ya diseñados, nunca duplican la fórmula.
- **Consistencia DDD**: decisión de diseño de `ADR-INV-005 §4.1` (Value Object vs. Aggregate) se
  reevaluó explícitamente para este ADR y se llegó a la conclusión **opuesta y correcta** para
  `SugerenciaDeCompra` (sí persistir) — no una aplicación mecánica de la misma regla sin pensar el
  caso nuevo.
- **Consistencia con `ADR-DB-001`**: dos tablas nuevas particionadas (`RANGE` mensual + `BRIN`),
  una explícitamente no particionada con la misma justificación ya usada para `Stock`.
- **Corrección activa de un hallazgo previo**: `bi.forecasts`/`forecast_models` verificados reales
  esta vez, corrigiendo [[Innovation Report — 2026-07-28]] en vez de heredar la conclusión sin
  volver a verificar — la disciplina de "nunca calcular desde memoria" aplicada también a las propias
  conclusiones anteriores de esta sesión, no solo al código.

# Enterprise Quality Report

| Criterio                                      | Cumplido                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Determinístico, auditable, explicable         | ✅ EOQ/ABC/XYZ como fórmulas de IR clásicas, `reasoning JSONB` explícito por sugerencia                     |
| Aprobación humana obligatoria                 | ✅ Sin excepción, ni para casos "obvios" (§13, alternativa de reorden automático descartada explícitamente) |
| 30 capacidades solicitadas diseñadas          | ✅ Las 30, cada una con estado real/parcial/propuesto declarado                                             |
| Sin lógica duplicada entre motores            | ✅ Verificado en §12 del ADR (Quality Gate)                                                                 |
| Sin invención de necesidad de negocio para IA | ✅ Mismo veredicto de [[Innovation Report — 2026-07-28]] reafirmado, no una nueva evaluación desde cero     |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-006]] creada, enlazada a los 5 ADRs previos de la serie y a
  [[Innovation Report — 2026-07-28]] (única nota de gobernanza referenciada directamente, por la
  corrección activa de su hallazgo).
- [[Engineering Heuristics]] **no se modificó** — ninguna heurística genuinamente nueva surgió
  (el patrón "decisión persistida vs. valor calculado" ya está cubierto por la heurística #3 y su
  aplicación inversa en `ADR-INV-006 §4.1`, documentada dentro del ADR mismo, no como heurística
  separada — evita fragmentar el mismo principio en dos notas).
- `Home.md` y `ADR Index.md` actualizados de forma aditiva.

# New Reusable Patterns Discovered

Ninguno nuevo a nivel de nota — el árbol de decisión ABC-XYZ (§11.3 del ADR) es una aplicación de
diagrama de decisión determinístico, no un patrón de arquitectura de software nuevo.

# New Engineering Heuristics

Ninguna nueva — ver Second Brain Update arriba.

# New Lessons Learned

**Las conclusiones de reportes anteriores de esta misma sesión no son inmunes a re-verificación**:
[[Innovation Report — 2026-07-28]] concluyó "sin dato ni código" para pronóstico de demanda —
conclusión correcta en su momento con la profundidad de búsqueda de ese nivel, pero incompleta.
Verificar de nuevo para `ADR-INV-006` (en vez de citar la conclusión anterior como definitiva) encontró
`bi.forecasts` real. Lección: cada ADR nuevo debe re-verificar el schema relevante a su alcance
específico, incluso si un reporte previo ya cubrió un tema adyacente — la profundidad de verificación
necesaria crece con la especificidad de lo que se está diseñando.

# New Issues Detected

`bi.forecasts`/`forecast_models` necesita `product_id`/`warehouse_id` nulables antes de que el
análisis de patrón de demanda (`ADR-INV-006 §3.7`) sea implementable — severidad Baja (extensión no
disruptiva, sin ticket formal aplicado directamente).

# Recommended ADR-INV-007

Ninguna arquitectura nueva de Inventario queda pendiente de diseñar en la trilogía Costeo/
Disponibilidad/Reabastecimiento — los tres motores centrales del dominio ya están completos. La
recomendación real, consistente con [[GEMM — Enterprise Maturity Model — 2026-07-28]] y con las
recomendaciones ya emitidas en [[Engineering Review — ADR-INV-004]]/[[Engineering Review — ADR-INV-005]],
es **dejar de diseñar y empezar a implementar** `ADR-INV-003` a `ADR-INV-006` en conjunto — los
cuatro comparten los mismos Aggregates base (`Stock`, `ReservaStock`) y se construyen naturalmente
juntos, no en ADRs adicionales. Si se insiste en continuar en fase de diseño, el siguiente ADR con
mayor evidencia de necesidad real sería sobre el dominio de **Compras** (`ADR-PUR-001`, fuera de
`inventory`) — ya identificado en `GEMM` como el dominio de mayor prioridad de construcción, y ahora
también como consumidor directo de `purchase_suggestions` (§3.12 de este ADR).

# Related ADRs

[[ADR-INV-006]] · [[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]]

# References

[ADR-INV-006 (documento real)](../../adr/ADR-INV-006-motor-de-reabastecimiento-de-inventario.md)
