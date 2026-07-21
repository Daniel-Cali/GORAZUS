# Database Dictionary — GORAZUS

> Índice del diccionario de datos, generado automáticamente por consulta directa a
> `information_schema`/`pg_catalog` contra la base `gorazus` real (Postgres 17) —
> no escrito a mano. Mismo criterio de organización que `docs/database/logico/`
> (un archivo por schema, no un único archivo de miles de líneas): ese set describe
> el **propósito de negocio** de cada tabla; este describe el **detalle técnico
> exacto de cada columna** (tipo, nullable, default, PK, FK, índices) tal como existe
> hoy en la base real. Donde diverjan, ver
> [DATABASE_HEALTH_REPORT.md](./DATABASE_HEALTH_REPORT.md).

## Cómo se generó

```sql
SELECT c.table_schema, c.table_name, c.ordinal_position, c.column_name,
       c.data_type, c.character_maximum_length, c.numeric_precision, c.numeric_scale,
       c.is_nullable, c.column_default,
       (existe en pg_constraint como PK) AS is_pk,
       (existe en pg_constraint como FK, con su tabla.columna referenciada) AS fk_ref
FROM information_schema.columns c
WHERE c.table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;
```

Ejecutada contra el contenedor `docker-postgres-1` (ver
[DATABASE_VISUALIZATION.md §5](./DATABASE_VISUALIZATION.md#5-prerrequisito-postgres-corriendo)
para cómo levantarlo), resultado exportado a CSV y agrupado en markdown por
schema/tabla. **Para regenerar** tras un cambio de schema: repetir esta consulta —
nunca editar los archivos de `dictionary/` a mano, son un derivado, igual que los
diagramas de `docs/database/erd/`.

## Archivos por schema

| Schema          | Archivo                                                            | Tablas |
| --------------- | ------------------------------------------------------------------ | ------ |
| `core`          | [dictionary/01-core.md](./dictionary/01-core.md)                   | 68     |
| `security`      | [dictionary/02-security.md](./dictionary/02-security.md)           | 24     |
| `customers`     | [dictionary/03-customers.md](./dictionary/03-customers.md)         | 18     |
| `suppliers`     | [dictionary/04-suppliers.md](./dictionary/04-suppliers.md)         | 13     |
| `products`      | [dictionary/05-products.md](./dictionary/05-products.md)           | 35     |
| `inventory`     | [dictionary/06-inventory.md](./dictionary/06-inventory.md)         | 34     |
| `sales`         | [dictionary/07-sales.md](./dictionary/07-sales.md)                 | 55     |
| `purchases`     | [dictionary/08-purchases.md](./dictionary/08-purchases.md)         | 27     |
| `cash`          | [dictionary/09-cash.md](./dictionary/09-cash.md)                   | 11     |
| `banks`         | [dictionary/10-banks.md](./dictionary/10-banks.md)                 | 14     |
| `accounting`    | [dictionary/11-accounting.md](./dictionary/11-accounting.md)       | 28     |
| `taxes`         | [dictionary/12-taxes.md](./dictionary/12-taxes.md)                 | 13     |
| `crm`           | [dictionary/13-crm.md](./dictionary/13-crm.md)                     | 17     |
| `hr`            | [dictionary/14-hr.md](./dictionary/14-hr.md)                       | 28     |
| `payroll`       | [dictionary/15-payroll.md](./dictionary/15-payroll.md)             | 22     |
| `services`      | [dictionary/16-services.md](./dictionary/16-services.md)           | 18     |
| `projects`      | [dictionary/17-projects.md](./dictionary/17-projects.md)           | 17     |
| `assets`        | [dictionary/18-assets.md](./dictionary/18-assets.md)               | 10     |
| `reports`       | [dictionary/19-reports.md](./dictionary/19-reports.md)             | 11     |
| `bi`            | [dictionary/20-bi.md](./dictionary/20-bi.md)                       | 14     |
| `configuration` | [dictionary/21-configuration.md](./dictionary/21-configuration.md) | 23     |

Numeración idéntica a `docs/database/logico/` a propósito — mismo schema, mismo
número, para que sea trivial cruzar el propósito de negocio (`logico/07-sales.md`)
contra el detalle técnico (`dictionary/07-sales.md`) de la misma tabla.

## Formato de cada entrada de tabla

```markdown
### schema.nombre_tabla

| Columna   | Tipo | Nullable | Default           | PK  | FK              |
| --------- | ---- | -------- | ----------------- | --- | --------------- |
| id        | uuid | NO       | gen_random_uuid() | ✅  | —               |
| tenant_id | uuid | NO       | —                 | —   | core.tenants.id |
| ...       | ...  | ...      | ...               | ... | ...             |
```

Las 18 columnas universales (`id`, `local_id`, `tenant_id`, `company_id`,
`branch_id`, `created_at/by`, `updated_at/by`, `deleted_at/by`, `version`,
`row_version`, `is_active`, `is_deleted`, `observations`, `metadata`) aparecen en
**todas** las tablas — ver su significado una sola vez en
`docs/database/01-modelo-conceptual.md §1.1`, no repetido en cada entrada de este
diccionario.

## Trazabilidad

| Punto pedido en el EPIC                                              | Cerrado en                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Diccionario de datos automático                                      | Este documento + `dictionary/*.md` (21 archivos)                                                                    |
| Tabla, descripción, campos, tipo, nullable, default, PK, FK, índices | Formato de §"Formato de cada entrada" — descripción de negocio referida a `docs/database/logico/`, no duplicada acá |
