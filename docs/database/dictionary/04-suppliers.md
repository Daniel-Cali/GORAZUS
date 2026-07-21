# Diccionario de datos — schema `suppliers`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## suppliers.supplier_addresses

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
| supplier_id     | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| address_type    | `text`                     | No       | ``                  |     |                        |
| line1           | `text`                     | No       | ``                  |     |                        |
| line2           | `text`                     | Sí       | ``                  |     |                        |
| municipality_id | `uuid`                     | Sí       | ``                  |     |                        |
| postal_code     | `text`                     | Sí       | ``                  |     |                        |
| is_default      | `boolean`                  | No       | `false`             |     |                        |

## suppliers.supplier_bank_accounts

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
| supplier_id              | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| bank_name                | `text`                     | No       | ``                  |     |                        |
| encrypted_account_number | `text`                     | No       | ``                  |     |                        |

## suppliers.supplier_block_history

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
| supplier_id  | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| action       | `text`                     | No       | ``                  |     |                        |
| reason       | `text`                     | Sí       | ``                  |     |                        |

## suppliers.supplier_classifications

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

## suppliers.supplier_contacts

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
| supplier_id  | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| full_name    | `text`                     | No       | ``                  |     |                        |
| email        | `text`                     | Sí       | ``                  |     |                        |
| phone        | `text`                     | Sí       | ``                  |     |                        |
| is_primary   | `boolean`                  | No       | `false`             |     |                        |

## suppliers.supplier_credit_limit_history

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
| supplier_id    | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| previous_limit | `numeric(18,4)`            | Sí       | ``                  |     |                        |
| new_limit      | `numeric(18,4)`            | Sí       | ``                  |     |                        |

## suppliers.supplier_credit_profiles

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
| supplier_id        | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| credit_limit       | `numeric(18,4)`            | Sí       | ``                  |     |                        |
| payment_terms_days | `integer`                  | No       | `0`                 |     |                        |

## suppliers.supplier_evaluation_criteria

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
| name              | `text`                     | No       | ``                  |     |     |
| weight_percentage | `numeric(5,2)`             | No       | ``                  |     |     |

## suppliers.supplier_evaluation_scores

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                                        |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                           |
| local_id      | `bigint`                   | No       | ``                  |     |                                           |
| tenant_id     | `uuid`                     | No       | ``                  |     |                                           |
| company_id    | `uuid`                     | No       | ``                  |     |                                           |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                                           |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                                           |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                                           |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                                           |
| created_by    | `uuid`                     | Sí       | ``                  |     |                                           |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                                           |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                                           |
| version       | `integer`                  | No       | `1`                 |     |                                           |
| row_version   | `bigint`                   | No       | `0`                 |     |                                           |
| is_active     | `boolean`                  | No       | `true`              |     |                                           |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                                           |
| observations  | `text`                     | Sí       | ``                  |     |                                           |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                           |
| evaluation_id | `uuid`                     | No       | ``                  |     | suppliers.supplier_evaluations.id         |
| criteria_id   | `uuid`                     | No       | ``                  |     | suppliers.supplier_evaluation_criteria.id |
| score         | `numeric(5,2)`             | No       | ``                  |     |                                           |

## suppliers.supplier_evaluations

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                     |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id             | `bigint`                   | No       | ``                  |     |                        |
| tenant_id            | `uuid`                     | No       | ``                  |     |                        |
| company_id           | `uuid`                     | No       | ``                  |     |                        |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                        |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by           | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                        |
| version              | `integer`                  | No       | `1`                 |     |                        |
| row_version          | `bigint`                   | No       | `0`                 |     |                        |
| is_active            | `boolean`                  | No       | `true`              |     |                        |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                        |
| observations         | `text`                     | Sí       | ``                  |     |                        |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| supplier_id          | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| evaluated_by_user_id | `uuid`                     | No       | ``                  |     |                        |
| evaluation_date      | `date`                     | No       | `CURRENT_DATE`      |     |                        |
| overall_score        | `numeric(5,2)`             | Sí       | ``                  |     |                        |

## suppliers.supplier_history

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
| supplier_id       | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| event_description | `text`                     | No       | ``                  |     |                        |
| occurred_at       | `timestamp with time zone` | No       | `now()`             |     |                        |

## suppliers.supplier_withholding_profiles

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
| supplier_id         | `uuid`                     | No       | ``                  |     | suppliers.suppliers.id |
| withholding_rule_id | `uuid`                     | Sí       | ``                  |     |                        |

## suppliers.suppliers

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                                    |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                       |
| local_id           | `bigint`                   | No       | ``                  |     |                                       |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                       |
| company_id         | `uuid`                     | No       | ``                  |     |                                       |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                       |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                       |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                       |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                       |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                       |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                       |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                       |
| version            | `integer`                  | No       | `1`                 |     |                                       |
| row_version        | `bigint`                   | No       | `0`                 |     |                                       |
| is_active          | `boolean`                  | No       | `true`              |     |                                       |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                       |
| observations       | `text`                     | Sí       | ``                  |     |                                       |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                       |
| legal_name         | `text`                     | No       | ``                  |     |                                       |
| trade_name         | `text`                     | Sí       | ``                  |     |                                       |
| tax_id             | `text`                     | No       | ``                  |     |                                       |
| payment_terms_days | `integer`                  | No       | `0`                 |     |                                       |
| is_blocked         | `boolean`                  | No       | `false`             |     |                                       |
| block_reason       | `text`                     | Sí       | ``                  |     |                                       |
| classification_id  | `uuid`                     | Sí       | ``                  |     | suppliers.supplier_classifications.id |

## suppliers.v_accounts_payable_aging

| Columna                  | Tipo            | Nullable | Default | PK  | FK  |
| ------------------------ | --------------- | -------- | ------- | --- | --- |
| supplier_id              | `uuid`          | Sí       | ``      |     |     |
| legal_name               | `text`          | Sí       | ``      |     |     |
| purchase_invoice_id      | `uuid`          | Sí       | ``      |     |     |
| supplier_document_number | `text`          | Sí       | ``      |     |     |
| total_amount             | `numeric(18,4)` | Sí       | ``      |     |     |
| days_outstanding         | `integer`       | Sí       | ``      |     |     |
| aging_bucket             | `text`          | Sí       | ``      |     |     |
