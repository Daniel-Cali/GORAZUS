# Diccionario de datos — schema `accounting`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## accounting.account_reconciliations

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                              |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id           | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                 |
| company_id         | `uuid`                     | No       | ``                  |     |                                 |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                 |
| version            | `integer`                  | No       | `1`                 |     |                                 |
| row_version        | `bigint`                   | No       | `0`                 |     |                                 |
| is_active          | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                 |
| observations       | `text`                     | Sí       | ``                  |     |                                 |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| account_id         | `uuid`                     | No       | ``                  |     | accounting.chart_of_accounts.id |
| reconciled_balance | `numeric(18,4)`            | No       | ``                  |     |                                 |
| subledger_balance  | `numeric(18,4)`            | No       | ``                  |     |                                 |

## accounting.account_types

| Columna        | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id       | `bigint`                   | No       | ``                  |     |     |
| tenant_id      | `uuid`                     | No       | ``                  |     |     |
| company_id     | `uuid`                     | Sí       | ``                  |     |     |
| branch_id      | `uuid`                     | Sí       | ``                  |     |     |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by     | `uuid`                     | Sí       | ``                  |     |     |
| updated_by     | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |     |
| version        | `integer`                  | No       | `1`                 |     |     |
| row_version    | `bigint`                   | No       | `0`                 |     |     |
| is_active      | `boolean`                  | No       | `true`              |     |     |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |     |
| observations   | `text`                     | Sí       | ``                  |     |     |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| code           | `text`                     | No       | ``                  |     |     |
| normal_balance | `text`                     | No       | ``                  |     |     |

## accounting.accounting_dimension_values

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                                  |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                     |
| local_id     | `bigint`                   | No       | ``                  |     |                                     |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                     |
| company_id   | `uuid`                     | Sí       | ``                  |     |                                     |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                     |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                                     |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                     |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                     |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                     |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                     |
| version      | `integer`                  | No       | `1`                 |     |                                     |
| row_version  | `bigint`                   | No       | `0`                 |     |                                     |
| is_active    | `boolean`                  | No       | `true`              |     |                                     |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                     |
| observations | `text`                     | Sí       | ``                  |     |                                     |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                     |
| dimension_id | `uuid`                     | No       | ``                  |     | accounting.accounting_dimensions.id |
| code         | `text`                     | No       | ``                  |     |                                     |

## accounting.accounting_dimensions

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| name         | `text`                     | No       | ``                  |     |     |

## accounting.accounting_rule_lines

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                              |
| -------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id       | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id      | `uuid`                     | No       | ``                  |     |                                 |
| company_id     | `uuid`                     | Sí       | ``                  |     |                                 |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by     | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                                 |
| version        | `integer`                  | No       | `1`                 |     |                                 |
| row_version    | `bigint`                   | No       | `0`                 |     |                                 |
| is_active      | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                                 |
| observations   | `text`                     | Sí       | ``                  |     |                                 |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| rule_id        | `uuid`                     | No       | ``                  |     | accounting.accounting_rules.id  |
| account_id     | `uuid`                     | No       | ``                  |     | accounting.chart_of_accounts.id |
| entry_side     | `text`                     | No       | ``                  |     |                                 |
| amount_formula | `text`                     | No       | ``                  |     |                                 |

## accounting.accounting_rules

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| event_code   | `text`                     | No       | ``                  |     |     |

## accounting.balance_sheet_snapshots

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                           |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id         | `bigint`                   | No       | ``                  |     |                              |
| tenant_id        | `uuid`                     | No       | ``                  |     |                              |
| company_id       | `uuid`                     | No       | ``                  |     |                              |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                              |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by       | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                              |
| version          | `integer`                  | No       | `1`                 |     |                              |
| row_version      | `bigint`                   | No       | `0`                 |     |                              |
| is_active        | `boolean`                  | No       | `true`              |     |                              |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                              |
| observations     | `text`                     | Sí       | ``                  |     |                              |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| fiscal_period_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id |
| snapshot_data    | `jsonb`                    | No       | ``                  |     |                              |

