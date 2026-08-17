---
id: shared-kernel-value-objects
title: Value Objects
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: value-objects
created: 2026-07-27
updated: 2026-07-27
tags: [shared-kernel, value-objects, ddd]
related:
  - '[[Domain Events]]'
  - '[[Policies]]'
---

# Purpose

Catálogo real ya diseñado en `docs/ddd/06_value_objects.md` — corrigió una conclusión errónea de
`ADR-INV-000 §7` (que estos VOs "no existían"; en realidad ya estaban diseñados, solo sin código).

# Domain Model

**Shared Kernel real** (`ddd/06 §1`): Dinero (`Money`, validado contra `configuration.currencies`,
tabla real), Porcentaje, Rango de Fecha.

**Locales, candidatos a Shared Kernel** (`ddd/06 §2`): Dirección, Correo, Teléfono, **Cantidad**
(local a `inventario`/`productos`/`ventas`/`compras`/`producción`, referencia
`products.units_of_measure`), Impuesto, Peso/Volumen/Medidas, Estado (respaldado por State Machine,
sin VO genérico compartido — cada agregado declara su propio enum).

# Design Decisions

Regla común: inmutables, sin identidad, constructor privado + factory estática validante
(`32-core-platform/09 §7`). Ninguno tiene código de aplicación real todavía — diseño completo, cero
implementación, mismo patrón que el resto de este AKB.

# Related ADRs

[[ADR-INV-000]] §7

# References

`docs/ddd/06_value_objects.md`
