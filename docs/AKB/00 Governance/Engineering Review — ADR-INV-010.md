---
id: governance-engineering-review-adr-inv-010
title: 'Engineering Review — ADR-INV-010 (Motor de Analítica de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, analytics-engine, kpi-audit]
related:
  - '[[ADR-INV-010]]'
  - '[[Issue Register]]'
  - '[[Decision Log]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-010`, mismo formato
consolidado ya usado para `ADR-INV-004` a `009`. Séptimo ADR de la serie — el primero cuyo propósito
central es auditar la **consistencia interna de la propia serie**, no solo contra el schema/código
real.

# Engineering Review

- **Auditoría cruzada entre ADRs, no solo contra el schema**: por primera vez en la serie, la
  verificación previa no fue "¿qué dice el código real?" sino "¿qué dicen los seis ADRs anteriores
  entre sí?" — metodología nueva dentro de la disciplina ya establecida, aplicada al propio corpus
  de decisiones en vez de solo al sistema.
- **Hallazgo real de duplicación de métrica, exactamente lo que este ADR debía prevenir**:
  `ADR-INV-006 §10` y `ADR-INV-009 §10` definen "Inventory Health Score" con fórmulas distintas —
  confirmado releyendo ambas tablas de KPI palabra por palabra, no de memoria.
- **Autocorrección durante la escritura, no después**: al diseñar la tabla de snapshot de KPI, se
  detectó que `bi.kpi_snapshots` ya es real (`ADR-DB-001 §7`) antes de que la tabla propuesta
  (`inventory.kpi_snapshots`) llegara a la versión final del documento — corregido en el momento,
  documentado explícitamente como evidencia de que la disciplina de verificación se aplicó incluso
  al contenido del propio ADR mientras se escribía.
- **Consistencia con los seis motores previos**: verificado que `ConsolidarKPIs` delega, nunca
  reimplementa — cada uno de los 21 KPIs solicitados se rastreó hasta su Domain Service dueño real
  antes de escribir la tabla maestra de §2.2.

# Enterprise Quality Report

| Criterio                                      | Cumplido                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| KPIs de inventario con fuente única de verdad | ✅ Objetivo central del ADR, verificado con una colisión real encontrada y resuelta |
| Sin duplicación de métricas                   | ✅ Auditoría explícita de §2, no una declaración sin evidencia                      |
| 21 KPIs + 27 módulos de analítica cubiertos   | ✅ Mapeados contra su ADR de origen; solo 3 KPIs genuinamente nuevos                |
| Sin tabla de hechos/dimensiones paralela      | ✅ Decisión explícita de reutilizar el modelo operacional real como fuente (§6.1)   |
| Seguridad read-only verificada                | ✅ Ningún endpoint de este ADR escribe sobre datos operacionales                    |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-010]] creada, enlazada a los 6 ADRs con tablas de KPI que este documento
  consolida.
- [[Engineering Heuristics]] **no se modificó** — el principio "un motor, N puntos de entrada" ya
  documentado (aplicado aquí por tercera vez) no requiere una heurística nueva, solo otra instancia.
- [[Issue Register]] y [[Decision Log]] actualizados con la colisión de nombre y su resolución (ver
  abajo) — primera vez que un hallazgo de **inconsistencia entre ADRs**, no de schema/código, se
  registra en el Issue Register.
- `Home.md` y `ADR Index.md` actualizados de forma aditiva.

# New Reusable Patterns Discovered

**Auditoría cruzada de KPIs entre documentos de arquitectura relacionados, antes de agregar una capa
de consolidación** — no es un patrón de código, es un patrón de proceso de documentación: cuando un
ADR nuevo va a consolidar/agregar trabajo de varios ADRs anteriores, releer sus tablas de referencia
(KPIs, eventos, políticas) buscando colisiones de nombre antes de diseñar es, en sí mismo, un paso
reutilizable para cualquier ADR de consolidación futuro (no solo de Inventario). Se recomienda
como práctica explícita, no como nota nueva separada (evita fragmentar un principio ya simple).

# New Engineering Heuristics

Ninguna nueva formalizada — ver "New Reusable Patterns" arriba, se mantiene como práctica
documentada en este ADR en vez de generar una séptima nota de heurística por un principio
suficientemente cubierto por el ejemplo concreto ya escrito.

# New Lessons Learned

**Ni siquiera el propio Second Brain está exento de la disciplina que exige de todo lo demás**: dos
ADRs de esta misma serie, escritos por el mismo autor en la misma sesión, lograron definir el mismo
KPI con nombres idénticos y fórmulas distintas — no por descuido evidente, sino porque cada ADR se
verificó exhaustivamente **contra el sistema real**, nunca **contra los demás ADRs**. La lección es
concreta: verificar contra la fuente de verdad externa (schema, código) es necesario pero no
suficiente — un corpus de documentos que crece rápido necesita, además, auditoría de consistencia
interna periódica, no solo al final de una serie larga.

# New Issues Detected

- **Severidad Media**: `ADR-INV-006 §10` y `ADR-INV-009 §10` definen "Inventory Health Score" con
  fórmulas distintas — resuelto en `ADR-INV-010 §2.1` (jerarquía de composición), con corrección de
  nomenclatura **recomendada, no aplicada** a los documentos originales (requiere autorización para
  editar un ADR ya aceptado). Consolidado en [[Issue Register]] (ver abajo).

# Recommended ADR-INV-011

Con `ADR-INV-010` se completan **ocho** documentos de motores/capas de Inventario, cubriendo
Movimientos, Costeo, Disponibilidad, Reabastecimiento, Almacenes, Trazabilidad, Conteo Cíclico y
ahora Analítica — la capa de consolidación final sobre las siete anteriores. **No queda ninguna
capacidad de Inventario de alto nivel sin diseñar** dentro del alcance ya cubierto por toda la
serie. La recomendación, reafirmada por sexta vez consecutiva, es no continuar generando ADRs de
Inventario — la serie ha llegado a su cierre natural: un motor de analítica que consolida a los
demás es, arquitectónicamente, el techo lógico de la pirámide, no un peldaño más. Si continúa,
`Compras` (`ADR-PUR-001`) sigue siendo el candidato de mayor evidencia real fuera de este dominio.

# Related ADRs

[[ADR-INV-010]] · [[ADR-INV-000]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]] · [[ADR-INV-008]] · [[ADR-INV-009]]

# References

[ADR-INV-010 (documento real)](../../adr/ADR-INV-010-motor-de-analitica-de-inventario.md)
