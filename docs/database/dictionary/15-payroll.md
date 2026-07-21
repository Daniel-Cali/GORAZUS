# Diccionario de datos — schema `payroll`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## payroll.concept_types

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

## payroll.deductions

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
| employee_id  | `uuid`                     | No       | ``                  |     |     |
| description  | `text`                     | No       | ``                  |     |     |
| amount       | `numeric(18,4)`            | No       | ``                  |     |     |

## payroll.employee_benefit_assignments

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                           |
| ------------ | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id     | `bigint`                   | No       | ``                  |     |                              |
| tenant_id    | `uuid`                     | No       | ``                  |     |                              |
| company_id   | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                              |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by   | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                              |
| version      | `integer`                  | No       | `1`                 |     |                              |
| row_version  | `bigint`                   | No       | `0`                 |     |                              |
| is_active    | `boolean`                  | No       | `true`              |     |                              |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                              |
| observations | `text`                     | Sí       | ``                  |     |                              |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| benefit_id   | `uuid`                     | No       | ``                  |     | payroll.employee_benefits.id |
| employee_id  | `uuid`                     | No       | ``                  |     |                              |

## payroll.employee_benefits

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

## payroll.loan_installments

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------------ | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id           | `bigint`                   | No       | ``                  |     |                            |
| tenant_id          | `uuid`                     | No       | ``                  |     |                            |
| company_id         | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                            |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by         | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                            |
| version            | `integer`                  | No       | `1`                 |     |                            |
| row_version        | `bigint`                   | No       | `0`                 |     |                            |
| is_active          | `boolean`                  | No       | `true`              |     |                            |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                            |
| observations       | `text`                     | Sí       | ``                  |     |                            |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| loan_id            | `uuid`                     | No       | ``                  |     | payroll.loans.id           |
| payroll_entry_id   | `uuid`                     | Sí       | ``                  |     | payroll.payroll_entries.id |
| amount             | `numeric(18,4)`            | No       | ``                  |     |                            |
| installment_number | `smallint`                 | No       | ``                  |     |                            |

## payroll.loans

| Columna           | Tipo                       | Nullable | Default             | PK  | FK  |
| ----------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id          | `bigint`                   | No       | ``                  |     |     |
| tenant_id         | `uuid`                     | No       | ``                  |     |     |
| company_id        | `uuid`                     | No       | ``                  |     |     |
| branch_id         | `uuid`                     | Sí       | ``                  |     |     |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by        | `uuid`                     | Sí       | ``                  |     |     |
| updated_by        | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |     |
| version           | `integer`                  | No       | `1`                 |     |     |
| row_version       | `bigint`                   | No       | `0`                 |     |     |
| is_active         | `boolean`                  | No       | `true`              |     |     |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |     |
| observations      | `text`                     | Sí       | ``                  |     |     |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| employee_id       | `uuid`                     | No       | ``                  |     |     |
| total_amount      | `numeric(18,4)`            | No       | ``                  |     |     |
| installment_count | `smallint`                 | No       | ``                  |     |     |
| remaining_balance | `numeric(18,4)`            | No       | ``                  |     |     |

## payroll.overtime_records

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                         |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id        | `bigint`                   | No       | ``                  |     |                            |
| tenant_id       | `uuid`                     | No       | ``                  |     |                            |
| company_id      | `uuid`                     | No       | ``                  |     |                            |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                            |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by      | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                            |
| version         | `integer`                  | No       | `1`                 |     |                            |
| row_version     | `bigint`                   | No       | `0`                 |     |                            |
| is_active       | `boolean`                  | No       | `true`              |     |                            |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                            |
| observations    | `text`                     | Sí       | ``                  |     |                            |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| employee_id     | `uuid`                     | No       | ``                  |     |                            |
| period_id       | `uuid`                     | No       | ``                  |     | payroll.payroll_periods.id |
| hours           | `numeric(6,2)`             | No       | ``                  |     |                            |
| rate_multiplier | `numeric(4,2)`             | No       | `1.5`               |     |                            |

## payroll.payroll_commission_entries

