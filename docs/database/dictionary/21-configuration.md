# Diccionario de datos — schema `configuration`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## configuration.banks

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
| swift_code   | `text`                     | Sí       | ``                  |     |     |

## configuration.correlatives

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
| series_id    | `uuid`                     | No       | ``                  |     | configuration.numbering_series.id |
| next_number  | `bigint`                   | No       | `1`                 |     |                                   |

## configuration.countries

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
| iso_code     | `character`                | No       | ``                  |     |     |

## configuration.country_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id      | `bigint`                   | No       | ``                  |     |                            |
| tenant_id     | `uuid`                     | No       | ``                  |     |                            |
| company_id    | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                            |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by    | `uuid`                     | Sí       | ``                  |     |                            |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                            |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                            |
| version       | `integer`                  | No       | `1`                 |     |                            |
| row_version   | `bigint`                   | No       | `0`                 |     |                            |
| is_active     | `boolean`                  | No       | `true`              |     |                            |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                            |
| observations  | `text`                     | Sí       | ``                  |     |                            |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| country_id    | `uuid`                     | No       | ``                  |     | configuration.countries.id |
| language_code | `text`                     | No       | ``                  |     |                            |
| name          | `text`                     | No       | ``                  |     |                            |

## configuration.currencies

| Columna        | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id       | `bigint`                   | No       | ``                  |     |     |
| tenant_id      | `uuid`                     | No       | ``                  |     |     |
| company_id     | `uuid`                     | Sí       | ``                  |     |     |
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
| iso_code       | `character`                | No       | ``                  |     |     |
| symbol         | `text`                     | Sí       | ``                  |     |     |
| decimal_places | `smallint`                 | No       | `2`                 |     |     |

## configuration.currency_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                          |
| ------------- | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id      | `bigint`                   | No       | ``                  |     |                             |
| tenant_id     | `uuid`                     | No       | ``                  |     |                             |
| company_id    | `uuid`                     | Sí       | ``                  |     |                             |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                             |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                             |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                             |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                             |
| created_by    | `uuid`                     | Sí       | ``                  |     |                             |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                             |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                             |
| version       | `integer`                  | No       | `1`                 |     |                             |
| row_version   | `bigint`                   | No       | `0`                 |     |                             |
| is_active     | `boolean`                  | No       | `true`              |     |                             |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                             |
| observations  | `text`                     | Sí       | ``                  |     |                             |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                             |
| currency_id   | `uuid`                     | No       | ``                  |     | configuration.currencies.id |
| language_code | `text`                     | No       | ``                  |     |                             |
| name          | `text`                     | No       | ``                  |     |                             |

## configuration.document_number_formats

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                                |
| ------------- | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id      | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id     | `uuid`                     | No       | ``                  |     |                                   |
| company_id    | `uuid`                     | Sí       | ``                  |     |                                   |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                                   |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                                   |
| created_by    | `uuid`                     | Sí       | ``                  |     |                                   |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                                   |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                                   |
| version       | `integer`                  | No       | `1`                 |     |                                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                                   |
| is_active     | `boolean`                  | No       | `true`              |     |                                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                                   |
| observations  | `text`                     | Sí       | ``                  |     |                                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                   |
| series_id     | `uuid`                     | No       | ``                  |     | configuration.numbering_series.id |
| prefix        | `text`                     | Sí       | ``                  |     |                                   |
| number_length | `smallint`                 | No       | `8`                 |     |                                   |
| suffix        | `text`                     | Sí       | ``                  |     |                                   |

## configuration.exchange_rate_types

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

## configuration.exchange_rates

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id         | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                      |
| company_id       | `uuid`                     | Sí       | ``                  |     |                                      |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                      |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                      |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                      |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                      |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                      |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                      |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                      |
| version          | `integer`                  | No       | `1`                 |     |                                      |
| row_version      | `bigint`                   | No       | `0`                 |     |                                      |
| is_active        | `boolean`                  | No       | `true`              |     |                                      |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                      |
| observations     | `text`                     | Sí       | ``                  |     |                                      |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                      |
| from_currency_id | `uuid`                     | No       | ``                  |     | configuration.currencies.id          |
| to_currency_id   | `uuid`                     | No       | ``                  |     | configuration.currencies.id          |
| rate_type_id     | `uuid`                     | Sí       | ``                  |     | configuration.exchange_rate_types.id |
| rate             | `numeric(18,6)`            | No       | ``                  |     |                                      |
| rate_date        | `date`                     | No       | ``                  |     |                                      |

