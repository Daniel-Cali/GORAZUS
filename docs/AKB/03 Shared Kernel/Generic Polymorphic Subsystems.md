---
id: shared-kernel-generic-polymorphic-subsystems
title: Generic Polymorphic Subsystems
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: reuse-pattern
created: 2026-07-28
updated: 2026-07-28
tags: [shared-kernel, pattern, reuse, core]
related:
  - '[[Shared Services]]'
  - '[[ADR-INV-001]]'
  - '[[Dynamic Attribute Engine]]'
---

# Purpose

Patrón de reutilización descubierto al diseñar `ADR-INV-001 §6` (Datos Maestros del Catálogo de
Productos): antes de crear una tabla nueva de propósito único para una necesidad de dominio, verificar
si un subsistema polimórfico de `core` ya la resuelve. Generalizable a cualquier módulo de negocio
nuevo, no exclusivo de Productos.

# Architecture

Dos mecanismos reales de `core` ya diseñados para ser consumidos por **cualquier** entidad del
sistema, vía referencia polimórfica (`entity_type`/`entity_id` o `source_module`/`source_entity_id`),
sin FK declarativa fija hacia un módulo específico:

- **`core.tags` + `core.entity_tags`** — etiquetado transversal (`name`, `color_hex`,
  `entity_type`/`entity_id`). Resuelve "Tags" para Productos (`ADR-INV-001 §6`) sin ninguna tabla
  `product_tags` — el mismo mecanismo sirve para etiquetar clientes, oportunidades de CRM, o
  cualquier entidad futura.
- **`core.documents` + `core.document_types`** (`file_id → core.files`, `source_module`,
  `source_entity_id`, `title`) — resuelve Adjuntos, Certificados y Documentos de Garantía de
  Productos (`ADR-INV-001 §6`) con una sola tabla genérica ya usada por `customers`
  (`16-modulo-customers.md §6`) antes que por Productos.

# Design Decisions

**Heurística de diseño reutilizable**: antes de proponer una tabla nueva de una sola columna útil
(`product_certificates`, `product_attachments`, `product_tags`...), verificar si `core` ya tiene un
subsistema polimórfico equivalente. Crear la tabla dedicada solo si la necesidad tiene una forma de
dato genuinamente distinta que el mecanismo genérico no pueda representar — no por conveniencia de
nombrado.

# Related ADRs

[[ADR-INV-001]] §6, §9

# References

[ADR-INV-001 §6/§9 (documento real)](../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md)
