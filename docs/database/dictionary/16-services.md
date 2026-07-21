# Diccionario de datos — schema `services`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## services.equipment

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                          |
| ----------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id          | `bigint`                   | No       | ``                  |     |                             |
| tenant_id         | `uuid`                     | No       | ``                  |     |                             |
| company_id        | `uuid`                     | No       | ``                  |     |                             |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                             |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by        | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                             |
| version           | `integer`                  | No       | `1`                 |     |                             |
| row_version       | `bigint`                   | No       | `0`                 |     |                             |
| is_active         | `boolean`                  | No       | `true`              |     |                             |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                             |
| observations      | `text`                     | Sí       | ``                  |     |                             |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| customer_id       | `uuid`                     | No       | ``                  |     |                             |
| equipment_type_id | `uuid`                     | No       | ``                  |     | services.equipment_types.id |
| serial_number     | `text`                     | Sí       | ``                  |     |                             |
| model             | `text`                     | Sí       | ``                  |     |                             |

## services.equipment_types

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

## services.maintenance_plans

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id       | `bigint`                   | No       | ``                  |     |                               |
| tenant_id      | `uuid`                     | No       | ``                  |     |                               |
| company_id     | `uuid`                     | No       | ``                  |     |                               |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                               |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by     | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                               |
| version        | `integer`                  | No       | `1`                 |     |                               |
| row_version    | `bigint`                   | No       | `0`                 |     |                               |
| is_active      | `boolean`                  | No       | `true`              |     |                               |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                               |
| observations   | `text`                     | Sí       | ``                  |     |                               |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| contract_id    | `uuid`                     | No       | ``                  |     | services.service_contracts.id |
| equipment_id   | `uuid`                     | No       | ``                  |     | services.equipment.id         |
| frequency_days | `integer`                  | No       | ``                  |     |                               |

## services.scheduled_maintenances

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                            |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id         | `bigint`                   | No       | ``                  |     |                               |
| tenant_id        | `uuid`                     | No       | ``                  |     |                               |
| company_id       | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                               |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by       | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                               |
| version          | `integer`                  | No       | `1`                 |     |                               |
| row_version      | `bigint`                   | No       | `0`                 |     |                               |
| is_active        | `boolean`                  | No       | `true`              |     |                               |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                               |
| observations     | `text`                     | Sí       | ``                  |     |                               |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| plan_id          | `uuid`                     | No       | ``                  |     | services.maintenance_plans.id |
| scheduled_date   | `date`                     | No       | ``                  |     |                               |
| service_order_id | `uuid`                     | Sí       | ``                  |     | services.service_orders.id    |

## services.service_contract_types

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

## services.service_contracts

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
| customer_id      | `uuid`                     | No       | ``                  |     |                                    |
| contract_type_id | `uuid`                     | No       | ``                  |     | services.service_contract_types.id |
| starts_on        | `date`                     | No       | ``                  |     |                                    |
| ends_on          | `date`                     | Sí       | ``                  |     |                                    |

## services.service_order_lines

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                         |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id         | `bigint`                   | No       | ``                  |     |                            |
| tenant_id        | `uuid`                     | No       | ``                  |     |                            |
| company_id       | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                            |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by       | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                            |
| version          | `integer`                  | No       | `1`                 |     |                            |
| row_version      | `bigint`                   | No       | `0`                 |     |                            |
| is_active        | `boolean`                  | No       | `true`              |     |                            |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                            |
| observations     | `text`                     | Sí       | ``                  |     |                            |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| service_order_id | `uuid`                     | No       | ``                  |     | services.service_orders.id |
| product_id       | `uuid`                     | No       | ``                  |     |                            |
| quantity         | `numeric(18,6)`            | No       | ``                  |     |                            |
| unit_price       | `numeric(18,4)`            | No       | ``                  |     |                            |

## services.service_order_reasons

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

## services.service_order_status

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

## services.service_order_status_history

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                               |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id         | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                  |
| company_id       | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| version          | `integer`                  | No       | `1`                 |     |                                  |
| row_version      | `bigint`                   | No       | `0`                 |     |                                  |
| is_active        | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                  |
| observations     | `text`                     | Sí       | ``                  |     |                                  |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| service_order_id | `uuid`                     | No       | ``                  |     | services.service_orders.id       |
| status_id        | `uuid`                     | No       | ``                  |     | services.service_order_status.id |

## services.service_orders

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                                |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id        | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                   |
| company_id      | `uuid`                     | No       | ``                  |     |                                   |
| branch_id       | `uuid`                     | No       | ``                  |     |                                   |
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
| document_number | `text`                     | No       | ``                  |     |                                   |
| customer_id     | `uuid`                     | No       | ``                  |     |                                   |
| equipment_id    | `uuid`                     | Sí       | ``                  |     | services.equipment.id             |
| service_type_id | `uuid`                     | No       | ``                  |     | services.service_types.id         |
| reason_id       | `uuid`                     | Sí       | ``                  |     | services.service_order_reasons.id |
| warranty_id     | `uuid`                     | Sí       | ``                  |     |                                   |
| status_id       | `uuid`                     | No       | ``                  |     | services.service_order_status.id  |

## services.service_parts_consumed

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                         |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id         | `bigint`                   | No       | ``                  |     |                            |
| tenant_id        | `uuid`                     | No       | ``                  |     |                            |
| company_id       | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                            |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                            |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by       | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                            |
| version          | `integer`                  | No       | `1`                 |     |                            |
| row_version      | `bigint`                   | No       | `0`                 |     |                            |
| is_active        | `boolean`                  | No       | `true`              |     |                            |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                            |
| observations     | `text`                     | Sí       | ``                  |     |                            |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| service_order_id | `uuid`                     | No       | ``                  |     | services.service_orders.id |
| product_id       | `uuid`                     | No       | ``                  |     |                            |
| quantity         | `numeric(18,6)`            | No       | ``                  |     |                            |

