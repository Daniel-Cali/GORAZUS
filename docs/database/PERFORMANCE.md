# Performance — GORAZUS Database

> Generado 2026-07-17 (PHASE 01 — Database Enterprise). Complementa
> `docs/database/04-estrategia-indices.md` (qué se indexa por diseño) con el estado
> **verificado** tras la optimización de esta fase. Solo documenta hallazgos y
> recomendaciones donde no hay evidencia real para actuar — no se inventan números
> de un sistema con ~427 filas de datos de desarrollo.

## 1. Optimización aplicada en esta fase

- **575 índices FK de negocio agregados** (`docs/database/sql/31_missing_fk_indexes.sql`) —
  detalle completo en [INDEX_CATALOG.md §3](./INDEX_CATALOG.md#3-optimización-aplicada-en-esta-fase-575-índices-fk-nuevos).
  Elimina el anti-patrón más común y de mayor impacto (JOIN/DELETE sin índice de
  soporte) antes de que el sistema tenga tráfico real — el costo se paga una vez
  (tiempo de creación + espacio en disco), el beneficio escala con el volumen.
- **Particionamiento real habilitado** (antes: 0 de 27 tablas particionadas
  funcionaban; ahora: 200 particiones reales, partition pruning operativo) — ver
  [DATABASE_ARCHITECTURE.md §4](./DATABASE_ARCHITECTURE.md#4-particionamiento-corregido-en-esta-fase).
  Sin esto, cualquier reporte "de este mes" sobre `sales.invoices` o
  `inventory.stock_movements` habría escaneado la tabla completa para siempre,
  independientemente de cuántos índices tuviera.

## 2. Por qué no hay benchmarks de consulta reales todavía

La base tiene ~427 filas totales (bootstrap + seed) — insuficiente para que
`EXPLAIN ANALYZE` produzca un plan de ejecución representativo de producción
(el optimizador de Postgres con una tabla de 10 filas casi siempre elige
sequential scan, correctamente, sin importar qué índices existan). Este documento
no fabrica benchmarks — fija el **procedimiento** para cuando haya volumen real:

1. Habilitar `pg_stat_statements` (extensión estándar, sin cambio de schema) antes
   de la primera prueba de carga.
2. Ejecutar `EXPLAIN (ANALYZE, BUFFERS)` contra las 4 consultas ya identificadas
   como candidatas a cursor-based pagination
   (`docs/architecture/30-api-completa.md §6`: `inventory.stock_movements`,
   `core.audit_logs`, `sales.invoices`, `accounting.journal_entry_lines`).
3. Confirmar que los 575 índices nuevos (§1) se usan realmente (`idx_scan > 0` en
   `pg_stat_user_indexes`) — un índice creado pero nunca usado por el planner en
   producción real es candidato a revisión (no a esta fase, a la primera revisión
   post-lanzamiento).

## 3. Índices compuestos — pendientes de evidencia real

No se agregó ningún índice compuesto (más de una columna) en esta fase — sería
optimización especulativa sin patrón de consulta real que la justifique (KISS,
`docs/architecture/01-estructura-monorepo.md §2`). Candidatos identificables por
diseño, a confirmar cuando haya tráfico real:

| Tabla                            | Índice compuesto candidato               | Justificación de diseño                                                                                            |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sales.sales_order_lines`        | `(sales_order_id, product_id)`           | Listado de líneas de una orden filtrado por producto                                                               |
| `inventory.stock_movements`      | `(warehouse_id, product_id, created_at)` | Kardex por producto y almacén, ya con BRIN en `created_at` — evaluar si el compuesto lo complementa o lo reemplaza |
| `accounting.journal_entry_lines` | `(account_id, fiscal_period_id)`         | Mayor de una cuenta en un período                                                                                  |

## 4. Particiones: tamaño y crecimiento esperado

Con `p_premake => 3` (mensual) / `p_premake => 1` (anual), el sistema mantiene
siempre 3-4 particiones mensuales o 1-2 anuales abiertas por tabla — sin
intervención manual mientras el job `partition_maintenance` corra según lo
programado (`0 2 * * *`, diario). Retención ya fijada:
`docs/database/07-estrategia-particionamiento.md §6` (DETACH + archivado, no
`DELETE` fila por fila).

## 5. Qué NO se optimizó (límite deliberado)

- Configuración de `postgresql.conf` (memoria, `work_mem`, `shared_buffers`) — no
  tocada, ya gestionada en `infra/docker/postgres/postgresql.conf` como
  configuración de infraestructura, no de "modelo de base de datos".
- Vistas materializadas adicionales no solicitadas — las 4 ya diseñadas
  (`docs/database/sql/28_materialized_views.sql`) cubren lo ya identificado como
  necesario; no se agregó ninguna nueva sin necesidad de negocio confirmada.

## 6. Trazabilidad

| Punto pedido en la fase              | Cerrado en                                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Detectar posibles cuellos de botella | §2-3 — transparente sobre falta de datos reales, procedimiento fijado para cuando existan |
| Optimizar sin romper compatibilidad  | §1                                                                                        |
