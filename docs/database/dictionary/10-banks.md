# Diccionario de datos — schema `banks`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## banks.bank_accounts

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
| bank_id                  | `uuid`                     | No       | ``                  |     |     |
| account_number_encrypted | `text`                     | No       | ``                  |     |     |
| currency_code            | `character`                | No       | ``                  |     |     |
| account_type             | `text`                     | No       | ``                  |     |     |

## banks.bank_cards

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     |                        |
| company_id       | `uuid`                     | No       | ``                  |     |                        |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                        |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                        |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| bank_account_id  | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| card_type        | `text`                     | No       | ``                  |     |                        |
| last_four_digits | `character`                | Sí       | ``                  |     |                        |

## banks.bank_deposits

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     |                        |
| company_id       | `uuid`                     | No       | ``                  |     |                        |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                        |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                        |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| bank_account_id  | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| cash_register_id | `uuid`                     | Sí       | ``                  |     |                        |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                        |

## banks.bank_payment_batch_lines

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                            |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id         | `bigint`                   | No       | ``                  |     |                               |
| tenant_id        | `uuid`                     | No       | ``                  |     |                               |
| company_id       | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                               |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by       | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                               |
| version          | `integer`                  | No       | `1`                 |     |                               |
| row_version      | `bigint`                   | No       | `0`                 |     |                               |
| is_active        | `boolean`                  | No       | `true`              |     |                               |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                               |
| observations     | `text`                     | Sí       | ``                  |     |                               |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| batch_id         | `uuid`                     | No       | ``                  |     | banks.bank_payment_batches.id |
| beneficiary_name | `text`                     | No       | ``                  |     |                               |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                               |
| source_module    | `text`                     | Sí       | ``                  |     |                               |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                               |

## banks.bank_payment_batches

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
| bank_account_id | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| batch_purpose   | `text`                     | No       | ``                  |     |                        |
| file_id         | `uuid`                     | Sí       | ``                  |     |                        |
| status          | `text`                     | No       | `'draft'::text`     |     |                        |

## banks.bank_pos_terminals

| Columna         | Tipo                       | Nullable | Default             | PK  | FK                     |
| --------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id        | `bigint`                   | No       | ``                  |     |                        |
| tenant_id       | `uuid`                     | No       | ``                  |     |                        |
| company_id      | `uuid`                     | No       | ``                  |     |                        |
| branch_id       | `uuid`                     | No       | ``                  |     |                        |
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
| bank_account_id | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| terminal_code   | `text`                     | No       | ``                  |     |                        |

## banks.bank_reconciliation_lines

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                            |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ----------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                               |
| local_id            | `bigint`                   | No       | ``                  |     |                               |
| tenant_id           | `uuid`                     | No       | ``                  |     |                               |
| company_id          | `uuid`                     | Sí       | ``                  |     |                               |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                               |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                               |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                               |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                               |
| created_by          | `uuid`                     | Sí       | ``                  |     |                               |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                               |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                               |
| version             | `integer`                  | No       | `1`                 |     |                               |
| row_version         | `bigint`                   | No       | `0`                 |     |                               |
| is_active           | `boolean`                  | No       | `true`              |     |                               |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                               |
| observations        | `text`                     | Sí       | ``                  |     |                               |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                               |
| reconciliation_id   | `uuid`                     | No       | ``                  |     | banks.bank_reconciliations.id |
| statement_line_id   | `uuid`                     | Sí       | ``                  |     | banks.bank_statement_lines.id |
| matched_transfer_id | `uuid`                     | Sí       | ``                  |     | banks.bank_transfers.id       |

## banks.bank_reconciliations

