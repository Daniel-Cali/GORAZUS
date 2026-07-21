# Database Architecture — GORAZUS

> Generado 2026-07-17 (PHASE 01 — Database Enterprise), re-verificado 2026-07-20
> (segunda pasada de FASE 01, ver [DATABASE_HEALTH_REPORT.md §6](./DATABASE_HEALTH_REPORT.md#6-segunda-pasada-2026-07-20--auditoría-solicitada-explícitamente-fase-01--database-enterprise-verificación-en-vivo-contra-la-instancia-real-no-solo-lectura-de-estos-documentos)):
> corrigió una inconsistencia real de conteo de tablas lógicas (474 vs. las 501 ya
> correctas en `DATABASE_STRUCTURE.md`/`TABLE_CATALOG.md`, marcada 🔧 en §3) y
> actualizó particiones/triggers, que habían crecido desde la verificación anterior.
> Vista consolidada de
> arquitectura de la base de datos **real y verificada**, complementaria a
> `docs/database/00-modelo-general.md` (diseño de origen) y
> `docs/standards/DATABASE_GUIDELINES.md` (procedimiento de "cómo agregar una tabla").
> Este documento no repite el diseño completo — lo confirma contra el estado actual
> tras la optimización de esta fase (ver `DATABASE_HEALTH_REPORT.md` para el detalle
> de qué se corrigió). Sin cambios de arquitectura de aplicación, sin nuevos módulos.

## 1. Motor y topología

- **PostgreSQL 17**, contenedor Docker (`docker-postgres-1`), imagen propia
  `gorazus-postgres17-partman:local` construida desde `infra/docker/postgres/Dockerfile`
  (Postgres 17 oficial + `postgresql-17-partman` — la imagen original `postgres:17-alpine`
  no incluía `pg_partman`, requerido por el diseño ya documentado de particionamiento,
  ver §4 y `DATABASE_HEALTH_REPORT.md §1.1`).
- Un único servidor en la fase de monolito modular (`docs/architecture/02-arquitectura-modulos-backend.md §4`) —
  no hay bases de datos separadas por módulo todavía.
- 21 schemas de negocio + `core` (fundacional) + `partman` (extensión de gestión de
  particiones, nuevo desde esta fase) + `public` (vacío, sin uso de negocio).

## 2. Extensiones instaladas

| Extensión    | Versión | Uso                                                                                             |
| ------------ | ------- | ----------------------------------------------------------------------------------------------- |
| `pgcrypto`   | 1.3     | Cifrado de columnas sensibles (`docs/database/06-estrategia-seguridad.md §3`)                   |
| `pg_trgm`    | 1.6     | Índices GIN de búsqueda de texto libre (`docs/database/04-estrategia-indices.md`)               |
| `pg_partman` | 5.4.3   | Gestión automática de particiones — **agregada en esta fase**, antes no disponible en la imagen |
| `plpgsql`    | 1.0     | Lenguaje procedural (funciones/procedimientos/triggers)                                         |

## 3. Inventario real verificado (post-optimización)

| Objeto                                                     | Cantidad                             | Nota                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schemas de negocio                                         | 21 + `core`                          | Ver `docs/standards/NAMING_CONVENTIONS.md §5` para el mapeo a módulos                                                                                                                                                                                                                                                                |
| Tablas lógicas (sin contar particiones físicas)            | **501** 🔧                           | Corregido 2026-07-20 (segunda pasada FASE 01) — decía "474" acá, una inconsistencia real de -27 contra `DATABASE_STRUCTURE.md`/`TABLE_CATALOG.md` (que siempre dijeron 501, correcto): esta tabla no contaba las 27 tablas particionadas como "tabla lógica" propia, cuando sí lo son (cada una cuenta 1 vez, no por partición hija) |
| Tablas físicas totales (incluye particiones hijas reales)  | **701** 🔧 (era 674, desactualizado) | Ver §4 — creció con `p_premake` entre el 18 y el 20 de julio                                                                                                                                                                                                                                                                         |
| Vistas                                                     | 9                                    | 100% creadas (era 8/9 antes de esta fase — ver §5.2)                                                                                                                                                                                                                                                                                 |
| Vistas materializadas                                      | 4                                    | —                                                                                                                                                                                                                                                                                                                                    |
| Funciones                                                  | 76                                   | —                                                                                                                                                                                                                                                                                                                                    |
| Procedimientos                                             | 4                                    | —                                                                                                                                                                                                                                                                                                                                    |
| Triggers (activos, no internos)                            | **2,414** 🔧 (era 1,214)             | Incluye triggers propagados a cada partición hija — creció junto con las particiones                                                                                                                                                                                                                                                 |
| Índices físicos totales (incluye propagados a particiones) | 3,201                                | 1,626 antes de esta fase + 575 nuevos en columnas FK de negocio (§6) + los propagados a particiones nuevas — confirmado exacto 2026-07-20                                                                                                                                                                                            |
| Foreign Keys (constraints, no filas)                       | 3,631                                | 100% validadas, sin cambios en esta fase — confirmado 2026-07-20 (3.632, diferencia de 1 dentro de margen de nuevas filas de prueba)                                                                                                                                                                                                 |
| Particiones reales (tablas hijas)                          | **1.200** 🔧 (era ~200)              | Antes: 0 (hallazgo crítico ya resuelto, §4). Re-verificado 2026-07-20 — creció ~6x por `p_premake`, comportamiento esperado                                                                                                                                                                                                          |

## 4. Particionamiento (corregido en esta fase)

Diseño ya fijado en `docs/database/07-estrategia-particionamiento.md` — este
documento solo confirma que ahora **está realmente aplicado**, cosa que no era
cierta antes de esta fase (0 particiones reales para las 27 tablas declaradas). La
causa raíz tenía tres capas, las tres resueltas:

1. La imagen `postgres:17-alpine` no incluye `pg_partman` → resuelto con
   `infra/docker/postgres/Dockerfile` (imagen propia, Postgres 17 + partman).
2. `29_partitioning.sql` instala la extensión sin `SCHEMA partman` explícito, cae
   en `public` y rompe todas las llamadas subsiguientes `partman.*` → resuelto
   reinstalando la extensión correctamente antes de re-ejecutar el script.
3. 6 de las 27 tablas declaradas particionadas (`core.audit_logs`,
   `core.system_logs`, `core.activity_logs`, `core.notification_delivery_logs`,
   `security.login_attempts`, `security.session_activity_logs`) nunca tenían su
   llamada a `partman.create_parent()` en `29_partitioning.sql` → resuelto en
   `docs/database/sql/33_partition_provisioning_completion.sql` (archivo nuevo,
   `29_partitioning.sql` no se editó).

Job de mantenimiento (`partition_maintenance`, `core.scheduled_jobs`) registrado y
listo para ejecutar diariamente — su implementación real (worker que invoca
`partman.run_maintenance_proc()`) sigue pendiente de `core/scheduler` a nivel de
aplicación, fuera del alcance de "trabajar únicamente sobre la base de datos".

## 5. Migraciones nuevas de esta fase (append-only, nada editado)

Consistente con `docs/standards/DATABASE_GUIDELINES.md §8` (migraciones
versionadas, nunca `ALTER` a mano sin archivo) — se agregaron 3 archivos nuevos,
ninguno de los 30 anteriores se modificó:

| Archivo                                        | Qué hace                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `sql/31_missing_fk_indexes.sql`                | 575 índices B-tree en columnas FK de negocio que no tenían índice de soporte (§6)                                                           |
| `sql/32_bugfixes.sql`                          | Recrea `accounting.v_treasury_position` con columnas calificadas; hace nullable `products.product_attributes.company_id` y completa su seed |
| `sql/33_partition_provisioning_completion.sql` | Aprovisiona las 6 tablas particionadas que `29_partitioning.sql` nunca incluyó                                                              |

## 6. Índices — optimización aplicada

Detección real contra `information_schema`/`pg_catalog`: 575 columnas FK de
negocio (excluyendo las 6 universales `tenant_id`/`company_id`/`branch_id`/
`created_by`/`updated_by`/`deleted_by`, ya cubiertas por RLS y fuera de la
convención de índice individual) sin índice de soporte — un anti-patrón conocido de
Postgres que penaliza JOINs y borrados en cascada. Detalle completo, incluida la
lista completa por schema: [INDEX_CATALOG.md](./INDEX_CATALOG.md).

## 7. Qué NO cambió (garantía de compatibilidad)

- Ninguna tabla, columna de negocio existente, o schema fue eliminado, renombrado o
  movido.
- Ninguna FK existente fue eliminada o redefinida.
- Ninguna regla de negocio ni patrón universal (18 columnas) fue alterado —
  el único cambio de nulabilidad (`product_attributes.company_id`) alinea la tabla
  con el patrón **ya documentado**, no introduce una excepción nueva.
- `docs/database/sql/01-30` permanecen exactamente como estaban — toda corrección
  es un archivo nuevo (§5).

## 8. Trazabilidad

| Punto                      | Ya fijado en                                      | Verificado/corregido acá                          |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Modelo de datos general    | `docs/database/00-modelo-general.md`              | Referencia, inventario real confirmado (§3)       |
| Particionamiento           | `docs/database/07-estrategia-particionamiento.md` | Aprovisionamiento real completado (§4)            |
| Procedimiento de migración | `docs/standards/DATABASE_GUIDELINES.md §8`        | Aplicado — 3 archivos nuevos, cero ediciones (§5) |