## configuration.fiscal_document_types

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
| country_id   | `uuid`                     | No       | ``                  |     | configuration.countries.id |
| code         | `text`                     | No       | ``                  |     |                            |
| name         | `text`                     | No       | ``                  |     |                            |

## configuration.fiscal_regimes

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
| country_id   | `uuid`                     | No       | ``                  |     | configuration.countries.id |
| name         | `text`                     | No       | ``                  |     |                            |

## configuration.holidays

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
| country_id   | `uuid`                     | No       | ``                  |     | configuration.countries.id |
| name         | `text`                     | No       | ``                  |     |                            |
| holiday_date | `date`                     | No       | ``                  |     |                            |

## configuration.languages

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
| iso_code     | `text`                     | No       | ``                  |     |     |

## configuration.municipalities

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                               |
| ----------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id          | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                  |
| company_id        | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| version           | `integer`                  | No       | `1`                 |     |                                  |
| row_version       | `bigint`                   | No       | `0`                 |     |                                  |
| is_active         | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                  |
| observations      | `text`                     | Sí       | ``                  |     |                                  |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| state_province_id | `uuid`                     | No       | ``                  |     | configuration.state_provinces.id |
| name              | `text`                     | No       | ``                  |     |                                  |

## configuration.numbering_series

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | No       | ``                  |     |     |
| branch_id     | `uuid`                     | No       | ``                  |     |     |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |     |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |     |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |     |
| created_by    | `uuid`                     | Sí       | ``                  |     |     |
| updated_by    | `uuid`                     | Sí       | ``                  |     |     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |     |
| version       | `integer`                  | No       | `1`                 |     |     |
| row_version   | `bigint`                   | No       | `0`                 |     |     |
| is_active     | `boolean`                  | No       | `true`              |     |     |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |     |
| observations  | `text`                     | Sí       | ``                  |     |     |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |
| document_type | `text`                     | No       | ``                  |     |     |

## configuration.payment_forms

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

## configuration.payment_methods

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                             |
| --------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id        | `bigint`                   | No       | ``                  |     |                                |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                |
| company_id      | `uuid`                     | No       | ``                  |     |                                |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                                |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                |
| version         | `integer`                  | No       | `1`                 |     |                                |
| row_version     | `bigint`                   | No       | `0`                 |     |                                |
| is_active       | `boolean`                  | No       | `true`              |     |                                |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                |
| observations    | `text`                     | Sí       | ``                  |     |                                |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| payment_form_id | `uuid`                     | No       | ``                  |     | configuration.payment_forms.id |
| bank_account_id | `uuid`                     | Sí       | ``                  |     |                                |
| name            | `text`                     | No       | ``                  |     |                                |

## configuration.price_list_items

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
| price_list_id | `uuid`                     | No       | ``                  |     | configuration.price_lists.id |
| product_id    | `uuid`                     | No       | ``                  |     |                              |
| unit_price    | `numeric(18,4)`            | No       | ``                  |     |                              |

## configuration.price_lists

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
| name         | `text`                     | No       | ``                  |     |                             |
| currency_id  | `uuid`                     | No       | ``                  |     | configuration.currencies.id |

## configuration.sectors

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                              |
| --------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id        | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id       | `uuid`                     | No       | ``                  |     |                                 |
| company_id      | `uuid`                     | Sí       | ``                  |     |                                 |
| branch_id       | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by      | `uuid`                     | Sí       | ``                  |     |                                 |
| version         | `integer`                  | No       | `1`                 |     |                                 |
| row_version     | `bigint`                   | No       | `0`                 |     |                                 |
| is_active       | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                                 |
| observations    | `text`                     | Sí       | ``                  |     |                                 |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| municipality_id | `uuid`                     | No       | ``                  |     | configuration.municipalities.id |
| name            | `text`                     | No       | ``                  |     |                                 |

## configuration.state_province_translations

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                               |
| ----------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id          | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                  |
| company_id        | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id         | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by        | `uuid`                     | Sí       | ``                  |     |                                  |
| version           | `integer`                  | No       | `1`                 |     |                                  |
| row_version       | `bigint`                   | No       | `0`                 |     |                                  |
| is_active         | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                  |
| observations      | `text`                     | Sí       | ``                  |     |                                  |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| state_province_id | `uuid`                     | No       | ``                  |     | configuration.state_provinces.id |
| language_code     | `text`                     | No       | ``                  |     |                                  |
| name              | `text`                     | No       | ``                  |     |                                  |

## configuration.state_provinces

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
| country_id   | `uuid`                     | No       | ``                  |     | configuration.countries.id |
| name         | `text`                     | No       | ``                  |     |                            |

## configuration.timezones

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
| iana_name    | `text`                     | No       | ``                  |     |     |
