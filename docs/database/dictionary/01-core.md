# Diccionario de datos — schema `core`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## core.activity_logs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id     |
| action_code  | `text`                     | No       | ``                  |     |                   |
| entity_type  | `text`                     | Sí       | ``                  |     |                   |
| entity_id    | `uuid`                     | Sí       | ``                  |     |                   |

## core.api_key_scopes

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id      | `bigint`                   | No       | ``                  |     |                     |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id     |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id   |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id    |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| version       | `integer`                  | No       | `1`                 |     |                     |
| row_version   | `bigint`                   | No       | `0`                 |     |                     |
| is_active     | `boolean`                  | No       | `true`              |     |                     |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                     |
| observations  | `text`                     | Sí       | ``                  |     |                     |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| api_key_id    | `uuid`                     | No       | ``                  |     | core.api_keys.id    |
| permission_id | `uuid`                     | No       | ``                  |     | core.permissions.id |

## core.api_keys

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name         | `text`                     | No       | ``                  |     |                   |
| key_hash     | `text`                     | No       | ``                  |     |                   |
| key_prefix   | `text`                     | No       | ``                  |     |                   |
| expires_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.approval_matrices

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id         | `bigint`                   | No       | ``                  |     |                   |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version          | `integer`                  | No       | `1`                 |     |                   |
| row_version      | `bigint`                   | No       | `0`                 |     |                   |
| is_active        | `boolean`                  | No       | `true`              |     |                   |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                   |
| observations     | `text`                     | Sí       | ``                  |     |                   |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| entity_type      | `text`                     | No       | ``                  |     |                   |
| min_amount       | `numeric(18,4)`            | Sí       | ``                  |     |                   |
| max_amount       | `numeric(18,4)`            | Sí       | ``                  |     |                   |
| required_role_id | `uuid`                     | No       | ``                  |     | core.roles.id     |

## core.approval_steps

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id         | `bigint`                   | No       | ``                  |     |                   |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version          | `integer`                  | No       | `1`                 |     |                   |
| row_version      | `bigint`                   | No       | `0`                 |     |                   |
| is_active        | `boolean`                  | No       | `true`              |     |                   |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                   |
| observations     | `text`                     | Sí       | ``                  |     |                   |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| approval_id      | `uuid`                     | No       | ``                  |     | core.approvals.id |
| approver_user_id | `uuid`                     | No       | ``                  |     | core.users.id     |
| decision         | `text`                     | Sí       | ``                  |     |                   |
| decided_at       | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.approvals

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id             | `bigint`                   | No       | ``                  |     |                   |
| tenant_id            | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id           | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id            | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by           | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by           | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by           | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version              | `integer`                  | No       | `1`                 |     |                   |
| row_version          | `bigint`                   | No       | `0`                 |     |                   |
| is_active            | `boolean`                  | No       | `true`              |     |                   |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                   |
| observations         | `text`                     | Sí       | ``                  |     |                   |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| entity_type          | `text`                     | No       | ``                  |     |                   |
| entity_id            | `uuid`                     | No       | ``                  |     |                   |
| requested_by_user_id | `uuid`                     | No       | ``                  |     | core.users.id     |
| status               | `text`                     | No       | `'pending'::text`   |     |                   |

## core.audit_logs

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                |
| --------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id        | `bigint`                   | No       | ``                  |     |                   |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version         | `integer`                  | No       | `1`                 |     |                   |
| row_version     | `bigint`                   | No       | `0`                 |     |                   |
| is_active       | `boolean`                  | No       | `true`              |     |                   |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                   |
| observations    | `text`                     | Sí       | ``                  |     |                   |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| table_schema    | `text`                     | No       | ``                  |     |                   |
| table_name      | `text`                     | No       | ``                  |     |                   |
| row_id          | `uuid`                     | No       | ``                  |     |                   |
| operation       | `text`                     | No       | ``                  |     |                   |
| old_values      | `jsonb`                    | Sí       | ``                  |     |                   |
| new_values      | `jsonb`                    | Sí       | ``                  |     |                   |
| changed_columns | `_text[]`                  | Sí       | ``                  |     |                   |
| actor_user_id   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| occurred_at     | `timestamp with time zone` | No       | `now()`             | PK  |                   |

## core.background_jobs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| job_key      | `text`                     | No       | ``                  |     |                   |
| queue_name   | `text`                     | No       | `'normal'::text`    |     |                   |
| payload      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| priority     | `smallint`                 | No       | `0`                 |     |                   |
| status       | `text`                     | No       | `'queued'::text`    |     |                   |
| attempts     | `integer`                  | No       | `0`                 |     |                   |
| max_attempts | `integer`                  | No       | `3`                 |     |                   |
| available_at | `timestamp with time zone` | No       | `now()`             |     |                   |
| locked_by    | `text`                     | Sí       | ``                  |     |                   |
| locked_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| started_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| completed_at | `timestamp with time zone` | Sí       | ``                  |     |                   |
| last_error   | `text`                     | Sí       | ``                  |     |                   |

## core.branches

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id       | `bigint`                   | No       | ``                  |     |                            |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id            |
| company_id     | `uuid`                     | No       | ``                  |     | core.companies.id          |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                            |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| version        | `integer`                  | No       | `1`                 |     |                            |
| row_version    | `bigint`                   | No       | `0`                 |     |                            |
| is_active      | `boolean`                  | No       | `true`              |     |                            |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                            |
| observations   | `text`                     | Sí       | ``                  |     |                            |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| name           | `text`                     | No       | ``                  |     |                            |
| code           | `text`                     | No       | ``                  |     |                            |
| is_main_branch | `boolean`                  | No       | `false`             |     |                            |
| address_line   | `text`                     | Sí       | ``                  |     |                            |
| phone          | `text`                     | Sí       | ``                  |     |                            |
| country_id     | `uuid`                     | Sí       | ``                  |     | configuration.countries.id |
| language_id    | `uuid`                     | Sí       | ``                  |     | configuration.languages.id |
| timezone_id    | `uuid`                     | Sí       | ``                  |     | configuration.timezones.id |

Columnas nuevas de `35_functional_completion.sql` (2026-07-25): `country_id`/`language_id`/`timezone_id` — `FUNCTIONAL_GAPS.md` #2.

