---
id: governance-engineering-review-adr-inv-005
title: 'Engineering Review — ADR-INV-005 (Motor de Disponibilidad de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, availability-engine]
related:
  - '[[ADR-INV-005]]'
  - '[[Stock]]'
  - '[[Reservation]]'
  - '[[Engineering Heuristics]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-005`, mismo formato
consolidado ya usado en [[Engineering Review — ADR-INV-004]] — sin fragmentar en ocho notas
separadas.

# Engineering Review

- **Consistencia DDD**: verificado que 4 de los 22 estados pedidos ya son reales
  (`On Hand`/`Reserved`/`Available`/`In Transit`) antes de proponer nada — ninguno se redujo ni se
  reemplazó, solo se extendieron con los 18 restantes.
- **Consistencia con Clean/Hexagonal**: `DisponibilidadDeInventario` como Value Object calculado
  (no Aggregate) es la aplicación directa del mismo principio de puerto/adaptador ya validado —
  ningún Repository nuevo para algo que no tiene persistencia propia.
- **Consistencia con `ADR-DB-001`**: `availability_snapshots` sigue el mismo criterio de partición
  `RANGE` mensual + `BRIN` ya certificado, sin inventar una estrategia nueva.
- **Sin contradicción con `v_available_stock` real**: verificado explícitamente que la vista real ya
  consumida por `sales` no se modifica — la extensión es aditiva (`v_net_available_stock`), mismo
  criterio de compatibilidad hacia atrás que las columnas nuevas de `stock_reservations` (todas
  `NULL`/`false` por defecto).

# Enterprise Quality Report

| Criterio                                        | Cumplido                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fuente única de disponibilidad para todo módulo | ✅ Regla de plataforma explícita en `ADR-INV-005 §12`                                                                                                                          |
| Multi-almacén/empresa                           | ✅ Heredado de `Stock`/RLS ya reales                                                                                                                                           |
| 22 estados solicitados diseñados                | ✅ Los 22, cada uno con estado real/parcial/propuesto declarado                                                                                                                |
| Escalabilidad a millones de reservas            | ✅ Reutiliza índices/particionamiento ya production-proven                                                                                                                     |
| Sin invención de necesidad de negocio           | ✅ Forecast Stock (§3.12) y Consigned (§3.10) explícitamente marcados como diseño sin evidencia de necesidad confirmada, mismo criterio que [[Innovation Report — 2026-07-28]] |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-005]] creada, enlazada a los 5 ADRs de la serie `ADR-INV-*` y a
  [[Reservation]]/[[Stock]]/[[Warehouse]] (notas que este ADR extiende).
- [[Engineering Heuristics]] **no se modificó** — la decisión central de este ADR (§4.1, Value
  Object calculado) refuerza la heurística #3 ya existente, no genera una heurística nueva
  (verificado explícitamente para no duplicar conocimiento ya capturado).
- `Home.md` y `ADR Index.md` actualizados de forma aditiva.

# New Reusable Patterns Discovered

Ninguno nuevo — el patrón de "tabla única con discriminador en vez de N tablas paralelas" (§3.7,
`stock_quality_holds`) es una reaplicación del mismo criterio ya documentado en
[[Enterprise Optimization Report — 2026-07-28]] §3, no un patrón nuevo.

# New Engineering Heuristics

Ninguna nueva — ver Second Brain Update arriba.

# New Lessons Learned

**Verificar antes de diseñar sigue siendo más rápido que diseñar y corregir después**: de los 22
estados pedidos, verificar el schema real primero redujo el trabajo de diseño genuino de 22 a 12
estados realmente nuevos — 4 ya existían, 6 eran agregaciones de datos ya reales. Sin esa
verificación previa, el riesgo real era diseñar tablas duplicadas para conceptos que
`v_available_stock`/`stock_transfers`/`inventory_lots` ya resolvían.

# New Issues Detected

Ninguna tabla real de recepción/orden de compra tiene columna de "fecha esperada de llegada"
(`ADR-INV-005 §3.15`) — bloquea `Projected Available` real. Severidad Media, sin ticket formal
aplicado directamente al [[Issue Register]] de la sesión de Inventario (mismo límite de
coordinación ya respetado).

# Recommended ADR-INV-006

Ninguna arquitectura nueva justificada por evidencia todavía. Si se continúa en fase de diseño, el
candidato más justificado es un **ADR de integración Ventas↔Disponibilidad** (cómo `sales` migra de
consumir `v_available_stock` directamente a consumir `CalcularDisponibilidad`, y cómo se conecta
`DevolucionRecibida` — hoy inexistente como evento — con `Inspection`, §3.9 de este ADR). Si se
prefiere pasar a implementación, la recomendación es la misma que para `ADR-INV-004`: construir sobre
`ADR-INV-003` primero, ya que `Allocated`/`Committed` (§3.2) dependen del ciclo de vida de
`SolicitudDeMovimiento` que ese ADR ya diseñó.

# Related ADRs

[[ADR-INV-005]] · [[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]]

# References

[ADR-INV-005 (documento real)](../../adr/ADR-INV-005-motor-de-disponibilidad-de-inventario.md)
