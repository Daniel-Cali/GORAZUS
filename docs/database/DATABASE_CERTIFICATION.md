# Database Certification — GORAZUS Enterprise v1.0.0

> Certificación formal de cierre del modelo de datos. 2026-07-21, rama
> `release/database-v1`. Emitida al final de las 8 partes de
> "Database Enterprise v1.0" (Preparación y Auditoría General → Auditoría
> de Schemas → Auditoría de Tablas → Relaciones/Claves/Integridad →
> Normalización → Validación Funcional → Rendimiento/Escalabilidad →
> Seguridad/Auditoría/Cumplimiento/Multiempresa).

## Declaración

Se certifica que la Base de Datos de **GORAZUS ERP** ha sido auditada
en su totalidad — los 22 schemas de negocio/core, las 501 tablas, las
5.164 relaciones, los 3.201 índices, los 2.414 triggers, las 10 vistas
y 4 vistas materializadas — contra los estándares Enterprise definidos
para el proyecto, y se declara:

## GORAZUS DATABASE ENTERPRISE v1.0.0

**Calificación general: 94/100** (ver
[DATABASE_SCORE.md](./DATABASE_SCORE.md) para el detalle por
dimensión).

## Alcance de esta certificación

Certifica el **modelo de datos** (schema, relaciones, integridad,
normalización, rendimiento estructural, seguridad de base de datos,
cobertura funcional) contra Postgres 17 real, verificado en vivo en las
8 partes de esta auditoría — **no certifica**:

- El código de aplicación (backend/frontend) — fuera de alcance de una
  auditoría de base de datos; ver `PROJECT_STATUS.md` para su estado
  real (2-3 de 27 módulos con backend construido).
- Rendimiento bajo carga real de producción — validado por diseño,
  pendiente de un entorno de staging dedicado con datos reales
  (`PERFORMANCE_REPORT.md §Objetivo final`).
- Los 2 hallazgos abiertos documentados abajo — certificados como
  **conocidos y aceptados**, no como resueltos.

## Hallazgos abiertos al momento de esta certificación (no bloqueantes)

| #   | Hallazgo                                                                                             | Severidad                                                                     | Documento                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | RLS de Empresa/Sucursal ausente (solo Tenant)                                                        | 🟠 Real para multiempresa avanzada, sin impacto en tenant de una sola empresa | [RLS_DESIGN.md](./RLS_DESIGN.md)                                                                    |
| 2   | 185 FK cross-schema (violan la regla de "ID suelto entre módulos")                                   | 🟠 Arquitectura, pendiente de ADR                                             | [FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio) |
| 3   | 4 gaps funcionales aditivos (hazmat, país/idioma/timezone, Costo Específico, Contratos de Proveedor) | 🟢 Bajo-medio, ninguno bloqueante                                             | [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md)                                                          |
| 4   | `core.restore_test_logs` sin RLS de Tenant                                                           | 🟡 Baja, posiblemente intencional                                             | `DATABASE_HEALTH_REPORT.md §2.2`                                                                    |

**Ninguno de los 4 requiere resolverse antes de iniciar el desarrollo
del Backend Core** — todos están completamente especificados, listos
para aplicarse en una migración versionada futura cuando se autorice.

## Política a partir de esta certificación

**A partir de GORAZUS Database Enterprise v1.0.0, el modelo de datos
queda congelado en su estructura fundamental:**

1. Ningún cambio estructural (nueva tabla, columna, FK, índice) se
   aplica directamente contra la base de datos — todo cambio pasa por
   una **migración versionada** (`sql/NN_*.sql`, append-only, mismo
   patrón ya usado en toda esta auditoría).
2. Toda migración que modifique el schema debe actualizar, en el mismo
   cambio: `TABLE_CATALOG.md`, el ERD correspondiente (`docs/database/erd/`),
   el diccionario de datos (`dictionary/*.md`), `CHANGELOG.md` (del
   proyecto), y `VERSION.md` si corresponde a una nueva versión de
   Database.
3. Los 2 gaps de mayor peso (RLS de Empresa/Sucursal, 185 FK
   cross-schema) son los primeros candidatos de la próxima migración
   versionada, cuando se autorice.

## Firma de la auditoría

- **Metodología:** verificación en vivo contra Postgres 17 real
  (`docker-postgres-1`), consultas de solo lectura contra
  `pg_catalog`/`information_schema`, nunca contra los documentos.
- **Alcance:** 8 partes, ~35 documentos nuevos, 0 DDL aplicado contra
  la base de desarrollo.
- **Rama:** `release/database-v1`.
- **Fecha:** 2026-07-21.

**Siguiente documento:** [DATABASE_RELEASE_NOTES.md](./DATABASE_RELEASE_NOTES.md).