| Columna                    | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                         | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id                   | `bigint`                   | No       | ``                  |     |                            |
| tenant_id                  | `uuid`                     | No       | ``                  |     |                            |
| company_id                 | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id                  | `uuid`                     | Sí       | ``                  |     |                            |
| created_at                 | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at                 | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at                 | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by                 | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by                 | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by                 | `uuid`                     | Sí       | ``                  |     |                            |
| version                    | `integer`                  | No       | `1`                 |     |                            |
| row_version                | `bigint`                   | No       | `0`                 |     |                            |
| is_active                  | `boolean`                  | No       | `true`              |     |                            |
| is_deleted                 | `boolean`                  | Sí       | ``                  |     |                            |
| observations               | `text`                     | Sí       | ``                  |     |                            |
| metadata                   | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| payroll_entry_id           | `uuid`                     | No       | ``                  |     | payroll.payroll_entries.id |
| source_commission_entry_id | `uuid`                     | No       | ``                  |     |                            |

## payroll.payroll_concepts

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                       |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id            | `bigint`                   | No       | ``                  |     |                          |
| tenant_id           | `uuid`                     | No       | ``                  |     |                          |
| company_id          | `uuid`                     | No       | ``                  |     |                          |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                          |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by          | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                          |
| version             | `integer`                  | No       | `1`                 |     |                          |
| row_version         | `bigint`                   | No       | `0`                 |     |                          |
| is_active           | `boolean`                  | No       | `true`              |     |                          |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                          |
| observations        | `text`                     | Sí       | ``                  |     |                          |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| concept_type_id     | `uuid`                     | No       | ``                  |     | payroll.concept_types.id |
| code                | `text`                     | No       | ``                  |     |                          |
| name                | `text`                     | No       | ``                  |     |                          |
| calculation_formula | `text`                     | Sí       | ``                  |     |                          |

## payroll.payroll_entries

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id     | `bigint`                   | No       | ``                  |     |                         |
| tenant_id    | `uuid`                     | No       | ``                  |     |                         |
| company_id   | `uuid`                     | No       | ``                  |     |                         |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                         |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by   | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                         |
| version      | `integer`                  | No       | `1`                 |     |                         |
| row_version  | `bigint`                   | No       | `0`                 |     |                         |
| is_active    | `boolean`                  | No       | `true`              |     |                         |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                         |
| observations | `text`                     | Sí       | ``                  |     |                         |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| run_id       | `uuid`                     | No       | ``                  |     | payroll.payroll_runs.id |
| employee_id  | `uuid`                     | No       | ``                  |     |                         |
| gross_amount | `numeric(18,4)`            | No       | `0`                 |     |                         |
| net_amount   | `numeric(18,4)`            | No       | `0`                 |     |                         |

## payroll.payroll_entry_lines

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
| entry_id     | `uuid`                     | No       | ``                  |     | payroll.payroll_entries.id  |
| concept_id   | `uuid`                     | No       | ``                  |     | payroll.payroll_concepts.id |
| amount       | `numeric(18,4)`            | No       | ``                  |     |                             |

## payroll.payroll_novelties

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                          |
| ------------ | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id     | `bigint`                   | No       | ``                  |     |                             |
| tenant_id    | `uuid`                     | No       | ``                  |     |                             |
| company_id   | `uuid`                     | No       | ``                  |     |                             |
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
| employee_id  | `uuid`                     | No       | ``                  |     |                             |
| period_id    | `uuid`                     | No       | ``                  |     | payroll.payroll_periods.id  |
| concept_id   | `uuid`                     | No       | ``                  |     | payroll.payroll_concepts.id |
| amount       | `numeric(18,4)`            | No       | ``                  |     |                             |

## payroll.payroll_periods

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
| starts_on    | `date`                     | No       | ``                  |     |     |
| ends_on      | `date`                     | No       | ``                  |     |     |
| frequency    | `text`                     | No       | ``                  |     |     |

## payroll.payroll_run_status

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

## payroll.payroll_run_status_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id     | `bigint`                   | No       | ``                  |     |                               |
| tenant_id    | `uuid`                     | No       | ``                  |     |                               |
| company_id   | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                               |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by   | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                               |
| version      | `integer`                  | No       | `1`                 |     |                               |
| row_version  | `bigint`                   | No       | `0`                 |     |                               |
| is_active    | `boolean`                  | No       | `true`              |     |                               |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                               |
| observations | `text`                     | Sí       | ``                  |     |                               |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| run_id       | `uuid`                     | No       | ``                  |     | payroll.payroll_runs.id       |
| status_id    | `uuid`                     | No       | ``                  |     | payroll.payroll_run_status.id |

