# Diccionario de datos — schema `cash`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## cash.cash_count_lines

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id           | `bigint`                   | No       | ``                  |     |                     |
| tenant_id          | `uuid`                     | No       | ``                  |     |                     |
| company_id         | `uuid`                     | Sí       | ``                  |     |                     |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                     |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by         | `uuid`                     | Sí       | ``                  |     |                     |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                     |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                     |
| version            | `integer`                  | No       | `1`                 |     |                     |
| row_version        | `bigint`                   | No       | `0`                 |     |                     |
| is_active          | `boolean`                  | No       | `true`              |     |                     |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                     |
| observations       | `text`                     | Sí       | ``                  |     |                     |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| cash_count_id      | `uuid`                     | No       | ``                  |     | cash.cash_counts.id |
| denomination_value | `numeric(18,4)`            | No       | ``                  |     |                     |
| quantity           | `integer`                  | No       | ``                  |     |                     |

## cash.cash_counts

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id     | `bigint`                   | No       | ``                  |     |                                |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                |
| company_id   | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                |
| version      | `integer`                  | No       | `1`                 |     |                                |
| row_version  | `bigint`                   | No       | `0`                 |     |                                |
| is_active    | `boolean`                  | No       | `true`              |     |                                |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                |
| observations | `text`                     | Sí       | ``                  |     |                                |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| closing_id   | `uuid`                     | No       | ``                  |     | cash.cash_register_closings.id |

## cash.cash_movement_types

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
| direction    | `text`                     | No       | ``                  |     |     |

## cash.cash_movements

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                             |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id         | `bigint`                   | No       | ``                  |     |                                |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                |
| company_id       | `uuid`                     | No       | ``                  |     |                                |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                                |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                |
| version          | `integer`                  | No       | `1`                 |     |                                |
| row_version      | `bigint`                   | No       | `0`                 |     |                                |
| is_active        | `boolean`                  | No       | `true`              |     |                                |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                |
| observations     | `text`                     | Sí       | ``                  |     |                                |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| register_id      | `uuid`                     | No       | ``                  |     | cash.cash_registers.id         |
| opening_id       | `uuid`                     | No       | ``                  |     | cash.cash_register_openings.id |
| movement_type_id | `uuid`                     | No       | ``                  |     | cash.cash_movement_types.id    |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                                |
| source_module    | `text`                     | Sí       | ``                  |     |                                |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                                |

## cash.cash_refunds

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                     |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id        | `bigint`                   | No       | ``                  |     |                        |
| tenant_id       | `uuid`                     | No       | ``                  |     |                        |
| company_id      | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                        |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by      | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                        |
| version         | `integer`                  | No       | `1`                 |     |                        |
| row_version     | `bigint`                   | No       | `0`                 |     |                        |
| is_active       | `boolean`                  | No       | `true`              |     |                        |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                        |
| observations    | `text`                     | Sí       | ``                  |     |                        |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| register_id     | `uuid`                     | No       | ``                  |     | cash.cash_registers.id |
| sales_return_id | `uuid`                     | No       | ``                  |     |                        |
| amount          | `numeric(18,4)`            | No       | ``                  |     |                        |

## cash.cash_register_closings

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                             |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id          | `bigint`                   | No       | ``                  |     |                                |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                |
| company_id        | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                                |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by        | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                                |
| version           | `integer`                  | No       | `1`                 |     |                                |
| row_version       | `bigint`                   | No       | `0`                 |     |                                |
| is_active         | `boolean`                  | No       | `true`              |     |                                |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                |
| observations      | `text`                     | Sí       | ``                  |     |                                |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| opening_id        | `uuid`                     | No       | ``                  |     | cash.cash_register_openings.id |
| closed_by_user_id | `uuid`                     | No       | ``                  |     |                                |
| expected_amount   | `numeric(18,4)`            | No       | ``                  |     |                                |
| counted_amount    | `numeric(18,4)`            | No       | ``                  |     |                                |
| difference_amount | `numeric(18,4)`            | Sí       | ``                  |     |                                |

