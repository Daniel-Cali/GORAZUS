# Diccionario de datos — schema `projects`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## projects.project_billing_milestones

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                                |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id        | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                   |
| company_id      | `uuid`                     | Sí       | ``                  |     |                                   |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                                   |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                   |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                   |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                   |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                   |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                   |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                   |
| version         | `integer`                  | No       | `1`                 |     |                                   |
| row_version     | `bigint`                   | No       | `0`                 |     |                                   |
| is_active       | `boolean`                  | No       | `true`              |     |                                   |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                   |
| observations    | `text`                     | Sí       | ``                  |     |                                   |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                   |
| billing_plan_id | `uuid`                     | No       | ``                  |     | projects.project_billing_plans.id |
| name            | `text`                     | No       | ``                  |     |                                   |
| amount          | `numeric(18,4)`            | No       | ``                  |     |                                   |
| invoice_id      | `uuid`                     | Sí       | ``                  |     |                                   |

## projects.project_billing_plans

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                   |
| -------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id       | `bigint`                   | No       | ``                  |     |                      |
| tenant_id      | `uuid`                     | No       | ``                  |     |                      |
| company_id     | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                      |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by     | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                      |
| version        | `integer`                  | No       | `1`                 |     |                      |
| row_version    | `bigint`                   | No       | `0`                 |     |                      |
| is_active      | `boolean`                  | No       | `true`              |     |                      |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                      |
| observations   | `text`                     | Sí       | ``                  |     |                      |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| project_id     | `uuid`                     | No       | ``                  |     | projects.projects.id |
| billing_method | `text`                     | No       | ``                  |     |                      |

## projects.project_budget_lines

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                          |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id        | `bigint`                   | No       | ``                  |     |                             |
| tenant_id       | `uuid`                     | No       | ``                  |     |                             |
| company_id      | `uuid`                     | Sí       | ``                  |     |                             |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                             |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by      | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                             |
| version         | `integer`                  | No       | `1`                 |     |                             |
| row_version     | `bigint`                   | No       | `0`                 |     |                             |
| is_active       | `boolean`                  | No       | `true`              |     |                             |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                             |
| observations    | `text`                     | Sí       | ``                  |     |                             |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| budget_id       | `uuid`                     | No       | ``                  |     | projects.project_budgets.id |
| category        | `text`                     | No       | ``                  |     |                             |
| budgeted_amount | `numeric(18,4)`            | No       | ``                  |     |                             |

## projects.project_budgets

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id     | `bigint`                   | No       | ``                  |     |                      |
| tenant_id    | `uuid`                     | No       | ``                  |     |                      |
| company_id   | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                      |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by   | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                      |
| version      | `integer`                  | No       | `1`                 |     |                      |
| row_version  | `bigint`                   | No       | `0`                 |     |                      |
| is_active    | `boolean`                  | No       | `true`              |     |                      |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                      |
| observations | `text`                     | Sí       | ``                  |     |                      |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| project_id   | `uuid`                     | No       | ``                  |     | projects.projects.id |

## projects.project_costs

| Columna                    | Tipo                       | Nullable | Default             | PK  | FK                        |
| -------------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id                         | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id                   | `bigint`                   | No       | ``                  |     |                           |
| tenant_id                  | `uuid`                     | No       | ``                  |     |                           |
| company_id                 | `uuid`                     | No       | ``                  |     |                           |
| branch_id                  | `uuid`                     | Sí       | ``                  |     |                           |
| created_at                 | `timestamp with time zone` | No       | `now()`             | PK  |                           |
| updated_at                 | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at                 | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by                 | `uuid`                     | Sí       | ``                  |     |                           |
| updated_by                 | `uuid`                     | Sí       | ``                  |     |                           |
| deleted_by                 | `uuid`                     | Sí       | ``                  |     |                           |
| version                    | `integer`                  | No       | `1`                 |     |                           |
| row_version                | `bigint`                   | No       | `0`                 |     |                           |
| is_active                  | `boolean`                  | No       | `true`              |     |                           |
| is_deleted                 | `boolean`                  | Sí       | ``                  |     |                           |
| observations               | `text`                     | Sí       | ``                  |     |                           |
| metadata                   | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| project_id                 | `uuid`                     | No       | ``                  |     | projects.projects.id      |
| task_id                    | `uuid`                     | Sí       | ``                  |     | projects.project_tasks.id |
| source_purchase_invoice_id | `uuid`                     | Sí       | ``                  |     |                           |
| amount                     | `numeric(18,4)`            | No       | ``                  |     |                           |

## projects.project_resource_assignments

| Columna               | Tipo                       | Nullable | Default             | PK  | FK                        |
| --------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id                    | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id              | `bigint`                   | No       | ``                  |     |                           |
| tenant_id             | `uuid`                     | No       | ``                  |     |                           |
| company_id            | `uuid`                     | Sí       | ``                  |     |                           |
| branch_id             | `uuid`                     | Sí       | ``                  |     |                           |
| created_at            | `timestamp with time zone` | No       | `now()`             |     |                           |
| updated_at            | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at            | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by            | `uuid`                     | Sí       | ``                  |     |                           |
| updated_by            | `uuid`                     | Sí       | ``                  |     |                           |
| deleted_by            | `uuid`                     | Sí       | ``                  |     |                           |
| version               | `integer`                  | No       | `1`                 |     |                           |
| row_version           | `bigint`                   | No       | `0`                 |     |                           |
| is_active             | `boolean`                  | No       | `true`              |     |                           |
| is_deleted            | `boolean`                  | Sí       | ``                  |     |                           |
| observations          | `text`                     | Sí       | ``                  |     |                           |
| metadata              | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| task_id               | `uuid`                     | No       | ``                  |     | projects.project_tasks.id |
| employee_id           | `uuid`                     | No       | ``                  |     |                           |
| allocation_percentage | `numeric(5,2)`             | No       | `100`               |     |                           |
| hourly_rate           | `numeric(18,4)`            | Sí       | ``                  |     |                           |

