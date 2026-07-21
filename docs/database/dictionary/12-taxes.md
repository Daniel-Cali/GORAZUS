# Diccionario de datos — schema `taxes`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## taxes.tax_declaration_lines

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                        |
| -------------- | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id       | `bigint`                   | No       | ``                  |     |                           |
| tenant_id      | `uuid`                     | No       | ``                  |     |                           |
| company_id     | `uuid`                     | Sí       | ``                  |     |                           |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                           |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                           |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by     | `uuid`                     | Sí       | ``                  |     |                           |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                           |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                           |
| version        | `integer`                  | No       | `1`                 |     |                           |
| row_version    | `bigint`                   | No       | `0`                 |     |                           |
| is_active      | `boolean`                  | No       | `true`              |     |                           |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                           |
| observations   | `text`                     | Sí       | ``                  |     |                           |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| declaration_id | `uuid`                     | No       | ``                  |     | taxes.tax_declarations.id |
| tax_id         | `uuid`                     | No       | ``                  |     | taxes.taxes.id            |
| amount         | `numeric(18,4)`            | No       | ``                  |     |                           |

## taxes.tax_declarations

| Columna          | Tipo                       | Nullable | Default             | PK  | FK  |
| ---------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id         | `bigint`                   | No       | ``                  |     |     |
| tenant_id        | `uuid`                     | No       | ``                  |     |     |
| company_id       | `uuid`                     | No       | ``                  |     |     |
| branch_id        | `uuid`                     | Sí       | ``                  |     |     |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by       | `uuid`                     | Sí       | ``                  |     |     |
| updated_by       | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |     |
| version          | `integer`                  | No       | `1`                 |     |     |
| row_version      | `bigint`                   | No       | `0`                 |     |     |
| is_active        | `boolean`                  | No       | `true`              |     |     |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |     |
| observations     | `text`                     | Sí       | ``                  |     |     |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| fiscal_period_id | `uuid`                     | No       | ``                  |     |     |
| filed_at         | `timestamp with time zone` | Sí       | ``                  |     |     |
| total_amount     | `numeric(18,4)`            | No       | ``                  |     |     |

## taxes.tax_exemption_certificates

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
| exemption_id | `uuid`                     | No       | ``                  |     | taxes.tax_exemptions.id |
| document_id  | `uuid`                     | No       | ``                  |     |                         |

## taxes.tax_exemptions

| Columna      | Tipo                       | Nullable | Default             | PK  | FK             |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                |
| local_id     | `bigint`                   | No       | ``                  |     |                |
| tenant_id    | `uuid`                     | No       | ``                  |     |                |
| company_id   | `uuid`                     | Sí       | ``                  |     |                |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                |
| created_by   | `uuid`                     | Sí       | ``                  |     |                |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                |
| version      | `integer`                  | No       | `1`                 |     |                |
| row_version  | `bigint`                   | No       | `0`                 |     |                |
| is_active    | `boolean`                  | No       | `true`              |     |                |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                |
| observations | `text`                     | Sí       | ``                  |     |                |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                |
| tax_id       | `uuid`                     | No       | ``                  |     | taxes.taxes.id |
| customer_id  | `uuid`                     | Sí       | ``                  |     |                |
| expires_at   | `date`                     | Sí       | ``                  |     |                |

## taxes.tax_jurisdictions

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
| country_id   | `uuid`                     | No       | ``                  |     |     |
| name         | `text`                     | No       | ``                  |     |     |

## taxes.tax_perception_rules

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                       |
| --------------- | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id        | `bigint`                   | No       | ``                  |     |                          |
| tenant_id       | `uuid`                     | No       | ``                  |     |                          |
| company_id      | `uuid`                     | Sí       | ``                  |     |                          |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                          |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by      | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                          |
| version         | `integer`                  | No       | `1`                 |     |                          |
| row_version     | `bigint`                   | No       | `0`                 |     |                          |
| is_active       | `boolean`                  | No       | `true`              |     |                          |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                          |
| observations    | `text`                     | Sí       | ``                  |     |                          |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| perception_id   | `uuid`                     | No       | ``                  |     | taxes.tax_perceptions.id |
| rate_percentage | `numeric(6,3)`             | No       | ``                  |     |                          |

