# Diccionario de datos — schema `reports`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## reports.dashboard_widgets

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| dashboard_id         | `uuid`                     | No       | ``                  |     | reports.dashboards.id         |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| position_order       | `smallint`                 | No       | `0`                 |     |                               |
| chart_type           | `text`                     | No       | `'table'::text`     |     |                               |

## reports.dashboards

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | Sí       | ``                  |     |     |
| branch_id     | `uuid`                     | Sí       | ``                  |     |     |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by    | `uuid`                     | Sí       | ``                  |     |     |
| updated_by    | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |     |
| version       | `integer`                  | No       | `1`                 |     |     |
| row_version   | `bigint`                   | No       | `0`                 |     |     |
| is_active     | `boolean`                  | No       | `true`              |     |     |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |     |
| observations  | `text`                     | Sí       | ``                  |     |     |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| owner_user_id | `uuid`                     | No       | ``                  |     |     |
| name          | `text`                     | No       | ``                  |     |     |

## reports.report_definitions

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | Sí       | ``                  |     |     |
| branch_id       | `uuid`                     | Sí       | ``                  |     |     |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by      | `uuid`                     | Sí       | ``                  |     |     |
| updated_by      | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |     |
| version         | `integer`                  | No       | `1`                 |     |     |
| row_version     | `bigint`                   | No       | `0`                 |     |     |
| is_active       | `boolean`                  | No       | `true`              |     |     |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |     |
| observations    | `text`                     | Sí       | ``                  |     |     |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| name            | `text`                     | No       | ``                  |     |     |
| source_module   | `text`                     | No       | ``                  |     |     |
| base_query_name | `text`                     | No       | ``                  |     |     |
| is_ad_hoc       | `boolean`                  | No       | `false`             |     |     |
| ad_hoc_config   | `jsonb`                    | Sí       | ``                  |     |     |

## reports.report_executions

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| executed_by_user_id  | `uuid`                     | No       | ``                  |     |                               |
| parameters_used      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |

## reports.report_exports

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                           |
| ------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id      | `bigint`                   | No       | ``                  |     |                              |
| tenant_id     | `uuid`                     | No       | ``                  |     |                              |
| company_id    | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                              |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by    | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                              |
| version       | `integer`                  | No       | `1`                 |     |                              |
| row_version   | `bigint`                   | No       | `0`                 |     |                              |
| is_active     | `boolean`                  | No       | `true`              |     |                              |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                              |
| observations  | `text`                     | Sí       | ``                  |     |                              |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| execution_id  | `uuid`                     | No       | ``                  |     | reports.report_executions.id |
| file_id       | `uuid`                     | No       | ``                  |     |                              |
| export_format | `text`                     | No       | ``                  |     |                              |

## reports.report_favorites

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| user_id              | `uuid`                     | No       | ``                  |     |                               |

## reports.report_parameters

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| parameter_key        | `text`                     | No       | ``                  |     |                               |
| data_type            | `text`                     | No       | ``                  |     |                               |

## reports.report_schedule_recipients

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                          |
| ------------ | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id     | `bigint`                   | No       | ``                  |     |                             |
| tenant_id    | `uuid`                     | No       | ``                  |     |                             |
| company_id   | `uuid`                     | Sí       | ``                  |     |                             |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                             |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by   | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                             |
| version      | `integer`                  | No       | `1`                 |     |                             |
| row_version  | `bigint`                   | No       | `0`                 |     |                             |
| is_active    | `boolean`                  | No       | `true`              |     |                             |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                             |
| observations | `text`                     | Sí       | ``                  |     |                             |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| schedule_id  | `uuid`                     | No       | ``                  |     | reports.report_schedules.id |
| user_id      | `uuid`                     | No       | ``                  |     |                             |

## reports.report_schedules

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | No       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| cron_expression      | `text`                     | No       | ``                  |     |                               |

## reports.report_template_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                          |
| ------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id      | `bigint`                   | No       | ``                  |     |                             |
| tenant_id     | `uuid`                     | No       | ``                  |     |                             |
| company_id    | `uuid`                     | Sí       | ``                  |     |                             |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                             |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by    | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                             |
| version       | `integer`                  | No       | `1`                 |     |                             |
| row_version   | `bigint`                   | No       | `0`                 |     |                             |
| is_active     | `boolean`                  | No       | `true`              |     |                             |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                             |
| observations  | `text`                     | Sí       | ``                  |     |                             |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| template_id   | `uuid`                     | No       | ``                  |     | reports.report_templates.id |
| language_code | `text`                     | No       | ``                  |     |                             |
| layout_html   | `text`                     | No       | ``                  |     |                             |

## reports.report_templates

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| report_definition_id | `uuid`                     | No       | ``                  |     | reports.report_definitions.id |
| layout_html          | `text`                     | No       | ``                  |     |                               |
