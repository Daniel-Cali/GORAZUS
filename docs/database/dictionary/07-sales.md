# Diccionario de datos — schema `sales`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## sales.commission_entries

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
| commission_rule_id | `uuid`                     | No       | ``                  |     | sales.commission_rules.id |
| invoice_id         | `uuid`                     | No       | ``                  |     |                           |
| amount             | `numeric(18,4)`            | No       | ``                  |     |                           |

## sales.commission_rules

| Columna               | Tipo                       | Nullable | Default             | PK  | FK                   |
| --------------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id                    | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id              | `bigint`                   | No       | ``                  |     |                      |
| tenant_id             | `uuid`                     | No       | ``                  |     |                      |
| company_id            | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id             | `uuid`                     | Sí       | ``                  |     |                      |
| created_at            | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at            | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at            | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by            | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by            | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by            | `uuid`                     | Sí       | ``                  |     |                      |
| version               | `integer`                  | No       | `1`                 |     |                      |
| row_version           | `bigint`                   | No       | `0`                 |     |                      |
| is_active             | `boolean`                  | No       | `true`              |     |                      |
| is_deleted            | `boolean`                  | Sí       | ``                  |     |                      |
| observations          | `text`                     | Sí       | ``                  |     |                      |
| metadata              | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| salesperson_id        | `uuid`                     | Sí       | ``                  |     | sales.salespeople.id |
| commission_percentage | `numeric(5,2)`             | No       | ``                  |     |                      |

## sales.coupon_redemptions

| Columna      | Tipo                       | Nullable | Default             | PK  | FK               |
| ------------ | -------------------------- | -------- | ------------------- | --- | ---------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                  |
| local_id     | `bigint`                   | No       | ``                  |     |                  |
| tenant_id    | `uuid`                     | No       | ``                  |     |                  |
| company_id   | `uuid`                     | Sí       | ``                  |     |                  |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                  |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                  |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                  |
| created_by   | `uuid`                     | Sí       | ``                  |     |                  |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                  |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                  |
| version      | `integer`                  | No       | `1`                 |     |                  |
| row_version  | `bigint`                   | No       | `0`                 |     |                  |
| is_active    | `boolean`                  | No       | `true`              |     |                  |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                  |
| observations | `text`                     | Sí       | ``                  |     |                  |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                  |
| coupon_id    | `uuid`                     | No       | ``                  |     | sales.coupons.id |
| invoice_id   | `uuid`                     | No       | ``                  |     |                  |

## sales.coupons

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
| code                | `text`                     | No       | ``                  |     |     |
| discount_percentage | `numeric(5,2)`             | Sí       | ``                  |     |     |
| discount_amount     | `numeric(18,4)`            | Sí       | ``                  |     |     |
| max_redemptions     | `integer`                  | Sí       | ``                  |     |     |
| expires_at          | `date`                     | Sí       | ``                  |     |     |

## sales.credit_note_lines

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                    |
| -------------- | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id       | `bigint`                   | No       | ``                  |     |                       |
| tenant_id      | `uuid`                     | No       | ``                  |     |                       |
| company_id     | `uuid`                     | Sí       | ``                  |     |                       |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                       |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by     | `uuid`                     | Sí       | ``                  |     |                       |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                       |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                       |
| version        | `integer`                  | No       | `1`                 |     |                       |
| row_version    | `bigint`                   | No       | `0`                 |     |                       |
| is_active      | `boolean`                  | No       | `true`              |     |                       |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                       |
| observations   | `text`                     | Sí       | ``                  |     |                       |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| credit_note_id | `uuid`                     | No       | ``                  |     | sales.credit_notes.id |
| product_id     | `uuid`                     | No       | ``                  |     |                       |
| quantity       | `numeric(18,6)`            | No       | ``                  |     |                       |
| unit_price     | `numeric(18,4)`            | No       | ``                  |     |                       |

## sales.credit_notes

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | No       | ``                  |     |     |
| branch_id       | `uuid`                     | No       | ``                  |     |     |
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
| document_number | `text`                     | No       | ``                  |     |     |
| invoice_id      | `uuid`                     | No       | ``                  |     |     |
| total_amount    | `numeric(18,4)`            | No       | ``                  |     |     |
| reason          | `text`                     | Sí       | ``                  |     |     |