## core.business_rule_evaluations

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id        |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id      |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id       |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| rule_id          | `uuid`                     | No       | ``                  |     | core.business_rules.id |
| rule_set_key     | `text`                     | No       | ``                  |     |                        |
| context_snapshot | `jsonb`                    | No       | ``                  |     |                        |
| matched          | `boolean`                  | No       | ``                  |     |                        |
| action_executed  | `boolean`                  | No       | `false`             |     |                        |

## core.business_rules

| Columna              | Tipo                       | Nullable | Default               | PK  | FK                |
| -------------------- | -------------------------- | -------- | --------------------- | --- | ----------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()`   | PK  |                   |
| local_id             | `bigint`                   | No       | ``                    |     |                   |
| tenant_id            | `uuid`                     | No       | ``                    |     | core.tenants.id   |
| company_id           | `uuid`                     | Sí       | ``                    |     | core.companies.id |
| branch_id            | `uuid`                     | Sí       | ``                    |     | core.branches.id  |
| created_at           | `timestamp with time zone` | No       | `now()`               |     |                   |
| updated_at           | `timestamp with time zone` | No       | `now()`               |     |                   |
| deleted_at           | `timestamp with time zone` | Sí       | ``                    |     |                   |
| created_by           | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| updated_by           | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| deleted_by           | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| version              | `integer`                  | No       | `1`                   |     |                   |
| row_version          | `bigint`                   | No       | `0`                   |     |                   |
| is_active            | `boolean`                  | No       | `true`                |     |                   |
| is_deleted           | `boolean`                  | Sí       | ``                    |     |                   |
| observations         | `text`                     | Sí       | ``                    |     |                   |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`         |     |                   |
| rule_set_key         | `text`                     | No       | ``                    |     |                   |
| name                 | `text`                     | No       | ``                    |     |                   |
| priority             | `integer`                  | No       | `0`                   |     |                   |
| evaluation_mode      | `text`                     | No       | `'first_match'::text` |     |                   |
| condition_expression | `jsonb`                    | No       | ``                    |     |                   |
| action_type          | `text`                     | No       | ``                    |     |                   |
| action_payload       | `jsonb`                    | No       | `'{}'::jsonb`         |     |                   |

## core.change_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| table_schema | `text`                     | No       | ``                  |     |                   |
| table_name   | `text`                     | No       | ``                  |     |                   |
| row_id       | `uuid`                     | No       | ``                  |     |                   |
| snapshot     | `jsonb`                    | No       | ``                  |     |                   |
| occurred_at  | `timestamp with time zone` | No       | `now()`             |     |                   |

## core.comments

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id       | `bigint`                   | No       | ``                  |     |                   |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id     | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id      | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version        | `integer`                  | No       | `1`                 |     |                   |
| row_version    | `bigint`                   | No       | `0`                 |     |                   |
| is_active      | `boolean`                  | No       | `true`              |     |                   |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                   |
| observations   | `text`                     | Sí       | ``                  |     |                   |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| entity_type    | `text`                     | No       | ``                  |     |                   |
| entity_id      | `uuid`                     | No       | ``                  |     |                   |
| author_user_id | `uuid`                     | No       | ``                  |     | core.users.id     |
| body           | `text`                     | No       | ``                  |     |                   |

## core.companies

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                         |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id                 | `bigint`                   | No       | ``                  |     |                            |
| tenant_id                | `uuid`                     | No       | ``                  |     | core.tenants.id            |
| company_id               | `uuid`                     | Sí       | ``                  |     |                            |
| branch_id                | `uuid`                     | Sí       | ``                  |     | core.branches.id           |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by               | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| updated_by               | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| deleted_by               | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| version                  | `integer`                  | No       | `1`                 |     |                            |
| row_version              | `bigint`                   | No       | `0`                 |     |                            |
| is_active                | `boolean`                  | No       | `true`              |     |                            |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                            |
| observations             | `text`                     | Sí       | ``                  |     |                            |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| legal_name               | `text`                     | No       | ``                  |     |                            |
| trade_name               | `text`                     | Sí       | ``                  |     |                            |
| tax_id                   | `text`                     | No       | ``                  |     |                            |
| tax_regime               | `text`                     | Sí       | ``                  |     |                            |
| functional_currency_code | `character`                | No       | ``                  |     |                            |
| fiscal_year_start_month  | `smallint`                 | No       | `1`                 |     |                            |
| country_id               | `uuid`                     | Sí       | ``                  |     | configuration.countries.id |
| language_id              | `uuid`                     | Sí       | ``                  |     | configuration.languages.id |
| timezone_id              | `uuid`                     | Sí       | ``                  |     | configuration.timezones.id |

Columnas nuevas de `35_functional_completion.sql` (2026-07-25): `country_id`/`language_id`/`timezone_id` — `FUNCTIONAL_GAPS.md` #2.

## core.consent_records

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| entity_type  | `text`                     | No       | ``                  |     |                   |
| entity_id    | `uuid`                     | No       | ``                  |     |                   |
| consent_type | `text`                     | No       | ``                  |     |                   |
| granted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| revoked_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.data_retention_policies

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id                | `bigint`                   | No       | ``                  |     |                   |
| tenant_id               | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id              | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id               | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version                 | `integer`                  | No       | `1`                 |     |                   |
| row_version             | `bigint`                   | No       | `0`                 |     |                   |
| is_active               | `boolean`                  | No       | `true`              |     |                   |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                   |
| observations            | `text`                     | Sí       | ``                  |     |                   |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| entity_type             | `text`                     | No       | ``                  |     |                   |
| retention_period_months | `integer`                  | No       | ``                  |     |                   |
| action_on_expiry        | `text`                     | No       | ``                  |     |                   |

