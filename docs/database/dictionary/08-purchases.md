# Diccionario de datos — schema `purchases`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## purchases.goods_receipt_note_lines

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                               |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id        | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                  |
| company_id      | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                  |
| version         | `integer`                  | No       | `1`                 |     |                                  |
| row_version     | `bigint`                   | No       | `0`                 |     |                                  |
| is_active       | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                  |
| observations    | `text`                     | Sí       | ``                  |     |                                  |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| receipt_note_id | `uuid`                     | No       | ``                  |     | purchases.goods_receipt_notes.id |
| product_id      | `uuid`                     | No       | ``                  |     |                                  |
| quantity        | `numeric(18,6)`            | No       | ``                  |     |                                  |

## purchases.goods_receipt_notes

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                           |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id             | `bigint`                   | No       | ``                  |     |                              |
| tenant_id            | `uuid`                     | No       | ``                  |     |                              |
| company_id           | `uuid`                     | No       | ``                  |     |                              |
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
| purchase_order_id    | `uuid`                     | No       | ``                  |     | purchases.purchase_orders.id |
| inventory_receipt_id | `uuid`                     | Sí       | ``                  |     |                              |

## purchases.import_expenses

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
| import_id    | `uuid`                     | No       | ``                  |     | purchases.imports.id |
| expense_type | `text`                     | No       | ``                  |     |                      |
| amount       | `numeric(18,4)`            | No       | ``                  |     |                      |

## purchases.import_status

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

## purchases.import_status_history

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
| import_id    | `uuid`                     | No       | ``                  |     | purchases.imports.id       |
| status_id    | `uuid`                     | No       | ``                  |     | purchases.import_status.id |

## purchases.imports

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                           |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id          | `bigint`                   | No       | ``                  |     |                              |
| tenant_id         | `uuid`                     | No       | ``                  |     |                              |
| company_id        | `uuid`                     | No       | ``                  |     |                              |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                              |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by        | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                              |
| version           | `integer`                  | No       | `1`                 |     |                              |
| row_version       | `bigint`                   | No       | `0`                 |     |                              |
| is_active         | `boolean`                  | No       | `true`              |     |                              |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                              |
| observations      | `text`                     | Sí       | ``                  |     |                              |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| purchase_order_id | `uuid`                     | No       | ``                  |     | purchases.purchase_orders.id |
| status_id         | `uuid`                     | No       | ``                  |     | purchases.import_status.id   |

## purchases.purchase_credit_note_lines

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                                 |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id       | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id      | `uuid`                     | No       | ``                  |     |                                    |
| company_id     | `uuid`                     | Sí       | ``                  |     |                                    |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| version        | `integer`                  | No       | `1`                 |     |                                    |
| row_version    | `bigint`                   | No       | `0`                 |     |                                    |
| is_active      | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                                    |
| observations   | `text`                     | Sí       | ``                  |     |                                    |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| credit_note_id | `uuid`                     | No       | ``                  |     | purchases.purchase_credit_notes.id |
| product_id     | `uuid`                     | No       | ``                  |     |                                    |
| quantity       | `numeric(18,6)`            | No       | ``                  |     |                                    |

## purchases.purchase_credit_notes

| Columna             | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id            | `bigint`                   | No       | ``                  |     |     |
| tenant_id           | `uuid`                     | No       | ``                  |     |     |
| company_id          | `uuid`                     | No       | ``                  |     |     |
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
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |     |
| total_amount        | `numeric(18,4)`            | No       | ``                  |     |     |

## purchases.purchase_expenses

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                           |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id          | `bigint`                   | No       | ``                  |     |                              |
| tenant_id         | `uuid`                     | No       | ``                  |     |                              |
| company_id        | `uuid`                     | No       | ``                  |     |                              |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                              |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by        | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                              |
| version           | `integer`                  | No       | `1`                 |     |                              |
| row_version       | `bigint`                   | No       | `0`                 |     |                              |
| is_active         | `boolean`                  | No       | `true`              |     |                              |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                              |
| observations      | `text`                     | Sí       | ``                  |     |                              |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| purchase_order_id | `uuid`                     | Sí       | ``                  |     | purchases.purchase_orders.id |
| description       | `text`                     | No       | ``                  |     |                              |
| amount            | `numeric(18,4)`            | No       | ``                  |     |                              |

## purchases.purchase_invoice_lines

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
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |     |
| product_id          | `uuid`                     | No       | ``                  |     |     |
| tax_id              | `uuid`                     | Sí       | ``                  |     |     |
| quantity            | `numeric(18,6)`            | No       | ``                  |     |     |
| unit_cost           | `numeric(18,4)`            | No       | ``                  |     |     |
| is_capitalizable    | `boolean`                  | No       | `false`             |     |     |