## sales.debit_note_lines

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id      | `bigint`                   | No       | ``                  |     |                      |
| tenant_id     | `uuid`                     | No       | ``                  |     |                      |
| company_id    | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                      |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by    | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                      |
| version       | `integer`                  | No       | `1`                 |     |                      |
| row_version   | `bigint`                   | No       | `0`                 |     |                      |
| is_active     | `boolean`                  | No       | `true`              |     |                      |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                      |
| observations  | `text`                     | Sí       | ``                  |     |                      |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| debit_note_id | `uuid`                     | No       | ``                  |     | sales.debit_notes.id |
| description   | `text`                     | No       | ``                  |     |                      |
| amount        | `numeric(18,4)`            | No       | ``                  |     |                      |

## sales.debit_notes

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | No       | ``                  |     |     |
| branch_id       | `uuid`                     | No       | ``                  |     |     |
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
| document_number | `text`                     | No       | ``                  |     |     |
| invoice_id      | `uuid`                     | No       | ``                  |     |     |
| total_amount    | `numeric(18,4)`            | No       | ``                  |     |     |
| reason          | `text`                     | Sí       | ``                  |     |     |

## sales.delivery_note_lines

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                      |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id         | `bigint`                   | No       | ``                  |     |                         |
| tenant_id        | `uuid`                     | No       | ``                  |     |                         |
| company_id       | `uuid`                     | Sí       | ``                  |     |                         |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                         |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by       | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                         |
| version          | `integer`                  | No       | `1`                 |     |                         |
| row_version      | `bigint`                   | No       | `0`                 |     |                         |
| is_active        | `boolean`                  | No       | `true`              |     |                         |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                         |
| observations     | `text`                     | Sí       | ``                  |     |                         |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| delivery_note_id | `uuid`                     | No       | ``                  |     | sales.delivery_notes.id |
| product_id       | `uuid`                     | No       | ``                  |     |                         |
| quantity         | `numeric(18,6)`            | No       | ``                  |     |                         |

## sales.delivery_notes

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                    |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id        | `bigint`                   | No       | ``                  |     |                       |
| tenant_id       | `uuid`                     | No       | ``                  |     |                       |
| company_id      | `uuid`                     | No       | ``                  |     |                       |
| branch_id       | `uuid`                     | No       | ``                  |     |                       |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by      | `uuid`                     | Sí       | ``                  |     |                       |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                       |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                       |
| version         | `integer`                  | No       | `1`                 |     |                       |
| row_version     | `bigint`                   | No       | `0`                 |     |                       |
| is_active       | `boolean`                  | No       | `true`              |     |                       |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                       |
| observations    | `text`                     | Sí       | ``                  |     |                       |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| document_number | `text`                     | No       | ``                  |     |                       |
| sales_order_id  | `uuid`                     | No       | ``                  |     | sales.sales_orders.id |

## sales.discounts

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
| product_category_id | `uuid`                     | Sí       | ``                  |     |     |
| discount_percentage | `numeric(5,2)`             | No       | ``                  |     |     |

## sales.electronic_invoice_logs

| Columna           | Tipo                       | Nullable | Default             | PK  | FK  |
| ----------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id          | `bigint`                   | No       | ``                  |     |     |
| tenant_id         | `uuid`                     | No       | ``                  |     |     |
| company_id        | `uuid`                     | Sí       | ``                  |     |     |
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
| invoice_id        | `uuid`                     | No       | ``                  |     |     |
| attempt_status    | `text`                     | No       | ``                  |     |     |
| provider_response | `text`                     | Sí       | ``                  |     |     |
| fiscal_folio      | `text`                     | Sí       | ``                  |     |     |

## sales.gift_card_transactions

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id     | `bigint`                   | No       | ``                  |     |                     |
| tenant_id    | `uuid`                     | No       | ``                  |     |                     |
| company_id   | `uuid`                     | Sí       | ``                  |     |                     |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                     |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by   | `uuid`                     | Sí       | ``                  |     |                     |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                     |
| version      | `integer`                  | No       | `1`                 |     |                     |
| row_version  | `bigint`                   | No       | `0`                 |     |                     |
| is_active    | `boolean`                  | No       | `true`              |     |                     |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                     |
| observations | `text`                     | Sí       | ``                  |     |                     |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| gift_card_id | `uuid`                     | No       | ``                  |     | sales.gift_cards.id |
| invoice_id   | `uuid`                     | Sí       | ``                  |     |                     |
| amount_delta | `numeric(18,4)`            | No       | ``                  |     |                     |

