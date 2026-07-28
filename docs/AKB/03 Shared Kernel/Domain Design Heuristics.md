---
id: shared-kernel-domain-design-heuristics
title: Domain Design Heuristics
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: ddd-patterns
created: 2026-07-28
updated: 2026-07-28
tags: [shared-kernel, ddd, pattern, heuristic]
related:
  - '[[Architecture Principles]]'
  - '[[ADR-INV-001]]'
  - '[[Product]]'
  - '[[Dynamic Attribute Engine]]'
---

# Purpose

Heurísticas de modelado de dominio extraídas de `ADR-INV-001`, generalizadas más allá del Catálogo
de Productos — reutilizables por cualquier ADR de dominio futuro.

# Design Decisions

**1. Modelo de dos capas: discriminador de motor vs. clasificación de negocio.** Cuando un dominio
necesita distinguir "tipos" de una entidad, separar explícitamente (a) el discriminador que gobierna
comportamiento **físico/de motor** real (pocos valores, `CHECK`-restringido, cambia reglas de
ejecución) de (b) una clasificación de **negocio** extensible (muchos valores posibles, sin `CHECK`
fijo, solo afecta reporte/reglas de presentación). Origen: `product_type` real (5 valores:
good/service/kit/combo/composite) vs. las 9 clasificaciones de negocio pedidas para Productos
(`ADR-INV-001 §3.1`) — mismo patrón que el "Tipo de Material" de SAP (`ROH`/`HALB`/`FERT`/`HAWA`/`DIEN`).
Aplicar este patrón evita dos errores simétricos: ampliar el `CHECK` de motor cada vez que aparece
una necesidad de reporte nueva (acopla motor a taxonomía de negocio cambiante), o dejar la
clasificación de negocio sin ninguna estructura (pierde consistencia y capacidad de reportar).

**2. Límite de dominio por la pregunta que responde, no por la forma del objeto.** Dos entidades con
la misma forma física pueden pertenecer a dominios distintos si responden preguntas de negocio
distintas. Origen: un Activo Fijo y un Producto Terminado pueden ser, físicamente, el mismo tipo de
bien (una máquina) — la pregunta "¿la empresa lo posee y deprecia internamente?" (dominio `assets`)
es distinta de "¿la empresa lo compra/vende/fabrica como parte de su operación comercial?" (dominio
`products`), y GORAZUS ya modela ambos dominios por separado (`ADR-INV-001 §3.7`). Al diseñar un
límite de Bounded Context nuevo, preguntar primero "¿qué pregunta de negocio responde esta entidad
aquí?" antes que "¿qué forma tiene?".

**3. Clasificación derivada de la posición en un grafo, no de una columna mantenida a mano.** Cuando
una clasificación puede calcularse de una relación ya existente, no agregar una columna nueva a
mantener manualmente (riesgo de desincronización). Origen: Materia Prima / Producto Terminado /
Semi-Terminado se derivan de la posición de un producto en el grafo de
`bill_of_materials`/`bom_components` (¿aparece solo como entrada? ¿solo como salida? ¿ambas?) —
`ADR-INV-001 §3.6` — sin ninguna columna `material_classification` que pudiera divergir del grafo
real.

# Related ADRs

[[ADR-INV-001]] §3.1, §3.6, §3.7 · Ver [[Dynamic Attribute Engine]] para la heurística de
extensibilidad sin migración (heurística hermana, documentada aparte por su propio peso).

# References

[ADR-INV-001 (documento real)](../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md)
