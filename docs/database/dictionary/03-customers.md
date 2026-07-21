# Diccionario de datos — schema `customers`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## customers.customer_addresses

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                     |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id        | `bigint`                   | No       | ``                  |     |                        |
| tenant_id       | `uuid`                     | No       | ``                  |     |                        |
| company_id      | `uuid`                     | No       | ``                  |     |                        |
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
| customer_id     | `uuid`                     | No       | ``                  |     | customers.customers.id |
| address_type    | `text`                     | No       | ``                  |     |                        |
| line1           | `text`                     | No       | ``                  |     |                        |
| line2           | `text`                     | Sí       | ``                  |     |                        |
| municipality_id | `uuid`                     | Sí       | ``                  |     |                        |
| postal_code     | `text`                     | Sí       | ``                  |     |                        |
| is_default      | `boolean`                  | No       | `false`             |     |                        |

## customers.customer_bank_accounts

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id                 | `bigint`                   | No       | ``                  |     |                        |
| tenant_id                | `uuid`                     | No       | ``                  |     |                        |
| company_id               | `uuid`                     | No       | ``                  |     |                        |
| branch_id                | `uuid`                     | Sí       | ``                  |     |                        |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by               | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by               | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |                        |
| version                  | `integer`                  | No       | `1`                 |     |                        |
| row_version              | `bigint`                   | No       | `0`                 |     |                        |
| is_active                | `boolean`                  | No       | `true`              |     |                        |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                        |
| observations             | `text`                     | Sí       | ``                  |     |                        |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id              | `uuid`                     | No       | ``                  |     | customers.customers.id |
| bank_name                | `text`                     | No       | ``                  |     |                        |
| encrypted_account_number | `text`                     | No       | ``                  |     |                        |

## customers.customer_block_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id     | `bigint`                   | No       | ``                  |     |                        |
| tenant_id    | `uuid`                     | No       | ``                  |     |                        |
| company_id   | `uuid`                     | No       | ``                  |     |                        |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                        |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by   | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                        |
| version      | `integer`                  | No       | `1`                 |     |                        |
| row_version  | `bigint`                   | No       | `0`                 |     |                        |
| is_active    | `boolean`                  | No       | `true`              |     |                        |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                        |
| observations | `text`                     | Sí       | ``                  |     |                        |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id  | `uuid`                     | No       | ``                  |     | customers.customers.id |
| action       | `text`                     | No       | ``                  |     |                        |
| reason       | `text`                     | Sí       | ``                  |     |                        |

## customers.customer_categories

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

## customers.customer_classifications

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

## customers.customer_contacts

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id     | `bigint`                   | No       | ``                  |     |                        |
| tenant_id    | `uuid`                     | No       | ``                  |     |                        |
| company_id   | `uuid`                     | No       | ``                  |     |                        |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                        |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by   | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                        |
| version      | `integer`                  | No       | `1`                 |     |                        |
| row_version  | `bigint`                   | No       | `0`                 |     |                        |
| is_active    | `boolean`                  | No       | `true`              |     |                        |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                        |
| observations | `text`                     | Sí       | ``                  |     |                        |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id  | `uuid`                     | No       | ``                  |     | customers.customers.id |
| full_name    | `text`                     | No       | ``                  |     |                        |
| job_title    | `text`                     | Sí       | ``                  |     |                        |
| email        | `text`                     | Sí       | ``                  |     |                        |
| phone        | `text`                     | Sí       | ``                  |     |                        |
| is_primary   | `boolean`                  | No       | `false`             |     |                        |

## customers.customer_credit_limit_history

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id            | `bigint`                   | No       | ``                  |     |                        |
| tenant_id           | `uuid`                     | No       | ``                  |     |                        |
| company_id          | `uuid`                     | No       | ``                  |     |                        |
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
| customer_id         | `uuid`                     | No       | ``                  |     | customers.customers.id |
| previous_limit      | `numeric(18,4)`            | No       | ``                  |     |                        |
| new_limit           | `numeric(18,4)`            | No       | ``                  |     |                        |
| approved_by_user_id | `uuid`                     | Sí       | ``                  |     |                        |