## core.data_subject_requests

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id                 | `bigint`                   | No       | ``                  |     |                   |
| tenant_id                | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id               | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id                | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by               | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by               | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by               | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version                  | `integer`                  | No       | `1`                 |     |                   |
| row_version              | `bigint`                   | No       | `0`                 |     |                   |
| is_active                | `boolean`                  | No       | `true`              |     |                   |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                   |
| observations             | `text`                     | Sí       | ``                  |     |                   |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| requested_by_entity_type | `text`                     | No       | ``                  |     |                   |
| requested_by_entity_id   | `uuid`                     | No       | ``                  |     |                   |
| request_type             | `text`                     | No       | ``                  |     |                   |
| status                   | `text`                     | No       | `'received'::text`  |     |                   |
| resolved_at              | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.departments

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                  |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id             | `bigint`                   | No       | ``                  |     |                     |
| tenant_id            | `uuid`                     | No       | ``                  |     | core.tenants.id     |
| company_id           | `uuid`                     | No       | ``                  |     | core.companies.id   |
| branch_id            | `uuid`                     | Sí       | ``                  |     | core.branches.id    |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by           | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| updated_by           | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| deleted_by           | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| version              | `integer`                  | No       | `1`                 |     |                     |
| row_version          | `bigint`                   | No       | `0`                 |     |                     |
| is_active            | `boolean`                  | No       | `true`              |     |                     |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                     |
| observations         | `text`                     | Sí       | ``                  |     |                     |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| name                 | `text`                     | No       | ``                  |     |                     |
| code                 | `text`                     | No       | ``                  |     |                     |
| parent_department_id | `uuid`                     | Sí       | ``                  |     | core.departments.id |

## core.document_types

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id                | `bigint`                   | No       | ``                  |     |                   |
| tenant_id               | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id              | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id               | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version                 | `integer`                  | No       | `1`                 |     |                   |
| row_version             | `bigint`                   | No       | `0`                 |     |                   |
| is_active               | `boolean`                  | No       | `true`              |     |                   |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                   |
| observations            | `text`                     | Sí       | ``                  |     |                   |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name                    | `text`                     | No       | ``                  |     |                   |
| retention_period_months | `integer`                  | Sí       | ``                  |     |                   |

## core.document_versions

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id       | `bigint`                   | No       | ``                  |     |                   |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id     | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id      | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version        | `integer`                  | No       | `1`                 |     |                   |
| row_version    | `bigint`                   | No       | `0`                 |     |                   |
| is_active      | `boolean`                  | No       | `true`              |     |                   |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                   |
| observations   | `text`                     | Sí       | ``                  |     |                   |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| document_id    | `uuid`                     | No       | ``                  |     | core.documents.id |
| file_id        | `uuid`                     | No       | ``                  |     | core.files.id     |
| version_number | `integer`                  | No       | ``                  |     |                   |

## core.documents

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id        |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id      |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id       |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| file_id          | `uuid`                     | No       | ``                  |     | core.files.id          |
| document_type_id | `uuid`                     | No       | ``                  |     | core.document_types.id |
| source_module    | `text`                     | No       | ``                  |     |                        |
| source_entity_id | `uuid`                     | No       | ``                  |     |                        |
| title            | `text`                     | No       | ``                  |     |                        |

## core.edi_transactions

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                   |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id         | `bigint`                   | No       | ``                  |     |                      |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id      |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id    |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id     |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| version          | `integer`                  | No       | `1`                 |     |                      |
| row_version      | `bigint`                   | No       | `0`                 |     |                      |
| is_active        | `boolean`                  | No       | `true`              |     |                      |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                      |
| observations     | `text`                     | Sí       | ``                  |     |                      |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| integration_id   | `uuid`                     | No       | ``                  |     | core.integrations.id |
| direction        | `text`                     | No       | ``                  |     |                      |
| document_type    | `text`                     | No       | ``                  |     |                      |
| source_module    | `text`                     | Sí       | ``                  |     |                      |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                      |
| raw_payload      | `text`                     | No       | ``                  |     |                      |
| status           | `text`                     | No       | `'received'::text`  |     |                      |

## core.entity_tags

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| tag_id       | `uuid`                     | No       | ``                  |     | core.tags.id      |
| entity_type  | `text`                     | No       | ``                  |     |                   |
| entity_id    | `uuid`                     | No       | ``                  |     |                   |

## core.export_batches

| Columna             | Tipo                       | Nullable | Default              | PK  | FK                |
| ------------------- | -------------------------- | -------- | -------------------- | --- | ----------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()`  | PK  |                   |
| local_id            | `bigint`                   | No       | ``                   |     |                   |
| tenant_id           | `uuid`                     | No       | ``                   |     | core.tenants.id   |
| company_id          | `uuid`                     | Sí       | ``                   |     | core.companies.id |
| branch_id           | `uuid`                     | Sí       | ``                   |     | core.branches.id  |
| created_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| updated_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| deleted_at          | `timestamp with time zone` | Sí       | ``                   |     |                   |
| created_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| updated_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| deleted_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| version             | `integer`                  | No       | `1`                  |     |                   |
| row_version         | `bigint`                   | No       | `0`                  |     |                   |
| is_active           | `boolean`                  | No       | `true`               |     |                   |
| is_deleted          | `boolean`                  | Sí       | ``                   |     |                   |
| observations        | `text`                     | Sí       | ``                   |     |                   |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`        |     |                   |
| source_module       | `text`                     | No       | ``                   |     |                   |
| output_file_id      | `uuid`                     | Sí       | ``                   |     | core.files.id     |
| executed_by_user_id | `uuid`                     | No       | ``                   |     | core.users.id     |
| status              | `text`                     | No       | `'processing'::text` |     |                   |

## core.feature_flags

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id           | `bigint`                   | No       | ``                  |     |                   |
| tenant_id          | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id         | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id          | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version            | `integer`                  | No       | `1`                 |     |                   |
| row_version        | `bigint`                   | No       | `0`                 |     |                   |
| is_active          | `boolean`                  | No       | `true`              |     |                   |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                   |
| observations       | `text`                     | Sí       | ``                  |     |                   |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| flag_key           | `text`                     | No       | ``                  |     |                   |
| is_enabled         | `boolean`                  | No       | `false`             |     |                   |
| rollout_percentage | `smallint`                 | Sí       | ``                  |     |                   |

## core.files

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                |
| --------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id        | `bigint`                   | No       | ``                  |     |                   |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version         | `integer`                  | No       | `1`                 |     |                   |
| row_version     | `bigint`                   | No       | `0`                 |     |                   |
| is_active       | `boolean`                  | No       | `true`              |     |                   |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                   |
| observations    | `text`                     | Sí       | ``                  |     |                   |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| storage_bucket  | `text`                     | No       | ``                  |     |                   |
| storage_key     | `text`                     | No       | ``                  |     |                   |
| original_name   | `text`                     | No       | ``                  |     |                   |
| mime_type       | `text`                     | No       | ``                  |     |                   |
| size_bytes      | `bigint`                   | No       | ``                  |     |                   |
| checksum_sha256 | `text`                     | No       | ``                  |     |                   |

