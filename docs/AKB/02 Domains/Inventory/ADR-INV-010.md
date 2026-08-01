---
id: adr-inv-010-bridge
title: 'ADR-INV-010 — Motor de Analítica de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: analytics-engine
created: 2026-07-28
updated: 2026-07-28
tags: [adr, analytics, kpi, dashboard, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-004]]'
  - '[[ADR-INV-005]]'
  - '[[ADR-INV-006]]'
  - '[[ADR-INV-007]]'
  - '[[ADR-INV-008]]'
  - '[[ADR-INV-009]]'
  - '[[Issue Register]]'
  - '[[Decision Log]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-010 — Motor de Analítica de Inventario](../../../adr/ADR-INV-010-motor-de-analitica-de-inventario.md).
**Estado: Propuesta.** Séptimo ADR de la serie — como `ADR-INV-008` (Trazabilidad), no introduce
lógica de negocio nueva: es la capa de consolidación sobre KPIs que ya tienen fórmula definida en
cinco ADRs anteriores.

# Background

**Hallazgo central**: antes de diseñar un solo KPI nuevo, se auditaron las cinco tablas de KPI ya
escritas en la serie — se encontró que `ADR-INV-006 §10` y `ADR-INV-009 §10` definen, **con el mismo
nombre exacto** ("Inventory Health Score"), **dos fórmulas distintas**. Es exactamente el defecto
que este ADR existe para prevenir, y ocurrió sin detectarse hasta esta auditoría cruzada.

# Domain Model

Resuelto con una jerarquía de composición, no eligiendo un ganador: `Inventory Health Score` pasa a
ser, exclusivamente, el compuesto de nivel superior definido en este ADR, agregando las dos fórmulas
en conflicto como sub-scores desambiguados (`Replenishment Health Score`, `Accuracy Health Score`).
`ConsolidarKPIs` es el único Domain Service que resuelve los 21 KPIs pedidos, delegando cada cálculo
real a su ADR de origen — tercera aplicación en la serie del principio "un motor, N puntos de
entrada" (`ADR-INV-008` genealogía, `ADR-INV-009` tipos de conteo).

# Architecture

**El propio ADR casi repite su hallazgo central dentro de sí mismo**: al diseñar la tabla de
snapshot de KPI, se verificó que `bi.kpi_snapshots` **ya existe** real (`ADR-DB-001 §7`) antes de
proponerla como nueva — se corrigió en el momento de escribir, documentado explícitamente como
segunda mitigación de la misma disciplina que motivó todo el ADR.

# Risks

Corrección de nomenclatura recomendada para `ADR-INV-006`/`ADR-INV-009`, **no aplicada
retroactivamente** — ningún ADR ya aceptado se edita sin autorización explícita, mismo límite
respetado en toda la serie. Documentada en [[Issue Register]]/[[Decision Log]] para que cualquier
consumidor futuro tenga la corrección disponible.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]] · [[ADR-INV-008]] · [[ADR-INV-009]]

# References

[ADR-INV-010 (documento real, `docs/adr/`)](../../../adr/ADR-INV-010-motor-de-analitica-de-inventario.md)
