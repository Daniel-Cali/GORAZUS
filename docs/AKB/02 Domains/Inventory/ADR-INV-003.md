---
id: adr-inv-003-bridge
title: 'ADR-INV-003 — Motor de Movimientos de Inventario'
version: 1.0.0
status: proposed
owner: Chief Software Architect
domain: inventory
subdomain: movement-engine
created: 2026-07-27
updated: 2026-07-27
tags: [adr, movement-engine, event-driven, bridge]
related:
  - '[[ADR-INV-000]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[ADR-DB-001]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Cost Engine]]'
  - '[[Business Rules Matrix — Inventory]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-003 — Motor de Movimientos de Inventario](../../../adr/ADR-INV-003-motor-de-movimientos-de-inventario.md).
**Estado: Propuesta** (no Aceptada) — a diferencia de `ADR-INV-000/001/002`, diseña arquitectura
nueva para cerrar **ISSUE-04** del Issue Register (Domain Policy P12 sin conectar con la brecha de
`goods_issues`).

# Background

Motivado directamente por la recomendación de "próximo documento" del cierre de gobernanza de
[[ADR-INV-000]] (Sección 8) — no una revisión de lo ya aceptado, sino la extensión de mayor valor
sobre `goods_receipts`/`goods_issues`, todavía sin código de aplicación.

# Domain Model

Introduce `SolicitudDeMovimiento` (Movement Request) como Aggregate Root **nuevo**, separado de
[[Movement Engine]] (que permanece inmutable/append-only sin cambios) — modela el ciclo de vida
`Requested → Validated → Authorized → Reserved → Executed → Posted → Audited → Reported → Archived`
que hoy no existe como concepto de dominio.

# Business Rules

Hilo conductor: Domain Policy **P12** ("reserva antes que salida física",
`docs/ddd/16_domain_policies.md §5`) — ver [[Business Rules Matrix — Inventory]] BR-06/ISSUE-04.

# Architecture

17 eventos de dominio solicitados, reconciliados con la convención española real — 5 genuinamente
nuevos (ciclo de vida de la solicitud), el resto ya reconciliados en [[ADR-INV-000]] §9.2. Un
evento explícitamente **no diseñado** por ser redundante con el trigger de auditoría universal ya
real (`AuditRecorded`), y uno explícitamente **no diseñado** por falta de infraestructura real
(`SearchIndexUpdated`).

# Risks

Hereda 3 brechas sin resolver, documentadas explícitamente como tales: sin RLS de sucursal/almacén
(ISSUE-02), sin `lot_id`/`serial_id` en el motor (`ADR-INV-002 §10.1`), sin clave de idempotencia en
las solicitudes (brecha nueva señalada en este ADR).

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-DB-001]]

# References

[ADR-INV-003 (documento real, `docs/adr/`)](../../../adr/ADR-INV-003-motor-de-movimientos-de-inventario.md)