## taxes.tax_perceptions

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                         |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id        | `bigint`                   | No       | ``                  |     |                            |
| tenant_id       | `uuid`                     | No       | ``                  |     |                            |
| company_id      | `uuid`                     | Sí       | ``                  |     |                            |
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
| jurisdiction_id | `uuid`                     | No       | ``                  |     | taxes.tax_jurisdictions.id |
| name            | `text`                     | No       | ``                  |     |                            |

## taxes.tax_rates

| Columna         | Tipo                       | Nullable | Default             | PK  | FK             |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                |
| local_id        | `bigint`                   | No       | ``                  |     |                |
| tenant_id       | `uuid`                     | No       | ``                  |     |                |
| company_id      | `uuid`                     | Sí       | ``                  |     |                |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                |
| created_by      | `uuid`                     | Sí       | ``                  |     |                |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                |
| version         | `integer`                  | No       | `1`                 |     |                |
| row_version     | `bigint`                   | No       | `0`                 |     |                |
| is_active       | `boolean`                  | No       | `true`              |     |                |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                |
| observations    | `text`                     | Sí       | ``                  |     |                |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                |
| tax_id          | `uuid`                     | No       | ``                  |     | taxes.taxes.id |
| rate_percentage | `numeric(6,3)`             | No       | ``                  |     |                |
| effective_from  | `date`                     | No       | ``                  |     |                |
| effective_to    | `date`                     | Sí       | ``                  |     |                |

## taxes.tax_rules

| Columna             | Tipo                       | Nullable | Default             | PK  | FK             |
| ------------------- | -------------------------- | -------- | ------------------- | --- | -------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                |
| local_id            | `bigint`                   | No       | ``                  |     |                |
| tenant_id           | `uuid`                     | No       | ``                  |     |                |
| company_id          | `uuid`                     | Sí       | ``                  |     |                |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                |
| created_by          | `uuid`                     | Sí       | ``                  |     |                |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                |
| version             | `integer`                  | No       | `1`                 |     |                |
| row_version         | `bigint`                   | No       | `0`                 |     |                |
| is_active           | `boolean`                  | No       | `true`              |     |                |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                |
| observations        | `text`                     | Sí       | ``                  |     |                |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                |
| tax_id              | `uuid`                     | No       | ``                  |     | taxes.taxes.id |
| product_category_id | `uuid`                     | Sí       | ``                  |     |                |
| fiscal_regime_id    | `uuid`                     | Sí       | ``                  |     |                |

## taxes.tax_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK             |
| ------------- | -------------------------- | -------- | ------------------- | --- | -------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                |
| local_id      | `bigint`                   | No       | ``                  |     |                |
| tenant_id     | `uuid`                     | No       | ``                  |     |                |
| company_id    | `uuid`                     | Sí       | ``                  |     |                |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                |
| created_by    | `uuid`                     | Sí       | ``                  |     |                |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                |
| version       | `integer`                  | No       | `1`                 |     |                |
| row_version   | `bigint`                   | No       | `0`                 |     |                |
| is_active     | `boolean`                  | No       | `true`              |     |                |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                |
| observations  | `text`                     | Sí       | ``                  |     |                |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                |
| tax_id        | `uuid`                     | No       | ``                  |     | taxes.taxes.id |
| language_code | `text`                     | No       | ``                  |     |                |
| name          | `text`                     | No       | ``                  |     |                |

