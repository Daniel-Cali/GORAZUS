---
id: governance-engineering-review-adr-inv-008
title: 'Engineering Review — ADR-INV-008 (Motor de Trazabilidad de Inventario)'
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-review
created: 2026-07-28
updated: 2026-07-28
tags: [governance, engineering-review, second-brain, traceability-engine]
related:
  - '[[ADR-INV-008]]'
  - '[[Movement Engine]]'
  - '[[Engineering Heuristics]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Revisión de Ingeniería y Actualización del Second Brain para `ADR-INV-008`, mismo formato
consolidado ya usado para `ADR-INV-004/005/006/007`. Quinto ADR de la serie — primero que se apoya
explícitamente en un hallazgo ya capturado por el Second Brain en vez de descubrir uno nuevo desde
cero, validando que el propósito del protocolo (conocimiento reutilizable entre sesiones/ADRs) está
funcionando en la práctica, no solo en la declaración de intención.

# Engineering Review

- **Reutilización de conocimiento ya capturado, no redescubierta**: [[Movement Engine]] (nota de
  Level 3 de esta misma sesión) ya documentaba la ausencia de `lot_id`/`serial_id` en
  `stock_movements` — este ADR la cita como fuente, no la re-verifica desde cero contra el schema
  (aunque sí se confirmó una vez más contra el schema real antes de diseñar sobre ella, §2 del ADR,
  disciplina de "nunca calcular desde memoria" aplicada también a hallazgos ya conocidos).
- **Consistencia con la Regla Empresarial del propio prompt, verificada explícitamente**: 25 puntos
  de entrada solicitados, resueltos en un solo Domain Service parametrizado — no 25 implementaciones.
  Es la aplicación más estricta de "no duplicar lógica" de toda la serie.
- **Consistencia con los cuatro motores previos**: verificado que `ADR-INV-008` es puramente lector
  sobre `ADR-INV-004/005/006/007` — ninguna reimplementación de costo/disponibilidad/reabastecimiento/
  tareas de almacén.
- **Desviación intencional documentada, no accidental**: la política de retención más larga (§6.4 del
  ADR) contradice superficialmente el criterio de `ADR-DB-001 §11` (retención acotada) — verificado
  que la contradicción es consciente y justificada (recall de largo plazo), no un descuido.

# Enterprise Quality Report

| Criterio                                             | Cumplido                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Reconstrucción de ciclo de vida completo             | ✅ `RecorrerGenealogia` bidireccional + `ReconstruirEnPuntoDelTiempo`                                                                          |
| Nada queda sin trazabilidad (dentro de lo capturado) | 🟡 Honesto: movimientos históricos sin `lot_id`/`serial_id` quedan sin trazabilidad física retroactiva — declarado explícitamente, no ocultado |
| 25 capacidades de genealogía diseñadas               | ✅ Las 25, colapsadas correctamente a 19 tipos reales distintos + aclaración de por qué las duplicadas no cuentan doble                        |
| Sin motor paralelo por tipo de genealogía            | ✅ Verificado en §12 del ADR (Quality Gate) — la decisión central del documento                                                                |
| Datos sensibles protegidos en consulta combinada     | ✅ Retention & Sensitive Data Policy (P29) propuesta explícitamente, no una omisión                                                            |

# Second Brain / Knowledge Graph Update Report

- Nota puente [[ADR-INV-008]] creada, enlazada a los 7 ADRs previos de la serie y a
  [[Movement Engine]] (única nota de dominio referenciada como fuente directa del hallazgo central).
- [[Engineering Heuristics]] **no se modificó** — el principio "un motor, N puntos de entrada, nunca
  N motores" es una instancia del mismo principio de fuente única ya cubierto (heurística #1, #5),
  no una heurística nueva.
- `Home.md` y `ADR Index.md` actualizados de forma aditiva.

# New Reusable Patterns Discovered

Ninguno nuevo a nivel de nota — el patrón "punto de entrada parametrizado en vez de N
implementaciones" es una aplicación de principios ya documentados, no un patrón de arquitectura
adicional.

# New Engineering Heuristics

Ninguna nueva.

# New Lessons Learned

**El Second Brain demuestra su valor cuando un ADR posterior construye sobre un hallazgo de un ADR/
nivel anterior sin tener que redescubrirlo**: este es el primer ADR de la serie donde eso ocurrió de
forma explícita y verificable — [[Movement Engine]] se escribió en la fase de Level 3 (Knowledge
Evolution), semanas de "tiempo de sesión" antes de que existiera la necesidad concreta de
`ADR-INV-008`, y el hallazgo seguía ahí, correcto y citable, cuando se necesitó. Es la prueba más
directa de que "convertir cada descubrimiento en conocimiento permanente" (mandato repetido en cada
nivel de esta secuencia) no es solo una frase del protocolo — tiene un efecto medible en la calidad y
velocidad del ADR siguiente.

# New Issues Detected

Ninguna nueva — la deuda técnica central (§6.1 del ADR) ya estaba señalada como hallazgo, ahora tiene
una corrección de schema concreta y propuesta, lista para convertirse en ticket cuando se coordine
con el Issue Register de la sesión de Inventario.

# Recommended ADR-INV-009

Con `ADR-INV-008` se completan **seis** ADRs de motores/capas de Inventario
(`ADR-INV-003` Movimientos, `004` Costeo, `005` Disponibilidad, `006` Reabastecimiento, `007`
Almacenes, `008` Trazabilidad) sobre una arquitectura de dominio ya formalizada en `ADR-INV-000`
más gestión de almacenes en `ADR-INV-002` — **la cobertura de diseño del dominio de Inventario está,
en la práctica, completa**. La recomendación real, ahora reafirmada por cuarta vez consecutiva
([[Engineering Review — ADR-INV-005]], [[006]], [[007]]), es no continuar generando ADRs de
Inventario sin una necesidad de negocio nueva y específica que ninguno de los ocho documentos ya
cubra. Si la serie continúa, el candidato de mayor evidencia sigue siendo `Compras`
(`ADR-PUR-001`, fuera de `inventory`) — con una razón adicional de este ADR: la genealogía de
Proveedor (§4.9) ya está diseñada para conectarse ahí en el momento en que exista código real de
`purchases`.

# Update — Digital Twin (§15, agregado 2026-07-28)

`ADR-INV-008` se extendió con `§15` (Point-in-Time Reconstruction completo: inventario, valuación,
estado de almacén, disponibilidad, reservas, asignaciones, snapshots, replay). Reafirma la misma
disciplina de esta revisión: **hallazgo real nuevo** (`remaining_quantity` de las capas de costo es
mutable, no una serie de eventos — verificado de nuevo contra el schema antes de diseñar §15.3, no
asumido) y **hallazgo positivo real** (Point-in-Time Reservations ya 100% reconstruible sin ningún
cambio de schema). Ambos ya volcados a [[Issue Register]] (`ISSUE-19`) y [[Decision Log]] —
primera vez en la serie que una extensión de un ADR ya cerrado se consolida directamente en los
registros canónicos de gobernanza en vez de quedar solo en esta nota de revisión.

# Related ADRs

[[ADR-INV-008]] · [[ADR-INV-000]] · [[ADR-INV-001]] · [[ADR-INV-002]] · [[ADR-INV-003]] · [[ADR-INV-004]] · [[ADR-INV-005]] · [[ADR-INV-006]] · [[ADR-INV-007]]

# References

[ADR-INV-008 (documento real)](../../adr/ADR-INV-008-motor-de-trazabilidad-de-inventario.md)