## sales.gift_cards

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
| code            | `text`                     | No       | ``                  |     |     |
| initial_balance | `numeric(18,4)`            | No       | ``                  |     |     |
| current_balance | `numeric(18,4)`            | No       | ``                  |     |     |
| expires_at      | `date`                     | Sí       | ``                  |     |     |

## sales.invoice_lines

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
| invoice_id          | `uuid`                     | No       | ``                  |     |     |
| product_id          | `uuid`                     | No       | ``                  |     |     |
| tax_id              | `uuid`                     | Sí       | ``                  |     |     |
| quantity            | `numeric(18,6)`            | No       | ``                  |     |     |
| unit_price          | `numeric(18,4)`            | No       | ``                  |     |     |
| discount_percentage | `numeric(5,2)`             | No       | `0`                 |     |     |
| line_total          | `numeric(18,4)`            | No       | ``                  |     |     |

## sales.invoice_status

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

## sales.invoice_status_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id     | `bigint`                   | No       | ``                  |     |                         |
| tenant_id    | `uuid`                     | No       | ``                  |     |                         |
| company_id   | `uuid`                     | Sí       | ``                  |     |                         |
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
| invoice_id   | `uuid`                     | No       | ``                  |     |                         |
| status_id    | `uuid`                     | No       | ``                  |     | sales.invoice_status.id |

## sales.invoices

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                      |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id                | `bigint`                   | No       | ``                  |     |                         |
| tenant_id               | `uuid`                     | No       | ``                  |     |                         |
| company_id              | `uuid`                     | No       | ``                  |     |                         |
| branch_id               | `uuid`                     | No       | ``                  |     |                         |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by              | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by              | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |                         |
| version                 | `integer`                  | No       | `1`                 |     |                         |
| row_version             | `bigint`                   | No       | `0`                 |     |                         |
| is_active               | `boolean`                  | No       | `true`              |     |                         |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                         |
| observations            | `text`                     | Sí       | ``                  |     |                         |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| document_number         | `text`                     | No       | ``                  |     |                         |
| fiscal_document_type_id | `uuid`                     | Sí       | ``                  |     |                         |
| customer_id             | `uuid`                     | No       | ``                  |     |                         |
| sales_order_id          | `uuid`                     | Sí       | ``                  |     | sales.sales_orders.id   |
| status_id               | `uuid`                     | No       | ``                  |     | sales.invoice_status.id |
| sales_channel           | `text`                     | No       | `'store'::text`     |     |                         |
| currency_code           | `character`                | No       | ``                  |     |                         |
| subtotal_amount         | `numeric(18,4)`            | No       | `0`                 |     |                         |
| tax_amount              | `numeric(18,4)`            | No       | `0`                 |     |                         |
| total_amount            | `numeric(18,4)`            | No       | `0`                 |     |                         |
| issued_at               | `timestamp with time zone` | No       | `now()`             | PK  |                         |

## sales.layaway_lines

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     |                   |
| company_id   | `uuid`                     | Sí       | ``                  |     |                   |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                   |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     |                   |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                   |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                   |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| layaway_id   | `uuid`                     | No       | ``                  |     | sales.layaways.id |
| product_id   | `uuid`                     | No       | ``                  |     |                   |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                   |
| unit_price   | `numeric(18,4)`            | No       | ``                  |     |                   |

## sales.layaway_payments

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     |                   |
| company_id   | `uuid`                     | Sí       | ``                  |     |                   |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                   |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     |                   |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                   |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                   |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| layaway_id   | `uuid`                     | No       | ``                  |     | sales.layaways.id |
| amount       | `numeric(18,4)`            | No       | ``                  |     |                   |

## sales.layaways

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
| customer_id  | `uuid`                     | No       | ``                  |     |     |
| total_amount | `numeric(18,4)`            | No       | ``                  |     |     |
| balance_due  | `numeric(18,4)`            | No       | ``                  |     |     |
| status       | `text`                     | No       | `'active'::text`    |     |     |

## sales.loyalty_points_transactions

| Columna            | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id           | `bigint`                   | No       | ``                  |     |     |
| tenant_id          | `uuid`                     | No       | ``                  |     |     |
| company_id         | `uuid`                     | Sí       | ``                  |     |     |
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
| loyalty_account_id | `uuid`                     | No       | ``                  |     |     |
| invoice_id         | `uuid`                     | Sí       | ``                  |     |     |
| points_delta       | `integer`                  | No       | ``                  |     |     |
| transaction_type   | `text`                     | No       | ``                  |     |     |

