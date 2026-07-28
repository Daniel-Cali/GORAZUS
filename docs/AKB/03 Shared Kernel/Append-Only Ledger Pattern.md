---
id: shared-kernel-append-only-ledger-pattern
title: Append-Only Ledger + Derived Current State
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: architecture-pattern
created: 2026-07-28
updated: 2026-07-28
tags: [shared-kernel, pattern, ddd, database, generalization]
related:
  - '[[Movement Engine]]'
  - '[[Stock]]'
  - '[[ADR-DB-001]]'
  - '[[Partitioning]]'
  - '[[Partition Manager]]'
---

# Purpose

Patrón arquitectónico detectado por generalización (Second Brain Level 3, Step 4-5) al aparecer de
forma independiente en **dos capas distintas** del sistema — no fue diseñado una sola vez y
reutilizado a propósito, sino descubierto porque la misma idea resuelve el mismo problema en capas
que no se coordinaron entre sí. Eso es evidencia más fuerte de que es un patrón real, no una
coincidencia de nombrado.

# Domain Model

**Instancia 1 — nivel de base de datos** (`ADR-DB-001 §4.3`, `Partitioning`): el patrón
"encabezado particionado / línea no particionada" — `sales.invoices` (particionado por
`issued_at`, append-only en la práctica) frente a `invoice_lines` (mutable durante el ciclo de vida
del borrador). El encabezado **es** el ledger; el saldo agregado (`total_amount`) se recalcula desde
las líneas, no se mantiene como columna independiente sin relación con su origen.

**Instancia 2 — nivel de Aggregate DDD** (`Movement Engine`/`Stock`, `ADR-INV-002`):
[[Movement Engine]] es el ledger real — append-only, cada fila inmutable, `running_balance` derivado
por suma acumulada, nunca corregido con `UPDATE`. [[Stock]] es el estado actual — mutable,
`quantityOnHand` es el resultado acumulado de todos los movimientos, pero se mantiene como
**denormalización explícita** (no se recalcula con `SUM` en cada lectura, por rendimiento) —
`quantityReserved` sigue el mismo criterio, mantenido por [[Reservation]] en cada creación/liberación.

**Instancia 3 — candidata, no verificada todavía**: `accounting.journal_entries` (ledger, ya
particionado anual, `ADR-DB-001 §7`) frente a un eventual saldo de cuenta contable — no confirmado
si existe una tabla de saldo denormalizado equivalente a [[Stock]] para cuentas contables; queda
como pregunta abierta para una futura revisión del dominio de Contabilidad, no como hallazgo cerrado.

# Design Decisions

**Regla general del patrón**: cuando un dominio necesita tanto "qué pasó" (auditoría, kardex,
reportes históricos) como "cuánto hay ahora" (consulta operativa rápida), no se resuelve con una
sola tabla — se separan en un ledger inmutable append-only y un agregado de estado actual mutable,
con una relación explícita y documentada de mantenimiento (quién actualiza el estado actual y
cuándo). El ledger nunca se corrige con `UPDATE`/`DELETE`; las correcciones son **nuevas filas** que
compensan (mismo criterio que `DETACH`/archivado en `ADR-DB-001 §4.6`, nunca un `DELETE` retroactivo).

# Related ADRs

[[ADR-DB-001]] §4.3 · `ADR-INV-002` (vía [[Movement Engine]]/[[Stock]])

# References

[ADR-DB-001 §4.3](../../adr/ADR-DB-001-estrategia-de-particionamiento-de-base-de-datos.md)