## projects.project_risks

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id     | `bigint`                   | No       | ``                  |     |                      |
| tenant_id    | `uuid`                     | No       | ``                  |     |                      |
| company_id   | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                      |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by   | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                      |
| version      | `integer`                  | No       | `1`                 |     |                      |
| row_version  | `bigint`                   | No       | `0`                 |     |                      |
| is_active    | `boolean`                  | No       | `true`              |     |                      |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                      |
| observations | `text`                     | Sí       | ``                  |     |                      |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| project_id   | `uuid`                     | No       | ``                  |     | projects.projects.id |
| description  | `text`                     | No       | ``                  |     |                      |
| probability  | `text`                     | No       | ``                  |     |                      |
| impact       | `text`                     | No       | ``                  |     |                      |

## projects.project_role_rates

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
| role_name    | `text`                     | No       | ``                  |     |     |
| hourly_rate  | `numeric(18,4)`            | No       | ``                  |     |     |

## projects.project_status

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
| is_final     | `boolean`                  | No       | `false`             |     |     |

## projects.project_status_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id     | `bigint`                   | No       | ``                  |     |                            |
| tenant_id    | `uuid`                     | No       | ``                  |     |                            |
| company_id   | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                            |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by   | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                            |
| version      | `integer`                  | No       | `1`                 |     |                            |
| row_version  | `bigint`                   | No       | `0`                 |     |                            |
| is_active    | `boolean`                  | No       | `true`              |     |                            |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                            |
| observations | `text`                     | Sí       | ``                  |     |                            |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| project_id   | `uuid`                     | No       | ``                  |     | projects.projects.id       |
| status_id    | `uuid`                     | No       | ``                  |     | projects.project_status.id |

## projects.project_task_dependencies

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                        |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id           | `bigint`                   | No       | ``                  |     |                           |
| tenant_id          | `uuid`                     | No       | ``                  |     |                           |
| company_id         | `uuid`                     | Sí       | ``                  |     |                           |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                           |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                           |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by         | `uuid`                     | Sí       | ``                  |     |                           |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                           |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                           |
| version            | `integer`                  | No       | `1`                 |     |                           |
| row_version        | `bigint`                   | No       | `0`                 |     |                           |
| is_active          | `boolean`                  | No       | `true`              |     |                           |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                           |
| observations       | `text`                     | Sí       | ``                  |     |                           |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| task_id            | `uuid`                     | No       | ``                  |     | projects.project_tasks.id |
| depends_on_task_id | `uuid`                     | No       | ``                  |     | projects.project_tasks.id |

## projects.project_task_status

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

## projects.project_tasks

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                              |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id            | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id           | `uuid`                     | No       | ``                  |     |                                 |
| company_id          | `uuid`                     | Sí       | ``                  |     |                                 |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by          | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                                 |
| version             | `integer`                  | No       | `1`                 |     |                                 |
| row_version         | `bigint`                   | No       | `0`                 |     |                                 |
| is_active           | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                                 |
| observations        | `text`                     | Sí       | ``                  |     |                                 |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| project_id          | `uuid`                     | No       | ``                  |     | projects.projects.id            |
| parent_task_id      | `uuid`                     | Sí       | ``                  |     | projects.project_tasks.id       |
| name                | `text`                     | No       | ``                  |     |                                 |
| status_id           | `uuid`                     | No       | ``                  |     | projects.project_task_status.id |
| starts_on           | `date`                     | Sí       | ``                  |     |                                 |
| ends_on             | `date`                     | Sí       | ``                  |     |                                 |
| progress_percentage | `smallint`                 | No       | `0`                 |     |                                 |

## projects.project_timesheet_status

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

## projects.project_timesheets

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id     | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                      |
| company_id   | `uuid`                     | No       | ``                  |     |                                      |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |                                      |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                      |
| version      | `integer`                  | No       | `1`                 |     |                                      |
| row_version  | `bigint`                   | No       | `0`                 |     |                                      |
| is_active    | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                      |
| observations | `text`                     | Sí       | ``                  |     |                                      |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| task_id      | `uuid`                     | No       | ``                  |     | projects.project_tasks.id            |
| employee_id  | `uuid`                     | No       | ``                  |     |                                      |
| work_date    | `date`                     | No       | ``                  |     |                                      |
| hours        | `numeric(6,2)`             | No       | ``                  |     |                                      |
| status_id    | `uuid`                     | No       | ``                  |     | projects.project_timesheet_status.id |

## projects.project_types

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
| name         | `text`                     | No       | ``                  |     |     |

## projects.projects

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
| name            | `text`                     | No       | ``                  |     |                            |
| customer_id     | `uuid`                     | Sí       | ``                  |     |                            |
| project_type_id | `uuid`                     | No       | ``                  |     | projects.project_types.id  |
| manager_user_id | `uuid`                     | No       | ``                  |     |                            |
| status_id       | `uuid`                     | No       | ``                  |     | projects.project_status.id |
| total_budget    | `numeric(18,4)`            | Sí       | ``                  |     |                            |
| cost_center_id  | `uuid`                     | Sí       | ``                  |     |                            |
