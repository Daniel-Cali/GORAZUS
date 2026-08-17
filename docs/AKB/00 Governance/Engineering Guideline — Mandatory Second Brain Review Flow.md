---
id: governance-engineering-guideline-mandatory-second-brain-review-flow
title: Engineering Guideline — Mandatory Second Brain Review Flow
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-guideline
created: 2026-08-04
updated: 2026-08-04
tags: [governance, engineering-guideline, akb, workflow, approval-gate]
related:
  - '[[Engineering Guideline — Workspace Isolation]]'
  - '[[Architecture Principles]]'
  - '[[Decision Log]]'
  - '[[Issue Register]]'
  - '[[ADR Index]]'
---

# Purpose

Regla operativa permanente: ningún análisis, diseño, modificación o implementación sobre GORAZUS
empieza sin revisar primero el estado real registrado en el Segundo Cerebro (AKB). Existe para que
ninguna fase de trabajo reinvente, contradiga o duplique una decisión arquitectónica ya tomada y ya
documentada — el mismo criterio que [[Architecture Principles]] ya aplica a nivel de arquitectura
del sistema (Feature/Regla "no diseñar especulativamente sin necesidad de negocio confirmada"),
extendido aquí al proceso de trabajo en sí.

# Scope

Aplica a todo análisis, diseño, modificación o implementación sobre el proyecto — sin excepción de
módulo o fase.

# Business Rules

**Revisión obligatoria antes de empezar**, siempre:

- `docs/AKB/` completo relevante al área de trabajo.
- ADRs relacionados ([[ADR Index]]).
- [[Decision Log]].
- Issues abiertos ([[Issue Register]]).
- Convenciones registradas.
- Decisiones arquitectónicas existentes.
- Reglas operativas del proyecto (incluye [[Engineering Guideline — Workspace Isolation]]).

No asumir comportamiento — verificar contra el código y el schema real, mismo criterio que el
protocolo de reality-check ya en uso en esta serie de fases de Compras. No crear una regla nueva si
ya existe una decisión registrada — extender o referenciar la existente. No modificar arquitectura
sin revisar las decisiones previas que la sostienen.

**Ante una contradicción** entre la solicitud actual y lo ya registrado en el Segundo Cerebro, el
orden es siempre: detenerse → explicar la contradicción encontrada → indicar el impacto → pedir
aprobación antes de continuar. Nunca resolverla por criterio propio en silencio.

# Design Decisions

**Flujo obligatorio de toda unidad de trabajo**:

1. Revisar Segundo Cerebro.
2. Revisar estado actual del código.
3. Revisar schema real.
4. Presentar plan (objetivo, archivos, motivo, riesgos, dependencias, resultado esperado).
5. Esperar aprobación.
6. Implementar únicamente después de recibir la confirmación explícita acordada para esa fase de
   trabajo.

Este flujo es el default para trabajo estructurado por fases (ej. la serie de Aggregate Roots de
Compras); no reemplaza la autoridad amplia ya otorgada para tareas técnicas internas rutinarias
cuando el usuario no pide explícitamente este gate por fase — ambos regímenes conviven según lo que
pida cada pedido concreto, sin contradicción entre sí.

# Related ADRs

Ninguno — convención operativa de proceso, no decisión de arquitectura del sistema.

# References

[[Decision Log]] — entrada 2026-08-04 · [[Engineering Guideline — Workspace Isolation]]
