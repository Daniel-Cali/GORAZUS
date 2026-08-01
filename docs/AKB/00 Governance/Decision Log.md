---
id: governance-decision-log
title: Decision Log
version: 1.3.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: decision-log
created: 2026-07-27
updated: 2026-07-28
tags: [governance, decision-log]
related:
  - '[[ADR Index]]'
  - '[[Issue Register]]'
---

# Purpose

Registro cronológico de decisiones mayores — complementa el [[ADR Index]] (qué existe) con el orden
real en que se tomó cada decisión y por qué.

# Domain Model

| Fecha      | Decisión                                                                                                                                                                                                                                                                                      | ADR                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 2026-07-27 | Catálogo de Productos: modelo de dos capas (mecánica física vs. clasificación de negocio)                                                                                                                                                                                                     | [[ADR-INV-001]]                         |
| 2026-07-27 | Gestión de Almacenes: jerarquía Empresa→Sucursal→Almacén→Zona→Ubicación, sin tablas separadas por nivel                                                                                                                                                                                       | [[ADR-INV-002]]                         |
| 2026-07-27 | Trazabilidad real es de costo (FIFO/promedio), no de unidad física — brecha señalada, no resuelta                                                                                                                                                                                             | [[ADR-INV-002]] §10                     |
| 2026-07-27 | Bounded Context de Inventario formalizado — Aggregates/Entities/VOs/Domain Services reconciliados con `docs/ddd/`                                                                                                                                                                             | [[ADR-INV-000]]                         |
| 2026-07-27 | Eventos de dominio unificados a nomenclatura española, corrigiendo diseño inicial en inglés                                                                                                                                                                                                   | [[ADR-INV-000]] §9, [[ADR-INV-002]] §13 |
| 2026-07-27 | `SolicitudDeMovimiento` como Aggregate Root nuevo — ciclo de vida de 9 estados, sin tocar `MovimientoStock` inmutable                                                                                                                                                                         | [[ADR-INV-003]]                         |
| 2026-07-27 | Orden determinístico de bloqueo (Company→Branch→Warehouse→Location→Product→Lot→Serial→Stock) — cierra riesgo de deadlock                                                                                                                                                                      | [[ADR-INF-001]] §4                      |
| 2026-07-27 | AKB migrado de taxonomía plana (10 categorías) a jerárquica (00 Governance–05 Integrations)                                                                                                                                                                                                   | Esta migración                          |
| 2026-07-28 | Motor de Costeo: LIFO diseñado desde cero (tabla real sin ningún documento previo) — señalado el límite de cumplimiento NIIF/IFRS (prohibido para reporte financiero en RD) como restricción de aplicación, no de motor                                                                       | [[ADR-INV-004]]                         |
| 2026-07-28 | Motor de Disponibilidad: `DisponibilidadDeInventario` como Value Object calculado, nunca Aggregate persistido — evita mantener un valor derivado de 7 tablas sincronizado desde múltiples puntos de escritura                                                                                 | [[ADR-INV-005]] §4.1                    |
| 2026-07-28 | Motor de Reabastecimiento: EOQ/Punto de Reorden/ABC-XYZ diseñados como fórmulas de investigación de operaciones clásicas, nunca IA — corrige un hallazgo previo de la misma sesión (`bi.forecasts` sí es real, [[Innovation Report — 2026-07-28]] lo había marcado sin evidencia)             | [[ADR-INV-006]] §2                      |
| 2026-07-28 | Motor de Optimización de Almacenes: se preserva la jerarquía de ubicación auto-referenciada real (sin tablas separadas por nivel) — decisión de diseño ya tomada, confirmada leyendo el código real antes de diseñar                                                                          | [[ADR-INV-007]] §3.4                    |
| 2026-07-28 | Motor de Trazabilidad: un solo Domain Service parametrizado (`RecorrerGenealogia`) resuelve los 25 puntos de entrada pedidos, nunca 25 motores separados                                                                                                                                      | [[ADR-INV-008]] §1                      |
| 2026-07-28 | Digital Twin: `remaining_quantity` de las capas de costo es mutable — se agrega un ledger de consumo paralelo (`fifo_cost_layer_consumptions`) para reconstrucción histórica, sin modificar la columna operativa existente                                                                    | [[ADR-INV-008]] §15.3                   |
| 2026-07-28 | Motor de Conteo Cíclico: `EvaluarTolerancia` se inserta como paso obligatorio antes de `completar()` real — cierra el hallazgo de que hoy cualquier discrepancia de conteo genera ajuste automático sin tolerancia ni aprobación, con compatibilidad hacia atrás explícita si no se configura | [[ADR-INV-009]] §5.1                    |
| 2026-07-28 | Motor de Analítica: `Inventory Health Score` colisionaba entre `ADR-INV-006`/`ADR-INV-009` con fórmulas distintas — resuelto con jerarquía de composición (no eligiendo un ganador), reutiliza `bi.kpi_snapshots` real en vez de crear una tabla paralela                                     | [[ADR-INV-010]] §2.1                    |

# Related ADRs

[[ADR Index]]