## services.service_types

| Columna                   | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                        | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                  | `bigint`                   | No       | ``                  |     |     |
| tenant_id                 | `uuid`                     | No       | ``                  |     |     |
| company_id                | `uuid`                     | No       | ``                  |     |     |
| branch_id                 | `uuid`                     | Sí       | ``                  |     |     |
| created_at                | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at                | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at                | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by                | `uuid`                     | Sí       | ``                  |     |     |
| updated_by                | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by                | `uuid`                     | Sí       | ``                  |     |     |
| version                   | `integer`                  | No       | `1`                 |     |     |
| row_version               | `bigint`                   | No       | `0`                 |     |     |
| is_active                 | `boolean`                  | No       | `true`              |     |     |
| is_deleted                | `boolean`                  | Sí       | ``                  |     |     |
| observations              | `text`                     | Sí       | ``                  |     |     |
| metadata                  | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| name                      | `text`                     | No       | ``                  |     |     |
| standard_duration_minutes | `integer`                  | Sí       | ``                  |     |     |

## services.service_visits

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                         |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id         | `bigint`                   | No       | ``                  |     |                            |
| tenant_id        | `uuid`                     | No       | ``                  |     |                            |
| company_id       | `uuid`                     | No       | ``                  |     |                            |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                            |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                            |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by       | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                            |
| version          | `integer`                  | No       | `1`                 |     |                            |
| row_version      | `bigint`                   | No       | `0`                 |     |                            |
| is_active        | `boolean`                  | No       | `true`              |     |                            |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                            |
| observations     | `text`                     | Sí       | ``                  |     |                            |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| service_order_id | `uuid`                     | No       | ``                  |     | services.service_orders.id |
| technician_id    | `uuid`                     | No       | ``                  |     | services.technicians.id    |
| started_at       | `timestamp with time zone` | Sí       | ``                  |     |                            |
| finished_at      | `timestamp with time zone` | Sí       | ``                  |     |                            |
| latitude         | `numeric(9,6)`             | Sí       | ``                  |     |                            |
| longitude        | `numeric(9,6)`             | Sí       | ``                  |     |                            |

## services.service_work_reports

| Columna                    | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                         | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                   | `bigint`                   | No       | ``                  |     |     |
| tenant_id                  | `uuid`                     | No       | ``                  |     |     |
| company_id                 | `uuid`                     | Sí       | ``                  |     |     |
| branch_id                  | `uuid`                     | Sí       | ``                  |     |     |
| created_at                 | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at                 | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at                 | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by                 | `uuid`                     | Sí       | ``                  |     |     |
| updated_by                 | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by                 | `uuid`                     | Sí       | ``                  |     |     |
| version                    | `integer`                  | No       | `1`                 |     |     |
| row_version                | `bigint`                   | No       | `0`                 |     |     |
| is_active                  | `boolean`                  | No       | `true`              |     |     |
| is_deleted                 | `boolean`                  | Sí       | ``                  |     |     |
| observations               | `text`                     | Sí       | ``                  |     |     |
| metadata                   | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| service_visit_id           | `uuid`                     | No       | ``                  |     |     |
| findings                   | `text`                     | Sí       | ``                  |     |     |
| customer_signature_file_id | `uuid`                     | Sí       | ``                  |     |     |

## services.sla_definitions

| Columna               | Tipo                       | Nullable | Default             | PK  | FK                            |
| --------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                    | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id              | `bigint`                   | No       | ``                  |     |                               |
| tenant_id             | `uuid`                     | No       | ``                  |     |                               |
| company_id            | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id             | `uuid`                     | Sí       | ``                  |     |                               |
| created_at            | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at            | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at            | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by            | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by            | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by            | `uuid`                     | Sí       | ``                  |     |                               |
| version               | `integer`                  | No       | `1`                 |     |                               |
| row_version           | `bigint`                   | No       | `0`                 |     |                               |
| is_active             | `boolean`                  | No       | `true`              |     |                               |
| is_deleted            | `boolean`                  | Sí       | ``                  |     |                               |
| observations          | `text`                     | Sí       | ``                  |     |                               |
| metadata              | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| contract_id           | `uuid`                     | No       | ``                  |     | services.service_contracts.id |
| response_time_hours   | `integer`                  | No       | ``                  |     |                               |
| resolution_time_hours | `integer`                  | No       | ``                  |     |                               |

## services.technician_assignments

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                         |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id         | `bigint`                   | No       | ``                  |     |                            |
| tenant_id        | `uuid`                     | No       | ``                  |     |                            |
| company_id       | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                            |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by       | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                            |
| version          | `integer`                  | No       | `1`                 |     |                            |
| row_version      | `bigint`                   | No       | `0`                 |     |                            |
| is_active        | `boolean`                  | No       | `true`              |     |                            |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                            |
| observations     | `text`                     | Sí       | ``                  |     |                            |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| technician_id    | `uuid`                     | No       | ``                  |     | services.technicians.id    |
| service_order_id | `uuid`                     | No       | ``                  |     | services.service_orders.id |
| scheduled_at     | `timestamp with time zone` | Sí       | ``                  |     |                            |

## services.technicians

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
| employee_id  | `uuid`                     | Sí       | ``                  |     |     |
| full_name    | `text`                     | No       | ``                  |     |     |