## sales.loyalty_program_tiers

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                        |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id     | `bigint`                   | No       | ``                  |     |                           |
| tenant_id    | `uuid`                     | No       | ``                  |     |                           |
| company_id   | `uuid`                     | Sí       | ``                  |     |                           |
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
| program_id   | `uuid`                     | No       | ``                  |     | sales.loyalty_programs.id |
| code         | `text`                     | No       | ``                  |     |                           |
| min_points   | `integer`                  | No       | ``                  |     |                           |

## sales.loyalty_programs

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
| name                     | `text`                     | No       | ``                  |     |     |
| points_per_currency_unit | `numeric(9,4)`             | No       | `1`                 |     |     |

## sales.online_store_configs

| Columna                        | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------------------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id                             | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id                       | `bigint`                   | No       | ``                  |     |     |
| tenant_id                      | `uuid`                     | No       | ``                  |     |     |
| company_id                     | `uuid`                     | No       | ``                  |     |     |
| branch_id                      | `uuid`                     | Sí       | ``                  |     |     |
| created_at                     | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at                     | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at                     | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by                     | `uuid`                     | Sí       | ``                  |     |     |
| updated_by                     | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by                     | `uuid`                     | Sí       | ``                  |     |     |
| version                        | `integer`                  | No       | `1`                 |     |     |
| row_version                    | `bigint`                   | No       | `0`                 |     |     |
| is_active                      | `boolean`                  | No       | `true`              |     |     |
| is_deleted                     | `boolean`                  | Sí       | ``                  |     |     |
| observations                   | `text`                     | Sí       | ``                  |     |     |
| metadata                       | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| domain                         | `text`                     | No       | ``                  |     |     |
| payment_gateway_integration_id | `uuid`                     | Sí       | ``                  |     |     |

## sales.promotion_rules

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id            | `bigint`                   | No       | ``                  |     |                     |
| tenant_id           | `uuid`                     | No       | ``                  |     |                     |
| company_id          | `uuid`                     | Sí       | ``                  |     |                     |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                     |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by          | `uuid`                     | Sí       | ``                  |     |                     |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                     |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                     |
| version             | `integer`                  | No       | `1`                 |     |                     |
| row_version         | `bigint`                   | No       | `0`                 |     |                     |
| is_active           | `boolean`                  | No       | `true`              |     |                     |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                     |
| observations        | `text`                     | Sí       | ``                  |     |                     |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| promotion_id        | `uuid`                     | No       | ``                  |     | sales.promotions.id |
| rule_type           | `text`                     | No       | ``                  |     |                     |
| product_id          | `uuid`                     | Sí       | ``                  |     |                     |
| min_quantity        | `numeric(18,6)`            | Sí       | ``                  |     |                     |
| discount_percentage | `numeric(5,2)`             | Sí       | ``                  |     |                     |

## sales.promotions

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
| starts_at    | `date`                     | No       | ``                  |     |     |
| ends_at      | `date`                     | No       | ``                  |     |     |

## sales.quote_lines

| Columna             | Tipo                       | Nullable | Default             | PK  | FK              |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                 |
| local_id            | `bigint`                   | No       | ``                  |     |                 |
| tenant_id           | `uuid`                     | No       | ``                  |     |                 |
| company_id          | `uuid`                     | Sí       | ``                  |     |                 |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                 |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                 |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                 |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                 |
| created_by          | `uuid`                     | Sí       | ``                  |     |                 |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                 |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                 |
| version             | `integer`                  | No       | `1`                 |     |                 |
| row_version         | `bigint`                   | No       | `0`                 |     |                 |
| is_active           | `boolean`                  | No       | `true`              |     |                 |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                 |
| observations        | `text`                     | Sí       | ``                  |     |                 |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                 |
| quote_id            | `uuid`                     | No       | ``                  |     | sales.quotes.id |
| product_id          | `uuid`                     | No       | ``                  |     |                 |
| quantity            | `numeric(18,6)`            | No       | ``                  |     |                 |
| unit_price          | `numeric(18,4)`            | No       | ``                  |     |                 |
| discount_percentage | `numeric(5,2)`             | No       | `0`                 |     |                 |