## cash.cash_register_openings

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                     |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id          | `bigint`                   | No       | ``                  |     |                        |
| tenant_id         | `uuid`                     | No       | ``                  |     |                        |
| company_id        | `uuid`                     | No       | ``                  |     |                        |
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
| register_id       | `uuid`                     | No       | ``                  |     | cash.cash_registers.id |
| opened_by_user_id | `uuid`                     | No       | ``                  |     |                        |
| opening_amount    | `numeric(18,4)`            | No       | ``                  |     |                        |
| is_open           | `boolean`                  | No       | `true`              |     |                        |

## cash.cash_registers

| Columna       | Tipo                       | Nullable | Default                  | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------------ | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()`      | PK  |     |
| local_id      | `bigint`                   | No       | ``                       |     |     |
| tenant_id     | `uuid`                     | No       | ``                       |     |     |
| company_id    | `uuid`                     | No       | ``                       |     |     |
| branch_id     | `uuid`                     | No       | ``                       |     |     |
| created_at    | `timestamp with time zone` | No       | `now()`                  |     |     |
| updated_at    | `timestamp with time zone` | No       | `now()`                  |     |     |
| deleted_at    | `timestamp with time zone` | Sí       | ``                       |     |     |
| created_by    | `uuid`                     | Sí       | ``                       |     |     |
| updated_by    | `uuid`                     | Sí       | ``                       |     |     |
| deleted_by    | `uuid`                     | Sí       | ``                       |     |     |
| version       | `integer`                  | No       | `1`                      |     |     |
| row_version   | `bigint`                   | No       | `0`                      |     |     |
| is_active     | `boolean`                  | No       | `true`                   |     |     |
| is_deleted    | `boolean`                  | Sí       | ``                       |     |     |
| observations  | `text`                     | Sí       | ``                       |     |     |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`            |     |     |
| name          | `text`                     | No       | ``                       |     |     |
| register_type | `text`                     | No       | `'administrative'::text` |     |     |

## cash.cash_transfers

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                     |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id                | `bigint`                   | No       | ``                  |     |                        |
| tenant_id               | `uuid`                     | No       | ``                  |     |                        |
| company_id              | `uuid`                     | Sí       | ``                  |     |                        |
| branch_id               | `uuid`                     | Sí       | ``                  |     |                        |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by              | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by              | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |                        |
| version                 | `integer`                  | No       | `1`                 |     |                        |
| row_version             | `bigint`                   | No       | `0`                 |     |                        |
| is_active               | `boolean`                  | No       | `true`              |     |                        |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                        |
| observations            | `text`                     | Sí       | ``                  |     |                        |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| source_register_id      | `uuid`                     | No       | ``                  |     | cash.cash_registers.id |
| destination_register_id | `uuid`                     | No       | ``                  |     | cash.cash_registers.id |
| amount                  | `numeric(18,4)`            | No       | ``                  |     |                        |

## cash.petty_cash_funds

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
| custodian_user_id | `uuid`                     | No       | ``                  |     |     |
| fund_amount       | `numeric(18,4)`            | No       | ``                  |     |     |

## cash.petty_cash_vouchers

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                       |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id      | `bigint`                   | No       | ``                  |     |                          |
| tenant_id     | `uuid`                     | No       | ``                  |     |                          |
| company_id    | `uuid`                     | Sí       | ``                  |     |                          |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                          |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by    | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                          |
| version       | `integer`                  | No       | `1`                 |     |                          |
| row_version   | `bigint`                   | No       | `0`                 |     |                          |
| is_active     | `boolean`                  | No       | `true`              |     |                          |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                          |
| observations  | `text`                     | Sí       | ``                  |     |                          |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| fund_id       | `uuid`                     | No       | ``                  |     | cash.petty_cash_funds.id |
| amount        | `numeric(18,4)`            | No       | ``                  |     |                          |
| is_reconciled | `boolean`                  | No       | `false`             |     |                          |