## core.group_members

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| group_id     | `uuid`                     | No       | ``                  |     | core.groups.id    |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id     |

## core.groups

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name         | `text`                     | No       | ``                  |     |                   |

## core.import_batch_errors

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                     |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id        | `bigint`                   | No       | ``                  |     |                        |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id        |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id      |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id       |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| version         | `integer`                  | No       | `1`                 |     |                        |
| row_version     | `bigint`                   | No       | `0`                 |     |                        |
| is_active       | `boolean`                  | No       | `true`              |     |                        |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                        |
| observations    | `text`                     | Sí       | ``                  |     |                        |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| import_batch_id | `uuid`                     | No       | ``                  |     | core.import_batches.id |
| row_number      | `integer`                  | No       | ``                  |     |                        |
| error_message   | `text`                     | No       | ``                  |     |                        |
| raw_row_data    | `jsonb`                    | Sí       | ``                  |     |                        |

## core.import_batches

| Columna             | Tipo                       | Nullable | Default              | PK  | FK                |
| ------------------- | -------------------------- | -------- | -------------------- | --- | ----------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()`  | PK  |                   |
| local_id            | `bigint`                   | No       | ``                   |     |                   |
| tenant_id           | `uuid`                     | No       | ``                   |     | core.tenants.id   |
| company_id          | `uuid`                     | Sí       | ``                   |     | core.companies.id |
| branch_id           | `uuid`                     | Sí       | ``                   |     | core.branches.id  |
| created_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| updated_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| deleted_at          | `timestamp with time zone` | Sí       | ``                   |     |                   |
| created_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| updated_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| deleted_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| version             | `integer`                  | No       | `1`                  |     |                   |
| row_version         | `bigint`                   | No       | `0`                  |     |                   |
| is_active           | `boolean`                  | No       | `true`               |     |                   |
| is_deleted          | `boolean`                  | Sí       | ``                   |     |                   |
| observations        | `text`                     | Sí       | ``                   |     |                   |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`        |     |                   |
| target_module       | `text`                     | No       | ``                   |     |                   |
| source_file_id      | `uuid`                     | Sí       | ``                   |     | core.files.id     |
| executed_by_user_id | `uuid`                     | No       | ``                   |     | core.users.id     |
| total_rows          | `integer`                  | Sí       | ``                   |     |                   |
| success_rows        | `integer`                  | Sí       | ``                   |     |                   |
| status              | `text`                     | No       | `'processing'::text` |     |                   |

## core.integration_credentials

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                   |
| --------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id        | `bigint`                   | No       | ``                  |     |                      |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id      |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id    |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id     |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| version         | `integer`                  | No       | `1`                 |     |                      |
| row_version     | `bigint`                   | No       | `0`                 |     |                      |
| is_active       | `boolean`                  | No       | `true`              |     |                      |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                      |
| observations    | `text`                     | Sí       | ``                  |     |                      |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| integration_id  | `uuid`                     | No       | ``                  |     | core.integrations.id |
| credential_key  | `text`                     | No       | ``                  |     |                      |
| encrypted_value | `text`                     | No       | ``                  |     |                      |

## core.integrations

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id         | `bigint`                   | No       | ``                  |     |                   |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version          | `integer`                  | No       | `1`                 |     |                   |
| row_version      | `bigint`                   | No       | `0`                 |     |                   |
| is_active        | `boolean`                  | No       | `true`              |     |                   |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                   |
| observations     | `text`                     | Sí       | ``                  |     |                   |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name             | `text`                     | No       | ``                  |     |                   |
| integration_type | `text`                     | No       | ``                  |     |                   |
| is_enabled       | `boolean`                  | No       | `true`              |     |                   |

## core.notification_channels

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id      | `bigint`                   | No       | ``                  |     |                   |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version       | `integer`                  | No       | `1`                 |     |                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                   |
| is_active     | `boolean`                  | No       | `true`              |     |                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                   |
| observations  | `text`                     | Sí       | ``                  |     |                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| channel_type  | `text`                     | No       | ``                  |     |                   |
| provider_name | `text`                     | Sí       | ``                  |     |                   |
| is_default    | `boolean`                  | No       | `false`             |     |                   |

## core.notification_delivery_logs

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                            |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id          | `bigint`                   | No       | ``                  |     |                               |
| tenant_id         | `uuid`                     | No       | ``                  |     | core.tenants.id               |
| company_id        | `uuid`                     | Sí       | ``                  |     | core.companies.id             |
| branch_id         | `uuid`                     | Sí       | ``                  |     | core.branches.id              |
| created_at        | `timestamp with time zone` | No       | `now()`             | PK  |                               |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| updated_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| deleted_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| version           | `integer`                  | No       | `1`                 |     |                               |
| row_version       | `bigint`                   | No       | `0`                 |     |                               |
| is_active         | `boolean`                  | No       | `true`              |     |                               |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                               |
| observations      | `text`                     | Sí       | ``                  |     |                               |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| notification_id   | `uuid`                     | No       | ``                  |     | core.notifications.id         |
| channel_id        | `uuid`                     | No       | ``                  |     | core.notification_channels.id |
| status            | `text`                     | No       | ``                  |     |                               |
| provider_response | `text`                     | Sí       | ``                  |     |                               |

## core.notification_preferences

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id     | `bigint`                   | No       | ``                  |     |                               |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id               |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id             |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id              |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| version      | `integer`                  | No       | `1`                 |     |                               |
| row_version  | `bigint`                   | No       | `0`                 |     |                               |
| is_active    | `boolean`                  | No       | `true`              |     |                               |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                               |
| observations | `text`                     | Sí       | ``                  |     |                               |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id                 |
| channel_id   | `uuid`                     | No       | ``                  |     | core.notification_channels.id |
| event_code   | `text`                     | No       | ``                  |     |                               |
| is_opted_in  | `boolean`                  | No       | `true`              |     |                               |