## sales.quote_status

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

## sales.quote_status_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                    |
| ------------ | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id     | `bigint`                   | No       | ``                  |     |                       |
| tenant_id    | `uuid`                     | No       | ``                  |     |                       |
| company_id   | `uuid`                     | Sí       | ``                  |     |                       |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                       |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by   | `uuid`                     | Sí       | ``                  |     |                       |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                       |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                       |
| version      | `integer`                  | No       | `1`                 |     |                       |
| row_version  | `bigint`                   | No       | `0`                 |     |                       |
| is_active    | `boolean`                  | No       | `true`              |     |                       |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                       |
| observations | `text`                     | Sí       | ``                  |     |                       |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| quote_id     | `uuid`                     | No       | ``                  |     | sales.quotes.id       |
| status_id    | `uuid`                     | No       | ``                  |     | sales.quote_status.id |

## sales.quotes

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                    |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id        | `bigint`                   | No       | ``                  |     |                       |
| tenant_id       | `uuid`                     | No       | ``                  |     |                       |
| company_id      | `uuid`                     | No       | ``                  |     |                       |
| branch_id       | `uuid`                     | No       | ``                  |     |                       |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by      | `uuid`                     | Sí       | ``                  |     |                       |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                       |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                       |
| version         | `integer`                  | No       | `1`                 |     |                       |
| row_version     | `bigint`                   | No       | `0`                 |     |                       |
| is_active       | `boolean`                  | No       | `true`              |     |                       |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                       |
| observations    | `text`                     | Sí       | ``                  |     |                       |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| document_number | `text`                     | No       | ``                  |     |                       |
| customer_id     | `uuid`                     | No       | ``                  |     |                       |
| salesperson_id  | `uuid`                     | Sí       | ``                  |     | sales.salespeople.id  |
| status_id       | `uuid`                     | No       | ``                  |     | sales.quote_status.id |
| currency_code   | `character`                | No       | ``                  |     |                       |
| total_amount    | `numeric(18,4)`            | No       | `0`                 |     |                       |
| valid_until     | `date`                     | Sí       | ``                  |     |                       |

## sales.receipt_allocations

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id       | `bigint`                   | No       | ``                  |     |                   |
| tenant_id      | `uuid`                     | No       | ``                  |     |                   |
| company_id     | `uuid`                     | Sí       | ``                  |     |                   |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                   |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by     | `uuid`                     | Sí       | ``                  |     |                   |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                   |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                   |
| version        | `integer`                  | No       | `1`                 |     |                   |
| row_version    | `bigint`                   | No       | `0`                 |     |                   |
| is_active      | `boolean`                  | No       | `true`              |     |                   |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                   |
| observations   | `text`                     | Sí       | ``                  |     |                   |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| receipt_id     | `uuid`                     | No       | ``                  |     | sales.receipts.id |
| invoice_id     | `uuid`                     | No       | ``                  |     |                   |
| amount_applied | `numeric(18,4)`            | No       | ``                  |     |                   |

## sales.receipts

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
| document_number   | `text`                     | No       | ``                  |     |     |
| customer_id       | `uuid`                     | No       | ``                  |     |     |
| total_amount      | `numeric(18,4)`            | No       | ``                  |     |     |
| payment_method_id | `uuid`                     | Sí       | ``                  |     |     |

## sales.recurring_sale_generations

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                                |
| ------------ | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id     | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                   |
| company_id   | `uuid`                     | Sí       | ``                  |     |                                   |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                   |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                   |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                   |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                   |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                   |
| version      | `integer`                  | No       | `1`                 |     |                                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                                   |
| is_active    | `boolean`                  | No       | `true`              |     |                                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                   |
| observations | `text`                     | Sí       | ``                  |     |                                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                   |
| template_id  | `uuid`                     | No       | ``                  |     | sales.recurring_sale_templates.id |
| invoice_id   | `uuid`                     | No       | ``                  |     |                                   |

## sales.recurring_sale_templates