## taxes.taxes

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                         |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id        | `bigint`                   | No       | ``                  |     |                            |
| tenant_id       | `uuid`                     | No       | ``                  |     |                            |
| company_id      | `uuid`                     | Sí       | ``                  |     |                            |
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
| code            | `text`                     | No       | ``                  |     |                            |
| jurisdiction_id | `uuid`                     | No       | ``                  |     | taxes.tax_jurisdictions.id |
| tax_kind        | `text`                     | No       | ``                  |     |                            |

## taxes.v_purchase_tax_ledger

| Columna                  | Tipo                       | Nullable | Default | PK  | FK  |
| ------------------------ | -------------------------- | -------- | ------- | --- | --- |
| tenant_id                | `uuid`                     | Sí       | ``      |     |     |
| company_id               | `uuid`                     | Sí       | ``      |     |     |
| branch_id                | `uuid`                     | Sí       | ``      |     |     |
| supplier_document_number | `text`                     | Sí       | ``      |     |     |
| received_at              | `timestamp with time zone` | Sí       | ``      |     |     |
| tax_id                   | `uuid`                     | Sí       | ``      |     |     |
| tax_code                 | `text`                     | Sí       | ``      |     |     |
| quantity                 | `numeric(18,6)`            | Sí       | ``      |     |     |
| unit_cost                | `numeric(18,4)`            | Sí       | ``      |     |     |
| taxable_base             | `numeric`                  | Sí       | ``      |     |     |
| rate_percentage          | `numeric(6,3)`             | Sí       | ``      |     |     |
| tax_amount               | `numeric`                  | Sí       | ``      |     |     |

## taxes.v_sales_tax_ledger

| Columna         | Tipo                       | Nullable | Default | PK  | FK  |
| --------------- | -------------------------- | -------- | ------- | --- | --- |
| tenant_id       | `uuid`                     | Sí       | ``      |     |     |
| company_id      | `uuid`                     | Sí       | ``      |     |     |
| branch_id       | `uuid`                     | Sí       | ``      |     |     |
| document_number | `text`                     | Sí       | ``      |     |     |
| issued_at       | `timestamp with time zone` | Sí       | ``      |     |     |
| tax_id          | `uuid`                     | Sí       | ``      |     |     |
| tax_code        | `text`                     | Sí       | ``      |     |     |
| quantity        | `numeric(18,6)`            | Sí       | ``      |     |     |
| unit_price      | `numeric(18,4)`            | Sí       | ``      |     |     |
| taxable_base    | `numeric`                  | Sí       | ``      |     |     |
| rate_percentage | `numeric(6,3)`             | Sí       | ``      |     |     |
| tax_amount      | `numeric`                  | Sí       | ``      |     |     |

## taxes.withholding_certificates

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id            | `bigint`                   | No       | ``                  |     |                            |
| tenant_id           | `uuid`                     | No       | ``                  |     |                            |
| company_id          | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                            |
| created_at          | `timestamp with time zone` | No       | `now()`             | PK  |                            |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by          | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                            |
| version             | `integer`                  | No       | `1`                 |     |                            |
| row_version         | `bigint`                   | No       | `0`                 |     |                            |
| is_active           | `boolean`                  | No       | `true`              |     |                            |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                            |
| observations        | `text`                     | Sí       | ``                  |     |                            |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| withholding_rule_id | `uuid`                     | No       | ``                  |     | taxes.withholding_rules.id |
| source_module       | `text`                     | No       | ``                  |     |                            |
| source_entity_id    | `uuid`                     | No       | ``                  |     |                            |
| amount              | `numeric(18,4)`            | No       | ``                  |     |                            |

## taxes.withholding_rules

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                         |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id        | `bigint`                   | No       | ``                  |     |                            |
| tenant_id       | `uuid`                     | No       | ``                  |     |                            |
| company_id      | `uuid`                     | Sí       | ``                  |     |                            |
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
| jurisdiction_id | `uuid`                     | No       | ``                  |     | taxes.tax_jurisdictions.id |
| name            | `text`                     | No       | ``                  |     |                            |
| rate_percentage | `numeric(6,3)`             | No       | ``                  |     |                            |