## customers.customer_credit_profiles

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id           | `bigint`                   | No       | ``                  |     |                        |
| tenant_id          | `uuid`                     | No       | ``                  |     |                        |
| company_id         | `uuid`                     | No       | ``                  |     |                        |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                        |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by         | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                        |
| version            | `integer`                  | No       | `1`                 |     |                        |
| row_version        | `bigint`                   | No       | `0`                 |     |                        |
| is_active          | `boolean`                  | No       | `true`              |     |                        |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                        |
| observations       | `text`                     | Sí       | ``                  |     |                        |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id        | `uuid`                     | No       | ``                  |     | customers.customers.id |
| credit_limit       | `numeric(18,4)`            | No       | `0`                 |     |                        |
| payment_terms_days | `integer`                  | No       | `0`                 |     |                        |
| billing_cutoff_day | `smallint`                 | Sí       | ``                  |     |                        |

## customers.customer_discounts

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id            | `bigint`                   | No       | ``                  |     |                        |
| tenant_id           | `uuid`                     | No       | ``                  |     |                        |
| company_id          | `uuid`                     | No       | ``                  |     |                        |
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
| customer_id         | `uuid`                     | No       | ``                  |     | customers.customers.id |
| discount_percentage | `numeric(5,2)`             | No       | ``                  |     |                        |
| product_category_id | `uuid`                     | Sí       | ``                  |     |                        |

## customers.customer_loyalty_accounts

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id           | `bigint`                   | No       | ``                  |     |                        |
| tenant_id          | `uuid`                     | No       | ``                  |     |                        |
| company_id         | `uuid`                     | No       | ``                  |     |                        |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                        |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by         | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                        |
| version            | `integer`                  | No       | `1`                 |     |                        |
| row_version        | `bigint`                   | No       | `0`                 |     |                        |
| is_active          | `boolean`                  | No       | `true`              |     |                        |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                        |
| observations       | `text`                     | Sí       | ``                  |     |                        |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id        | `uuid`                     | No       | ``                  |     | customers.customers.id |
| loyalty_program_id | `uuid`                     | Sí       | ``                  |     |                        |
| points_balance     | `integer`                  | No       | `0`                 |     |                        |
| tier_code          | `text`                     | Sí       | ``                  |     |                        |

## customers.customer_price_lists

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id      | `bigint`                   | No       | ``                  |     |                        |
| tenant_id     | `uuid`                     | No       | ``                  |     |                        |
| company_id    | `uuid`                     | No       | ``                  |     |                        |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                        |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by    | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                        |
| version       | `integer`                  | No       | `1`                 |     |                        |
| row_version   | `bigint`                   | No       | `0`                 |     |                        |
| is_active     | `boolean`                  | No       | `true`              |     |                        |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                        |
| observations  | `text`                     | Sí       | ``                  |     |                        |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id   | `uuid`                     | No       | ``                  |     | customers.customers.id |
| price_list_id | `uuid`                     | No       | ``                  |     |                        |

## customers.customer_references

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                     |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id       | `bigint`                   | No       | ``                  |     |                        |
| tenant_id      | `uuid`                     | No       | ``                  |     |                        |
| company_id     | `uuid`                     | No       | ``                  |     |                        |
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
| customer_id    | `uuid`                     | No       | ``                  |     | customers.customers.id |
| reference_type | `text`                     | No       | ``                  |     |                        |
| name           | `text`                     | No       | ``                  |     |                        |
| phone          | `text`                     | Sí       | ``                  |     |                        |

## customers.customer_statements

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                     |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id        | `bigint`                   | No       | ``                  |     |                        |
| tenant_id       | `uuid`                     | No       | ``                  |     |                        |
| company_id      | `uuid`                     | No       | ``                  |     |                        |
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
| customer_id     | `uuid`                     | No       | ``                  |     | customers.customers.id |
| period_start    | `date`                     | No       | ``                  |     |                        |
| period_end      | `date`                     | No       | ``                  |     |                        |
| closing_balance | `numeric(18,4)`            | No       | ``                  |     |                        |
| snapshot_data   | `jsonb`                    | No       | ``                  |     |                        |

## customers.customer_visits

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                        |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id           | `bigint`                   | No       | ``                  |     |                           |
| tenant_id          | `uuid`                     | No       | ``                  |     |                           |
| company_id         | `uuid`                     | No       | ``                  |     |                           |
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
| customer_id        | `uuid`                     | No       | ``                  |     | customers.customers.id    |
| route_id           | `uuid`                     | Sí       | ``                  |     | customers.sales_routes.id |
| visited_by_user_id | `uuid`                     | No       | ``                  |     |                           |
| visited_at         | `timestamp with time zone` | No       | `now()`             |     |                           |
| latitude           | `numeric(9,6)`             | Sí       | ``                  |     |                           |
| longitude          | `numeric(9,6)`             | Sí       | ``                  |     |                           |
| outcome_notes      | `text`                     | Sí       | ``                  |     |                           |

