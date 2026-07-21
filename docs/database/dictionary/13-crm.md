# Diccionario de datos — schema `crm`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## crm.calendar_event_attendees

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                     |
| -------------- | -------------------------- | -------- | ------------------- | --- | ---------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                        |
| local_id       | `bigint`                   | No       | ``                  |     |                        |
| tenant_id      | `uuid`                     | No       | ``                  |     |                        |
| company_id     | `uuid`                     | Sí       | ``                  |     |                        |
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
| event_id       | `uuid`                     | No       | ``                  |     | crm.calendar_events.id |
| user_id        | `uuid`                     | Sí       | ``                  |     |                        |
| external_email | `text`                     | Sí       | ``                  |     |                        |

## crm.calendar_events

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
| owner_user_id  | `uuid`                     | No       | ``                  |     |                      |
| title          | `text`                     | No       | ``                  |     |                      |
| starts_at      | `timestamp with time zone` | No       | ``                  |     |                      |
| ends_at        | `timestamp with time zone` | No       | ``                  |     |                      |
| lead_id        | `uuid`                     | Sí       | ``                  |     | crm.leads.id         |
| opportunity_id | `uuid`                     | Sí       | ``                  |     | crm.opportunities.id |

## crm.call_logs

| Columna          | Tipo                       | Nullable | Default             | PK  | FK           |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------ |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |              |
| local_id         | `bigint`                   | No       | ``                  |     |              |
| tenant_id        | `uuid`                     | No       | ``                  |     |              |
| company_id       | `uuid`                     | Sí       | ``                  |     |              |
| branch_id        | `uuid`                     | Sí       | ``                  |     |              |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |              |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |              |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |              |
| created_by       | `uuid`                     | Sí       | ``                  |     |              |
| updated_by       | `uuid`                     | Sí       | ``                  |     |              |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |              |
| version          | `integer`                  | No       | `1`                 |     |              |
| row_version      | `bigint`                   | No       | `0`                 |     |              |
| is_active        | `boolean`                  | No       | `true`              |     |              |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |              |
| observations     | `text`                     | Sí       | ``                  |     |              |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |              |
| lead_id          | `uuid`                     | Sí       | ``                  |     | crm.leads.id |
| customer_id      | `uuid`                     | Sí       | ``                  |     |              |
| duration_seconds | `integer`                  | Sí       | ``                  |     |              |
| outcome          | `text`                     | Sí       | ``                  |     |              |

## crm.campaign_members

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
| campaign_id  | `uuid`                     | No       | ``                  |     | crm.campaigns.id |
| lead_id      | `uuid`                     | No       | ``                  |     | crm.leads.id     |

## crm.campaigns

| Columna       | Tipo                       | Nullable | Default             | PK  | FK  |
| ------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id      | `bigint`                   | No       | ``                  |     |     |
| tenant_id     | `uuid`                     | No       | ``                  |     |     |
| company_id    | `uuid`                     | No       | ``                  |     |     |
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
| budget_amount | `numeric(18,4)`            | Sí       | ``                  |     |     |
| starts_on     | `date`                     | Sí       | ``                  |     |     |
| ends_on       | `date`                     | Sí       | ``                  |     |     |

## crm.email_logs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK           |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |              |
| local_id     | `bigint`                   | No       | ``                  |     |              |
| tenant_id    | `uuid`                     | No       | ``                  |     |              |
| company_id   | `uuid`                     | Sí       | ``                  |     |              |
| branch_id    | `uuid`                     | Sí       | ``                  |     |              |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |              |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |              |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |              |
| created_by   | `uuid`                     | Sí       | ``                  |     |              |
| updated_by   | `uuid`                     | Sí       | ``                  |     |              |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |              |
| version      | `integer`                  | No       | `1`                 |     |              |
| row_version  | `bigint`                   | No       | `0`                 |     |              |
| is_active    | `boolean`                  | No       | `true`              |     |              |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |              |
| observations | `text`                     | Sí       | ``                  |     |              |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |              |
| lead_id      | `uuid`                     | Sí       | ``                  |     | crm.leads.id |
| customer_id  | `uuid`                     | Sí       | ``                  |     |              |
| subject      | `text`                     | Sí       | ``                  |     |              |
| direction    | `text`                     | No       | ``                  |     |              |

