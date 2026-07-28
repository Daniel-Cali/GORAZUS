---
id: governance-engineering-review-adr-inv-004
title: 'Engineering Review — ADR-INV-004 (Motor de Costeo de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, cost-engine]
related:
  - '[[ADR-INV-004]]'
  - '[[Cost Engine]]'
  - '[[Engineering Heuristics]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
  - '[[Decision Log]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-004` — consolida los puntos
10-17 del entregable pedido (Engineering Review, Enterprise Quality Report, Second Brain/Knowledge
Graph Update, patrones nuevos, issues nuevos, próximo ADR recomendado) en un solo documento, sin
fragmentar en ocho notas separadas (mismo criterio de simplificación ya aplicado en
[[Enterprise Optimization Report — 2026-07-28]] §3).

# Engineering Review

- **Consistencia DDD**: verificada contra `docs/ddd/08_domain_services.md`, `docs/ddd/16_domain_policies.md §P11`,
  `docs/ddd/06_value_objects.md §1` antes de proponer ningún Domain Service/VO nuevo — `CostoUnitario`
  se recomendó como instancia de `Money` (ya real), no como VO paralelo, evitando una duplicación
  antes de que ocurriera (`ADR-INV-004 §12.3`).
- **Consistencia de Base de Datos**: las tres tablas reales de costeo (`fifo_cost_layers`,
  `lifo_cost_layers`, `average_cost_history`) se leyeron completas antes de proponer cualquier tabla
  nueva — ninguna migración propuesta modifica su forma, salvo el `CHECK` de integridad (§13.3 del
  ADR) y la columna de trazabilidad recomendada para LIFO.
- **Consistencia con `ADR-DB-001`**: `cost_adjustments` sigue exactamente el mismo criterio de
  partición `RANGE` mensual + `BRIN` ya establecido para tablas append-only — sin inventar un patrón
  de partición nuevo.
- **Sin contradicción con ningún ADR existente**: verificado contra los cinco ADRs de la serie
  `ADR-INV-*`/`ADR-DB-001`/`ADR-INF-001` antes de escribir — ninguna decisión de `ADR-INV-004`
  reabre una decisión ya aceptada.

# Enterprise Quality Report

| Criterio                                                      | Cumplido                                                                                                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escalable a millones de transacciones                         | ✅ Reutiliza particionamiento ya production-proven (`ADR-DB-001`)                                                                                                       |
| Multi-empresa/almacén                                         | ✅ Ya real en las tres tablas de costeo existentes                                                                                                                      |
| Multi-moneda                                                  | 🔴 Diseñado, no implementado — brecha declarada explícitamente, no fabricada como resuelta                                                                              |
| Recálculo histórico                                           | ✅ Diseñado como `background_job`, nunca síncrono                                                                                                                       |
| Auditabilidad completa                                        | ✅ Heredada automáticamente (auditoría universal)                                                                                                                       |
| Sin invención de reglas de negocio sin documentar el supuesto | ✅ Cada regla nueva (Ajuste vs. Corrección, política de inventario negativo con 3 opciones configurables) documenta explícitamente su supuesto y alternativa descartada |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-004]] creada, enlazada a los 5 ADRs relacionados reales, a [[Cost Engine]]
  (nota existente que este ADR formaliza) y a dos patrones ya generalizados en Level 3
  ([[Append-Only Ledger Pattern]], [[Engineering Heuristics]]).
- [[Engineering Heuristics]] extendida con la heurística #6 (Ajuste vs. Corrección, generalizada más
  allá de costeo — aplica a cualquier corrección de dominio con ventana temporal).
- `Home.md` y `ADR Index.md` actualizados de forma aditiva (§Knowledge Graph Changes abajo).
- [[Cost Engine]] (nota existente, propiedad de la sesión de Inventario) **no se editó
  directamente** — su cita a "`[[ADR-INV-001]] §7`" para `costingMethod` no corresponde a la
  estructura real de `ADR-INV-001` (esa sección es "Clasificación de Producto", no costeo) — se
  señala aquí como observación para quien mantenga esa nota, mismo límite de "complementar, no
  sobrescribir" ya aplicado toda la sesión.

# New Reusable Patterns Discovered

Ninguno nuevo a nivel de patrón arquitectónico — `ADR-INV-004 §4` (interfaz `ICostSource` sobre tres
tablas de forma distinta) es una aplicación del mismo principio de puerto/adaptador ya real
([[Architecture Review — ADR-DB-001 and ADR-INV-001]]), no un patrón nuevo que amerite nota propia.

# New Engineering Knowledge Extracted

Heurística #6 de [[Engineering Heuristics]] (arriba) — la única pieza de conocimiento genuinamente
nueva y generalizable de este ciclo.

# New Issues Detected

Ambos ya registrados en `ADR-INV-004 §21` (documento real) y en la nota puente §Risks — se listan
aquí también por ser el punto de consolidación de "issues nuevos" del entregable pedido, sin aplicar
directamente al [[Issue Register]] de la sesión de Inventario (mismo límite de no editar ese archivo
sin coordinación):

1. **Severidad Alta** — `fifo_cost_layers`/`lifo_cost_layers` sin `CHECK (remaining_quantity <= original_quantity)`.
2. **Severidad Media** — `lifo_cost_layers` sin `source_receipt_line_id` (pierde trazabilidad frente a su equivalente FIFO).

# Recommended Next ADR

No un ADR nuevo de arquitectura — la recomendación real, consistente con [[GEMM — Enterprise Maturity Model — 2026-07-28]] §14
(que ya identificó `Compras` como el dominio con mayor justificación de evidencia para construirse a
continuación): la siguiente pieza de mayor valor no es diseñar más arquitectura de costeo, es
**implementar** `ADR-INV-004` sobre el Motor de Movimientos ya diseñado (`ADR-INV-003`) — ambos
documentos ya están completos, ninguno tiene código todavía. Si se prefiere seguir en fase de
diseño, el candidato siguiente más justificado por evidencia es un ADR de **Landed Cost multi-moneda
con tipo de cambio** (`ADR-INV-004 §9.3-9.4` ya lo deja especificado a nivel conceptual, sin el
detalle de integración con un proveedor real de tasas de cambio).

# Related ADRs

[[ADR-INV-004]] · [[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-DB-001]]

# References

[ADR-INV-004 (documento real)](../../adr/ADR-INV-004-motor-de-costeo-de-inventario.md) · [[Cost Engine]] ·
[[GEMM — Enterprise Maturity Model — 2026-07-28]]