## core.notification_recipients

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                    |
| --------------- | -------------------------- | -------- | ------------------- | --- | --------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                       |
| local_id        | `bigint`                   | No       | ``                  |     |                       |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id       |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id     |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id      |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                       |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                       |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id         |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id         |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id         |
| version         | `integer`                  | No       | `1`                 |     |                       |
| row_version     | `bigint`                   | No       | `0`                 |     |                       |
| is_active       | `boolean`                  | No       | `true`              |     |                       |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                       |
| observations    | `text`                     | Sí       | ``                  |     |                       |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                       |
| notification_id | `uuid`                     | No       | ``                  |     | core.notifications.id |
| user_id         | `uuid`                     | No       | ``                  |     | core.users.id         |

## core.notification_template_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id      | `bigint`                   | No       | ``                  |     |                                |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id                |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id              |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id               |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| version       | `integer`                  | No       | `1`                 |     |                                |
| row_version   | `bigint`                   | No       | `0`                 |     |                                |
| is_active     | `boolean`                  | No       | `true`              |     |                                |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                                |
| observations  | `text`                     | Sí       | ``                  |     |                                |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| template_id   | `uuid`                     | No       | ``                  |     | core.notification_templates.id |
| language_code | `text`                     | No       | ``                  |     |                                |
| subject       | `text`                     | Sí       | ``                  |     |                                |
| body          | `text`                     | No       | ``                  |     |                                |

## core.notification_templates

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id           | `bigint`                   | No       | ``                  |     |                               |
| tenant_id          | `uuid`                     | No       | ``                  |     | core.tenants.id               |
| company_id         | `uuid`                     | Sí       | ``                  |     | core.companies.id             |
| branch_id          | `uuid`                     | Sí       | ``                  |     | core.branches.id              |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by         | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| updated_by         | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| deleted_by         | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| version            | `integer`                  | No       | `1`                 |     |                               |
| row_version        | `bigint`                   | No       | `0`                 |     |                               |
| is_active          | `boolean`                  | No       | `true`              |     |                               |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                               |
| observations       | `text`                     | Sí       | ``                  |     |                               |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| event_code         | `text`                     | No       | ``                  |     |                               |
| default_channel_id | `uuid`                     | Sí       | ``                  |     | core.notification_channels.id |

## core.notifications

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                             |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id          | `bigint`                   | No       | ``                  |     |                                |
| tenant_id         | `uuid`                     | No       | ``                  |     | core.tenants.id                |
| company_id        | `uuid`                     | Sí       | ``                  |     | core.companies.id              |
| branch_id         | `uuid`                     | Sí       | ``                  |     | core.branches.id               |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| updated_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| deleted_by        | `uuid`                     | Sí       | ``                  |     | core.users.id                  |
| version           | `integer`                  | No       | `1`                 |     |                                |
| row_version       | `bigint`                   | No       | `0`                 |     |                                |
| is_active         | `boolean`                  | No       | `true`              |     |                                |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                                |
| observations      | `text`                     | Sí       | ``                  |     |                                |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| recipient_user_id | `uuid`                     | No       | ``                  |     | core.users.id                  |
| template_id       | `uuid`                     | Sí       | ``                  |     | core.notification_templates.id |
| subject           | `text`                     | Sí       | ``                  |     |                                |
| body              | `text`                     | No       | ``                  |     |                                |
| read_at           | `timestamp with time zone` | Sí       | ``                  |     |                                |

## core.permissions

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| code         | `text`                     | No       | ``                  |     |                   |
| module_code  | `text`                     | No       | ``                  |     |                   |
| action_code  | `text`                     | No       | ``                  |     |                   |
| description  | `text`                     | Sí       | ``                  |     |                   |

## core.restore_test_logs

| Columna             | Tipo                       | Nullable | Default                                        | PK  | FK            |
| ------------------- | -------------------------- | -------- | ---------------------------------------------- | --- | ------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()`                            | PK  |               |
| local_id            | `bigint`                   | No       | ``                                             |     |               |
| tenant_id           | `uuid`                     | No       | `'00000000-0000-0000-0000-000000000000'::uuid` |     |               |
| company_id          | `uuid`                     | Sí       | ``                                             |     |               |
| branch_id           | `uuid`                     | Sí       | ``                                             |     |               |
| created_at          | `timestamp with time zone` | No       | `now()`                                        |     |               |
| updated_at          | `timestamp with time zone` | No       | `now()`                                        |     |               |
| deleted_at          | `timestamp with time zone` | Sí       | ``                                             |     |               |
| created_by          | `uuid`                     | Sí       | ``                                             |     | core.users.id |
| updated_by          | `uuid`                     | Sí       | ``                                             |     | core.users.id |
| deleted_by          | `uuid`                     | Sí       | ``                                             |     | core.users.id |
| version             | `integer`                  | No       | `1`                                            |     |               |
| row_version         | `bigint`                   | No       | `0`                                            |     |               |
| is_active           | `boolean`                  | No       | `true`                                         |     |               |
| is_deleted          | `boolean`                  | Sí       | ``                                             |     |               |
| observations        | `text`                     | Sí       | ``                                             |     |               |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`                                  |     |               |
| backup_source       | `text`                     | No       | ``                                             |     |               |
| restore_started_at  | `timestamp with time zone` | No       | ``                                             |     |               |
| restore_finished_at | `timestamp with time zone` | Sí       | ``                                             |     |               |
| all_checks_passed   | `boolean`                  | Sí       | ``                                             |     |               |
| check_results       | `jsonb`                    | Sí       | ``                                             |     |               |

## core.role_permissions

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id      | `bigint`                   | No       | ``                  |     |                     |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id     |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id   |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id    |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id       |
| version       | `integer`                  | No       | `1`                 |     |                     |
| row_version   | `bigint`                   | No       | `0`                 |     |                     |
| is_active     | `boolean`                  | No       | `true`              |     |                     |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                     |
| observations  | `text`                     | Sí       | ``                  |     |                     |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| role_id       | `uuid`                     | No       | ``                  |     | core.roles.id       |
| permission_id | `uuid`                     | No       | ``                  |     | core.permissions.id |

## core.roles

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id       | `bigint`                   | No       | ``                  |     |                   |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id     | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id      | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version        | `integer`                  | No       | `1`                 |     |                   |
| row_version    | `bigint`                   | No       | `0`                 |     |                   |
| is_active      | `boolean`                  | No       | `true`              |     |                   |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                   |
| observations   | `text`                     | Sí       | ``                  |     |                   |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name           | `text`                     | No       | ``                  |     |                   |
| is_system_role | `boolean`                  | No       | `false`             |     |                   |

