---
id: adr-inv-000-bridge
title: 'ADR-INV-000 — Arquitectura del Dominio de Inventario'
version: 1.0.0
status: accepted
owner: Chief Software Architect
domain: inventory
subdomain: bounded-context
created: 2026-07-27
updated: 2026-07-27
tags: [adr, inventory, ddd, bounded-context, bridge]
related:
  - '[[ADR-DB-001]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-002]]'
  - '[[Product]]'
  - '[[Inventory]]'
  - '[[Warehouse]]'
  - '[[Stock]]'
  - '[[Movement Engine]]'
  - '[[Reservation]]'
  - '[[Cost Engine]]'
---

# Purpose

Nota puente hacia el documento real: [ADR-INV-000 — Arquitectura del Dominio de Inventario](../../../adr/ADR-INV-000-arquitectura-del-dominio-de-inventario.md).
Documento **fundacional** de la familia `ADR-INV-*` — Bounded Context, Ubiquitous Language,
Aggregates, Entities, Value Objects, Domain Services, Domain Events, Event Flow, Integración.

# Background

Numerado `000` deliberadamente: es el documento que [[ADR-INV-001]] y [[ADR-INV-002]] presuponen,
aunque se escribió después de ambos.

# Business Requirements

Millones de productos, miles de millones de transacciones, multi-empresa/sucursal/almacén — todos
verificados como reales o parciales, con matices honestos (multi-moneda y multi-idioma con soporte
real parcial; alta disponibilidad y escalabilidad horizontal parciales por capa).

# Domain Model

Bounded Context de Inventario = subdominio `products` ([[Product]]) + subdominio `inventory`
([[Inventory]], [[Warehouse]], [[Stock]], [[Movement Engine]], [[Reservation]], [[Cost Engine]]).

Aggregate Roots ya reales en código: `Almacen` ([[Warehouse]]), `Stock` ([[Stock]]),
`MovimientoStock` ([[Movement Engine]]), `Transferencia`, `ReservaStock` ([[Reservation]]),
`ConteoFisico`. Propuestos, sin código todavía: `Lote`, `NumeroSerie`, `ReglaReposicion`.

# Architecture

Bus de eventos real sobre RabbitMQ (`core/messaging`), exchange topic `gorazus.eventos` — cero
eventos de dominio publicados todavía en ningún módulo del sistema, confirmado por búsqueda
exhaustiva. Webhooks (`core.webhook_subscriptions`) y Background Jobs (`core.background_jobs`)
existen a nivel de schema, sin ningún worker o dispatcher real.

# Integration

CRM es el límite más limpio del dominio: solo referencia `Product`, nunca `Inventory`. Purchasing y
Sales se integran vía FKs polimórficas (`source_module`/`source_entity_id`), sin código de
aplicación todavía en ninguno de los dos sentidos.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INV-001]] · [[ADR-INV-002]]

# References

[ADR-INV-000 (documento real, `docs/adr/`)](../../../adr/ADR-INV-000-arquitectura-del-dominio-de-inventario.md)
