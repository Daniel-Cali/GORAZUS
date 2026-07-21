# Diccionario de datos — schema `security`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## security.access_control_lists

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | Sí       | ``                  |     |     |
| branch_id     | `uuid`                     | Sí       | ``                  |     |     |
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
| name          | `text`                     | No       | ``                  |     |     |
| resource_type | `text`                     | No       | ``                  |     |     |

## security.acl_entries

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                               |
| ------------ | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id     | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                  |
| company_id   | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                  |
| version      | `integer`                  | No       | `1`                 |     |                                  |
| row_version  | `bigint`                   | No       | `0`                 |     |                                  |
| is_active    | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                  |
| observations | `text`                     | Sí       | ``                  |     |                                  |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| acl_id       | `uuid`                     | No       | ``                  |     | security.access_control_lists.id |
| subject_type | `text`                     | No       | ``                  |     |                                  |
| subject_id   | `uuid`                     | No       | ``                  |     |                                  |
| resource_id  | `uuid`                     | Sí       | ``                  |     |                                  |
| effect       | `text`                     | No       | ``                  |     |                                  |

## security.api_key_rate_limits

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
| api_key_id          | `uuid`                     | No       | ``                  |     |     |
| requests_per_minute | `integer`                  | No       | `60`                |     |     |

## security.data_encryption_keys

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
| kms_key_reference | `text`                     | No       | ``                  |     |     |
| purpose           | `text`                     | No       | ``                  |     |     |
| is_current        | `boolean`                  | No       | `true`              |     |     |

## security.encryption_key_rotations

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                               |
| ------------------ | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id           | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id          | `uuid`                     | No       | ``                  |     |                                  |
| company_id         | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by         | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                                  |
| version            | `integer`                  | No       | `1`                 |     |                                  |
| row_version        | `bigint`                   | No       | `0`                 |     |                                  |
| is_active          | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                                  |
| observations       | `text`                     | Sí       | ``                  |     |                                  |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| encryption_key_id  | `uuid`                     | No       | ``                  |     | security.data_encryption_keys.id |
| rotated_at         | `timestamp with time zone` | No       | `now()`             |     |                                  |
| rotated_by_user_id | `uuid`                     | Sí       | ``                  |     |                                  |

## security.ip_allowlist_entries

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
| cidr_range   | `cidr`                     | No       | ``                  |     |     |

## security.ip_denylist_entries

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
| cidr_range   | `cidr`                     | No       | ``                  |     |     |
| reason       | `text`                     | Sí       | ``                  |     |     |

## security.login_attempts

| Columna         | Tipo                       | Nullable | Default             | PK  | FK  |
| --------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id        | `bigint`                   | No       | ``                  |     |     |
| tenant_id       | `uuid`                     | No       | ``                  |     |     |
| company_id      | `uuid`                     | Sí       | ``                  |     |     |
| branch_id       | `uuid`                     | Sí       | ``                  |     |     |
| created_at      | `timestamp with time zone` | No       | `now()`             | PK  |     |
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
| user_id         | `uuid`                     | Sí       | ``                  |     |     |
| email_attempted | `text`                     | No       | ``                  |     |     |
| ip_address      | `inet`                     | Sí       | ``                  |     |     |
| succeeded       | `boolean`                  | No       | ``                  |     |     |

## security.oauth_client_scopes

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
| client_id    | `uuid`                     | No       | ``                  |     | security.oauth_clients.id |
| scope_id     | `uuid`                     | No       | ``                  |     | security.oauth_scopes.id  |

## security.oauth_clients

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
| name               | `text`                     | No       | ``                  |     |     |
| client_id          | `text`                     | No       | ``                  |     |     |
| client_secret_hash | `text`                     | No       | ``                  |     |     |
| redirect_uris      | `_text[]`                  | No       | ``                  |     |     |

## security.oauth_scopes

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
| description  | `text`                     | Sí       | ``                  |     |     |

## security.oauth_tokens

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
| client_id          | `uuid`                     | No       | ``                  |     | security.oauth_clients.id |
| user_id            | `uuid`                     | Sí       | ``                  |     |                           |
| access_token_hash  | `text`                     | No       | ``                  |     |                           |
| refresh_token_hash | `text`                     | Sí       | ``                  |     |                           |
| expires_at         | `timestamp with time zone` | No       | ``                  |     |                           |
| revoked_at         | `timestamp with time zone` | Sí       | ``                  |     |                           |

## security.password_history

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | Sí       | ``                  |     |     |
| branch_id     | `uuid`                     | Sí       | ``                  |     |     |
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
| user_id       | `uuid`                     | No       | ``                  |     |     |
| password_hash | `text`                     | No       | ``                  |     |     |