| Columna              | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id             | `bigint`                   | No       | ``                  |     |     |
| tenant_id            | `uuid`                     | No       | ``                  |     |     |
| company_id           | `uuid`                     | No       | ``                  |     |     |
| branch_id            | `uuid`                     | Sí       | ``                  |     |     |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by           | `uuid`                     | Sí       | ``                  |     |     |
| updated_by           | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |     |
| version              | `integer`                  | No       | `1`                 |     |     |
| row_version          | `bigint`                   | No       | `0`                 |     |     |
| is_active            | `boolean`                  | No       | `true`              |     |     |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |     |
| observations         | `text`                     | Sí       | ``                  |     |     |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| customer_id          | `uuid`                     | No       | ``                  |     |     |
| frequency            | `text`                     | No       | ``                  |     |     |
| next_generation_date | `date`                     | No       | ``                  |     |     |

## sales.sales_contract_lines

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                       |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id     | `bigint`                   | No       | ``                  |     |                          |
| tenant_id    | `uuid`                     | No       | ``                  |     |                          |
| company_id   | `uuid`                     | Sí       | ``                  |     |                          |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                          |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by   | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                          |
| version      | `integer`                  | No       | `1`                 |     |                          |
| row_version  | `bigint`                   | No       | `0`                 |     |                          |
| is_active    | `boolean`                  | No       | `true`              |     |                          |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                          |
| observations | `text`                     | Sí       | ``                  |     |                          |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| contract_id  | `uuid`                     | No       | ``                  |     | sales.sales_contracts.id |
| product_id   | `uuid`                     | No       | ``                  |     |                          |
| agreed_price | `numeric(18,4)`            | No       | ``                  |     |                          |

## sales.sales_contracts

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
| customer_id  | `uuid`                     | No       | ``                  |     |     |
| starts_at    | `date`                     | No       | ``                  |     |     |
| ends_at      | `date`                     | Sí       | ``                  |     |     |

## sales.sales_order_lines

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                    |
| ------------------- | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id            | `bigint`                   | No       | ``                  |     |                       |
| tenant_id           | `uuid`                     | No       | ``                  |     |                       |
| company_id          | `uuid`                     | Sí       | ``                  |     |                       |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                       |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by          | `uuid`                     | Sí       | ``                  |     |                       |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                       |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                       |
| version             | `integer`                  | No       | `1`                 |     |                       |
| row_version         | `bigint`                   | No       | `0`                 |     |                       |
| is_active           | `boolean`                  | No       | `true`              |     |                       |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                       |
| observations        | `text`                     | Sí       | ``                  |     |                       |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| sales_order_id      | `uuid`                     | No       | ``                  |     | sales.sales_orders.id |
| product_id          | `uuid`                     | No       | ``                  |     |                       |
| quantity            | `numeric(18,6)`            | No       | ``                  |     |                       |
| unit_price          | `numeric(18,4)`            | No       | ``                  |     |                       |
| discount_percentage | `numeric(5,2)`             | No       | `0`                 |     |                       |

## sales.sales_order_status

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

## sales.sales_order_status_history

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                          |
| -------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id       | `bigint`                   | No       | ``                  |     |                             |
| tenant_id      | `uuid`                     | No       | ``                  |     |                             |
| company_id     | `uuid`                     | Sí       | ``                  |     |                             |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                             |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by     | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                             |
| version        | `integer`                  | No       | `1`                 |     |                             |
| row_version    | `bigint`                   | No       | `0`                 |     |                             |
| is_active      | `boolean`                  | No       | `true`              |     |                             |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                             |
| observations   | `text`                     | Sí       | ``                  |     |                             |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| sales_order_id | `uuid`                     | No       | ``                  |     | sales.sales_orders.id       |
| status_id      | `uuid`                     | No       | ``                  |     | sales.sales_order_status.id |

## sales.sales_orders

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                          |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id        | `bigint`                   | No       | ``                  |     |                             |
| tenant_id       | `uuid`                     | No       | ``                  |     |                             |
| company_id      | `uuid`                     | No       | ``                  |     |                             |
| branch_id       | `uuid`                     | No       | ``                  |     |                             |
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
| document_number | `text`                     | No       | ``                  |     |                             |
| customer_id     | `uuid`                     | No       | ``                  |     |                             |
| quote_id        | `uuid`                     | Sí       | ``                  |     | sales.quotes.id             |
| salesperson_id  | `uuid`                     | Sí       | ``                  |     | sales.salespeople.id        |
| status_id       | `uuid`                     | No       | ``                  |     | sales.sales_order_status.id |
| sales_channel   | `text`                     | No       | `'store'::text`     |     |                             |
| currency_code   | `character`                | No       | ``                  |     |                             |
| total_amount    | `numeric(18,4)`            | No       | `0`                 |     |                             |

