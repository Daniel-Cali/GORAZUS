# Project Status — GORAZUS ERP

> Foto del estado general del proyecto a 2026-07-21. Complementa, sin
> duplicar, a [ROADMAP.md](./ROADMAP.md) (estado del código por módulo),
> [VERSION.md](./VERSION.md) (versión actual), [CHANGELOG.md](./CHANGELOG.md)
> (detalle por sesión de trabajo) y
> [docs/00-roadmap-fases.md](./docs/00-roadmap-fases.md) (estado de la
> documentación de arquitectura por fase). Generado como entregable propio de
> la auditoría de base de datos "Fase 1, Parte 1" (rama
> `feature/database-audit`) — sin modificar ninguno de esos documentos.

## 1. En una frase

GORAZUS tiene **documentación de arquitectura y base de datos Enterprise
prácticamente completa** (32 fases + DDD + auditorías de base de datos) y
**código real todavía temprano** (2 de 27 módulos de negocio con
backend+frontend funcional) — la brecha entre "diseñado" e "implementado" es
grande y está documentada con honestidad en cada pieza, no oculta.

## 2. Versión actual

**0.2.0** (2026-07-21) — FASE 02, Backend Core + Gestión de Versiones. Ver
[VERSION.md](./VERSION.md) para el detalle de qué se agregó.

## 3. Estado del código (resumen de ROADMAP.md)

| Pieza                                                                                                       | Estado                                                                  |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                               | ✅                                                                      |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki) | ✅ verificada de punta a punta                                          |
| Foundation Platform (`core/*`)                                                                              | ✅ validado con servidor real                                           |
| Persistencia (`core/database`, 21 clientes Prisma, RLS)                                                     | ✅                                                                      |
| Módulos de negocio con backend real                                                                         | 🟡 2 de 27 (`auth`, `seguridad`) + `configuracion` (Core, sin frontend) |
| Resto de módulos de negocio (24)                                                                            | ❌ Sin backend — placeholder de frontend registrado                     |
| Testing (unitario/integración/e2e/carga/seguridad)                                                          | ✅ 111+ tests, corriendo contra infraestructura real                    |

Ver [ROADMAP.md](./ROADMAP.md) para la tabla completa módulo por módulo.

## 4. Estado de la documentación de arquitectura

32 fases originales pedidas por el usuario — casi todas ✅ completas, ver
[docs/00-roadmap-fases.md](./docs/00-roadmap-fases.md) para el detalle
fase por fase. Trabajo adicional fuera de esas 32 fases, completado en
sesiones posteriores (ver
[docs/00-indice-maestro.md](./docs/00-indice-maestro.md) §"Documentación
fuera de esta lista"):

- **EPIC 03** — Arquitectura de Frontend (`docs/frontend/`).
- **EPIC 04** — Implementation Standards (`docs/standards/`).
- **EPIC — Database Visualization Environment** (`docs/database/erd/`,
  DBeaver/SchemaSpy/Graphviz).
- **PHASE 01 — Database Enterprise** (optimización real: particionamiento,
  575 índices FK agregados).
- **Fases 1-5 (usuario) — Arquitectura Enterprise avanzada**: auditoría del
  modelo de datos, motores Enterprise (Workflow/BPM/Approval/Document
  Management/Digital Signature/Integration Engine), Data Warehouse/BI,
  módulo de IA, y el capstone de ERP Enterprise readiness (Holding/MRP/
  TMS/Zero Trust/Compliance) — ver
  [docs/architecture/README.md](./docs/architecture/README.md).
- **Fase 6 (usuario) — Domain-Driven Design**: 20 documentos de arquitectura
  de dominio (Bounded Contexts, Aggregates, Domain Events, ...) — ver
  [docs/ddd/README.md](./docs/ddd/README.md).
- **"Database Enterprise v1.0" (usuario) — auditoría de base de datos
  orientada a ferretería/distribución** (esta sesión, rama
  `feature/database-audit`): formas normales verificadas, catálogo de
  vistas/triggers/funciones re-confirmado, análisis funcional de vertical,
  y este mismo inventario/auditoría/estado consolidados — ver
  [docs/database/DATABASE_AUDIT.md](./docs/database/DATABASE_AUDIT.md).

## 5. Estado de la base de datos

**92% Enterprise-Ready** (ver
[docs/database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §6](./docs/database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#6-informe-final)) —
501 tablas, 5.164 FK (100% válidas), 3.201 índices (0 duplicados), RLS
forzado en 500/501 tablas, particionamiento aprovisionado en las 27 tablas
de alto volumen. Detalle completo:
[docs/database/DATABASE_INVENTORY.md](./docs/database/DATABASE_INVENTORY.md)
(números) y
[docs/database/DATABASE_AUDIT.md](./docs/database/DATABASE_AUDIT.md)
(hallazgos de calidad).

## 6. Brecha principal: diseño vs. implementación

La brecha más grande del proyecto hoy no es de diseño — es que **25 de 27
módulos de negocio todavía no tienen una sola línea de backend real**,
aunque cada uno ya tiene su modelo de datos, arquitectura de módulo,
eventos de dominio y Aggregate Root completamente diseñados. El orden de
construcción ya confirmado (ver memoria de proyecto / `ROADMAP.md` §5):
Productos → Inventario → Clientes → Ventas → Caja → POS.

## 7. Puntos abiertos que requieren una decisión (no técnica, de negocio)

| Punto                                                        | Por qué está abierto                                                                      | Dónde está documentado                                                                                                                                                |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 185 FK reales cruzan schemas de módulos de negocio distintos | Contradice la regla de "ID suelto" ya documentada; corregirlo es un cambio de alto riesgo | [docs/database/FOREIGN_KEYS.md §3](./docs/database/FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio)                                       |
| `core.restore_test_logs` sin RLS                             | Podría ser intencional (tabla de infraestructura de backup)                               | [docs/database/SECURITY.md §1](./docs/database/SECURITY.md#1-row-level-security--verificado)                                                                          |
| Materiales peligrosos/hoja de seguridad sin campo dedicado   | Gap funcional real para el vertical ferretería, bajo riesgo de agregar                    | [docs/database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4.1](./docs/database/AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#41--detalle-del-gap-materiales-peligrosos) |

## 8. Trazabilidad

Este documento es una síntesis — no introduce ningún hecho nuevo que no esté
ya documentado en `ROADMAP.md`, `docs/00-roadmap-fases.md`,
`docs/database/DATABASE_AUDIT.md` o `docs/database/DATABASE_INVENTORY.md`.
Actualizar este archivo cada vez que cambie sustancialmente el estado del
código o de la documentación, en el mismo commit que ese cambio — mismo
principio ya aplicado a `docs/00-indice-maestro.md`.
