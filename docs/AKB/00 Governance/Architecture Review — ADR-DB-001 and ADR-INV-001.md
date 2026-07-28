---
id: governance-review-adr-db-001-adr-inv-001
title: 'Enterprise Architecture Review — ADR-DB-001 & ADR-INV-001'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: architecture-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, architecture-review, adr, database, products]
related:
  - '[[ADR-DB-001]]'
  - '[[ADR-INV-001]]'
  - '[[ADR-INV-000]]'
  - '[[Issue Register]]'
  - '[[Architecture Principles]]'
  - '[[Security]]'
  - '[[API Standards]]'
  - '[[Database Maintenance]]'
---

# Purpose

Revisión de Arquitectura Empresarial (Second Brain Protocol, Level 2 — ANALYZE) sobre los dos ADRs
que produje esta sesión: `ADR-DB-001` (Estrategia de Particionamiento) y `ADR-INV-001` (Catálogo de
Productos). Ninguno se declara aceptado en el AKB sin pasar por esta revisión completa.

# Background — Mapa de Dependencias (Step 1)

Documentos leídos para construir el contexto de esta revisión, más allá de los dos ADRs propios:
`docs/ddd/17_invariants.md`, `docs/ddd/04_aggregates.md` (vía [[ADR-INV-000]]), `docs/database/06-estrategia-seguridad.md`,
`docs/architecture/07-convenciones-y-estandares.md` (vía [[API Standards]]), código real de
`modules/productos/backend/` (entidad, repositorios, módulo), `docs/database/sql/29_partitioning.sql`,
`docs/database/POSTGRESQL_TUNING.md`/`INDEX_REPORT.md`, y las notas ya existentes del AKB
([[Issue Register]], [[Security]], [[API Standards]], [[Architecture Principles]]). Ningún hallazgo de
esta revisión se basa en supuestos sin verificar contra el schema Prisma real o el código real.

# Architecture Findings

## Consistencia (Step 2)

Sin duplicación encontrada. `ADR-DB-001` y `ADR-INV-001` no redefinen ningún concepto que el otro ya
posea — `ADR-INV-001` referencia el catálogo de tablas particionadas de `ADR-DB-001 §7` en vez de
repetirlo (`sales.invoice_lines`, `purchase_invoice_lines` como ejemplo del patrón
encabezado-particionado/línea-no-particionada, citado, no reescrito). Única fuente de verdad
respetada en ambos sentidos.

## DDD (Step 3)

- ✅ **Bounded Context correcto**: `Product` como Aggregate Root del subdominio de identidad dentro
  del Bounded Context de Inventario (`ADR-INV-000 §3.1`), consistente con [[Product]].
- ✅ **Límite de dominio bien trazado**: Activo Fijo excluido explícitamente de `products` hacia
  `assets` (`ADR-INV-001 §3.7`) — validado como heurística general en [[Domain Design Heuristics]].