## purchases.purchase_invoice_matching

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                               |
| ------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id            | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id           | `uuid`                     | No       | ``                  |     |                                  |
| company_id          | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by          | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                                  |
| version             | `integer`                  | No       | `1`                 |     |                                  |
| row_version         | `bigint`                   | No       | `0`                 |     |                                  |
| is_active           | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                                  |
| observations        | `text`                     | Sí       | ``                  |     |                                  |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| purchase_order_id   | `uuid`                     | No       | ``                  |     | purchases.purchase_orders.id     |
| receipt_note_id     | `uuid`                     | No       | ``                  |     | purchases.goods_receipt_notes.id |
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |                                  |
| discrepancy_amount  | `numeric(18,4)`            | No       | `0`                 |     |                                  |
| is_within_tolerance | `boolean`                  | No       | `true`              |     |                                  |

## purchases.purchase_invoice_status

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

## purchases.purchase_invoice_status_history

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id            | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id           | `uuid`                     | No       | ``                  |     |                                      |
| company_id          | `uuid`                     | Sí       | ``                  |     |                                      |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                                      |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by          | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                                      |
| version             | `integer`                  | No       | `1`                 |     |                                      |
| row_version         | `bigint`                   | No       | `0`                 |     |                                      |
| is_active           | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                                      |
| observations        | `text`                     | Sí       | ``                  |     |                                      |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |                                      |
| status_id           | `uuid`                     | No       | ``                  |     | purchases.purchase_invoice_status.id |

## purchases.purchase_invoices

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id                 | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id                | `uuid`                     | No       | ``                  |     |                                      |
| company_id               | `uuid`                     | No       | ``                  |     |                                      |
| branch_id                | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                                      |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by               | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by               | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |                                      |
| version                  | `integer`                  | No       | `1`                 |     |                                      |
| row_version              | `bigint`                   | No       | `0`                 |     |                                      |
| is_active                | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                                      |
| observations             | `text`                     | Sí       | ``                  |     |                                      |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| supplier_document_number | `text`                     | No       | ``                  |     |                                      |
| supplier_id              | `uuid`                     | No       | ``                  |     |                                      |
| purchase_order_id        | `uuid`                     | Sí       | ``                  |     | purchases.purchase_orders.id         |
| status_id                | `uuid`                     | No       | ``                  |     | purchases.purchase_invoice_status.id |
| currency_code            | `character`                | No       | ``                  |     |                                      |
| subtotal_amount          | `numeric(18,4)`            | No       | `0`                 |     |                                      |
| tax_amount               | `numeric(18,4)`            | No       | `0`                 |     |                                      |
| total_amount             | `numeric(18,4)`            | No       | `0`                 |     |                                      |
| received_at              | `timestamp with time zone` | No       | `now()`             | PK  |                                      |

## purchases.purchase_order_lines

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                           |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id          | `bigint`                   | No       | ``                  |     |                              |
| tenant_id         | `uuid`                     | No       | ``                  |     |                              |
| company_id        | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                              |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by        | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                              |
| version           | `integer`                  | No       | `1`                 |     |                              |
| row_version       | `bigint`                   | No       | `0`                 |     |                              |
| is_active         | `boolean`                  | No       | `true`              |     |                              |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                              |
| observations      | `text`                     | Sí       | ``                  |     |                              |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| purchase_order_id | `uuid`                     | No       | ``                  |     | purchases.purchase_orders.id |
| product_id        | `uuid`                     | No       | ``                  |     |                              |
| quantity          | `numeric(18,6)`            | No       | ``                  |     |                              |
| unit_price        | `numeric(18,4)`            | No       | ``                  |     |                              |

## purchases.purchase_order_status

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

## purchases.purchase_order_status_history

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                                 |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id          | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                    |
| company_id        | `uuid`                     | Sí       | ``                  |     |                                    |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by        | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                                    |
| version           | `integer`                  | No       | `1`                 |     |                                    |
| row_version       | `bigint`                   | No       | `0`                 |     |                                    |
| is_active         | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                    |
| observations      | `text`                     | Sí       | ``                  |     |                                    |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| purchase_order_id | `uuid`                     | No       | ``                  |     | purchases.purchase_orders.id       |
| status_id         | `uuid`                     | No       | ``                  |     | purchases.purchase_order_status.id |

## purchases.purchase_orders

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                                 |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id        | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                    |
| company_id      | `uuid`                     | No       | ``                  |     |                                    |
| branch_id       | `uuid`                     | No       | ``                  |     |                                    |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                    |
| version         | `integer`                  | No       | `1`                 |     |                                    |
| row_version     | `bigint`                   | No       | `0`                 |     |                                    |
| is_active       | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                    |
| observations    | `text`                     | Sí       | ``                  |     |                                    |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| document_number | `text`                     | No       | ``                  |     |                                    |
| supplier_id     | `uuid`                     | No       | ``                  |     |                                    |
| requisition_id  | `uuid`                     | Sí       | ``                  |     | purchases.purchase_requisitions.id |
| status_id       | `uuid`                     | No       | ``                  |     | purchases.purchase_order_status.id |
| currency_code   | `character`                | No       | ``                  |     |                                    |
| total_amount    | `numeric(18,4)`            | No       | `0`                 |     |                                    |

