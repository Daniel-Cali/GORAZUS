---
id: shared-kernel-anti-pattern-asserted-unenforced-invariant
title: 'Asserted-but-Unenforced Invariant (Anti-Pattern)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: anti-pattern
created: 2026-07-28
updated: 2026-07-28
tags: [shared-kernel, anti-pattern, ddd, governance]
related:
  - '[[Product]]'
  - '[[Stock]]'
  - '[[Reservation]]'
  - '[[Business Rules Matrix — Inventory]]'
  - '[[Architecture Review — ADR-DB-001 and ADR-INV-001]]'
  - '[[Issue Register]]'
---

# Purpose

Anti-patrón detectado por recurrencia real (Second Brain Level 3, Step 6) — no es un caso aislado,
son **tres instancias independientes** encontradas en el AKB, cada una verificada contra código o
schema real, no contra otra documentación. Se documenta explícitamente como categoría propia porque
el riesgo no es "falta implementar X" (honesto, ya rotulado como tal en `[[Value Objects]]`/
`[[Domain Events]]`) — es que la documentación **afirma una garantía que el sistema no tiene**,
llevando a cualquier consumidor de esa documentación a confiar en una protección inexistente.

# Domain Model

| Instancia                                    | Documento que lo afirma                                   | Realidad verificada                                                                                                                                                                                                | Severidad |
| -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| **I4 / BR-08** — "Lote XOR Serie"            | `ddd/17_invariants.md`: "verificada en `ProductoFactory`" | `producto.entity.ts` real solo bloquea `tracksSerial`/`tracksLot` para `service` — nada impide ambos en `true` para un `good` (verificado línea por línea en [[Architecture Review — ADR-DB-001 and ADR-INV-001]]) | Alta      |
| **BR-01** — "Disponible nunca negativo"      | Implícita en el diseño de [[Stock]]                       | `inventory.stock` es `NUMERIC` sin `CHECK` cruzado — el invariante depende enteramente de la capa de aplicación, hoy parcialmente sin construir ([[Business Rules Matrix — Inventory]])                            | Alta      |
| **BR-06** — "Reserva antes de salida física" | Domain Policy P12 (`ddd/16 §5`)                           | Sin FK real entre `stock_reservations`/`goods_issues` — sin enforcement de base de datos cuando esa tabla se construya                                                                                             | Media     |

# Business Rules

**Por qué es dañino, específicamente**: un desarrollador que lee `ddd/17_invariants.md` y ve "I4 —
verificada en `ProductoFactory`" tiene una base razonable para **no** volver a validarlo en el nuevo
código que escriba — la documentación le dice que ya está resuelto. El costo no es el gap en sí (eso
es normal en un sistema con diseño-antes-que-código), es la **falsa sensación de seguridad** que
retrasa el descubrimiento del gap hasta que ya hay datos reales inconsistentes en producción.

**Distinción con el patrón sano ya presente en el AKB**: [[Value Objects]]/[[Domain Events]] están
"diseñados, cero código" y **lo dicen explícitamente** — ningún consumidor de esos documentos asume
una protección que no existe. La línea que separa el patrón sano del anti-patrón no es "¿está
implementado?" — es "¿el documento es honesto sobre si está implementado?".

# Design Decisions

**Heurística de prevención**: todo invariante de dominio documentado debe citar **la línea de código
real** que lo aplica (archivo + método), no solo el nombre de una clase/patrón esperado
(`ProductoFactory` no existe con ese nombre — la clase real es `Producto`). Si no existe código que
lo aplique todavía, el documento debe decir explícitamente "diseñado, sin aplicar" — nunca
"verificado en X" sin verificar X.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] (las tres instancias, vía
[[Business Rules Matrix — Inventory]])

# References

[[Architecture Review — ADR-DB-001 and ADR-INV-001]] · [[Issue Register]] (`ISSUE-01`) ·
`docs/ddd/17_invariants.md` · `modules/productos/backend/entities/producto.entity.ts`
