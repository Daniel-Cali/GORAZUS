# Diccionario de datos — schema `products`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.
> Regenerado 2026-07-18 (PHASE 01 — Database Enterprise): `product_attributes.company_id` ahora nullable (corregido en `32_bugfixes.sql`, ver DATABASE_HEALTH_REPORT.md §1.3).

## products.bill_of_materials

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                   |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id        | `bigint`                   | No       | ``                  |     |                      |
| tenant_id       | `uuid`                     | No       | ``                  |     |                      |
| company_id      | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                      |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by      | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                      |
| version         | `integer`                  | No       | `1`                 |     |                      |
| row_version     | `bigint`                   | No       | `0`                 |     |                      |
| is_active       | `boolean`                  | No       | `true`              |     |                      |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                      |
| observations    | `text`                     | Sí       | ``                  |     |                      |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| product_id      | `uuid`                     | No       | ``                  |     | products.products.id |
| name            | `text`                     | No       | ``                  |     |                      |
| output_quantity | `numeric(18,6)`            | No       | `1`                 |     |                      |

## products.bom_components

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                            |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id             | `bigint`                   | No       | ``                  |     |                               |
| tenant_id            | `uuid`                     | No       | ``                  |     |                               |
| company_id           | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                               |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by           | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                               |
| version              | `integer`                  | No       | `1`                 |     |                               |
| row_version          | `bigint`                   | No       | `0`                 |     |                               |
| is_active            | `boolean`                  | No       | `true`              |     |                               |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                               |
| observations         | `text`                     | Sí       | ``                  |     |                               |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| bom_id               | `uuid`                     | No       | ``                  |     | products.bill_of_materials.id |
| component_product_id | `uuid`                     | No       | ``                  |     | products.products.id          |
| quantity_required    | `numeric(18,6)`            | No       | ``                  |     |                               |

## products.brand_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                 |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------ |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                    |
| local_id      | `bigint`                   | No       | ``                  |     |                    |
| tenant_id     | `uuid`                     | No       | ``                  |     |                    |
| company_id    | `uuid`                     | Sí       | ``                  |     |                    |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                    |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                    |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                    |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                    |
| created_by    | `uuid`                     | Sí       | ``                  |     |                    |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                    |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                    |
| version       | `integer`                  | No       | `1`                 |     |                    |
| row_version   | `bigint`                   | No       | `0`                 |     |                    |
| is_active     | `boolean`                  | No       | `true`              |     |                    |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                    |
| observations  | `text`                     | Sí       | ``                  |     |                    |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                    |
| brand_id      | `uuid`                     | No       | ``                  |     | products.brands.id |
| language_code | `text`                     | No       | ``                  |     |                    |
| description   | `text`                     | Sí       | ``                  |     |                    |

## products.brands

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

## products.product_attribute_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id      | `bigint`                   | No       | ``                  |     |                                |
| tenant_id     | `uuid`                     | No       | ``                  |     |                                |
| company_id    | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                                |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by    | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                                |
| version       | `integer`                  | No       | `1`                 |     |                                |
| row_version   | `bigint`                   | No       | `0`                 |     |                                |
| is_active     | `boolean`                  | No       | `true`              |     |                                |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                                |
| observations  | `text`                     | Sí       | ``                  |     |                                |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| attribute_id  | `uuid`                     | No       | ``                  |     | products.product_attributes.id |
| language_code | `text`                     | No       | ``                  |     |                                |
| name          | `text`                     | No       | ``                  |     |                                |

## products.product_attribute_value_translations

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id           | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                      |
| company_id         | `uuid`                     | Sí       | ``                  |     |                                      |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                      |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| version            | `integer`                  | No       | `1`                 |     |                                      |
| row_version        | `bigint`                   | No       | `0`                 |     |                                      |
| is_active          | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                      |
| observations       | `text`                     | Sí       | ``                  |     |                                      |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| attribute_value_id | `uuid`                     | No       | ``                  |     | products.product_attribute_values.id |
| language_code      | `text`                     | No       | ``                  |     |                                      |
| name               | `text`                     | No       | ``                  |     |                                      |