## purchases.purchase_quote_lines

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
| quote_id     | `uuid`                     | No       | ``                  |     | purchases.purchase_quotes.id |
| product_id   | `uuid`                     | No       | ``                  |     |                              |
| unit_price   | `numeric(18,4)`            | No       | ``                  |     |                              |

## purchases.purchase_quotes

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                                 |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id       | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id      | `uuid`                     | No       | ``                  |     |                                    |
| company_id     | `uuid`                     | No       | ``                  |     |                                    |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| version        | `integer`                  | No       | `1`                 |     |                                    |
| row_version    | `bigint`                   | No       | `0`                 |     |                                    |
| is_active      | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                                    |
| observations   | `text`                     | Sí       | ``                  |     |                                    |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| supplier_id    | `uuid`                     | No       | ``                  |     |                                    |
| requisition_id | `uuid`                     | Sí       | ``                  |     | purchases.purchase_requisitions.id |

## purchases.purchase_requisition_lines

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                                 |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                    |
| local_id       | `bigint`                   | No       | ``                  |     |                                    |
| tenant_id      | `uuid`                     | No       | ``                  |     |                                    |
| company_id     | `uuid`                     | Sí       | ``                  |     |                                    |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                                    |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                                    |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                                    |
| created_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                                    |
| version        | `integer`                  | No       | `1`                 |     |                                    |
| row_version    | `bigint`                   | No       | `0`                 |     |                                    |
| is_active      | `boolean`                  | No       | `true`              |     |                                    |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                                    |
| observations   | `text`                     | Sí       | ``                  |     |                                    |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                    |
| requisition_id | `uuid`                     | No       | ``                  |     | purchases.purchase_requisitions.id |
| product_id     | `uuid`                     | No       | ``                  |     |                                    |
| quantity       | `numeric(18,6)`            | No       | ``                  |     |                                    |

## purchases.purchase_requisition_status

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

## purchases.purchase_requisition_status_history

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                                       |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                          |
| local_id       | `bigint`                   | No       | ``                  |     |                                          |
| tenant_id      | `uuid`                     | No       | ``                  |     |                                          |
| company_id     | `uuid`                     | Sí       | ``                  |     |                                          |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                                          |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                                          |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                                          |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                                          |
| created_by     | `uuid`                     | Sí       | ``                  |     |                                          |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                                          |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                                          |
| version        | `integer`                  | No       | `1`                 |     |                                          |
| row_version    | `bigint`                   | No       | `0`                 |     |                                          |
| is_active      | `boolean`                  | No       | `true`              |     |                                          |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                                          |
| observations   | `text`                     | Sí       | ``                  |     |                                          |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                          |
| requisition_id | `uuid`                     | No       | ``                  |     | purchases.purchase_requisitions.id       |
| status_id      | `uuid`                     | No       | ``                  |     | purchases.purchase_requisition_status.id |

## purchases.purchase_requisitions

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                                       |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                          |
| local_id             | `bigint`                   | No       | ``                  |     |                                          |
| tenant_id            | `uuid`                     | No       | ``                  |     |                                          |
| company_id           | `uuid`                     | No       | ``                  |     |                                          |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                                          |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                                          |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                                          |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                                          |
| created_by           | `uuid`                     | Sí       | ``                  |     |                                          |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                                          |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                                          |
| version              | `integer`                  | No       | `1`                 |     |                                          |
| row_version          | `bigint`                   | No       | `0`                 |     |                                          |
| is_active            | `boolean`                  | No       | `true`              |     |                                          |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                                          |
| observations         | `text`                     | Sí       | ``                  |     |                                          |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                          |
| document_number      | `text`                     | No       | ``                  |     |                                          |
| requested_by_user_id | `uuid`                     | No       | ``                  |     |                                          |
| status_id            | `uuid`                     | No       | ``                  |     | purchases.purchase_requisition_status.id |

## purchases.purchase_return_lines

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
| return_id    | `uuid`                     | No       | ``                  |     | purchases.purchase_returns.id |
| product_id   | `uuid`                     | No       | ``                  |     |                               |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                               |

## purchases.purchase_returns

| Columna             | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id            | `bigint`                   | No       | ``                  |     |     |
| tenant_id           | `uuid`                     | No       | ``                  |     |     |
| company_id          | `uuid`                     | No       | ``                  |     |     |
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
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |     |
| reason              | `text`                     | Sí       | ``                  |     |     |

## purchases.purchase_withholdings

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
| purchase_invoice_id | `uuid`                     | No       | ``                  |     |     |
| withholding_rule_id | `uuid`                     | Sí       | ``                  |     |     |
| amount              | `numeric(18,4)`            | No       | ``                  |     |     |