## accounting.budget_lines

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                              |
| --------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id        | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                 |
| company_id      | `uuid`                     | Sí       | ``                  |     |                                 |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| version         | `integer`                  | No       | `1`                 |     |                                 |
| row_version     | `bigint`                   | No       | `0`                 |     |                                 |
| is_active       | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                 |
| observations    | `text`                     | Sí       | ``                  |     |                                 |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| budget_id       | `uuid`                     | No       | ``                  |     | accounting.budgets.id           |
| account_id      | `uuid`                     | No       | ``                  |     | accounting.chart_of_accounts.id |
| period_number   | `smallint`                 | No       | ``                  |     |                                 |
| budgeted_amount | `numeric(18,4)`            | No       | ``                  |     |                                 |

## accounting.budgets

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id       | `bigint`                   | No       | ``                  |     |                            |
| tenant_id      | `uuid`                     | No       | ``                  |     |                            |
| company_id     | `uuid`                     | No       | ``                  |     |                            |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                            |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by     | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                            |
| version        | `integer`                  | No       | `1`                 |     |                            |
| row_version    | `bigint`                   | No       | `0`                 |     |                            |
| is_active      | `boolean`                  | No       | `true`              |     |                            |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                            |
| observations   | `text`                     | Sí       | ``                  |     |                            |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| fiscal_year_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_years.id |
| cost_center_id | `uuid`                     | Sí       | ``                  |     | accounting.cost_centers.id |
| name           | `text`                     | No       | ``                  |     |                            |

## accounting.cash_flow_snapshots

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                           |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id         | `bigint`                   | No       | ``                  |     |                              |
| tenant_id        | `uuid`                     | No       | ``                  |     |                              |
| company_id       | `uuid`                     | No       | ``                  |     |                              |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                              |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by       | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                              |
| version          | `integer`                  | No       | `1`                 |     |                              |
| row_version      | `bigint`                   | No       | `0`                 |     |                              |
| is_active        | `boolean`                  | No       | `true`              |     |                              |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                              |
| observations     | `text`                     | Sí       | ``                  |     |                              |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| fiscal_period_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id |
| snapshot_data    | `jsonb`                    | No       | ``                  |     |                              |

## accounting.chart_of_accounts

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                              |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id          | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                 |
| company_id        | `uuid`                     | No       | ``                  |     |                                 |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by        | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                                 |
| version           | `integer`                  | No       | `1`                 |     |                                 |
| row_version       | `bigint`                   | No       | `0`                 |     |                                 |
| is_active         | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                 |
| observations      | `text`                     | Sí       | ``                  |     |                                 |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| code              | `text`                     | No       | ``                  |     |                                 |
| name              | `text`                     | No       | ``                  |     |                                 |
| account_type_id   | `uuid`                     | No       | ``                  |     | accounting.account_types.id     |
| parent_account_id | `uuid`                     | Sí       | ``                  |     | accounting.chart_of_accounts.id |
| accepts_postings  | `boolean`                  | No       | `true`              |     |                                 |

## accounting.consolidated_financial_snapshots

| Columna             | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id            | `bigint`                   | No       | ``                  |     |     |
| tenant_id           | `uuid`                     | No       | ``                  |     |     |
| company_id          | `uuid`                     | Sí       | ``                  |     |     |
| branch_id           | `uuid`                     | Sí       | ``                  |     |     |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by          | `uuid`                     | Sí       | ``                  |     |     |
| updated_by          | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |     |
| version             | `integer`                  | No       | `1`                 |     |     |
| row_version         | `bigint`                   | No       | `0`                 |     |     |
| is_active           | `boolean`                  | No       | `true`              |     |     |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |     |
| observations        | `text`                     | Sí       | ``                  |     |     |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| consolidation_label | `text`                     | No       | ``                  |     |     |
| snapshot_data       | `jsonb`                    | No       | ``                  |     |     |

## accounting.cost_centers

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| name         | `text`                     | No       | ``                  |     |     |