## products.product_attribute_values

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id     | `bigint`                   | No       | ``                  |     |                                |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                |
| company_id   | `uuid`                     | No       | ``                  |     |                                |
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
| attribute_id | `uuid`                     | No       | ``                  |     | products.product_attributes.id |
| code         | `text`                     | No       | ``                  |     |                                |

## products.product_attributes

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

## products.product_barcodes

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
| product_id   | `uuid`                     | No       | ``                  |     | products.products.id |
| barcode      | `text`                     | No       | ``                  |     |                      |
| barcode_type | `text`                     | No       | `'gtin'::text`      |     |                      |

## products.product_categories

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id           | `bigint`                   | No       | ``                  |     |                                |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                |
| company_id         | `uuid`                     | No       | ``                  |     |                                |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                |
| version            | `integer`                  | No       | `1`                 |     |                                |
| row_version        | `bigint`                   | No       | `0`                 |     |                                |
| is_active          | `boolean`                  | No       | `true`              |     |                                |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                |
| observations       | `text`                     | Sí       | ``                  |     |                                |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| code               | `text`                     | No       | ``                  |     |                                |
| parent_category_id | `uuid`                     | Sí       | ``                  |     | products.product_categories.id |

## products.product_category_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id      | `bigint`                   | No       | ``                  |     |                                |
| tenant_id     | `uuid`                     | No       | ``                  |     |                                |
| company_id    | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                                |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by    | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                                |
| version       | `integer`                  | No       | `1`                 |     |                                |
| row_version   | `bigint`                   | No       | `0`                 |     |                                |
| is_active     | `boolean`                  | No       | `true`              |     |                                |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                                |
| observations  | `text`                     | Sí       | ``                  |     |                                |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| category_id   | `uuid`                     | No       | ``                  |     | products.product_categories.id |
| language_code | `text`                     | No       | ``                  |     |                                |
| name          | `text`                     | No       | ``                  |     |                                |

## products.product_collections

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
| season       | `text`                     | Sí       | ``                  |     |     |

## products.product_combo_components

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id             | `bigint`                   | No       | ``                  |     |                            |
| tenant_id            | `uuid`                     | No       | ``                  |     |                            |
| company_id           | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                            |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by           | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                            |
| version              | `integer`                  | No       | `1`                 |     |                            |
| row_version          | `bigint`                   | No       | `0`                 |     |                            |
| is_active            | `boolean`                  | No       | `true`              |     |                            |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                            |
| observations         | `text`                     | Sí       | ``                  |     |                            |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| combo_id             | `uuid`                     | No       | ``                  |     | products.product_combos.id |
| component_product_id | `uuid`                     | No       | ``                  |     | products.products.id       |
| quantity             | `numeric(18,6)`            | No       | ``                  |     |                            |

## products.product_combos

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id            | `bigint`                   | No       | ``                  |     |                      |
| tenant_id           | `uuid`                     | No       | ``                  |     |                      |
| company_id          | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                      |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by          | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                      |
| version             | `integer`                  | No       | `1`                 |     |                      |
| row_version         | `bigint`                   | No       | `0`                 |     |                      |
| is_active           | `boolean`                  | No       | `true`              |     |                      |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                      |
| observations        | `text`                     | Sí       | ``                  |     |                      |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| product_id          | `uuid`                     | No       | ``                  |     | products.products.id |
| discount_percentage | `numeric(5,2)`             | No       | `0`                 |     |                      |

## products.product_families

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

## products.product_images

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
| product_id    | `uuid`                     | No       | ``                  |     | products.products.id |
| file_id       | `uuid`                     | No       | ``                  |     |                      |
| display_order | `smallint`                 | No       | `0`                 |     |                      |