## crm.follow_up_activities

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                   |
| ------------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id            | `bigint`                   | No       | ``                  |     |                      |
| tenant_id           | `uuid`                     | No       | ``                  |     |                      |
| company_id          | `uuid`                     | No       | ``                  |     |                      |
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
| lead_id             | `uuid`                     | Sí       | ``                  |     | crm.leads.id         |
| opportunity_id      | `uuid`                     | Sí       | ``                  |     | crm.opportunities.id |
| assigned_to_user_id | `uuid`                     | No       | ``                  |     |                      |
| due_at              | `timestamp with time zone` | No       | ``                  |     |                      |
| completed_at        | `timestamp with time zone` | Sí       | ``                  |     |                      |

## crm.lead_sources

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

## crm.lead_status

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

## crm.lead_status_history

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                 |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                    |
| local_id     | `bigint`                   | No       | ``                  |     |                    |
| tenant_id    | `uuid`                     | No       | ``                  |     |                    |
| company_id   | `uuid`                     | Sí       | ``                  |     |                    |
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
| lead_id      | `uuid`                     | No       | ``                  |     | crm.leads.id       |
| status_id    | `uuid`                     | No       | ``                  |     | crm.lead_status.id |

## crm.leads

| Columna                 | Tipo                       | Nullable | Default             | PK  | FK                  |
| ----------------------- | -------------------------- | -------- | ------------------- | --- | ------------------- |
| id                      | `uuid`                     | No       | `gen_random_uuid()` | PK  |                     |
| local_id                | `bigint`                   | No       | ``                  |     |                     |
| tenant_id               | `uuid`                     | No       | ``                  |     |                     |
| company_id              | `uuid`                     | No       | ``                  |     |                     |
| branch_id               | `uuid`                     | Sí       | ``                  |     |                     |
| created_at              | `timestamp with time zone` | No       | `now()`             |     |                     |
| updated_at              | `timestamp with time zone` | No       | `now()`             |     |                     |
| deleted_at              | `timestamp with time zone` | Sí       | ``                  |     |                     |
| created_by              | `uuid`                     | Sí       | ``                  |     |                     |
| updated_by              | `uuid`                     | Sí       | ``                  |     |                     |
| deleted_by              | `uuid`                     | Sí       | ``                  |     |                     |
| version                 | `integer`                  | No       | `1`                 |     |                     |
| row_version             | `bigint`                   | No       | `0`                 |     |                     |
| is_active               | `boolean`                  | No       | `true`              |     |                     |
| is_deleted              | `boolean`                  | Sí       | ``                  |     |                     |
| observations            | `text`                     | Sí       | ``                  |     |                     |
| metadata                | `jsonb`                    | No       | `'{}'::jsonb`       |     |                     |
| full_name               | `text`                     | No       | ``                  |     |                     |
| email                   | `text`                     | Sí       | ``                  |     |                     |
| phone                   | `text`                     | Sí       | ``                  |     |                     |
| source_id               | `uuid`                     | Sí       | ``                  |     | crm.lead_sources.id |
| status_id               | `uuid`                     | No       | ``                  |     | crm.lead_status.id  |
| assigned_salesperson_id | `uuid`                     | Sí       | ``                  |     |                     |
| converted_customer_id   | `uuid`                     | Sí       | ``                  |     |                     |

## crm.opportunities

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                              |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                 |
| local_id                 | `bigint`                   | No       | ``                  |     |                                 |
| tenant_id                | `uuid`                     | No       | ``                  |     |                                 |
| company_id               | `uuid`                     | No       | ``                  |     |                                 |
| branch_id                | `uuid`                     | Sí       | ``                  |     |                                 |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                                 |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                                 |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                                 |
| created_by               | `uuid`                     | Sí       | ``                  |     |                                 |
| updated_by               | `uuid`                     | Sí       | ``                  |     |                                 |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |                                 |
| version                  | `integer`                  | No       | `1`                 |     |                                 |
| row_version              | `bigint`                   | No       | `0`                 |     |                                 |
| is_active                | `boolean`                  | No       | `true`              |     |                                 |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                                 |
| observations             | `text`                     | Sí       | ``                  |     |                                 |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                 |
| lead_id                  | `uuid`                     | Sí       | ``                  |     | crm.leads.id                    |
| customer_id              | `uuid`                     | Sí       | ``                  |     |                                 |
| funnel_stage_id          | `uuid`                     | No       | ``                  |     | crm.sales_funnel_stages.id      |
| estimated_amount         | `numeric(18,4)`            | No       | `0`                 |     |                                 |
| status                   | `text`                     | No       | `'open'::text`      |     |                                 |
| loss_reason_id           | `uuid`                     | Sí       | ``                  |     | crm.opportunity_loss_reasons.id |
| resulting_sales_order_id | `uuid`                     | Sí       | ``                  |     |                                 |