## payroll.payroll_runs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id     | `bigint`                   | No       | ``                  |     |                               |
| tenant_id    | `uuid`                     | No       | ``                  |     |                               |
| company_id   | `uuid`                     | No       | ``                  |     |                               |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                               |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by   | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                               |
| version      | `integer`                  | No       | `1`                 |     |                               |
| row_version  | `bigint`                   | No       | `0`                 |     |                               |
| is_active    | `boolean`                  | No       | `true`              |     |                               |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                               |
| observations | `text`                     | Sí       | ``                  |     |                               |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| period_id    | `uuid`                     | No       | ``                  |     | payroll.payroll_periods.id    |
| status_id    | `uuid`                     | No       | ``                  |     | payroll.payroll_run_status.id |

## payroll.salary_structure_concepts

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                           |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id        | `bigint`                   | No       | ``                  |     |                              |
| tenant_id       | `uuid`                     | No       | ``                  |     |                              |
| company_id      | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                              |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by      | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                              |
| version         | `integer`                  | No       | `1`                 |     |                              |
| row_version     | `bigint`                   | No       | `0`                 |     |                              |
| is_active       | `boolean`                  | No       | `true`              |     |                              |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                              |
| observations    | `text`                     | Sí       | ``                  |     |                              |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| structure_id    | `uuid`                     | No       | ``                  |     | payroll.salary_structures.id |
| concept_id      | `uuid`                     | No       | ``                  |     | payroll.payroll_concepts.id  |
| override_amount | `numeric(18,4)`            | Sí       | ``                  |     |                              |

## payroll.salary_structures

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | No       | ``                  |     |     |
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
| job_position_id | `uuid`                     | Sí       | ``                  |     |     |
| name            | `text`                     | No       | ``                  |     |     |

## payroll.severance_calculations

| Columna            | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id           | `bigint`                   | No       | ``                  |     |     |
| tenant_id          | `uuid`                     | No       | ``                  |     |     |
| company_id         | `uuid`                     | No       | ``                  |     |     |
| branch_id          | `uuid`                     | Sí       | ``                  |     |     |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by         | `uuid`                     | Sí       | ``                  |     |     |
| updated_by         | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |     |
| version            | `integer`                  | No       | `1`                 |     |     |
| row_version        | `bigint`                   | No       | `0`                 |     |     |
| is_active          | `boolean`                  | No       | `true`              |     |     |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |     |
| observations       | `text`                     | Sí       | ``                  |     |     |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| employee_id        | `uuid`                     | No       | ``                  |     |     |
| total_amount       | `numeric(18,4)`            | No       | ``                  |     |     |
| calculation_detail | `jsonb`                    | No       | ``                  |     |     |

## payroll.social_security_tables

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                 | `bigint`                   | No       | ``                  |     |     |
| tenant_id                | `uuid`                     | No       | ``                  |     |     |
| company_id               | `uuid`                     | No       | ``                  |     |     |
| branch_id                | `uuid`                     | Sí       | ``                  |     |     |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by               | `uuid`                     | Sí       | ``                  |     |     |
| updated_by               | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |     |
| version                  | `integer`                  | No       | `1`                 |     |     |
| row_version              | `bigint`                   | No       | `0`                 |     |     |
| is_active                | `boolean`                  | No       | `true`              |     |     |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |     |
| observations             | `text`                     | Sí       | ``                  |     |     |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| scheme_name              | `text`                     | No       | ``                  |     |     |
| employee_rate_percentage | `numeric(6,3)`             | No       | ``                  |     |     |
| employer_rate_percentage | `numeric(6,3)`             | No       | ``                  |     |     |

## payroll.tax_withholding_tables

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | No       | ``                  |     |     |
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
| bracket_min     | `numeric(18,4)`            | No       | ``                  |     |     |
| bracket_max     | `numeric(18,4)`            | Sí       | ``                  |     |     |
| rate_percentage | `numeric(6,3)`             | No       | ``                  |     |     |

## payroll.thirteenth_month_calculations

| Columna        | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id       | `bigint`                   | No       | ``                  |     |     |
| tenant_id      | `uuid`                     | No       | ``                  |     |     |
| company_id     | `uuid`                     | No       | ``                  |     |     |
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
| employee_id    | `uuid`                     | No       | ``                  |     |     |
| fiscal_year_id | `uuid`                     | No       | ``                  |     |     |
| amount         | `numeric(18,4)`            | No       | ``                  |     |     |