## products.product_kit_components

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                       |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id             | `bigint`                   | No       | ``                  |     |                          |
| tenant_id            | `uuid`                     | No       | ``                  |     |                          |
| company_id           | `uuid`                     | Sí       | ``                  |     |                          |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                          |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by           | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                          |
| version              | `integer`                  | No       | `1`                 |     |                          |
| row_version          | `bigint`                   | No       | `0`                 |     |                          |
| is_active            | `boolean`                  | No       | `true`              |     |                          |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                          |
| observations         | `text`                     | Sí       | ``                  |     |                          |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| kit_id               | `uuid`                     | No       | ``                  |     | products.product_kits.id |
| component_product_id | `uuid`                     | No       | ``                  |     | products.products.id     |
| quantity             | `numeric(18,6)`            | No       | ``                  |     |                          |

## products.product_kits

| Columna        | Tipo                       | Nullable | Default                  | PK  | FK                   |
| -------------- | -------------------------- | -------- | ------------------------ | --- | -------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()`      | PK  |                      |
| local_id       | `bigint`                   | No       | ``                       |     |                      |
| tenant_id      | `uuid`                     | No       | ``                       |     |                      |
| company_id     | `uuid`                     | Sí       | ``                       |     |                      |
| branch_id      | `uuid`                     | Sí       | ``                       |     |                      |
| created_at     | `timestamp with time zone` | No       | `now()`                  |     |                      |
| updated_at     | `timestamp with time zone` | No       | `now()`                  |     |                      |
| deleted_at     | `timestamp with time zone` | Sí       | ``                       |     |                      |
| created_by     | `uuid`                     | Sí       | ``                       |     |                      |
| updated_by     | `uuid`                     | Sí       | ``                       |     |                      |
| deleted_by     | `uuid`                     | Sí       | ``                       |     |                      |
| version        | `integer`                  | No       | `1`                      |     |                      |
| row_version    | `bigint`                   | No       | `0`                      |     |                      |
| is_active      | `boolean`                  | No       | `true`                   |     |                      |
| is_deleted     | `boolean`                  | Sí       | ``                       |     |                      |
| observations   | `text`                     | Sí       | ``                       |     |                      |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`            |     |                      |
| product_id     | `uuid`                     | No       | ``                       |     | products.products.id |
| pricing_policy | `text`                     | No       | `'sum_components'::text` |     |                      |

## products.product_lines

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

## products.product_models

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                 |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                    |
| local_id     | `bigint`                   | No       | ``                  |     |                    |
| tenant_id    | `uuid`                     | No       | ``                  |     |                    |
| company_id   | `uuid`                     | No       | ``                  |     |                    |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                    |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                    |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                    |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                    |
| created_by   | `uuid`                     | Sí       | ``                  |     |                    |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                    |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                    |
| version      | `integer`                  | No       | `1`                 |     |                    |
| row_version  | `bigint`                   | No       | `0`                 |     |                    |
| is_active    | `boolean`                  | No       | `true`              |     |                    |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                    |
| observations | `text`                     | Sí       | ``                  |     |                    |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                    |
| brand_id     | `uuid`                     | No       | ``                  |     | products.brands.id |
| name         | `text`                     | No       | ``                  |     |                    |

## products.product_presentations

| Columna               | Tipo                       | Nullable | Default             | PK  | FK                           |
| --------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                    | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id              | `bigint`                   | No       | ``                  |     |                              |
| tenant_id             | `uuid`                     | No       | ``                  |     |                              |
| company_id            | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id             | `uuid`                     | Sí       | ``                  |     |                              |
| created_at            | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at            | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at            | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by            | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by            | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by            | `uuid`                     | Sí       | ``                  |     |                              |
| version               | `integer`                  | No       | `1`                 |     |                              |
| row_version           | `bigint`                   | No       | `0`                 |     |                              |
| is_active             | `boolean`                  | No       | `true`              |     |                              |
| is_deleted            | `boolean`                  | Sí       | ``                  |     |                              |
| observations          | `text`                     | Sí       | ``                  |     |                              |
| metadata              | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| product_id            | `uuid`                     | No       | ``                  |     | products.products.id         |
| unit_id               | `uuid`                     | No       | ``                  |     | products.units_of_measure.id |
| name                  | `text`                     | No       | ``                  |     |                              |
| quantity_in_base_unit | `numeric(18,6)`            | No       | ``                  |     |                              |