## accounting.currency_revaluations

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                           |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id         | `bigint`                   | No       | ``                  |     |                              |
| tenant_id        | `uuid`                     | No       | ``                  |     |                              |
| company_id       | `uuid`                     | No       | ``                  |     |                              |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                              |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by       | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                              |
| version          | `integer`                  | No       | `1`                 |     |                              |
| row_version      | `bigint`                   | No       | `0`                 |     |                              |
| is_active        | `boolean`                  | No       | `true`              |     |                              |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                              |
| observations     | `text`                     | Sí       | ``                  |     |                              |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| fiscal_period_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id |
| journal_entry_id | `uuid`                     | Sí       | ``                  |     |                              |

## accounting.fiscal_periods

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id       | `bigint`                   | No       | ``                  |     |                            |
| tenant_id      | `uuid`                     | No       | ``                  |     |                            |
| company_id     | `uuid`                     | No       | ``                  |     |                            |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                            |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by     | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                            |
| version        | `integer`                  | No       | `1`                 |     |                            |
| row_version    | `bigint`                   | No       | `0`                 |     |                            |
| is_active      | `boolean`                  | No       | `true`              |     |                            |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                            |
| observations   | `text`                     | Sí       | ``                  |     |                            |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| fiscal_year_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_years.id |
| period_number  | `smallint`                 | No       | ``                  |     |                            |
| starts_on      | `date`                     | No       | ``                  |     |                            |
| ends_on        | `date`                     | No       | ``                  |     |                            |
| status         | `text`                     | No       | `'open'::text`      |     |                            |

## accounting.fiscal_years

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| year_label   | `text`                     | No       | ``                  |     |     |
| starts_on    | `date`                     | No       | ``                  |     |     |
| ends_on      | `date`                     | No       | ``                  |     |     |
| is_closed    | `boolean`                  | No       | `false`             |     |     |

## accounting.ifrs_adjustments

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK  |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                | `bigint`                   | No       | ``                  |     |     |
| tenant_id               | `uuid`                     | No       | ``                  |     |     |
| company_id              | `uuid`                     | Sí       | ``                  |     |     |
| branch_id               | `uuid`                     | Sí       | ``                  |     |     |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by              | `uuid`                     | Sí       | ``                  |     |     |
| updated_by              | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |     |
| version                 | `integer`                  | No       | `1`                 |     |     |
| row_version             | `bigint`                   | No       | `0`                 |     |     |
| is_active               | `boolean`                  | No       | `true`              |     |     |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |     |
| observations            | `text`                     | Sí       | ``                  |     |     |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| journal_entry_id        | `uuid`                     | No       | ``                  |     |     |
| ifrs_standard_reference | `text`                     | Sí       | ``                  |     |     |

## accounting.income_statement_snapshots

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                           |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id         | `bigint`                   | No       | ``                  |     |                              |
| tenant_id        | `uuid`                     | No       | ``                  |     |                              |
| company_id       | `uuid`                     | No       | ``                  |     |                              |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                              |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by       | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                              |
| version          | `integer`                  | No       | `1`                 |     |                              |
| row_version      | `bigint`                   | No       | `0`                 |     |                              |
| is_active        | `boolean`                  | No       | `true`              |     |                              |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                              |
| observations     | `text`                     | Sí       | ``                  |     |                              |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| fiscal_period_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id |
| snapshot_data    | `jsonb`                    | No       | ``                  |     |                              |

## accounting.intercompany_transactions

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK  |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                | `bigint`                   | No       | ``                  |     |     |
| tenant_id               | `uuid`                     | No       | ``                  |     |     |
| company_id              | `uuid`                     | Sí       | ``                  |     |     |
| branch_id               | `uuid`                     | Sí       | ``                  |     |     |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by              | `uuid`                     | Sí       | ``                  |     |     |
| updated_by              | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |     |
| version                 | `integer`                  | No       | `1`                 |     |     |
| row_version             | `bigint`                   | No       | `0`                 |     |     |
| is_active               | `boolean`                  | No       | `true`              |     |     |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |     |
| observations            | `text`                     | Sí       | ``                  |     |     |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| source_company_id       | `uuid`                     | No       | ``                  |     |     |
| target_company_id       | `uuid`                     | No       | ``                  |     |     |
| source_journal_entry_id | `uuid`                     | Sí       | ``                  |     |     |
| target_journal_entry_id | `uuid`                     | Sí       | ``                  |     |     |
| amount                  | `numeric(18,4)`            | No       | ``                  |     |     |