## core.scheduled_job_runs

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     | core.tenants.id        |
| company_id       | `uuid`                     | Sí       | ``                  |     | core.companies.id      |
| branch_id        | `uuid`                     | Sí       | ``                  |     | core.branches.id       |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| updated_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| deleted_by       | `uuid`                     | Sí       | ``                  |     | core.users.id          |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| scheduled_job_id | `uuid`                     | No       | ``                  |     | core.scheduled_jobs.id |
| started_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| finished_at      | `timestamp with time zone` | Sí       | ``                  |     |                        |
| status           | `text`                     | No       | `'running'::text`   |     |                        |

## core.scheduled_jobs

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                |
| --------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id        | `bigint`                   | No       | ``                  |     |                   |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version         | `integer`                  | No       | `1`                 |     |                   |
| row_version     | `bigint`                   | No       | `0`                 |     |                   |
| is_active       | `boolean`                  | No       | `true`              |     |                   |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                   |
| observations    | `text`                     | Sí       | ``                  |     |                   |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| job_code        | `text`                     | No       | ``                  |     |                   |
| cron_expression | `text`                     | No       | ``                  |     |                   |
| is_enabled      | `boolean`                  | No       | `true`              |     |                   |

## core.sessions

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id           | `bigint`                   | No       | ``                  |     |                   |
| tenant_id          | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id         | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id          | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version            | `integer`                  | No       | `1`                 |     |                   |
| row_version        | `bigint`                   | No       | `0`                 |     |                   |
| is_active          | `boolean`                  | No       | `true`              |     |                   |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                   |
| observations       | `text`                     | Sí       | ``                  |     |                   |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id            | `uuid`                     | No       | ``                  |     | core.users.id     |
| refresh_token_hash | `text`                     | No       | ``                  |     |                   |
| ip_address         | `inet`                     | Sí       | ``                  |     |                   |
| user_agent         | `text`                     | Sí       | ``                  |     |                   |
| revoked_at         | `timestamp with time zone` | Sí       | ``                  |     |                   |
| expires_at         | `timestamp with time zone` | No       | ``                  |     |                   |

## core.signature_requests

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| document_id  | `uuid`                     | No       | ``                  |     | core.documents.id |
| status       | `text`                     | No       | `'pending'::text`   |     |                   |
| due_at       | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.signatures

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id                | `bigint`                   | No       | ``                  |     |                   |
| tenant_id               | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id              | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id               | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version                 | `integer`                  | No       | `1`                 |     |                   |
| row_version             | `bigint`                   | No       | `0`                 |     |                   |
| is_active               | `boolean`                  | No       | `true`              |     |                   |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                   |
| observations            | `text`                     | Sí       | ``                  |     |                   |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| document_id             | `uuid`                     | No       | ``                  |     | core.documents.id |
| signer_user_id          | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| signer_external_name    | `text`                     | Sí       | ``                  |     |                   |
| signed_at               | `timestamp with time zone` | No       | `now()`             |     |                   |
| signature_image_file_id | `uuid`                     | Sí       | ``                  |     | core.files.id     |

## core.system_logs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| level        | `text`                     | No       | ``                  |     |                   |
| message      | `text`                     | No       | ``                  |     |                   |
| context      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |

## core.system_parameters

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id      | `bigint`                   | No       | ``                  |     |                   |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version       | `integer`                  | No       | `1`                 |     |                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                   |
| is_active     | `boolean`                  | No       | `true`              |     |                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                   |
| observations  | `text`                     | Sí       | ``                  |     |                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| key           | `text`                     | No       | ``                  |     |                   |
| data_type     | `text`                     | No       | ``                  |     |                   |
| default_value | `text`                     | Sí       | ``                  |     |                   |

## core.system_settings

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                        |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                           |
| local_id     | `bigint`                   | No       | ``                  |     |                           |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id           |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id         |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id          |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                           |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                           |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                           |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id             |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id             |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id             |
| version      | `integer`                  | No       | `1`                 |     |                           |
| row_version  | `bigint`                   | No       | `0`                 |     |                           |
| is_active    | `boolean`                  | No       | `true`              |     |                           |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                           |
| observations | `text`                     | Sí       | ``                  |     |                           |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                           |
| parameter_id | `uuid`                     | No       | ``                  |     | core.system_parameters.id |
| value        | `text`                     | No       | ``                  |     |                           |

## core.tags

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name         | `text`                     | No       | ``                  |     |                   |
| color_hex    | `text`                     | Sí       | ``                  |     |                   |

## core.template_translations

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id      | `bigint`                   | No       | ``                  |     |                   |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version       | `integer`                  | No       | `1`                 |     |                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                   |
| is_active     | `boolean`                  | No       | `true`              |     |                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                   |
| observations  | `text`                     | Sí       | ``                  |     |                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| template_id   | `uuid`                     | No       | ``                  |     | core.templates.id |
| language_code | `text`                     | No       | ``                  |     |                   |
| layout_html   | `text`                     | No       | ``                  |     |                   |

## core.templates

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id      | `bigint`                   | No       | ``                  |     |                   |
| tenant_id     | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version       | `integer`                  | No       | `1`                 |     |                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                   |
| is_active     | `boolean`                  | No       | `true`              |     |                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                   |
| observations  | `text`                     | Sí       | ``                  |     |                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| name          | `text`                     | No       | ``                  |     |                   |
| document_kind | `text`                     | No       | ``                  |     |                   |
| layout_html   | `text`                     | No       | ``                  |     |                   |

## core.tenant_subscription_features

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                           |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id        | `bigint`                   | No       | ``                  |     |                              |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id              |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id            |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id             |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                |
| version         | `integer`                  | No       | `1`                 |     |                              |
| row_version     | `bigint`                   | No       | `0`                 |     |                              |
| is_active       | `boolean`                  | No       | `true`              |     |                              |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                              |
| observations    | `text`                     | Sí       | ``                  |     |                              |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| subscription_id | `uuid`                     | No       | ``                  |     | core.tenant_subscriptions.id |
| module_code     | `text`                     | No       | ``                  |     |                              |