## products.product_price_history

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
| product_id     | `uuid`                     | No       | ``                  |     | products.products.id |
| price_type     | `text`                     | No       | ``                  |     |                      |
| previous_value | `numeric(18,4)`            | Sí       | ``                  |     |                      |
| new_value      | `numeric(18,4)`            | No       | ``                  |     |                      |

## products.product_related_products

| Columna            | Tipo                       | Nullable | Default              | PK  | FK                   |
| ------------------ | -------------------------- | -------- | -------------------- | --- | -------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()`  | PK  |                      |
| local_id           | `bigint`                   | No       | ``                   |     |                      |
| tenant_id          | `uuid`                     | No       | ``                   |     |                      |
| company_id         | `uuid`                     | Sí       | ``                   |     |                      |
| branch_id          | `uuid`                     | Sí       | ``                   |     |                      |
| created_at         | `timestamp with time zone` | No       | `now()`              |     |                      |
| updated_at         | `timestamp with time zone` | No       | `now()`              |     |                      |
| deleted_at         | `timestamp with time zone` | Sí       | ``                   |     |                      |
| created_by         | `uuid`                     | Sí       | ``                   |     |                      |
| updated_by         | `uuid`                     | Sí       | ``                   |     |                      |
| deleted_by         | `uuid`                     | Sí       | ``                   |     |                      |
| version            | `integer`                  | No       | `1`                  |     |                      |
| row_version        | `bigint`                   | No       | `0`                  |     |                      |
| is_active          | `boolean`                  | No       | `true`               |     |                      |
| is_deleted         | `boolean`                  | Sí       | ``                   |     |                      |
| observations       | `text`                     | Sí       | ``                   |     |                      |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`        |     |                      |
| product_id         | `uuid`                     | No       | ``                   |     | products.products.id |
| related_product_id | `uuid`                     | No       | ``                   |     | products.products.id |
| relation_type      | `text`                     | No       | `'cross_sell'::text` |     |                      |

## products.product_reviews

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
| product_id   | `uuid`                     | No       | ``                  |     | products.products.id |
| customer_id  | `uuid`                     | Sí       | ``                  |     |                      |
| rating       | `smallint`                 | No       | ``                  |     |                      |
| comment      | `text`                     | Sí       | ``                  |     |                      |

## products.product_suppliers

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------------ | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id           | `bigint`                   | No       | ``                  |     |                      |
| tenant_id          | `uuid`                     | No       | ``                  |     |                      |
| company_id         | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                      |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by         | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                      |
| version            | `integer`                  | No       | `1`                 |     |                      |
| row_version        | `bigint`                   | No       | `0`                 |     |                      |
| is_active          | `boolean`                  | No       | `true`              |     |                      |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                      |
| observations       | `text`                     | Sí       | ``                  |     |                      |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| product_id         | `uuid`                     | No       | ``                  |     | products.products.id |
| supplier_id        | `uuid`                     | No       | ``                  |     |                      |
| supplier_sku       | `text`                     | Sí       | ``                  |     |                      |
| lead_time_days     | `integer`                  | Sí       | ``                  |     |                      |
| is_preferred       | `boolean`                  | No       | `false`             |     |                      |
| last_purchase_cost | `numeric(18,4)`            | Sí       | ``                  |     |                      |

## products.product_tax_profiles

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
| product_id   | `uuid`                     | No       | ``                  |     | products.products.id |
| tax_id       | `uuid`                     | No       | ``                  |     |                      |

## products.product_translations

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
| product_id    | `uuid`                     | No       | ``                  |     | products.products.id |
| language_code | `text`                     | No       | ``                  |     |                      |
| name          | `text`                     | No       | ``                  |     |                      |
| description   | `text`                     | Sí       | ``                  |     |                      |

## products.product_variant_attribute_values

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id           | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                      |
| company_id         | `uuid`                     | Sí       | ``                  |     |                                      |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                      |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                      |
| version            | `integer`                  | No       | `1`                 |     |                                      |
| row_version        | `bigint`                   | No       | `0`                 |     |                                      |
| is_active          | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                      |
| observations       | `text`                     | Sí       | ``                  |     |                                      |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| variant_product_id | `uuid`                     | No       | ``                  |     | products.products.id                 |
| attribute_value_id | `uuid`                     | No       | ``                  |     | products.product_attribute_values.id |