## sales.sales_return_lines

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
| sales_return_id | `uuid`                     | No       | ``                  |     | sales.sales_returns.id |
| product_id      | `uuid`                     | No       | ``                  |     |                        |
| quantity        | `numeric(18,6)`            | No       | ``                  |     |                        |

## sales.sales_returns

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
| invoice_id   | `uuid`                     | No       | ``                  |     |     |
| reason       | `text`                     | Sí       | ``                  |     |     |

## sales.sales_targets

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
| salesperson_id | `uuid`                     | Sí       | ``                  |     | sales.salespeople.id |
| team_id        | `uuid`                     | Sí       | ``                  |     | sales.sales_teams.id |
| period_start   | `date`                     | No       | ``                  |     |                      |
| period_end     | `date`                     | No       | ``                  |     |                      |
| target_amount  | `numeric(18,4)`            | No       | ``                  |     |                      |

## sales.sales_team_members

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
| team_id        | `uuid`                     | No       | ``                  |     | sales.sales_teams.id |
| salesperson_id | `uuid`                     | No       | ``                  |     | sales.salespeople.id |

## sales.sales_teams

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

## sales.sales_territories

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

## sales.salespeople

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id     | `bigint`                   | No       | ``                  |     |                            |
| tenant_id    | `uuid`                     | No       | ``                  |     |                            |
| company_id   | `uuid`                     | No       | ``                  |     |                            |
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
| user_id      | `uuid`                     | Sí       | ``                  |     |                            |
| employee_id  | `uuid`                     | Sí       | ``                  |     |                            |
| territory_id | `uuid`                     | Sí       | ``                  |     | sales.sales_territories.id |

## sales.shopping_cart_items

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id     | `bigint`                   | No       | ``                  |     |                         |
| tenant_id    | `uuid`                     | No       | ``                  |     |                         |
| company_id   | `uuid`                     | Sí       | ``                  |     |                         |
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
| cart_id      | `uuid`                     | No       | ``                  |     | sales.shopping_carts.id |
| product_id   | `uuid`                     | No       | ``                  |     |                         |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                         |

## sales.shopping_carts

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
| customer_id  | `uuid`                     | Sí       | ``                  |     |     |
| status       | `text`                     | No       | `'active'::text`    |     |     |

## sales.subscription_billing_cycles

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
| subscription_id | `uuid`                     | No       | ``                  |     | sales.subscriptions.id |
| period_start    | `date`                     | No       | ``                  |     |                        |
| period_end      | `date`                     | No       | ``                  |     |                        |
| invoice_id      | `uuid`                     | Sí       | ``                  |     |                        |

## sales.subscription_lines

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
| subscription_id | `uuid`                     | No       | ``                  |     | sales.subscriptions.id |
| product_id      | `uuid`                     | No       | ``                  |     |                        |
| unit_price      | `numeric(18,4)`            | No       | ``                  |     |                        |

## sales.subscriptions

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
| customer_id       | `uuid`                     | No       | ``                  |     |     |
| billing_frequency | `text`                     | No       | ``                  |     |     |
| status            | `text`                     | No       | `'active'::text`    |     |     |

## sales.warranties

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
| invoice_line_id | `uuid`                     | No       | ``                  |     | sales.invoice_lines.id |
| product_id      | `uuid`                     | No       | ``                  |     |                        |
| coverage_months | `integer`                  | No       | ``                  |     |                        |
| expires_at      | `date`                     | No       | ``                  |     |                        |

## sales.warranty_claims

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                  |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id          | `bigint`                   | No       | ``                  |     |                     |
| tenant_id         | `uuid`                     | No       | ``                  |     |                     |
| company_id        | `uuid`                     | Sí       | ``                  |     |                     |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                     |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by        | `uuid`                     | Sí       | ``                  |     |                     |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                     |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                     |
| version           | `integer`                  | No       | `1`                 |     |                     |
| row_version       | `bigint`                   | No       | `0`                 |     |                     |
| is_active         | `boolean`                  | No       | `true`              |     |                     |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                     |
| observations      | `text`                     | Sí       | ``                  |     |                     |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| warranty_id       | `uuid`                     | No       | ``                  |     | sales.warranties.id |
| claim_description | `text`                     | No       | ``                  |     |                     |
| status            | `text`                     | No       | `'open'::text`      |     |                     |
