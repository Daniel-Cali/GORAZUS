# Diccionario de datos — schema `assets`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## assets.asset_categories

| Columna                        | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id                       | `bigint`                   | No       | ``                  |     |                                |
| tenant_id                      | `uuid`                     | No       | ``                  |     |                                |
| company_id                     | `uuid`                     | No       | ``                  |     |                                |
| branch_id                      | `uuid`                     | Sí       | ``                  |     |                                |
| created_at                     | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at                     | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at                     | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by                     | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by                     | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by                     | `uuid`                     | Sí       | ``                  |     |                                |
| version                        | `integer`                  | No       | `1`                 |     |                                |
| row_version                    | `bigint`                   | No       | `0`                 |     |                                |
| is_active                      | `boolean`                  | No       | `true`              |     |                                |
| is_deleted                     | `boolean`                  | Sí       | ``                  |     |                                |
| observations                   | `text`                     | Sí       | ``                  |     |                                |
| metadata                       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| name                           | `text`                     | No       | ``                  |     |                                |
| default_depreciation_method_id | `uuid`                     | Sí       | ``                  |     | assets.depreciation_methods.id |
| default_useful_life_months     | `integer`                  | Sí       | ``                  |     |                                |

## assets.asset_custodian_history

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                     |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id          | `bigint`                   | No       | ``                  |     |                        |
| tenant_id         | `uuid`                     | No       | ``                  |     |                        |
| company_id        | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                        |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by        | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                        |
| version           | `integer`                  | No       | `1`                 |     |                        |
| row_version       | `bigint`                   | No       | `0`                 |     |                        |
| is_active         | `boolean`                  | No       | `true`              |     |                        |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                        |
| observations      | `text`                     | Sí       | ``                  |     |                        |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| asset_id          | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id |
| custodian_user_id | `uuid`                     | No       | ``                  |     |                        |

## assets.asset_depreciation_entries

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     |                        |
| company_id       | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                        |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                        |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| asset_id         | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id |
| fiscal_period_id | `uuid`                     | No       | ``                  |     |                        |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                        |

## assets.asset_disposals

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                     |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id       | `bigint`                   | No       | ``                  |     |                        |
| tenant_id      | `uuid`                     | No       | ``                  |     |                        |
| company_id     | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                        |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by     | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                        |
| version        | `integer`                  | No       | `1`                 |     |                        |
| row_version    | `bigint`                   | No       | `0`                 |     |                        |
| is_active      | `boolean`                  | No       | `true`              |     |                        |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                        |
| observations   | `text`                     | Sí       | ``                  |     |                        |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| asset_id       | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id |
| disposal_type  | `text`                     | No       | ``                  |     |                        |
| residual_value | `numeric(18,4)`            | No       | `0`                 |     |                        |

## assets.asset_maintenance_types

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | Sí       | ``                  |     |     |
| branch_id    | `uuid`                     | Sí       | ``                  |     |     |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by   | `uuid`                     | Sí       | ``                  |     |     |
| updated_by   | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |     |
| version      | `integer`                  | No       | `1`                 |     |     |
| row_version  | `bigint`                   | No       | `0`                 |     |     |
| is_active    | `boolean`                  | No       | `true`              |     |     |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |     |
| observations | `text`                     | Sí       | ``                  |     |     |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| code         | `text`                     | No       | ``                  |     |     |

## assets.asset_maintenances

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                                |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id            | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id           | `uuid`                     | No       | ``                  |     |                                   |
| company_id          | `uuid`                     | Sí       | ``                  |     |                                   |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                                   |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                                   |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                                   |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                                   |
| created_by          | `uuid`                     | Sí       | ``                  |     |                                   |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                                   |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                                   |
| version             | `integer`                  | No       | `1`                 |     |                                   |
| row_version         | `bigint`                   | No       | `0`                 |     |                                   |
| is_active           | `boolean`                  | No       | `true`              |     |                                   |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                                   |
| observations        | `text`                     | Sí       | ``                  |     |                                   |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                   |
| asset_id            | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id            |
| maintenance_type_id | `uuid`                     | No       | ``                  |     | assets.asset_maintenance_types.id |
| cost                | `numeric(18,4)`            | Sí       | ``                  |     |                                   |

## assets.asset_revaluations

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id            | `bigint`                   | No       | ``                  |     |                        |
| tenant_id           | `uuid`                     | No       | ``                  |     |                        |
| company_id          | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                        |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by          | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                        |
| version             | `integer`                  | No       | `1`                 |     |                        |
| row_version         | `bigint`                   | No       | `0`                 |     |                        |
| is_active           | `boolean`                  | No       | `true`              |     |                        |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                        |
| observations        | `text`                     | Sí       | ``                  |     |                        |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| asset_id            | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id |
| new_value           | `numeric(18,4)`            | No       | ``                  |     |                        |
| approved_by_user_id | `uuid`                     | No       | ``                  |     |                        |

## assets.asset_transfers

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                     |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id       | `bigint`                   | No       | ``                  |     |                        |
| tenant_id      | `uuid`                     | No       | ``                  |     |                        |
| company_id     | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                        |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by     | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                        |
| version        | `integer`                  | No       | `1`                 |     |                        |
| row_version    | `bigint`                   | No       | `0`                 |     |                        |
| is_active      | `boolean`                  | No       | `true`              |     |                        |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                        |
| observations   | `text`                     | Sí       | ``                  |     |                        |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| asset_id       | `uuid`                     | No       | ``                  |     | assets.fixed_assets.id |
| from_branch_id | `uuid`                     | Sí       | ``                  |     |                        |
| to_branch_id   | `uuid`                     | Sí       | ``                  |     |                        |

## assets.depreciation_methods

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | Sí       | ``                  |     |     |
| branch_id    | `uuid`                     | Sí       | ``                  |     |     |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by   | `uuid`                     | Sí       | ``                  |     |     |
| updated_by   | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |     |
| version      | `integer`                  | No       | `1`                 |     |     |
| row_version  | `bigint`                   | No       | `0`                 |     |     |
| is_active    | `boolean`                  | No       | `true`              |     |     |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |     |
| observations | `text`                     | Sí       | ``                  |     |     |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| code         | `text`                     | No       | ``                  |     |     |

## assets.fixed_assets

| Columna                         | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id                        | `bigint`                   | No       | ``                  |     |                            |
| tenant_id                       | `uuid`                     | No       | ``                  |     |                            |
| company_id                      | `uuid`                     | No       | ``                  |     |                            |
| branch_id                       | `uuid`                     | Sí       | ``                  |     |                            |
| created_at                      | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at                      | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at                      | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by                      | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by                      | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by                      | `uuid`                     | Sí       | ``                  |     |                            |
| version                         | `integer`                  | No       | `1`                 |     |                            |
| row_version                     | `bigint`                   | No       | `0`                 |     |                            |
| is_active                       | `boolean`                  | No       | `true`              |     |                            |
| is_deleted                      | `boolean`                  | Sí       | ``                  |     |                            |
| observations                    | `text`                     | Sí       | ``                  |     |                            |
| metadata                        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| name                            | `text`                     | No       | ``                  |     |                            |
| category_id                     | `uuid`                     | No       | ``                  |     | assets.asset_categories.id |
| source_purchase_invoice_line_id | `uuid`                     | Sí       | ``                  |     |                            |
| acquisition_cost                | `numeric(18,4)`            | No       | ``                  |     |                            |
| acquisition_date                | `date`                     | No       | ``                  |     |                            |
| current_custodian_user_id       | `uuid`                     | Sí       | ``                  |     |                            |