## crm.opportunity_lines

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
| opportunity_id     | `uuid`                     | No       | ``                  |     | crm.opportunities.id |
| product_id         | `uuid`                     | No       | ``                  |     |                      |
| estimated_quantity | `numeric(18,6)`            | No       | ``                  |     |                      |

## crm.opportunity_loss_reasons

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

## crm.sales_funnel_stages

| Columna                    | Tipo                       | Nullable | Default             | PK  | FK                   |
| -------------------------- | -------------------------- | -------- | ------------------- | --- | -------------------- |
| id                         | `uuid`                     | No       | `gen_random_uuid()` | PK  |                      |
| local_id                   | `bigint`                   | No       | ``                  |     |                      |
| tenant_id                  | `uuid`                     | No       | ``                  |     |                      |
| company_id                 | `uuid`                     | Sí       | ``                  |     |                      |
| branch_id                  | `uuid`                     | Sí       | ``                  |     |                      |
| created_at                 | `timestamp with time zone` | No       | `now()`             |     |                      |
| updated_at                 | `timestamp with time zone` | No       | `now()`             |     |                      |
| deleted_at                 | `timestamp with time zone` | Sí       | ``                  |     |                      |
| created_by                 | `uuid`                     | Sí       | ``                  |     |                      |
| updated_by                 | `uuid`                     | Sí       | ``                  |     |                      |
| deleted_by                 | `uuid`                     | Sí       | ``                  |     |                      |
| version                    | `integer`                  | No       | `1`                 |     |                      |
| row_version                | `bigint`                   | No       | `0`                 |     |                      |
| is_active                  | `boolean`                  | No       | `true`              |     |                      |
| is_deleted                 | `boolean`                  | Sí       | ``                  |     |                      |
| observations               | `text`                     | Sí       | ``                  |     |                      |
| metadata                   | `jsonb`                    | No       | `'{}'::jsonb`       |     |                      |
| funnel_id                  | `uuid`                     | No       | ``                  |     | crm.sales_funnels.id |
| name                       | `text`                     | No       | ``                  |     |                      |
| stage_order                | `smallint`                 | No       | ``                  |     |                      |
| win_probability_percentage | `numeric(5,2)`             | No       | `0`                 |     |                      |

## crm.sales_funnels

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

## crm.whatsapp_logs

| Columna      | Tipo                       | Nullable | Default             | PK  | FK           |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------ |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |              |
| local_id     | `bigint`                   | No       | ``                  |     |              |
| tenant_id    | `uuid`                     | No       | ``                  |     |              |
| company_id   | `uuid`                     | Sí       | ``                  |     |              |
| branch_id    | `uuid`                     | Sí       | ``                  |     |              |
| created_at   | `timestamp with time zone` | No       | `now()`             | PK  |              |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |              |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |              |
| created_by   | `uuid`                     | Sí       | ``                  |     |              |
| updated_by   | `uuid`                     | Sí       | ``                  |     |              |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |              |
| version      | `integer`                  | No       | `1`                 |     |              |
| row_version  | `bigint`                   | No       | `0`                 |     |              |
| is_active    | `boolean`                  | No       | `true`              |     |              |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |              |
| observations | `text`                     | Sí       | ``                  |     |              |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |              |
| lead_id      | `uuid`                     | Sí       | ``                  |     | crm.leads.id |
| customer_id  | `uuid`                     | Sí       | ``                  |     |              |
| message_body | `text`                     | Sí       | ``                  |     |              |
| direction    | `text`                     | No       | ``                  |     |              |