## accounting.journal_entries

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                 |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id         | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                    |
| company_id       | `uuid`                     | No       | ``                  |     |                                    |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| version          | `integer`                  | No       | `1`                 |     |                                    |
| row_version      | `bigint`                   | No       | `0`                 |     |                                    |
| is_active        | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                    |
| observations     | `text`                     | Sí       | ``                  |     |                                    |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| document_number  | `text`                     | No       | ``                  |     |                                    |
| fiscal_period_id | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id       |
| status_id        | `uuid`                     | No       | ``                  |     | accounting.journal_entry_status.id |
| source_module    | `text`                     | Sí       | ``                  |     |                                    |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                                    |
| posting_date     | `date`                     | No       | `CURRENT_DATE`      | PK  |                                    |
| description      | `text`                     | Sí       | ``                  |     |                                    |

## accounting.journal_entry_dimension_values

| Columna               | Tipo                       | Nullable | Default             | PK  | FK                                        |
| --------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------------------- |
| id                    | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                           |
| local_id              | `bigint`                   | No       | ``                  |     |                                           |
| tenant_id             | `uuid`                     | No       | ``                  |     |                                           |
| company_id            | `uuid`                     | Sí       | ``                  |     |                                           |
| branch_id             | `uuid`                     | Sí       | ``                  |     |                                           |
| created_at            | `timestamp with time zone` | No       | `now()`             |     |                                           |
| updated_at            | `timestamp with time zone` | No       | `now()`             |     |                                           |
| deleted_at            | `timestamp with time zone` | Sí       | ``                  |     |                                           |
| created_by            | `uuid`                     | Sí       | ``                  |     |                                           |
| updated_by            | `uuid`                     | Sí       | ``                  |     |                                           |
| deleted_by            | `uuid`                     | Sí       | ``                  |     |                                           |
| version               | `integer`                  | No       | `1`                 |     |                                           |
| row_version           | `bigint`                   | No       | `0`                 |     |                                           |
| is_active             | `boolean`                  | No       | `true`              |     |                                           |
| is_deleted            | `boolean`                  | Sí       | ``                  |     |                                           |
| observations          | `text`                     | Sí       | ``                  |     |                                           |
| metadata              | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                           |
| journal_entry_line_id | `uuid`                     | No       | ``                  |     | accounting.journal_entry_lines.id         |
| dimension_value_id    | `uuid`                     | No       | ``                  |     | accounting.accounting_dimension_values.id |

## accounting.journal_entry_lines

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                              |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id         | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                 |
| company_id       | `uuid`                     | Sí       | ``                  |     |                                 |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                 |
| version          | `integer`                  | No       | `1`                 |     |                                 |
| row_version      | `bigint`                   | No       | `0`                 |     |                                 |
| is_active        | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                 |
| observations     | `text`                     | Sí       | ``                  |     |                                 |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| journal_entry_id | `uuid`                     | No       | ``                  |     |                                 |
| account_id       | `uuid`                     | No       | ``                  |     | accounting.chart_of_accounts.id |
| cost_center_id   | `uuid`                     | Sí       | ``                  |     | accounting.cost_centers.id      |
| profit_center_id | `uuid`                     | Sí       | ``                  |     | accounting.profit_centers.id    |
| debit_amount     | `numeric(18,4)`            | No       | `0`                 |     |                                 |
| credit_amount    | `numeric(18,4)`            | No       | `0`                 |     |                                 |

## accounting.journal_entry_status

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