## customers.customer_wishlist_items

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                     |
| ------------ | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id     | `bigint`                   | No       | ``                  |     |                        |
| tenant_id    | `uuid`                     | No       | ``                  |     |                        |
| company_id   | `uuid`                     | No       | ``                  |     |                        |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                        |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by   | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                        |
| version      | `integer`                  | No       | `1`                 |     |                        |
| row_version  | `bigint`                   | No       | `0`                 |     |                        |
| is_active    | `boolean`                  | No       | `true`              |     |                        |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                        |
| observations | `text`                     | Sí       | ``                  |     |                        |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| customer_id  | `uuid`                     | No       | ``                  |     | customers.customers.id |
| product_id   | `uuid`                     | No       | ``                  |     |                        |

## customers.customers

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                                    |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                       |
| local_id                | `bigint`                   | No       | ``                  |     |                                       |
| tenant_id               | `uuid`                     | No       | ``                  |     |                                       |
| company_id              | `uuid`                     | No       | ``                  |     |                                       |
| branch_id               | `uuid`                     | Sí       | ``                  |     |                                       |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                                       |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                                       |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                                       |
| created_by              | `uuid`                     | Sí       | ``                  |     |                                       |
| updated_by              | `uuid`                     | Sí       | ``                  |     |                                       |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |                                       |
| version                 | `integer`                  | No       | `1`                 |     |                                       |
| row_version             | `bigint`                   | No       | `0`                 |     |                                       |
| is_active               | `boolean`                  | No       | `true`              |     |                                       |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                                       |
| observations            | `text`                     | Sí       | ``                  |     |                                       |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                       |
| legal_name              | `text`                     | No       | ``                  |     |                                       |
| trade_name              | `text`                     | Sí       | ``                  |     |                                       |
| tax_id                  | `text`                     | No       | ``                  |     |                                       |
| tax_regime              | `text`                     | Sí       | ``                  |     |                                       |
| preferred_currency_code | `character`                | No       | ``                  |     |                                       |
| assigned_salesperson_id | `uuid`                     | Sí       | ``                  |     |                                       |
| is_blocked              | `boolean`                  | No       | `false`             |     |                                       |
| block_reason            | `text`                     | Sí       | ``                  |     |                                       |
| classification_id       | `uuid`                     | Sí       | ``                  |     | customers.customer_classifications.id |
| category_id             | `uuid`                     | Sí       | ``                  |     | customers.customer_categories.id      |

## customers.sales_route_customers

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                        |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id     | `bigint`                   | No       | ``                  |     |                           |
| tenant_id    | `uuid`                     | No       | ``                  |     |                           |
| company_id   | `uuid`                     | No       | ``                  |     |                           |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                           |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                           |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by   | `uuid`                     | Sí       | ``                  |     |                           |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                           |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                           |
| version      | `integer`                  | No       | `1`                 |     |                           |
| row_version  | `bigint`                   | No       | `0`                 |     |                           |
| is_active    | `boolean`                  | No       | `true`              |     |                           |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                           |
| observations | `text`                     | Sí       | ``                  |     |                           |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| route_id     | `uuid`                     | No       | ``                  |     | customers.sales_routes.id |
| customer_id  | `uuid`                     | No       | ``                  |     | customers.customers.id    |
| visit_order  | `smallint`                 | Sí       | ``                  |     |                           |

## customers.sales_routes

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK  |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                | `bigint`                   | No       | ``                  |     |     |
| tenant_id               | `uuid`                     | No       | ``                  |     |     |
| company_id              | `uuid`                     | No       | ``                  |     |     |
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
| name                    | `text`                     | No       | ``                  |     |     |
| assigned_salesperson_id | `uuid`                     | Sí       | ``                  |     |     |

## customers.v_accounts_receivable_aging

| Columna          | Tipo            | Nullable | Default | PK  | FK  |
| ---------------- | --------------- | -------- | ------- | --- | --- |
| customer_id      | `uuid`          | Sí       | ``      |     |     |
| legal_name       | `text`          | Sí       | ``      |     |     |
| invoice_id       | `uuid`          | Sí       | ``      |     |     |
| document_number  | `text`          | Sí       | ``      |     |     |
| total_amount     | `numeric(18,4)` | Sí       | ``      |     |     |
| open_balance     | `numeric`       | Sí       | ``      |     |     |
| days_outstanding | `integer`       | Sí       | ``      |     |     |
| aging_bucket     | `text`          | Sí       | ``      |     |     |
