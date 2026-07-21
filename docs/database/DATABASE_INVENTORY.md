# Database Inventory — GORAZUS

> "Fase 1, Parte 1" (2026-07-21, rama `feature/database-audit`) — inventario
> numérico consolidado de la base de datos, pedido explícitamente como
> entregable propio. **No es una nueva medición** — cada número de este
> documento ya fue verificado en vivo contra Postgres 17 real
> (`docker-postgres-1`) en las dos auditorías previas de esta misma sesión
> ([AUDIT_FASE1_ENTERPRISE.md](./AUDIT_FASE1_ENTERPRISE.md),
> [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md),
> esta última hace minutos) — este documento los consolida en un solo lugar,
> en el formato de inventario puro que se pidió, sin repetir el análisis.

## 1. Inventario numérico

| Objeto                                             | Cantidad                                                                                                                                                        | Última verificación en vivo | Fuente del detalle                                                                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Schemas**                                        | 22 (21 de negocio/core + 1 de infraestructura, `partman`)                                                                                                       | 2026-07-21                  | [TABLE_CATALOG.md](./TABLE_CATALOG.md)                                                                                                                        |
| **Tablas (lógicas)**                               | 501                                                                                                                                                             | 2026-07-21                  | [TABLE_CATALOG.md](./TABLE_CATALOG.md)                                                                                                                        |
| **Tablas (físicas, incl. particiones)**            | 730                                                                                                                                                             | 2026-07-20                  | [DATABASE_HEALTH_REPORT.md §6](./DATABASE_HEALTH_REPORT.md#6-segunda-pasada-2026-07-20--auditoría-solicitada-explícitamente-fase-01--database)                |
| **Relaciones (Foreign Keys)**                      | 5.164                                                                                                                                                           | 2026-07-21                  | [FOREIGN_KEYS.md](./FOREIGN_KEYS.md)                                                                                                                          |
| **FK inválidas**                                   | 0                                                                                                                                                               | 2026-07-21                  | [AUDIT_FASE1_ENTERPRISE.md §3](./AUDIT_FASE1_ENTERPRISE.md)                                                                                                   |
| **Índices**                                        | 3.201                                                                                                                                                           | 2026-07-21                  | [INDEX_CATALOG.md](./INDEX_CATALOG.md)                                                                                                                        |
| **Índices duplicados**                             | 0                                                                                                                                                               | 2026-07-21                  | [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §2](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md)                                                                 |
| **Triggers**                                       | 2.414                                                                                                                                                           | 2026-07-21                  | [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §2](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md)                                                                 |
| **Funciones**                                      | 76 (20 de negocio propio; el resto son de extensiones `pgcrypto`/`pg_trgm` en `public` y de `pg_partman`)                                                       | 2026-07-21                  | [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §2.1](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#21--nota-sobre-el-recuento-de-funciones-76-vs-recuento-propio) |
| **Procedimientos**                                 | 4 (de negocio: `accounting.sp_close_fiscal_period`, `sales.sp_confirm_sales_order`, `sales.sp_generate_due_recurring_invoices`, `core.sp_provision_new_tenant`) | 2026-07-21                  | ídem                                                                                                                                                          |
| **Views**                                          | 10 (`accounting`:3, `customers`:1, `inventory`:2, `partman`:1, `suppliers`:1, `taxes`:2)                                                                        | 2026-07-21                  | ídem                                                                                                                                                          |
| **Vistas inválidas**                               | 0                                                                                                                                                               | 2026-07-21                  | ídem                                                                                                                                                          |
| **Materialized Views**                             | 4 (todas en `bi`)                                                                                                                                               | 2026-07-21                  | ídem                                                                                                                                                          |
| **Secuencias**                                     | 501 (una por tabla, respaldando `local_id BIGINT GENERATED ALWAYS AS IDENTITY`)                                                                                 | 2026-07-21                  | [AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §2.2](./AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md#22--nota-sobre-informationschemasequences-vs-pgclass)          |
| **Secuencias sin uso**                             | 0                                                                                                                                                               | 2026-07-21                  | ídem                                                                                                                                                          |
| **Tablas particionadas**                           | 27                                                                                                                                                              | 2026-07-20                  | [DATABASE_HEALTH_REPORT.md §1.1](./DATABASE_HEALTH_REPORT.md#-11--particionamiento-era--crítico--resuelto)                                                    |
| **Tablas particionadas sin aprovisionar**          | 0 de 27                                                                                                                                                         | 2026-07-20                  | ídem                                                                                                                                                          |
| **Tablas sin RLS habilitado**                      | 1 de 501 (`core.restore_test_logs`, pendiente de confirmación de negocio)                                                                                       | 2026-07-21                  | [DATABASE_HEALTH_REPORT.md §2.2](./DATABASE_HEALTH_REPORT.md#-22--corerestore_test_logs-es-la-única-tabla-sin-rls-habilitado)                                 |
| **Tablas huérfanas (sin FK entrante ni saliente)** | 0 de 501                                                                                                                                                        | 2026-07-20                  | [DATABASE_HEALTH_REPORT.md §4](./DATABASE_HEALTH_REPORT.md#4-validaciones-de-integridad-verificado-de-nuevo-tras-la-optimización)                             |
| **Tablas duplicadas**                              | 0                                                                                                                                                               | 2026-07-21                  | [AUDIT_FASE1_ENTERPRISE.md §4](./AUDIT_FASE1_ENTERPRISE.md#4-verificación-en-vivo--nomenclatura-y-normalización-hallazgos-nuevos-de-esta-pasada)              |

## 2. Inventario por schema (tablas)

Ver el desglose completo, schema por schema, con tablas raíz/hijas/catálogo
clasificadas, en [TABLE_CATALOG.md](./TABLE_CATALOG.md) — no se repite aquí
para no duplicar un documento de 501 filas; este inventario es el resumen
numérico de alto nivel que se pidió como entregable separado.

| Schema          | Tablas                              | Módulo de negocio                                                                        |
| --------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `core`          | 69                                  | Plataforma técnica transversal (tenants, usuarios, auditoría, documentos, integraciones) |
| `security`      | 24                                  | Seguridad                                                                                |
| `customers`     | 18                                  | Clientes                                                                                 |
| `suppliers`     | 13                                  | Proveedores                                                                              |
| `products`      | 35                                  | Productos                                                                                |
| `inventory`     | 34                                  | Inventario                                                                               |
| `sales`         | 55                                  | Ventas                                                                                   |
| `purchases`     | 27                                  | Compras                                                                                  |
| `cash`          | 11                                  | Caja                                                                                     |
| `banks`         | 14                                  | Bancos                                                                                   |
| `accounting`    | 28                                  | Contabilidad                                                                             |
| `taxes`         | 13                                  | Impuestos                                                                                |
| `hr`            | 28                                  | RRHH                                                                                     |
| `payroll`       | 22                                  | Nómina                                                                                   |
| `crm`           | 17                                  | CRM                                                                                      |
| `services`      | 18                                  | Servicios                                                                                |
| `projects`      | 17                                  | Proyectos                                                                                |
| `assets`        | 10                                  | Activos Fijos                                                                            |
| `reports`       | 11                                  | Reportes                                                                                 |
| `bi`            | 14                                  | Business Intelligence                                                                    |
| `configuration` | 23                                  | Configuración                                                                            |
| `partman`       | 29 (infraestructura, no de negocio) | Gestión de particiones (extensión)                                                       |

**Total: 501 tablas de negocio/core + 29 tablas propias de `partman`.**

## 3. Trazabilidad

Ningún número de este documento es una medición nueva — todos provienen de
consultas en vivo ya ejecutadas contra `pg_catalog`/`information_schema` en
esta misma sesión (2026-07-21) o en la pasada inmediatamente anterior
(2026-07-20), sin cambios detectados entre ambas. Este documento existe
únicamente para satisfacer el entregable "inventario completo" pedido en un
solo archivo consolidado, sin obligar a leer 3 documentos distintos para
tener los números centrales.