## products.product_videos

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
| product_id   | `uuid`                     | No       | ``                  |     | products.products.id |
| file_id      | `uuid`                     | No       | ``                  |     |                      |

## products.products

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
| sku               | `text`                     | No       | ``                  |     |                                 |
| product_type      | `text`                     | No       | ``                  |     |                                 |
| category_id       | `uuid`                     | Sí       | ``                  |     | products.product_categories.id  |
| brand_id          | `uuid`                     | Sí       | ``                  |     | products.brands.id              |
| model_id          | `uuid`                     | Sí       | ``                  |     | products.product_models.id      |
| line_id           | `uuid`                     | Sí       | ``                  |     | products.product_lines.id       |
| family_id         | `uuid`                     | Sí       | ``                  |     | products.product_families.id    |
| collection_id     | `uuid`                     | Sí       | ``                  |     | products.product_collections.id |
| base_unit_id      | `uuid`                     | No       | ``                  |     | products.units_of_measure.id    |
| parent_product_id | `uuid`                     | Sí       | ``                  |     | products.products.id            |
| costing_method    | `text`                     | No       | `'average'::text`   |     |                                 |
| tracks_serial     | `boolean`                  | No       | `false`             |     |                                 |
| tracks_lot        | `boolean`                  | No       | `false`             |     |                                 |
| standard_cost     | `numeric(18,4)`            | Sí       | ``                  |     |                                 |
| list_price        | `numeric(18,4)`            | Sí       | ``                  |     |                                 |

## products.recipe_ingredients

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
| recipe_id             | `uuid`                     | No       | ``                  |     | products.recipes.id  |
| ingredient_product_id | `uuid`                     | No       | ``                  |     | products.products.id |
| quantity              | `numeric(18,6)`            | No       | ``                  |     |                      |

## products.recipes

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                           |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id       | `bigint`                   | No       | ``                  |     |                              |
| tenant_id      | `uuid`                     | No       | ``                  |     |                              |
| company_id     | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                              |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by     | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                              |
| version        | `integer`                  | No       | `1`                 |     |                              |
| row_version    | `bigint`                   | No       | `0`                 |     |                              |
| is_active      | `boolean`                  | No       | `true`              |     |                              |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                              |
| observations   | `text`                     | Sí       | ``                  |     |                              |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| product_id     | `uuid`                     | No       | ``                  |     | products.products.id         |
| yield_quantity | `numeric(18,6)`            | No       | ``                  |     |                              |
| yield_unit_id  | `uuid`                     | Sí       | ``                  |     | products.units_of_measure.id |

## products.unit_conversions

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
| product_id        | `uuid`                     | No       | ``                  |     | products.products.id         |
| from_unit_id      | `uuid`                     | No       | ``                  |     | products.units_of_measure.id |
| to_unit_id        | `uuid`                     | No       | ``                  |     | products.units_of_measure.id |
| conversion_factor | `numeric(18,6)`            | No       | ``                  |     |                              |

## products.unit_of_measure_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                           |
| ------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id      | `bigint`                   | No       | ``                  |     |                              |
| tenant_id     | `uuid`                     | No       | ``                  |     |                              |
| company_id    | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                              |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by    | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                              |
| version       | `integer`                  | No       | `1`                 |     |                              |
| row_version   | `bigint`                   | No       | `0`                 |     |                              |
| is_active     | `boolean`                  | No       | `true`              |     |                              |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                              |
| observations  | `text`                     | Sí       | ``                  |     |                              |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| unit_id       | `uuid`                     | No       | ``                  |     | products.units_of_measure.id |
| language_code | `text`                     | No       | ``                  |     |                              |
| name          | `text`                     | No       | ``                  |     |                              |
| abbreviation  | `text`                     | No       | ``                  |     |                              |

## products.units_of_measure

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
