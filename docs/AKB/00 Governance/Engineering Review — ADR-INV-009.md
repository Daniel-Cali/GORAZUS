---
id: governance-engineering-review-adr-inv-009
title: 'Engineering Review — ADR-INV-009 (Motor de Conteo Cíclico de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, cycle-count-engine]
related:
  - '[[ADR-INV-009]]'
  - '[[Issue Register]]'
  - '[[Decision Log]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-009`, mismo formato
consolidado ya usado para `ADR-INV-004` a `008`. Sexto ADR de la serie — primero que audita código
de aplicación real ya probado (no solo schema) como paso previo obligatorio al diseño.

# Engineering Review

- **Verificación de código real como paso central, no accesorio**: `conteos.service.ts` se leyó
  completo antes de diseñar, no solo `physical_counts`/`stock_adjustments` a nivel de schema — el
  hallazgo central del ADR (cero tolerancia/aprobación) solo era visible en el código, no en las
  columnas de la tabla.
- **Reutilización cruzada confirmada con evidencia externa**: `INVENTORY_CYCLE_COUNT.md` (reporte de
  una fase anterior de esta misma sesión de trabajo, no de esta conversación) ya predijo que haría
  falta una tabla de clasificación ABC para conteo inteligente — `ADR-INV-006 §3.4`
  (`product_abc_classifications`) ya es exactamente esa tabla, diseñada sin que su autor supiera de
  esa predicción anterior. Es la segunda vez en la serie (después de `ADR-INV-008`/[[Movement Engine]])
  que el Second Brain conecta un hallazgo antiguo con un diseño posterior sin redescubrirlo.
- **Consistencia con toda la serie**: `PropuestaDeConteo` reutiliza el patrón de
  `SugerenciaDeCompra` (`ADR-INV-006`), `AsignarConteo` reutiliza `AsignarTarea` (`ADR-INV-007`),
  `lot_id`/`serial_id` reutiliza las columnas ya propuestas en `ADR-INV-008 §6.1` sin duplicar
  diseño.
- **Extensión, no reemplazo, de Aggregates reales y probados**: verificado explícitamente que
  `ConteoFisico`/`AjusteStock` no se tocan como clases — solo ganan columnas nulables y un paso
  intermedio (`EvaluarTolerancia`) antes de su comportamiento ya real.

# Enterprise Quality Report

| Criterio                                                       | Cumplido                                                                                                                                        |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| El almacén nunca deja de operar                                | ✅ Verificado que el diseño real ya no bloquea movimientos concurrentes durante un conteo — sin cambio necesario                                |
| Ajustes solo se originan de este motor                         | ✅ Ya cierto en el código real (`completar()` es el único punto que crea `stock_adjustment` desde conteo) — este ADR lo audita, no lo introduce |
| 23 tipos de conteo diseñados                                   | ✅ Colapsados correctamente a un generador único parametrizado, mismo criterio que `ADR-INV-008`                                                |
| Tolerancia/aprobación diseñadas con compatibilidad hacia atrás | ✅ Sin tolerancia configurada, comportamiento actual preservado exactamente                                                                     |
| Honestidad sobre el bloqueador real de "continuidad"           | ✅ `core/scheduler` sin consumidor señalado explícitamente como el gap real, no ocultado                                                        |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-009]] creada, enlazada a 6 ADRs previos de la serie y a
  [[Business Rules Matrix — Inventory]] (BR-09/BR-10, las reglas reales que este ADR extiende).
- [[Engineering Heuristics]] **no se modificó** — ningún principio genuinamente nuevo, todos los
  aplicados (generador único parametrizado, extensión sin ruptura, decisión persistida con
  aprobación humana) ya estaban documentados antes de este ADR.
- `Home.md`, `ADR Index.md`, [[Issue Register]] y [[Decision Log]] actualizados de forma aditiva
  (ver abajo).

# New Reusable Patterns Discovered

Ninguno nuevo a nivel de nota — todos los patrones de este ADR son reaplicaciones verificadas
explícitamente contra el Second Brain existente antes de escribir (§ Engineering Review arriba).

# New Engineering Heuristics

Ninguna nueva.

# New Lessons Learned

**Auditar código real antes de diseñar una capa de gobernanza nueva revela gaps que ningún análisis
de schema puede mostrar**: `stock_adjustments.status` tiene un `CHECK` implícito de dos valores
(`draft`/`confirmed`, visto en el código, no en una columna `CHECK` explícita) — la ausencia de
tolerancia/aprobación no es visible en ninguna tabla, solo en la lógica de `completar()`. Para
dominios donde ya existe código real y probado (a diferencia de la mayoría de esta serie, mayormente
schema-sin-código), el paso de "leer el código antes de diseñar" no es opcional — es la única forma
de encontrar el hallazgo que realmente importa.

# New Issues Detected

Ninguna tabla o columna nueva descubierta como faltante más allá de lo ya diseñado en el propio ADR
— el hallazgo central (ausencia de tolerancia/aprobación) ya se convirtió directamente en diseño
(§5 del ADR). Consolidado en [[Issue Register]] como deuda de **comportamiento**, no de schema:

- **Severidad Alta**: `completar()` real genera ajustes automáticos sin tolerancia ni aprobación para
  cualquier magnitud de diferencia — riesgo de producción real si se opera con volumen antes de
  implementar `EvaluarTolerancia`.
- **Severidad Media**: `core/scheduler` sin consumidor real bloquea que cualquier programación
  (`cycle_count_schedules` u otra) se ejecute sola — ya documentado en `TECHNICAL_DEBT.md`, reafirmado
  aquí con un caso de uso concreto.

# Recommended ADR-INV-010

Con `ADR-INV-009` se completan **siete** documentos de motores/capas de Inventario. La cobertura de
diseño del dominio está, con altísima confianza, completa — reafirmado por **quinta vez consecutiva**
([[Engineering Review — ADR-INV-005]] a [[008]]). Este ADR además demuestra por qué: a diferencia de
los anteriores, encontró que gran parte de lo pedido **ya existe y funciona** — la superficie de
diseño genuinamente nueva se está reduciendo, no expandiendo, con cada ADR sucesivo de este dominio.
Si la serie continúa, la recomendación real sigue siendo `Compras` (`ADR-PUR-001`) o, dado el
hallazgo de este ADR específicamente, **implementar la corrección de tolerancia/aprobación de §5**
directamente sobre `conteos.service.ts` real — es una corrección de comportamiento acotada, no una
arquitectura nueva, y cierra el riesgo de mayor severidad de todo este documento.

# Related ADRs

[[ADR-INV-009]] · [[ADR-INV-000]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]] · [[ADR-INV-008]]

# References

[ADR-INV-009 (documento real)](../../adr/ADR-INV-009-motor-de-conteo-ciclico-de-inventario.md)