## core.tenant_subscriptions

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id       | `bigint`                   | No       | ``                  |     |                   |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id     | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id      | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version        | `integer`                  | No       | `1`                 |     |                   |
| row_version    | `bigint`                   | No       | `0`                 |     |                   |
| is_active      | `boolean`                  | No       | `true`              |     |                   |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                   |
| observations   | `text`                     | Sí       | ``                  |     |                   |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| plan_code      | `text`                     | No       | ``                  |     |                   |
| max_users      | `integer`                  | Sí       | ``                  |     |                   |
| max_companies  | `integer`                  | Sí       | ``                  |     |                   |
| max_branches   | `integer`                  | Sí       | ``                  |     |                   |
| max_warehouses | `integer`                  | Sí       | ``                  |     |                   |
| billing_cycle  | `text`                     | No       | `'monthly'::text`   |     |                   |
| starts_at      | `date`                     | No       | ``                  |     |                   |
| ends_at        | `date`                     | Sí       | ``                  |     |                   |

## core.tenants

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id      | `bigint`                   | No       | ``                  |     |                   |
| tenant_id     | `uuid`                     | No       | ``                  |     |                   |
| company_id    | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id     | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by    | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version       | `integer`                  | No       | `1`                 |     |                   |
| row_version   | `bigint`                   | No       | `0`                 |     |                   |
| is_active     | `boolean`                  | No       | `true`              |     |                   |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                   |
| observations  | `text`                     | Sí       | ``                  |     |                   |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| legal_name    | `text`                     | No       | ``                  |     |                   |
| trade_name    | `text`                     | Sí       | ``                  |     |                   |
| slug          | `text`                     | No       | ``                  |     |                   |
| contact_email | `text`                     | No       | ``                  |     |                   |
| status        | `text`                     | No       | `'active'::text`    |     |                   |

## core.tokens

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id     |
| token_hash   | `text`                     | No       | ``                  |     |                   |
| purpose      | `text`                     | No       | ``                  |     |                   |
| expires_at   | `timestamp with time zone` | No       | ``                  |     |                   |
| used_at      | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.user_companies

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id          | `bigint`                   | No       | ``                  |     |                   |
| tenant_id         | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id        | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id         | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version           | `integer`                  | No       | `1`                 |     |                   |
| row_version       | `bigint`                   | No       | `0`                 |     |                   |
| is_active         | `boolean`                  | No       | `true`              |     |                   |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                   |
| observations      | `text`                     | Sí       | ``                  |     |                   |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id           | `uuid`                     | No       | ``                  |     | core.users.id     |
| target_company_id | `uuid`                     | No       | ``                  |     | core.companies.id |
| is_default        | `boolean`                  | No       | `false`             |     |                   |

## core.user_devices

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id     |
| device_type  | `text`                     | No       | ``                  |     |                   |
| push_token   | `text`                     | Sí       | ``                  |     |                   |
| last_seen_at | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.user_profiles

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id           | `bigint`                   | No       | ``                  |     |                   |
| tenant_id          | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id         | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id          | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by         | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version            | `integer`                  | No       | `1`                 |     |                   |
| row_version        | `bigint`                   | No       | `0`                 |     |                   |
| is_active          | `boolean`                  | No       | `true`              |     |                   |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                   |
| observations       | `text`                     | Sí       | ``                  |     |                   |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id            | `uuid`                     | No       | ``                  |     | core.users.id     |
| avatar_file_id     | `uuid`                     | Sí       | ``                  |     | core.files.id     |
| preferred_language | `text`                     | No       | `'es'::text`        |     |                   |
| preferred_timezone | `text`                     | No       | `'UTC'::text`       |     |                   |

## core.user_roles

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                |
| ------------ | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id     | `bigint`                   | No       | ``                  |     |                   |
| tenant_id    | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version      | `integer`                  | No       | `1`                 |     |                   |
| row_version  | `bigint`                   | No       | `0`                 |     |                   |
| is_active    | `boolean`                  | No       | `true`              |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                   |
| observations | `text`                     | Sí       | ``                  |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| user_id      | `uuid`                     | No       | ``                  |     | core.users.id     |
| role_id      | `uuid`                     | No       | ``                  |     | core.roles.id     |

## core.users

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id          | `bigint`                   | No       | ``                  |     |                   |
| tenant_id         | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id        | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id         | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at        | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at        | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at        | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version           | `integer`                  | No       | `1`                 |     |                   |
| row_version       | `bigint`                   | No       | `0`                 |     |                   |
| is_active         | `boolean`                  | No       | `true`              |     |                   |
| is_deleted        | `boolean`                  | Sí       | ``                  |     |                   |
| observations      | `text`                     | Sí       | ``                  |     |                   |
| metadata          | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| email             | `text`                     | No       | ``                  |     |                   |
| password_hash     | `text`                     | Sí       | ``                  |     |                   |
| full_name         | `text`                     | No       | ``                  |     |                   |
| is_system_account | `boolean`                  | No       | `false`             |     |                   |
| last_login_at     | `timestamp with time zone` | Sí       | ``                  |     |                   |

## core.webhook_delivery_logs

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                            |
| --------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id        | `bigint`                   | No       | ``                  |     |                               |
| tenant_id       | `uuid`                     | No       | ``                  |     | core.tenants.id               |
| company_id      | `uuid`                     | Sí       | ``                  |     | core.companies.id             |
| branch_id       | `uuid`                     | Sí       | ``                  |     | core.branches.id              |
| created_at      | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at      | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at      | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| updated_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| deleted_by      | `uuid`                     | Sí       | ``                  |     | core.users.id                 |
| version         | `integer`                  | No       | `1`                 |     |                               |
| row_version     | `bigint`                   | No       | `0`                 |     |                               |
| is_active       | `boolean`                  | No       | `true`              |     |                               |
| is_deleted      | `boolean`                  | Sí       | ``                  |     |                               |
| observations    | `text`                     | Sí       | ``                  |     |                               |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| subscription_id | `uuid`                     | No       | ``                  |     | core.webhook_subscriptions.id |
| http_status     | `integer`                  | Sí       | ``                  |     |                               |
| attempt_number  | `integer`                  | No       | `1`                 |     |                               |
| succeeded       | `boolean`                  | No       | `false`             |     |                               |

