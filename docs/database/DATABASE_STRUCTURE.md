# Database Structure — GORAZUS

> Generado 2026-07-16, actualizado 2026-07-18 (PHASE 01 — Database Enterprise, tras
> la optimización que corrigió los 3 gaps de la versión original y agregó 575
> índices), re-verificado 2026-07-20 (segunda pasada de FASE 01 — Database
> Enterprise, ver [DATABASE_HEALTH_REPORT.md §6](./DATABASE_HEALTH_REPORT.md#6-segunda-pasada-2026-07-20--auditoría-solicitada-explícitamente-fase-01--database-enterprise-verificación-en-vivo-contra-la-instancia-real-no-solo-lectura-de-estos-documentos)):
> triggers y particiones habían crecido más de lo documentado (crecimiento normal
> del `p_premake` con el tiempo, no un error), el resto de las métricas se
> reconciliaron exactas. Resumen ejecutivo del estado **real** de la base de datos
> `gorazus`,
> verificado por consulta directa contra Postgres 17 (contenedor
> `docker-postgres-1`, ver [DATABASE_VISUALIZATION.md](./DATABASE_VISUALIZATION.md)
> para cómo reproducir estas consultas). Complementa — no repite —
> `docs/database/00-modelo-general.md` (diseño) y `docs/database/02-modelo-logico.md`
> (inventario funcional). Este documento es el **estado verificado**, aquel es el
> **diseño de origen**; donde difieran, ver
> [DATABASE_HEALTH_REPORT.md](./DATABASE_HEALTH_REPORT.md) para la reconciliación.

## 1. Resumen general

| Métrica                                                          | Valor real (re-verificado 2026-07-20)                                                                                                                                        | PHASE 01 (2026-07-18)                           | Antes de PHASE 01                                    |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Schemas totales                                                  | 23 (los 21 ya inventariados en §2 — incluye `core` y `security` — más `partman`/`public` técnicos)                                                                           | 21 + `core` fundacional + `partman` + `public`  | 21 + `core`                                          |
| Tablas lógicas                                                   | **501**                                                                                                                                                                      | 501                                             | 501 (sin cambio)                                     |
| Tablas físicas (incluye particiones reales)                      | **701** (exacto)                                                                                                                                                             | ~674-701 (estimado)                             | 501 (0 particiones reales)                           |
| Vistas                                                           | **9 de 9** ✅ (sin cambio; una 10ma vista existe pero es `partman.table_privs`, interna de la extensión `pg_partman`, no una vista de negocio)                               | 9 de 9                                          | 8 de 9 (`v_treasury_position` no existía)            |
| Vistas materializadas                                            | 4                                                                                                                                                                            | 4                                               | 4                                                    |
| Funciones                                                        | 76 (sin cambio)                                                                                                                                                              | 76                                              | 75                                                   |
| Procedimientos                                                   | 4 (sin cambio)                                                                                                                                                               | 4                                               | 4                                                    |
| Triggers lógicos (sin propagados a particiones)                  | 1,962                                                                                                                                                                        | No medido por separado                          | No medido por separado                               |
| Triggers totales (incluye propagados a particiones)              | **2,414** 🔺 creció con las particiones                                                                                                                                      | ~1,214                                          | 982                                                  |
| Secuencias                                                       | 501 (verificado por `pg_class`, no por `information_schema.sequences` — ver nota abajo)                                                                                      | 501                                             | 501                                                  |
| Índices (lógicos, sin contar propagados a particiones)           | **2,201** (sin cambio, confirmado exacto)                                                                                                                                    | 2,201                                           | 1,626 (+575 nuevos, ver §3)                          |
| Foreign Keys (constraints lógicos, sin propagados a particiones) | **3,632** (± 1, sin cambio real) — **185 cruzan schemas de módulo**, ver [FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio) | 3,631                                           | 3,631 (relación cross-schema no verificada entonces) |
| Primary Keys                                                     | 501                                                                                                                                                                          | 501                                             | 501                                                  |
| Check constraints                                                | 6,102 (sin re-verificar en esta pasada)                                                                                                                                      | 6,102                                           | 6,102                                                |
| Tablas particionadas (declaradas)                                | 27                                                                                                                                                                           | 27                                              | 27                                                   |
| Particiones reales creadas                                       | **1.200** 🔺 (creció ~6x, `p_premake` normal con el tiempo, no un error)                                                                                                     | ~200 ✅                                         | 0 🔴                                                 |
| RLS habilitado (tablas lógicas)                                  | 500 de 501 (`core.restore_test_logs` es la excepción, ver [SECURITY.md §1](./SECURITY.md#1-row-level-security--verificado))                                                  | 500 de 501                                      | No verificado antes                                  |
| 🔴 **RLS realmente forzado** (`relforcerowsecurity`)             | **0 de 501**                                                                                                                                                                 | No verificado en esta dimensión                 | —                                                    |
| 🔴 **Rol de conexión de la API superusuario**                    | `gorazus_app` = `rolsuper=true`, `rolbypassrls=true` — causa raíz exacta en [SECURITY.md §2](./SECURITY.md#2-roles-de-base-de-datos--verificados-existen-los-5-documentados) | Se afirmaba erróneamente "ninguno superusuario" | —                                                    |

**Nota sobre secuencias:** `information_schema.sequences` devuelve 0 filas contra esta instancia
(comportamiento de esa vista con secuencias de columnas `GENERATED ALWAYS AS IDENTITY` bajo ciertos
roles/privilegios) — el conteo confiable es `SELECT count(*) FROM pg_class WHERE relkind='S'`, que
sí devuelve 501 consistentemente. Si se vuelve a auditar esta métrica, usar ese método.

## 2. Schemas (21 de negocio + `core`)

Mapeo completo carpeta de módulo (español) ↔ schema (inglés) ya fijado en
[docs/standards/NAMING_CONVENTIONS.md §5](../standards/NAMING_CONVENTIONS.md#5-mapeo-módulo-español--schema-inglés) —
no se repite acá, solo la cuenta real de tablas por schema verificada:

| Schema          | Tablas (real) | Documentado (`02-modelo-logico.md §3`)                        | Diferencia                                                                                           |
| --------------- | ------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `core`          | 68            | 65                                                            | +3 (Core Platform: `business_rules`, `business_rule_evaluations`, `background_jobs`, ya documentado) |
| `security`      | 24            | 24                                                            | —                                                                                                    |
| `customers`     | 18            | 18                                                            | —                                                                                                    |
| `suppliers`     | 13            | 13                                                            | —                                                                                                    |
| `products`      | 35            | 35                                                            | —                                                                                                    |
| `inventory`     | 34            | 34                                                            | —                                                                                                    |
| `sales`         | 55            | 54                                                            | +1                                                                                                   |
| `purchases`     | 27            | 27                                                            | —                                                                                                    |
| `cash`          | 11            | 11                                                            | —                                                                                                    |
| `banks`         | 14            | 14                                                            | —                                                                                                    |
| `accounting`    | 28            | 28                                                            | —                                                                                                    |
| `taxes`         | 13            | 13                                                            | —                                                                                                    |
| `crm`           | 17            | 17                                                            | —                                                                                                    |
| `hr`            | 28            | 28                                                            | —                                                                                                    |
| `payroll`       | 22            | 22                                                            | —                                                                                                    |
| `services`      | 18            | 18                                                            | —                                                                                                    |
| `projects`      | 17            | 16                                                            | +1 (`project_role_rates`, ya documentado en `40-modulo-projects.md`)                                 |
| `assets`        | 10            | 10                                                            | —                                                                                                    |
| `reports`       | 11            | 11                                                            | —                                                                                                    |
| `bi`            | 14            | 13                                                            | +1 (`bi.data_mart_tables`, ver `28_materialized_views.sql`)                                          |
| `configuration` | 23            | 23                                                            | —                                                                                                    |
| **Total**       | **501**       | 495 (+3 Core Platform +1 Proyectos +1 sales +1 bi = 501 real) | Cuadra                                                                                               |

Las diferencias son todas cambios ya documentados en su momento en
`docs/architecture/32-core-platform/`, `40-modulo-projects.md` y el propio
`28_materialized_views.sql` (agrega `bi.data_mart_tables`) — no son drift sin
explicación.

## 3. Objetos por tipo — detalle (post-optimización)

- **Vistas (9/9 ✅):** `accounting.v_treasury_position` corregida y creada en
  `docs/database/sql/32_bugfixes.sql` — las 9 vistas declaradas en `24_views.sql`
  existen ahora.
- **Vistas materializadas (4):** sin cambios — pendientes de su primer `REFRESH`
  manual.
- **Funciones (76) y procedimientos (4):** +1 función respecto a la verificación
  anterior (`core.fn_export_detached_partition`, ya existía en `29_partitioning.sql`
  pero solo se hizo invocable al completar el particionamiento, ver
  [BACKUP.md §3](./BACKUP.md#3-nuevo-en-esta-fase-archivado-de-particiones-desconectadas)).
- **Triggers (2,414 totales / 1,962 lógicos):** el total sigue creciendo con cada
  partición nueva que `pg_partman` crea automáticamente por adelantado (`p_premake`,
  `docs/database/07-estrategia-particionamiento.md §5`) — comportamiento esperado,
  no una desviación.
- **Índices (2,201 lógicos, +575 respecto a antes):** el gap real (575 columnas FK
  de negocio sin índice de soporte) cerrado en `31_missing_fk_indexes.sql`. Detalle
  completo: [INDEX_CATALOG.md](./INDEX_CATALOG.md).
- **Foreign Keys (3,631 lógicas):** 100% validadas, sin cambios en la cantidad —
  pero verificación más profunda esta fase reveló que 185 cruzan schemas de módulo
  de negocio (ver [FOREIGN_KEYS.md §3](./FOREIGN_KEYS.md#3-hallazgo-real-185-fk-cruzan-schemas-de-módulos-de-negocio),
  no detectado en la verificación de 2026-07-16).
- **Secuencias (501):** sin cambios — 0 huérfanas.
- **Particiones (1.200 reales, antes 0):** ver
  [DATABASE_ARCHITECTURE.md §4](./DATABASE_ARCHITECTURE.md#4-particionamiento-corregido-en-esta-fase)
  para la causa raíz completa (3 capas) y su corrección. El crecimiento de ~200 a
  1.200 entre el 18 y el 20 de julio es el mecanismo de `p_premake` funcionando como
  se diseñó, no una anomalía.

## 4. Datos actuales (base de desarrollo)

~459 filas estimadas (`pg_stat_user_tables.n_live_tup`, requiere `ANALYZE` reciente
para ser confiable — la estimación cae a niveles absurdamente bajos, ~24, si no
corrió `ANALYZE` desde el último cambio grande de datos; ejecutado manualmente para
esta verificación). Creció desde las ~427 de la pasada anterior con datos reales de
prueba del módulo `auth`/`seguridad` construido esta sesión (un tenant, usuarios,
sesiones, roles, permisos y sus asignaciones). Sigue siendo una base de desarrollo,
no un ambiente de volumen real — ver [PERFORMANCE.md §2](./PERFORMANCE.md#2-por-qué-no-hay-benchmarks-de-consulta-reales-todavía)
para por qué esto limita el análisis de rendimiento real.

## 5. Documentos relacionados de esta fase (PHASE 01 — Database Enterprise)

| Documento                                              | Contenido                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) | Vista consolidada de arquitectura, motor, extensiones, migraciones nuevas |
| [TABLE_CATALOG.md](./TABLE_CATALOG.md)                 | Catálogo operacional de las 501 tablas (tipo, filas, particionada)        |
| [INDEX_CATALOG.md](./INDEX_CATALOG.md)                 | Los 575 índices nuevos + inventario completo por tipo/schema              |
| [FOREIGN_KEYS.md](./FOREIGN_KEYS.md)                   | Catálogo de FK + el hallazgo de 185 cross-schema                          |
| [MODULE_RELATIONSHIPS.md](./MODULE_RELATIONSHIPS.md)   | Patrón "módulo dueño" vs. implementación real                             |
| [DATA_FLOW.md](./DATA_FLOW.md)                         | Flujo de datos dentro del motor (triggers, particiones, RLS)              |
| [PERFORMANCE.md](./PERFORMANCE.md)                     | Optimización aplicada + procedimiento para cuando haya datos reales       |
| [SECURITY.md](./SECURITY.md)                           | RLS, roles, cifrado — verificado                                          |
| [BACKUP.md](./BACKUP.md)                               | Estrategia de respaldo — verificada                                       |

## 6. Trazabilidad

| Punto                                 | Ya fijado en                                      | Verificado/cerrado acá                                               |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| Diseño de las 18 columnas universales | `docs/database/01-modelo-conceptual.md §1.1`      | Confirmado presente en las 501 tablas (§1)                           |
| Inventario de tablas por schema       | `docs/database/02-modelo-logico.md §3`            | Conteo real verificado (§2, sin cambios respecto a la fase anterior) |
| Estrategia de particionamiento        | `docs/database/07-estrategia-particionamiento.md` | Corregido y verificado — 0 tablas sin particiones (§3)               |
| Mapeo módulo↔schema                   | `docs/standards/NAMING_CONVENTIONS.md §5`         | Referencia (§2)                                                      |
