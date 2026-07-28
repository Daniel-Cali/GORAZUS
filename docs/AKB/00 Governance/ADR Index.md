---
id: governance-adr-index
title: ADR Index
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: adr-index
created: 2026-07-27
updated: 2026-07-27
tags: [governance, adr, index]
related:
  - '[[Architecture Principles]]'
  - '[[Decision Log]]'
  - '[[Issue Register]]'
---

# Purpose

Índice único de todos los ADRs de GORAZUS — la nota puente de cada uno vive en la categoría de la
nueva taxonomía a la que pertenece por tema, no todas juntas en un solo lugar.

# Domain Model

| ADR             | Título                                          | Estado    | Ubicación en el AKB     |
| --------------- | ----------------------------------------------- | --------- | ----------------------- |
| [[ADR-DB-001]]  | Estrategia de Particionamiento de Base de Datos | Aceptada  | `04 Database/`          |
| [[ADR-INV-000]] | Arquitectura del Dominio de Inventario          | Aceptada  | `02 Domains/Inventory/` |
| [[ADR-INV-001]] | Arquitectura del Catálogo de Productos          | Aceptada  | `02 Domains/Inventory/` |
| [[ADR-INV-002]] | Arquitectura de Gestión de Almacenes            | Aceptada  | `02 Domains/Inventory/` |
| [[ADR-INV-003]] | Motor de Movimientos de Inventario              | Propuesta | `02 Domains/Inventory/` |
| [[ADR-INF-001]] | Estrategia de Concurrencia de Inventario        | Propuesta | `01 Platform/`          |
| [[ADR-INV-004]] | Motor de Costeo de Inventario                   | Propuesta | `02 Domains/Inventory/` |
| [[ADR-INV-005]] | Motor de Disponibilidad de Inventario           | Propuesta | `02 Domains/Inventory/` |

# References

`docs/adr/` — documentos reales, fuente de verdad.