## security.password_policies

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
| min_length         | `smallint`                 | No       | `12`                |     |     |
| requires_uppercase | `boolean`                  | No       | `true`              |     |     |
| requires_number    | `boolean`                  | No       | `true`              |     |     |
| requires_symbol    | `boolean`                  | No       | `true`              |     |     |
| expires_after_days | `integer`                  | Sí       | ``                  |     |     |
| history_count      | `smallint`                 | No       | `5`                 |     |     |

## security.permission_delegations

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
| delegator_user_id | `uuid`                     | No       | ``                  |     |     |
| delegate_user_id  | `uuid`                     | No       | ``                  |     |     |
| permission_id     | `uuid`                     | No       | ``                  |     |     |
| starts_at         | `timestamp with time zone` | No       | `now()`             |     |     |
| ends_at           | `timestamp with time zone` | No       | ``                  |     |     |

## security.security_audit_logs

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | Sí       | ``                  |     |     |
| branch_id     | `uuid`                     | Sí       | ``                  |     |     |
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
| event_type    | `text`                     | No       | ``                  |     |     |
| actor_user_id | `uuid`                     | Sí       | ``                  |     |     |
| ip_address    | `inet`                     | Sí       | ``                  |     |     |
| details       | `jsonb`                    | No       | `'{}'::jsonb`       |     |     |

## security.security_incident_events

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
| incident_id       | `uuid`                     | No       | ``                  |     | security.security_incidents.id |
| event_description | `text`                     | No       | ``                  |     |                                |
| occurred_at       | `timestamp with time zone` | No       | `now()`             |     |                                |

## security.security_incidents

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
| title        | `text`                     | No       | ``                  |     |     |
| severity     | `text`                     | No       | ``                  |     |     |
| status       | `text`                     | No       | `'open'::text`      |     |     |

## security.security_policies

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id                 | `bigint`                   | No       | ``                  |     |                               |
| tenant_id                | `uuid`                     | No       | ``                  |     |                               |
| company_id               | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id                | `uuid`                     | Sí       | ``                  |     |                               |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by               | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by               | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |                               |
| version                  | `integer`                  | No       | `1`                 |     |                               |
| row_version              | `bigint`                   | No       | `0`                 |     |                               |
| is_active                | `boolean`                  | No       | `true`              |     |                               |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                               |
| observations             | `text`                     | Sí       | ``                  |     |                               |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| password_policy_id       | `uuid`                     | Sí       | ``                  |     | security.password_policies.id |
| max_login_attempts       | `smallint`                 | No       | `5`                 |     |                               |
| lockout_duration_minutes | `smallint`                 | No       | `15`                |     |                               |
| requires_2fa             | `boolean`                  | No       | `false`             |     |                               |
| session_timeout_minutes  | `smallint`                 | No       | `30`                |     |                               |

## security.session_activity_logs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------ | -------------------------- | -------- | ------------------- | --- | --- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id     | `bigint`                   | No       | ``                  |     |     |
| tenant_id    | `uuid`                     | No       | ``                  |     |     |
| company_id   | `uuid`                     | Sí       | ``                  |     |     |
| branch_id    | `uuid`                     | Sí       | ``                  |     |     |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |     |
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
| session_id   | `uuid`                     | No       | ``                  |     |     |
| event_type   | `text`                     | No       | ``                  |     |     |

## security.trusted_devices

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | Sí       | ``                  |     |     |
| branch_id     | `uuid`                     | Sí       | ``                  |     |     |
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
| user_id       | `uuid`                     | No       | ``                  |     |     |
| device_id     | `uuid`                     | No       | ``                  |     |     |
| trusted_until | `timestamp with time zone` | No       | ``                  |     |     |

## security.two_factor_backup_codes

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
| user_id      | `uuid`                     | No       | ``                  |     |     |
| code_hash    | `text`                     | No       | ``                  |     |     |
| used_at      | `timestamp with time zone` | Sí       | ``                  |     |     |

## security.two_factor_challenges

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
| user_id      | `uuid`                     | No       | ``                  |     |     |
| succeeded    | `boolean`                  | No       | ``                  |     |     |
| ip_address   | `inet`                     | Sí       | ``                  |     |     |

## security.two_factor_credentials

| Columna          | Tipo                       | Nullable | Default             | PK  | FK  |
| ---------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id         | `bigint`                   | No       | ``                  |     |     |
| tenant_id        | `uuid`                     | No       | ``                  |     |     |
| company_id       | `uuid`                     | Sí       | ``                  |     |     |
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
| user_id          | `uuid`                     | No       | ``                  |     |     |
| method           | `text`                     | No       | ``                  |     |     |
| encrypted_secret | `text`                     | No       | ``                  |     |     |
| confirmed_at     | `timestamp with time zone` | Sí       | ``                  |     |     |