- 🔴 **Violación de invariante confirmada con evidencia nueva de código — refuerza `ISSUE-01`**:
  `ddd/17_invariants.md` declara la invariante **I4** ("Un Producto se rastrea por Lote **o** por
  Serie, nunca ambos simultáneamente") como "verificada en `ProductoFactory`". Verifiqué
  directamente `modules/productos/backend/entities/producto.entity.ts` (código real, no
  documentación) — el único guard del constructor es que `productType === 'service'` no puede tener
  `tracksSerial`/`tracksLot` en `true`. **No existe ningún guard que impida `tracksSerial = true` Y
  `tracksLot = true` simultáneamente en un producto `good`.** La invariante I4, tal como está
  redactada, es falsa sobre el código real — no "sin implementar" en abstracto, sino documentada con
  un mecanismo de aplicación (`ProductoFactory`) que no coincide con la clase real que sí existe
  (`Producto`, sin ese nombre ni ese guard). `ADR-INV-001` no introdujo este defecto, pero tampoco lo
  detectó al describir `tracksSerial`/`tracksLot` en §6 — se documenta aquí como hallazgo de esta
  revisión.

## Clean Architecture / Hexagonal (Steps 4-5)

✅ **Validado con código real, no solo con el documento de principios**: `Producto` (entidad) no
importa Nest ni Prisma — regla de dominio pura en el constructor. `ProductoRepository` es una clase
abstracta (puerto), `ProductoRepositoryPrisma` es el adaptador concreto, inyectado en
`productos.module.ts` vía `{ provide: ProductoRepository, useClass: ProductoRepositoryPrisma }` —
exactamente el patrón que [[Architecture Principles]] describe, confirmado en el módulo de
Productos específicamente, no solo citado en general.

## Base de Datos (Step 6)

Cubierto en profundidad por el propio `ADR-DB-001` (§7-§17) — sin hallazgo nuevo de normalización,
constraints o multiempresa. Único hallazgo real, ya registrado en [[Database Maintenance]]: seis
tablas con PK compuesta lista pero sin `PARTITION BY RANGE` ni registro en `pg_partman`. No se repite
aquí — se referencia.

## API (Step 7)

**No aplicable a esta revisión, por diseño explícito**: `ADR-INV-001` se escribió bajo restricción
explícita del usuario ("Do not write code", "Architecture only") — no define contratos REST. Los
estándares reales de API de GORAZUS ya están consolidados en [[API Standards]]
(`/api/v1`, formato `{data, meta}`, error RFC 7807, paginación offset+limit) y se heredan
automáticamente cuando exista una Parte de implementación de Productos con endpoints — no hay
inconsistencia que señalar porque no hay superficie de API propia todavía que revisar.

## Seguridad (Step 8)

🔴 **Gap real encontrado — silencio documental, no gap de código**: RLS ya cubre
`products.products` y las 35 tablas del schema (`06-estrategia-seguridad.md §1`: "494 tablas sin
excepción"), pero `ADR-INV-001` **nunca menciona RLS ni la postura multiempresa del dominio** — una
omisión real en un documento que sí dedica §6 a "Visibilidad" sin conectarla con el mecanismo de
aislamiento que ya la sostiene a nivel de motor. Además, la brecha ya conocida
[[Security]]/`ISSUE-02` (RLS cubre `tenant`/`company`, **no** cubre `branch`/`warehouse`) es
directamente relevante para la "Visibilidad por canal" que `ADR-INV-001 §6` deja como brecha sin
resolver — ambos documentos describen, sin saberlo, la misma brecha de fondo desde ángulos distintos
(uno a nivel de motor, el otro a nivel de dominio de Productos) y nunca se cruzan.

## Rendimiento (Step 9)

Cubierto por `ADR-DB-001` a nivel de plataforma. Sin análisis específico de rendimiento para las
tablas EAV de Productos (`product_attribute_values`) a escala — no crítico hoy (alcance real: 5 de 35
tablas con código, sin datos de producción), pero candidato a revisar cuando el Motor de Atributos
Dinámicos (`ADR-INV-001 §8`) se implemente: una búsqueda "todos los productos con Voltaje=220V" sobre
un modelo EAV requiere JOIN por cada atributo filtrado — patrón conocido de tener costo de consulta
mayor que columnas nativas, mitigable con índices compuestos `(attribute_id, code)` ya reales en
`product_attribute_values`, pero sin verificar a volumen real todavía.

# Strengths

- Ambos ADRs distinguen consistentemente **estado real verificado** de **recomendación** — ninguna
  afirmación se presenta como implementada sin evidencia directa contra schema/código.
- El patrón de dos capas (`ADR-INV-001 §3.1`) y el criterio de particionamiento selectivo
  (`ADR-DB-001 §2`) comparten la misma disciplina de fondo: no aplicar una solución uniforme donde
  el patrón de uso real no lo justifica — coherencia de principios entre ambos documentos sin haberlo
  coordinado explícitamente entre secciones.
- El hallazgo de la brecha de `PARTITION BY RANGE` (`ADR-DB-001 §14.1`) y ahora el de la invariante
  I4 (esta revisión) demuestran que el proceso de verificación contra código real, no solo contra
  documentación, produce hallazgos genuinos — validación del propio protocolo Second Brain.

# Weaknesses

- `ADR-INV-001` no cruza su propia sección de Seguridad/Visibilidad con la postura RLS real ya
  documentada en otro lugar del AKB — un lector que solo lea `ADR-INV-001` no sabe que el dominio ya
  está protegido por RLS a nivel de tenant/empresa.
- Ninguno de los dos ADRs incluye una sección de Testing Strategy explícita (el protocolo Level 1
  la lista como opcional "donde aplique") — dado que son documentos de arquitectura sin código, es
  una ausencia consistente con su alcance, no un defecto, pero se señala para la Parte de
  implementación futura.

# Risks

| Riesgo                                           | Severidad | Detalle                                                                                                                                                                                                                                                                           | Mitigación                                                                                                                    |
| ------------------------------------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Invariante I4 no aplicada en código real         | **Alta**  | Un producto puede quedar con `tracksSerial=true` y `tracksLot=true` simultáneamente sin que el motor lo impida — dato de configuración contradictorio que otros dominios (`inventory.inventory_lots`/`inventory_serials`) consumirían sin saber cuál de los dos es la fuente real | Agregar el guard real al constructor de `Producto`, mismo patrón ya usado para `service` (una línea de código, sin migración) |
| Silencio de `ADR-INV-001` sobre RLS/multiempresa | Media     | Riesgo de que una implementación futura de Productos asuma que debe construir su propio aislamiento, duplicando lo que RLS ya resuelve a nivel de motor                                                                                                                           | Referenciar [[Security]] explícitamente si `ADR-INV-001` se revisa de nuevo                                                   |
| Rendimiento EAV a escala sin verificar           | Baja      | Sin datos de producción reales, no hay evidencia de que sea un problema — riesgo especulativo, no confirmado                                                                                                                                                                      | Medir cuando exista volumen real, no rediseñar preventivamente (mismo criterio de `ADR-DB-001 §2.1`)                          |

# Technical Debt

- Invariante I4 (ya registrada como `ISSUE-01`, reforzada aquí con evidencia de código directa en
  vez de solo señalada como pendiente).
- Seis tablas sin `PARTITION BY RANGE`/registro `pg_partman` (ya registrada en
  [[Database Maintenance]], sin ticket formal en el Issue Register de Inventario porque es un
  hallazgo de alcance Database, no de Inventario).

# Reusable Knowledge (Step 11)

Ya extraído y documentado esta sesión en [[Partition Manager]], [[Data Retention]],
[[Database Maintenance]], [[Generic Polymorphic Subsystems]], [[Domain Design Heuristics]],
[[Dynamic Attribute Engine]] — sin conocimiento reutilizable adicional identificado en esta pasada
de revisión que no estuviera ya capturado.

# Knowledge Base Improvements (Step 15)

- Esta nota nueva (`00 Governance/Architecture Review — ADR-DB-001 and ADR-INV-001`) enlazada desde
  [[ADR-DB-001]] y [[ADR-INV-001]] (bridge notes) — pendiente de que esas notas agreguen el enlace de
  vuelta si su dueño (esta sesión) las vuelve a tocar; no se editaron en esta pasada para minimizar
  huella sobre notas que la sesión concurrente de Inventario también toca.
- Recomendado (no aplicado, para no editar el Issue Register de otra sesión): agregar una fila nueva
  al [[Issue Register]] para la evidencia de código de I4, y agregar `ADR-INV-001` a la lista de ADRs
  relacionados de `ISSUE-02`.

# Recommended ADRs

Ninguno nuevo — los dos ADRs revisados ya cubren su alcance declarado. La corrección de I4 y del gap
de particionamiento son correcciones de implementación, no decisiones de arquitectura nuevas.

# Issue Register Updates (Step 14, propuesto — no aplicado directamente)

| ID propuesto                       | Título                                                                                                                             | Severidad                       | ADR relacionado                  | Evidencia                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ISSUE-01` (reforzar, no duplicar) | Invariante I4 confirmada ausente en `producto.entity.ts` (constructor real, no `ProductoFactory` como dice `ddd/17_invariants.md`) | Alta                            | [[ADR-INV-000]], [[ADR-INV-001]] | Código leído línea por línea en esta revisión, `modules/productos/backend/entities/producto.entity.ts:21-46` |
| Nuevo — sugerido                   | `ADR-INV-001` no documenta la postura RLS/multiempresa del dominio de Productos                                                    | Baja (documental, no de código) | [[ADR-INV-001]], [[Security]]    | Esta revisión, §Seguridad                                                                                    |

# Final Recommendation

**Decisión: Accepted with Observations.**

Ambos ADRs (`ADR-DB-001`, `ADR-INV-001`) se aceptan como parte permanente del AKB — la arquitectura
que describen es sólida, internamente consistente, y ya verificada contra el schema/código real en
la magnitud que su alcance declarado exige. Las observaciones de esta revisión (invariante I4,
silencio sobre RLS) son correcciones de seguimiento, no defectos que invaliden la decisión de
arquitectura tomada en ninguno de los dos documentos — ambos ya se auto-señalan con el mismo nivel de
honestidad que esta revisión aplicó para encontrarlas.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INV-001]] · [[ADR-INV-000]]

# References

[ADR-DB-001](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md) ·
[ADR-INV-001](../../adr/ADR-INV-001-arquitectura-del-catalogo-de-productos.md) ·
`docs/ddd/17_invariants.md` · `modules/productos/backend/entities/producto.entity.ts` ·
`docs/database/06-estrategia-seguridad.md`