## accounting.journal_entry_status_history

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                 |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id         | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                    |
| company_id       | `uuid`                     | Sí       | ``                  |     |                                    |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                    |
| version          | `integer`                  | No       | `1`                 |     |                                    |
| row_version      | `bigint`                   | No       | `0`                 |     |                                    |
| is_active        | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                    |
| observations     | `text`                     | Sí       | ``                  |     |                                    |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| journal_entry_id | `uuid`                     | No       | ``                  |     |                                    |
| status_id        | `uuid`                     | No       | ``                  |     | accounting.journal_entry_status.id |

## accounting.period_closing_logs

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                           |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id             | `bigint`                   | No       | ``                  |     |                              |
| tenant_id            | `uuid`                     | No       | ``                  |     |                              |
| company_id           | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                              |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by           | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                              |
| version              | `integer`                  | No       | `1`                 |     |                              |
| row_version          | `bigint`                   | No       | `0`                 |     |                              |
| is_active            | `boolean`                  | No       | `true`              |     |                              |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                              |
| observations         | `text`                     | Sí       | ``                  |     |                              |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| fiscal_period_id     | `uuid`                     | No       | ``                  |     | accounting.fiscal_periods.id |
| action               | `text`                     | No       | ``                  |     |                              |
| performed_by_user_id | `uuid`                     | No       | ``                  |     |                              |

## accounting.profit_centers

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| name         | `text`                     | No       | ``                  |     |     |

## accounting.recurring_journal_entry_generations

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                              |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                                 |
| local_id         | `bigint`                   | No       | ``                  |     |                                                 |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                                 |
| company_id       | `uuid`                     | Sí       | ``                  |     |                                                 |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                                 |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                                 |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                                 |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                                 |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                                 |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                                 |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                                 |
| version          | `integer`                  | No       | `1`                 |     |                                                 |
| row_version      | `bigint`                   | No       | `0`                 |     |                                                 |
| is_active        | `boolean`                  | No       | `true`              |     |                                                 |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                                 |
| observations     | `text`                     | Sí       | ``                  |     |                                                 |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                                 |
| template_id      | `uuid`                     | No       | ``                  |     | accounting.recurring_journal_entry_templates.id |
| journal_entry_id | `uuid`                     | No       | ``                  |     |                                                 |

## accounting.recurring_journal_entry_templates

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | No       | ``                  |     |     |
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
| name         | `text`                     | No       | ``                  |     |     |
| frequency    | `text`                     | No       | ``                  |     |     |

## accounting.v_general_ledger

| Columna         | Tipo            | Nullable | Default | PK  | FK  |
| --------------- | --------------- | -------- | ------- | --- | --- |
| tenant_id       | `uuid`          | Sí       | ``      |     |     |
| company_id      | `uuid`          | Sí       | ``      |     |     |
| branch_id       | `uuid`          | Sí       | ``      |     |     |
| account_id      | `uuid`          | Sí       | ``      |     |     |
| account_code    | `text`          | Sí       | ``      |     |     |
| account_name    | `text`          | Sí       | ``      |     |     |
| posting_date    | `date`          | Sí       | ``      |     |     |
| document_number | `text`          | Sí       | ``      |     |     |
| debit_amount    | `numeric(18,4)` | Sí       | ``      |     |     |
| credit_amount   | `numeric(18,4)` | Sí       | ``      |     |     |
| running_balance | `numeric`       | Sí       | ``      |     |     |

## accounting.v_trial_balance

| Columna      | Tipo      | Nullable | Default | PK  | FK  |
| ------------ | --------- | -------- | ------- | --- | --- |
| account_id   | `uuid`    | Sí       | ``      |     |     |
| account_code | `text`    | Sí       | ``      |     |     |
| account_name | `text`    | Sí       | ``      |     |     |
| company_id   | `uuid`    | Sí       | ``      |     |     |
| branch_id    | `uuid`    | Sí       | ``      |     |     |
| total_debit  | `numeric` | Sí       | ``      |     |     |
| total_credit | `numeric` | Sí       | ``      |     |     |
| net_balance  | `numeric` | Sí       | ``      |     |     |
