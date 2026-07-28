---
id: shared-kernel-engineering-heuristics
title: Engineering Heuristics
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: decision-heuristics
created: 2026-07-28
updated: 2026-07-28
tags: [shared-kernel, heuristic, engineering-standard]
related:
  - '[[Domain Design Heuristics]]'
  - '[[Append-Only Ledger Pattern]]'
  - '[[Asserted-but-Unenforced Invariant (Anti-Pattern)]]'
  - '[[Movement Engine]]'
---

# Purpose

Heurísticas de ingeniería (distintas de las heurísticas de modelado de dominio en
[[Domain Design Heuristics]]) extraídas por generalización de decisiones ya reales en el código y en
el AKB — reglas cortas, permanentes, aplicables a cualquier módulo futuro.

# Design Decisions

**1. Nunca modificar el estado actual sin pasar por el ledger que lo sostiene.** Origen literal, cita
real del código: _"Toda otra operación... termina generando una o más filas [en Movement Engine],
nunca modifica Stock directamente sin dejar rastro"_ ([[Movement Engine]]). Generalización: cualquier
Aggregate de "estado actual" mantenido por denormalización (ver [[Append-Only Ledger Pattern]]) debe
tener **una única vía de escritura** — la operación que actualiza el ledger — nunca un `UPDATE`
directo al estado actual desde otro punto del sistema.

**2. Diseñar antes que codificar es una práctica sana; afirmar aplicación sin verificarla no lo es.**
Ver [[Asserted-but-Unenforced Invariant (Anti-Pattern)]] para el criterio completo — la honestidad
sobre el estado real (¿diseñado? ¿aplicado? ¿dónde exactamente?) es la variable que determina si un
documento de arquitectura es confiable, no si el código ya existe.

**3. Denormalizar un total solo cuando la operación dueña se compromete a mantenerlo, nunca "por si
alguien lo necesita".** Origen: `Stock.quantityReserved` se denormaliza porque [[Reservation]] lo
mantiene en cada creación/liberación (decisión de rendimiento explícita, documentada) — no porque
sea conveniente tenerlo cacheado sin dueño claro de su actualización.

**4. Una referencia polimórfica (`sourceModule`/`sourceEntityId`) declara su propia obligatoriedad
según la semántica del dominio, no por convención uniforme.** Origen: en [[Movement Engine]] ambos
campos son opcionales pero correlacionados ("o los dos presentes, o ninguno" — un ajuste manual puede
no tener origen externo); en [[Reservation]] ambos son **siempre** obligatorios ("una reserva siempre
tiene un dueño identificable, nunca es suelta" — cita literal del código). La regla no es "todo
polimórfico es opcional" ni "todo polimórfico es obligatorio" — depende de si la entidad puede
existir legítimamente sin ese origen.

**5. Antes de crear una tabla/entidad nueva de propósito único, verificar si un subsistema genérico
de `core` ya resuelve la necesidad.** Ver [[Generic Polymorphic Subsystems]] para el criterio
completo y los dos ejemplos reales (`core.documents`, `core.tags`).

**6. Una corrección dentro de la ventana operativa normal se aplica sobre el registro existente; una
corrección después de que esa ventana cerró nunca reescribe el pasado, siempre compensa hacia
adelante.** Origen: `ADR-INV-004 §5` distingue **Ajuste** (mismo período contable, corrige la fila
existente) de **Corrección** (período ya cerrado, genera una fila compensatoria nueva, nunca toca la
original) — la misma asimetría que ya gobierna `ADR-INV-001 §4.3` (`INACTIVE` reversible vs.
`DISCONTINUED` definitivo) y el [[Append-Only Ledger Pattern]] en general (`DETACH`/archivado en vez
de `DELETE` retroactivo). Generalización: cualquier corrección de dominio debe preguntar primero "¿el
período/ventana en la que ocurrió el error sigue abierto?" antes de decidir si corrige en sitio o
compensa hacia adelante — nunca asumir que "corregir" significa siempre lo mismo.

# Related ADRs

[[ADR-DB-001]] · [[ADR-INV-001]] · [[ADR-INV-004]] · `ADR-INV-002` (vía [[Movement Engine]]/[[Reservation]])

# References

[[Architecture Review — ADR-DB-001 and ADR-INV-001]]