## core.webhook_subscriptions

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                   |
| -------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id       | `bigint`                   | No       | ``                  |     |                      |
| tenant_id      | `uuid`                     | No       | ``                  |     | core.tenants.id      |
| company_id     | `uuid`                     | Sí       | ``                  |     | core.companies.id    |
| branch_id      | `uuid`                     | Sí       | ``                  |     | core.branches.id     |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by     | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| updated_by     | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| deleted_by     | `uuid`                     | Sí       | ``                  |     | core.users.id        |
| version        | `integer`                  | No       | `1`                 |     |                      |
| row_version    | `bigint`                   | No       | `0`                 |     |                      |
| is_active      | `boolean`                  | No       | `true`              |     |                      |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                      |
| observations   | `text`                     | Sí       | ``                  |     |                      |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| integration_id | `uuid`                     | No       | ``                  |     | core.integrations.id |
| event_code     | `text`                     | No       | ``                  |     |                      |
| target_url     | `text`                     | No       | ``                  |     |                      |
| secret_hash    | `text`                     | No       | ``                  |     |                      |

## core.workflow_instance_steps

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                         |
| -------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------- |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                            |
| local_id             | `bigint`                   | No       | ``                  |     |                            |
| tenant_id            | `uuid`                     | No       | ``                  |     | core.tenants.id            |
| company_id           | `uuid`                     | Sí       | ``                  |     | core.companies.id          |
| branch_id            | `uuid`                     | Sí       | ``                  |     | core.branches.id           |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                            |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                            |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                            |
| created_by           | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| updated_by           | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| deleted_by           | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| version              | `integer`                  | No       | `1`                 |     |                            |
| row_version          | `bigint`                   | No       | `0`                 |     |                            |
| is_active            | `boolean`                  | No       | `true`              |     |                            |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                            |
| observations         | `text`                     | Sí       | ``                  |     |                            |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                            |
| workflow_instance_id | `uuid`                     | No       | ``                  |     | core.workflow_instances.id |
| workflow_step_id     | `uuid`                     | No       | ``                  |     | core.workflow_steps.id     |
| status               | `text`                     | No       | `'pending'::text`   |     |                            |
| decided_by_user_id   | `uuid`                     | Sí       | ``                  |     | core.users.id              |
| decided_at           | `timestamp with time zone` | Sí       | ``                  |     |                            |

## core.workflow_instances

| Columna      | Tipo                       | Nullable | Default               | PK  | FK                |
| ------------ | -------------------------- | -------- | --------------------- | --- | ----------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()`   | PK  |                   |
| local_id     | `bigint`                   | No       | ``                    |     |                   |
| tenant_id    | `uuid`                     | No       | ``                    |     | core.tenants.id   |
| company_id   | `uuid`                     | Sí       | ``                    |     | core.companies.id |
| branch_id    | `uuid`                     | Sí       | ``                    |     | core.branches.id  |
| created_at   | `timestamp with time zone` | No       | `now()`               |     |                   |
| updated_at   | `timestamp with time zone` | No       | `now()`               |     |                   |
| deleted_at   | `timestamp with time zone` | Sí       | ``                    |     |                   |
| created_by   | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| updated_by   | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| deleted_by   | `uuid`                     | Sí       | ``                    |     | core.users.id     |
| version      | `integer`                  | No       | `1`                   |     |                   |
| row_version  | `bigint`                   | No       | `0`                   |     |                   |
| is_active    | `boolean`                  | No       | `true`                |     |                   |
| is_deleted   | `boolean`                  | Sí       | ``                    |     |                   |
| observations | `text`                     | Sí       | ``                    |     |                   |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`         |     |                   |
| workflow_id  | `uuid`                     | No       | ``                    |     | core.workflows.id |
| entity_type  | `text`                     | No       | ``                    |     |                   |
| entity_id    | `uuid`                     | No       | ``                    |     |                   |
| status       | `text`                     | No       | `'in_progress'::text` |     |                   |

## core.workflow_steps

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ----------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                   |
| local_id                | `bigint`                   | No       | ``                  |     |                   |
| tenant_id               | `uuid`                     | No       | ``                  |     | core.tenants.id   |
| company_id              | `uuid`                     | Sí       | ``                  |     | core.companies.id |
| branch_id               | `uuid`                     | Sí       | ``                  |     | core.branches.id  |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                   |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                   |
| created_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| updated_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| version                 | `integer`                  | No       | `1`                 |     |                   |
| row_version             | `bigint`                   | No       | `0`                 |     |                   |
| is_active               | `boolean`                  | No       | `true`              |     |                   |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                   |
| observations            | `text`                     | Sí       | ``                  |     |                   |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                   |
| workflow_id             | `uuid`                     | No       | ``                  |     | core.workflows.id |
| step_order              | `integer`                  | No       | ``                  |     |                   |
| approver_role_id        | `uuid`                     | Sí       | ``                  |     | core.roles.id     |
| approver_user_id        | `uuid`                     | Sí       | ``                  |     | core.users.id     |
| transition_rule_set_key | `text`                     | Sí       | ``                  |     |                   |

## core.workflows

| Columna             | Tipo                       | Nullable | Default              | PK  | FK                |
| ------------------- | -------------------------- | -------- | -------------------- | --- | ----------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()`  | PK  |                   |
| local_id            | `bigint`                   | No       | ``                   |     |                   |
| tenant_id           | `uuid`                     | No       | ``                   |     | core.tenants.id   |
| company_id          | `uuid`                     | Sí       | ``                   |     | core.companies.id |
| branch_id           | `uuid`                     | Sí       | ``                   |     | core.branches.id  |
| created_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| updated_at          | `timestamp with time zone` | No       | `now()`              |     |                   |
| deleted_at          | `timestamp with time zone` | Sí       | ``                   |     |                   |
| created_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| updated_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| deleted_by          | `uuid`                     | Sí       | ``                   |     | core.users.id     |
| version             | `integer`                  | No       | `1`                  |     |                   |
| row_version         | `bigint`                   | No       | `0`                  |     |                   |
| is_active           | `boolean`                  | No       | `true`               |     |                   |
| is_deleted          | `boolean`                  | Sí       | ``                   |     |                   |
| observations        | `text`                     | Sí       | ``                   |     |                   |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`        |     |                   |
| name                | `text`                     | No       | ``                   |     |                   |
| trigger_entity_type | `text`                     | No       | ``                   |     |                   |
| execution_mode      | `text`                     | No       | `'sequential'::text` |     |                   |