| Columna         | Tipo                       | Nullable | Default               | PK  | FK                       |
| --------------- | -------------------------- | -------- | --------------------- | --- | ------------------------ |
| id              | `uuid`                     | No       | `gen_random_uuid()`   | PK  |                          |
| local_id        | `bigint`                   | No       | ``                    |     |                          |
| tenant_id       | `uuid`                     | No       | ``                    |     |                          |
| company_id      | `uuid`                     | No       | ``                    |     |                          |
| branch_id       | `uuid`                     | Sí       | ``                    |     |                          |
| created_at      | `timestamp with time zone` | No       | `now()`               |     |                          |
| updated_at      | `timestamp with time zone` | No       | `now()`               |     |                          |
| deleted_at      | `timestamp with time zone` | Sí       | ``                    |     |                          |
| created_by      | `uuid`                     | Sí       | ``                    |     |                          |
| updated_by      | `uuid`                     | Sí       | ``                    |     |                          |
| deleted_by      | `uuid`                     | Sí       | ``                    |     |                          |
| version         | `integer`                  | No       | `1`                   |     |                          |
| row_version     | `bigint`                   | No       | `0`                   |     |                          |
| is_active       | `boolean`                  | No       | `true`                |     |                          |
| is_deleted      | `boolean`                  | Sí       | ``                    |     |                          |
| observations    | `text`                     | Sí       | ``                    |     |                          |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`         |     |                          |
| bank_account_id | `uuid`                     | No       | ``                    |     | banks.bank_accounts.id   |
| statement_id    | `uuid`                     | No       | ``                    |     | banks.bank_statements.id |
| status          | `text`                     | No       | `'in_progress'::text` |     |                          |

## banks.bank_statement_lines

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                       |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------------------ |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                          |
| local_id         | `bigint`                   | No       | ``                  |     |                          |
| tenant_id        | `uuid`                     | No       | ``                  |     |                          |
| company_id       | `uuid`                     | Sí       | ``                  |     |                          |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                          |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                          |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                          |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                          |
| created_by       | `uuid`                     | Sí       | ``                  |     |                          |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                          |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                          |
| version          | `integer`                  | No       | `1`                 |     |                          |
| row_version      | `bigint`                   | No       | `0`                 |     |                          |
| is_active        | `boolean`                  | No       | `true`              |     |                          |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                          |
| observations     | `text`                     | Sí       | ``                  |     |                          |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                          |
| statement_id     | `uuid`                     | No       | ``                  |     | banks.bank_statements.id |
| description      | `text`                     | No       | ``                  |     |                          |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                          |
| transaction_date | `date`                     | No       | ``                  |     |                          |

## banks.bank_statements

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
| bank_account_id | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| period_start    | `date`                     | No       | ``                  |     |                        |
| period_end      | `date`                     | No       | ``                  |     |                        |
| source_file_id  | `uuid`                     | Sí       | ``                  |     |                        |

## banks.bank_transfers

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                     |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id         | `bigint`                   | No       | ``                  |     |                        |
| tenant_id        | `uuid`                     | No       | ``                  |     |                        |
| company_id       | `uuid`                     | No       | ``                  |     |                        |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                        |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                        |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                        |
| created_by       | `uuid`                     | Sí       | ``                  |     |                        |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                        |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                        |
| version          | `integer`                  | No       | `1`                 |     |                        |
| row_version      | `bigint`                   | No       | `0`                 |     |                        |
| is_active        | `boolean`                  | No       | `true`              |     |                        |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                        |
| observations     | `text`                     | Sí       | ``                  |     |                        |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                        |
| bank_account_id  | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| direction        | `text`                     | No       | ``                  |     |                        |
| amount           | `numeric(18,4)`            | No       | ``                  |     |                        |
| source_module    | `text`                     | Sí       | ``                  |     |                        |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                        |

## banks.checkbooks

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
| bank_account_id | `uuid`                     | No       | ``                  |     | banks.bank_accounts.id |
| starting_number | `integer`                  | No       | ``                  |     |                        |
| ending_number   | `integer`                  | No       | ``                  |     |                        |
| next_number     | `integer`                  | No       | ``                  |     |                        |

## banks.checks_issued

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                  |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id     | `bigint`                   | No       | ``                  |     |                     |
| tenant_id    | `uuid`                     | No       | ``                  |     |                     |
| company_id   | `uuid`                     | No       | ``                  |     |                     |
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
| checkbook_id | `uuid`                     | No       | ``                  |     | banks.checkbooks.id |
| check_number | `integer`                  | No       | ``                  |     |                     |
| supplier_id  | `uuid`                     | Sí       | ``                  |     |                     |
| amount       | `numeric(18,4)`            | No       | ``                  |     |                     |
| status       | `text`                     | No       | `'issued'::text`    |     |                     |

## banks.checks_received

| Columna         | Tipo                       | Nullable | Default                | PK  | FK                     |
| --------------- | -------------------------- | -------- | ---------------------- | --- | ---------------------- |
| id              | `uuid`                     | No       | `gen_random_uuid()`    | PK  |                        |
| local_id        | `bigint`                   | No       | ``                     |     |                        |
| tenant_id       | `uuid`                     | No       | ``                     |     |                        |
| company_id      | `uuid`                     | No       | ``                     |     |                        |
| branch_id       | `uuid`                     | Sí       | ``                     |     |                        |
| created_at      | `timestamp with time zone` | No       | `now()`                |     |                        |
| updated_at      | `timestamp with time zone` | No       | `now()`                |     |                        |
| deleted_at      | `timestamp with time zone` | Sí       | ``                     |     |                        |
| created_by      | `uuid`                     | Sí       | ``                     |     |                        |
| updated_by      | `uuid`                     | Sí       | ``                     |     |                        |
| deleted_by      | `uuid`                     | Sí       | ``                     |     |                        |
| version         | `integer`                  | No       | `1`                    |     |                        |
| row_version     | `bigint`                   | No       | `0`                    |     |                        |
| is_active       | `boolean`                  | No       | `true`                 |     |                        |
| is_deleted      | `boolean`                  | Sí       | ``                     |     |                        |
| observations    | `text`                     | Sí       | ``                     |     |                        |
| metadata        | `jsonb`                    | No       | `'{}'::jsonb`          |     |                        |
| bank_account_id | `uuid`                     | Sí       | ``                     |     | banks.bank_accounts.id |
| customer_id     | `uuid`                     | Sí       | ``                     |     |                        |
| amount          | `numeric(18,4)`            | No       | ``                     |     |                        |
| status          | `text`                     | No       | `'in_portfolio'::text` |     |                        |
