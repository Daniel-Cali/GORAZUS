---
id: shared-kernel-policies
title: Policies
version: 1.0.0
status: active
owner: Chief Software Architect
domain: shared-kernel
subdomain: domain-policies
created: 2026-07-27
updated: 2026-07-27
tags: [shared-kernel, domain-policies]
related:
  - '[[Domain Events]]'
  - '[[Issue Register]]'
---

# Purpose

Catálogo real de Domain Policies — `docs/ddd/16_domain_policies.md`, P1-P12, más P13/P14
propuestas por [[ADR-INF-001]].

# Business Rules

- **P1** Módulo dueño único · **P2** Publicación después del commit · **P3** Sin transacciones
  distribuidas · **P4** Soft delete universal · **P5** Numeración exclusiva por serie · **P6**
  Documentos fiscales inmutables · **P7** Ninguna IA escribe directamente · **P8** Operaciones
  irreversibles requieren aprobación · **P9** Aislamiento de tenant inescapable · **P10** Pertenencia
  única a Grupo Corporativo · **P11** Costeo fijo por Producto · **P12** Reserva antes que
  compromiso físico.
- **P13 (propuesta)** Orden determinístico de bloqueo · **P14 (propuesta)** Idempotencia
  obligatoria — ambas pendientes de autorización para editar el documento origen.

# Related ADRs

[[ADR-INV-000]] · [[ADR-INV-003]] · [[ADR-INF-001]] §10

# References

`docs/ddd/16_domain_policies.md` · [[Issue Register]] — ISSUE-13
