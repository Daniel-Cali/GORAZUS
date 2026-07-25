# Diccionario de datos — schema `inventory`

> Generado automáticamente desde `information_schema` contra la base `gorazus` real. Ver [../DATABASE_DICTIONARY.md](../DATABASE_DICTIONARY.md) para metodología. No editar a mano.

## inventory.average_cost_history

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
| product_id       | `uuid`                     | No       | ``                  |     |                         |
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| new_average_cost | `numeric(18,4)`            | No       | ``                  |     |                         |

## inventory.cycle_count_schedules

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
| zone_id        | `uuid`                     | No       | ``                  |     | inventory.warehouse_zones.id |
| frequency_days | `integer`                  | No       | ``                  |     |                              |
| next_run_date  | `date`                     | Sí       | ``                  |     |                              |

## inventory.fifo_cost_layers

| Columna                | Tipo                       | Nullable | Default             | PK  | FK                               |
| ---------------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                     | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id               | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id              | `uuid`                     | No       | ``                  |     |                                  |
| company_id             | `uuid`                     | Sí       | ``                  |     |                                  |
| branch_id              | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at             | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at             | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at             | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by             | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by             | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by             | `uuid`                     | Sí       | ``                  |     |                                  |
| version                | `integer`                  | No       | `1`                 |     |                                  |
| row_version            | `bigint`                   | No       | `0`                 |     |                                  |
| is_active              | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted             | `boolean`                  | Sí       | ``                  |     |                                  |
| observations           | `text`                     | Sí       | ``                  |     |                                  |
| metadata               | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| product_id             | `uuid`                     | No       | ``                  |     |                                  |
| warehouse_id           | `uuid`                     | No       | ``                  |     | inventory.warehouses.id          |
| source_receipt_line_id | `uuid`                     | Sí       | ``                  |     | inventory.goods_receipt_lines.id |
| original_quantity      | `numeric(18,6)`            | No       | ``                  |     |                                  |
| remaining_quantity     | `numeric(18,6)`            | No       | ``                  |     |                                  |
| unit_cost              | `numeric(18,4)`            | No       | ``                  |     |                                  |

## inventory.goods_issue_lines

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
| issue_id     | `uuid`                     | No       | ``                  |     | inventory.goods_issues.id |
| product_id   | `uuid`                     | No       | ``                  |     |                           |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                           |

## inventory.goods_issue_reasons

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

## inventory.goods_issues

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                               |
| ---------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id         | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                  |
| company_id       | `uuid`                     | No       | ``                  |     |                                  |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                  |
| created_at       | `timestamp with time zone` | No       | `now()`             |     |                                  |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                  |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                  |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                  |
| version          | `integer`                  | No       | `1`                 |     |                                  |
| row_version      | `bigint`                   | No       | `0`                 |     |                                  |
| is_active        | `boolean`                  | No       | `true`              |     |                                  |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                  |
| observations     | `text`                     | Sí       | ``                  |     |                                  |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                  |
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id          |
| reason_id        | `uuid`                     | Sí       | ``                  |     | inventory.goods_issue_reasons.id |
| source_module    | `text`                     | Sí       | ``                  |     |                                  |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                                  |

## inventory.goods_receipt_lines

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                          |
| ------------ | -------------------------- | -------- | ------------------- | --- | --------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                             |
| local_id     | `bigint`                   | No       | ``                  |     |                             |
| tenant_id    | `uuid`                     | No       | ``                  |     |                             |
| company_id   | `uuid`                     | Sí       | ``                  |     |                             |
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
| receipt_id   | `uuid`                     | No       | ``                  |     | inventory.goods_receipts.id |
| product_id   | `uuid`                     | No       | ``                  |     |                             |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                             |
| unit_cost    | `numeric(18,4)`            | Sí       | ``                  |     |                             |

## inventory.goods_receipts

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                      |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id         | `bigint`                   | No       | ``                  |     |                         |
| tenant_id        | `uuid`                     | No       | ``                  |     |                         |
| company_id       | `uuid`                     | No       | ``                  |     |                         |
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
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| source_module    | `text`                     | Sí       | ``                  |     |                         |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                         |

## inventory.inventory_lots

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id           | `bigint`                   | No       | ``                  |     |                         |
| tenant_id          | `uuid`                     | No       | ``                  |     |                         |
| company_id         | `uuid`                     | Sí       | ``                  |     |                         |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                         |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by         | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                         |
| version            | `integer`                  | No       | `1`                 |     |                         |
| row_version        | `bigint`                   | No       | `0`                 |     |                         |
| is_active          | `boolean`                  | No       | `true`              |     |                         |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                         |
| observations       | `text`                     | Sí       | ``                  |     |                         |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| product_id         | `uuid`                     | No       | ``                  |     |                         |
| warehouse_id       | `uuid`                     | Sí       | ``                  |     | inventory.warehouses.id |
| lot_number         | `text`                     | No       | ``                  |     |                         |
| expiry_date        | `date`                     | Sí       | ``                  |     |                         |
| remaining_quantity | `numeric(18,6)`            | No       | `0`                 |     |                         |

## inventory.inventory_serials

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id      | `bigint`                   | No       | ``                  |     |                         |
| tenant_id     | `uuid`                     | No       | ``                  |     |                         |
| company_id    | `uuid`                     | Sí       | ``                  |     |                         |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                         |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by    | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                         |
| version       | `integer`                  | No       | `1`                 |     |                         |
| row_version   | `bigint`                   | No       | `0`                 |     |                         |
| is_active     | `boolean`                  | No       | `true`              |     |                         |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                         |
| observations  | `text`                     | Sí       | ``                  |     |                         |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| product_id    | `uuid`                     | No       | ``                  |     |                         |
| warehouse_id  | `uuid`                     | Sí       | ``                  |     | inventory.warehouses.id |
| serial_number | `text`                     | No       | ``                  |     |                         |
| status        | `text`                     | No       | `'in_stock'::text`  |     |                         |
| unit_cost     | `numeric(18,4)`            | Sí       | ``                  |     |                         |

Columna nueva de `35_functional_completion.sql` (2026-07-25): `unit_cost` — costo real de esta unidad serializada puntual, solo se usa cuando `products.costing_method='specific_identification'`. `FUNCTIONAL_GAPS.md` #3.

## inventory.lifo_cost_layers

| Columna            | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id                 | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id           | `bigint`                   | No       | ``                  |     |                         |
| tenant_id          | `uuid`                     | No       | ``                  |     |                         |
| company_id         | `uuid`                     | Sí       | ``                  |     |                         |
| branch_id          | `uuid`                     | Sí       | ``                  |     |                         |
| created_at         | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at         | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at         | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by         | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by         | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by         | `uuid`                     | Sí       | ``                  |     |                         |
| version            | `integer`                  | No       | `1`                 |     |                         |
| row_version        | `bigint`                   | No       | `0`                 |     |                         |
| is_active          | `boolean`                  | No       | `true`              |     |                         |
| is_deleted         | `boolean`                  | Sí       | ``                  |     |                         |
| observations       | `text`                     | Sí       | ``                  |     |                         |
| metadata           | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| product_id         | `uuid`                     | No       | ``                  |     |                         |
| warehouse_id       | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| original_quantity  | `numeric(18,6)`            | No       | ``                  |     |                         |
| remaining_quantity | `numeric(18,6)`            | No       | ``                  |     |                         |
| unit_cost          | `numeric(18,4)`            | No       | ``                  |     |                         |

## inventory.physical_count_lines

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
| physical_count_id | `uuid`                     | No       | ``                  |     | inventory.physical_counts.id |
| product_id        | `uuid`                     | No       | ``                  |     |                              |
| system_quantity   | `numeric(18,6)`            | No       | ``                  |     |                              |
| counted_quantity  | `numeric(18,6)`            | Sí       | ``                  |     |                              |

## inventory.physical_counts

| Columna        | Tipo                       | Nullable | Default             | PK  | FK                      |
| -------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id       | `bigint`                   | No       | ``                  |     |                         |
| tenant_id      | `uuid`                     | No       | ``                  |     |                         |
| company_id     | `uuid`                     | No       | ``                  |     |                         |
| branch_id      | `uuid`                     | Sí       | ``                  |     |                         |
| created_at     | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at     | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at     | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by     | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by     | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by     | `uuid`                     | Sí       | ``                  |     |                         |
| version        | `integer`                  | No       | `1`                 |     |                         |
| row_version    | `bigint`                   | No       | `0`                 |     |                         |
| is_active      | `boolean`                  | No       | `true`              |     |                         |
| is_deleted     | `boolean`                  | Sí       | ``                  |     |                         |
| observations   | `text`                     | Sí       | ``                  |     |                         |
| metadata       | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| warehouse_id   | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| scheduled_date | `date`                     | No       | ``                  |     |                         |
| status         | `text`                     | No       | `'planned'::text`   |     |                         |

## inventory.picking_rules

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
| warehouse_id | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| strategy     | `text`                     | No       | ``                  |     |                         |

## inventory.production_consumptions

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                             |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id             | `bigint`                   | No       | ``                  |     |                                |
| tenant_id            | `uuid`                     | No       | ``                  |     |                                |
| company_id           | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                                |
| created_at           | `timestamp with time zone` | No       | `now()`             | PK  |                                |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by           | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                                |
| version              | `integer`                  | No       | `1`                 |     |                                |
| row_version          | `bigint`                   | No       | `0`                 |     |                                |
| is_active            | `boolean`                  | No       | `true`              |     |                                |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                                |
| observations         | `text`                     | Sí       | ``                  |     |                                |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| production_order_id  | `uuid`                     | No       | ``                  |     | inventory.production_orders.id |
| component_product_id | `uuid`                     | No       | ``                  |     |                                |
| actual_quantity      | `numeric(18,6)`            | No       | ``                  |     |                                |

## inventory.production_order_components

| Columna              | Tipo                       | Nullable | Default             | PK  | FK                             |
| -------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                   | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id             | `bigint`                   | No       | ``                  |     |                                |
| tenant_id            | `uuid`                     | No       | ``                  |     |                                |
| company_id           | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id            | `uuid`                     | Sí       | ``                  |     |                                |
| created_at           | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at           | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at           | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by           | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by           | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by           | `uuid`                     | Sí       | ``                  |     |                                |
| version              | `integer`                  | No       | `1`                 |     |                                |
| row_version          | `bigint`                   | No       | `0`                 |     |                                |
| is_active            | `boolean`                  | No       | `true`              |     |                                |
| is_deleted           | `boolean`                  | Sí       | ``                  |     |                                |
| observations         | `text`                     | Sí       | ``                  |     |                                |
| metadata             | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| production_order_id  | `uuid`                     | No       | ``                  |     | inventory.production_orders.id |
| component_product_id | `uuid`                     | No       | ``                  |     |                                |
| planned_quantity     | `numeric(18,6)`            | No       | ``                  |     |                                |

## inventory.production_order_outputs

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                             |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------ |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                |
| local_id            | `bigint`                   | No       | ``                  |     |                                |
| tenant_id           | `uuid`                     | No       | ``                  |     |                                |
| company_id          | `uuid`                     | Sí       | ``                  |     |                                |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                                |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                                |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                                |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                                |
| created_by          | `uuid`                     | Sí       | ``                  |     |                                |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                                |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                                |
| version             | `integer`                  | No       | `1`                 |     |                                |
| row_version         | `bigint`                   | No       | `0`                 |     |                                |
| is_active           | `boolean`                  | No       | `true`              |     |                                |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                                |
| observations        | `text`                     | Sí       | ``                  |     |                                |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                |
| production_order_id | `uuid`                     | No       | ``                  |     | inventory.production_orders.id |
| product_id          | `uuid`                     | No       | ``                  |     |                                |
| quantity            | `numeric(18,6)`            | No       | ``                  |     |                                |

## inventory.production_order_status

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

## inventory.production_order_status_history

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
| production_order_id | `uuid`                     | No       | ``                  |     | inventory.production_orders.id       |
| status_id           | `uuid`                     | No       | ``                  |     | inventory.production_order_status.id |

## inventory.production_orders

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                   |
| ---------------- | -------------------------- | -------- | ------------------- | --- | ------------------------------------ |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                      |
| local_id         | `bigint`                   | No       | ``                  |     |                                      |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                      |
| company_id       | `uuid`                     | No       | ``                  |     |                                      |
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
| bom_id           | `uuid`                     | No       | ``                  |     |                                      |
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id              |
| status_id        | `uuid`                     | No       | ``                  |     | inventory.production_order_status.id |
| planned_quantity | `numeric(18,6)`            | No       | ``                  |     |                                      |
| planned_date     | `date`                     | Sí       | ``                  |     |                                      |

## inventory.putaway_rules

| Columna             | Tipo                       | Nullable | Default             | PK  | FK                           |
| ------------------- | -------------------------- | -------- | ------------------- | --- | ---------------------------- |
| id                  | `uuid`                     | No       | `gen_random_uuid()` | PK  |                              |
| local_id            | `bigint`                   | No       | ``                  |     |                              |
| tenant_id           | `uuid`                     | No       | ``                  |     |                              |
| company_id          | `uuid`                     | Sí       | ``                  |     |                              |
| branch_id           | `uuid`                     | Sí       | ``                  |     |                              |
| created_at          | `timestamp with time zone` | No       | `now()`             |     |                              |
| updated_at          | `timestamp with time zone` | No       | `now()`             |     |                              |
| deleted_at          | `timestamp with time zone` | Sí       | ``                  |     |                              |
| created_by          | `uuid`                     | Sí       | ``                  |     |                              |
| updated_by          | `uuid`                     | Sí       | ``                  |     |                              |
| deleted_by          | `uuid`                     | Sí       | ``                  |     |                              |
| version             | `integer`                  | No       | `1`                 |     |                              |
| row_version         | `bigint`                   | No       | `0`                 |     |                              |
| is_active           | `boolean`                  | No       | `true`              |     |                              |
| is_deleted          | `boolean`                  | Sí       | ``                  |     |                              |
| observations        | `text`                     | Sí       | ``                  |     |                              |
| metadata            | `jsonb`                    | No       | `'{}'::jsonb`       |     |                              |
| warehouse_id        | `uuid`                     | No       | ``                  |     | inventory.warehouses.id      |
| product_category_id | `uuid`                     | Sí       | ``                  |     |                              |
| target_zone_id      | `uuid`                     | No       | ``                  |     | inventory.warehouse_zones.id |
| priority            | `smallint`                 | No       | `0`                 |     |                              |

## inventory.replenishment_rules

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
| warehouse_id | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| product_id   | `uuid`                     | No       | ``                  |     |                         |
| min_quantity | `numeric(18,6)`            | No       | ``                  |     |                         |
| max_quantity | `numeric(18,6)`            | No       | ``                  |     |                         |

## inventory.stock

| Columna           | Tipo                       | Nullable | Default             | PK  | FK                               |
| ----------------- | -------------------------- | -------- | ------------------- | --- | -------------------------------- |
| id                | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                  |
| local_id          | `bigint`                   | No       | ``                  |     |                                  |
| tenant_id         | `uuid`                     | No       | ``                  |     |                                  |
| company_id        | `uuid`                     | No       | ``                  |     |                                  |
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
| product_id        | `uuid`                     | No       | ``                  |     |                                  |
| warehouse_id      | `uuid`                     | No       | ``                  |     | inventory.warehouses.id          |
| location_id       | `uuid`                     | Sí       | ``                  |     | inventory.warehouse_locations.id |
| quantity_on_hand  | `numeric(18,6)`            | No       | `0`                 |     |                                  |
| quantity_reserved | `numeric(18,6)`            | No       | `0`                 |     |                                  |

## inventory.stock_adjustment_lines

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
| adjustment_id     | `uuid`                     | No       | ``                  |     | inventory.stock_adjustments.id |
| product_id        | `uuid`                     | No       | ``                  |     |                                |
| previous_quantity | `numeric(18,6)`            | No       | ``                  |     |                                |
| new_quantity      | `numeric(18,6)`            | No       | ``                  |     |                                |

## inventory.stock_adjustment_reasons

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

## inventory.stock_adjustments

| Columna      | Tipo                       | Nullable | Default             | PK  | FK                                    |
| ------------ | -------------------------- | -------- | ------------------- | --- | ------------------------------------- |
| id           | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                       |
| local_id     | `bigint`                   | No       | ``                  |     |                                       |
| tenant_id    | `uuid`                     | No       | ``                  |     |                                       |
| company_id   | `uuid`                     | No       | ``                  |     |                                       |
| branch_id    | `uuid`                     | Sí       | ``                  |     |                                       |
| created_at   | `timestamp with time zone` | No       | `now()`             |     |                                       |
| updated_at   | `timestamp with time zone` | No       | `now()`             |     |                                       |
| deleted_at   | `timestamp with time zone` | Sí       | ``                  |     |                                       |
| created_by   | `uuid`                     | Sí       | ``                  |     |                                       |
| updated_by   | `uuid`                     | Sí       | ``                  |     |                                       |
| deleted_by   | `uuid`                     | Sí       | ``                  |     |                                       |
| version      | `integer`                  | No       | `1`                 |     |                                       |
| row_version  | `bigint`                   | No       | `0`                 |     |                                       |
| is_active    | `boolean`                  | No       | `true`              |     |                                       |
| is_deleted   | `boolean`                  | Sí       | ``                  |     |                                       |
| observations | `text`                     | Sí       | ``                  |     |                                       |
| metadata     | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                       |
| warehouse_id | `uuid`                     | No       | ``                  |     | inventory.warehouses.id               |
| reason_id    | `uuid`                     | No       | ``                  |     | inventory.stock_adjustment_reasons.id |
| status       | `text`                     | No       | `'draft'::text`     |     |                                       |

## inventory.stock_movement_types

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
| direction    | `text`                     | No       | ``                  |     |     |

## inventory.stock_movements

| Columna          | Tipo                       | Nullable | Default             | PK  | FK                                |
| ---------------- | -------------------------- | -------- | ------------------- | --- | --------------------------------- |
| id               | `uuid`                     | No       | `gen_random_uuid()` | PK  |                                   |
| local_id         | `bigint`                   | No       | ``                  |     |                                   |
| tenant_id        | `uuid`                     | No       | ``                  |     |                                   |
| company_id       | `uuid`                     | No       | ``                  |     |                                   |
| branch_id        | `uuid`                     | Sí       | ``                  |     |                                   |
| created_at       | `timestamp with time zone` | No       | `now()`             | PK  |                                   |
| updated_at       | `timestamp with time zone` | No       | `now()`             |     |                                   |
| deleted_at       | `timestamp with time zone` | Sí       | ``                  |     |                                   |
| created_by       | `uuid`                     | Sí       | ``                  |     |                                   |
| updated_by       | `uuid`                     | Sí       | ``                  |     |                                   |
| deleted_by       | `uuid`                     | Sí       | ``                  |     |                                   |
| version          | `integer`                  | No       | `1`                 |     |                                   |
| row_version      | `bigint`                   | No       | `0`                 |     |                                   |
| is_active        | `boolean`                  | No       | `true`              |     |                                   |
| is_deleted       | `boolean`                  | Sí       | ``                  |     |                                   |
| observations     | `text`                     | Sí       | ``                  |     |                                   |
| metadata         | `jsonb`                    | No       | `'{}'::jsonb`       |     |                                   |
| product_id       | `uuid`                     | No       | ``                  |     |                                   |
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id           |
| movement_type_id | `uuid`                     | No       | ``                  |     | inventory.stock_movement_types.id |
| quantity         | `numeric(18,6)`            | No       | ``                  |     |                                   |
| unit_cost        | `numeric(18,4)`            | Sí       | ``                  |     |                                   |
| source_module    | `text`                     | Sí       | ``                  |     |                                   |
| source_entity_id | `uuid`                     | Sí       | ``                  |     |                                   |

## inventory.stock_reservations

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
| product_id       | `uuid`                     | No       | ``                  |     |                         |
| warehouse_id     | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| quantity         | `numeric(18,6)`            | No       | ``                  |     |                         |
| source_module    | `text`                     | No       | ``                  |     |                         |
| source_entity_id | `uuid`                     | No       | ``                  |     |                         |
| released_at      | `timestamp with time zone` | Sí       | ``                  |     |                         |

## inventory.stock_transfer_lines

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
| transfer_id  | `uuid`                     | No       | ``                  |     | inventory.stock_transfers.id |
| product_id   | `uuid`                     | No       | ``                  |     |                              |
| quantity     | `numeric(18,6)`            | No       | ``                  |     |                              |

## inventory.stock_transfers

| Columna                  | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------------------ | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id                       | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id                 | `bigint`                   | No       | ``                  |     |                         |
| tenant_id                | `uuid`                     | No       | ``                  |     |                         |
| company_id               | `uuid`                     | No       | ``                  |     |                         |
| branch_id                | `uuid`                     | Sí       | ``                  |     |                         |
| created_at               | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at               | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at               | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by               | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by               | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by               | `uuid`                     | Sí       | ``                  |     |                         |
| version                  | `integer`                  | No       | `1`                 |     |                         |
| row_version              | `bigint`                   | No       | `0`                 |     |                         |
| is_active                | `boolean`                  | No       | `true`              |     |                         |
| is_deleted               | `boolean`                  | Sí       | ``                  |     |                         |
| observations             | `text`                     | Sí       | ``                  |     |                         |
| metadata                 | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| source_warehouse_id      | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| destination_warehouse_id | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| document_number          | `text`                     | No       | ``                  |     |                         |
| status                   | `text`                     | No       | `'draft'::text`     |     |                         |

## inventory.v_available_stock

| Columna            | Tipo            | Nullable | Default | PK  | FK  |
| ------------------ | --------------- | -------- | ------- | --- | --- |
| product_id         | `uuid`          | Sí       | ``      |     |     |
| warehouse_id       | `uuid`          | Sí       | ``      |     |     |
| company_id         | `uuid`          | Sí       | ``      |     |     |
| branch_id          | `uuid`          | Sí       | ``      |     |     |
| quantity_on_hand   | `numeric(18,6)` | Sí       | ``      |     |     |
| quantity_reserved  | `numeric(18,6)` | Sí       | ``      |     |     |
| quantity_available | `numeric`       | Sí       | ``      |     |     |

## inventory.v_kardex

| Columna          | Tipo                       | Nullable | Default | PK  | FK  |
| ---------------- | -------------------------- | -------- | ------- | --- | --- |
| tenant_id        | `uuid`                     | Sí       | ``      |     |     |
| company_id       | `uuid`                     | Sí       | ``      |     |     |
| branch_id        | `uuid`                     | Sí       | ``      |     |     |
| product_id       | `uuid`                     | Sí       | ``      |     |     |
| warehouse_id     | `uuid`                     | Sí       | ``      |     |     |
| movement_type_id | `uuid`                     | Sí       | ``      |     |     |
| direction        | `text`                     | Sí       | ``      |     |     |
| quantity         | `numeric(18,6)`            | Sí       | ``      |     |     |
| unit_cost        | `numeric(18,4)`            | Sí       | ``      |     |     |
| movement_value   | `numeric`                  | Sí       | ``      |     |     |
| movement_date    | `timestamp with time zone` | Sí       | ``      |     |     |
| running_balance  | `numeric`                  | Sí       | ``      |     |     |

## inventory.warehouse_locations

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
| zone_id            | `uuid`                     | No       | ``                  |     | inventory.warehouse_zones.id     |
| code               | `text`                     | No       | ``                  |     |                                  |
| parent_location_id | `uuid`                     | Sí       | ``                  |     | inventory.warehouse_locations.id |

## inventory.warehouse_zones

| Columna       | Tipo                       | Nullable | Default             | PK  | FK                      |
| ------------- | -------------------------- | -------- | ------------------- | --- | ----------------------- |
| id            | `uuid`                     | No       | `gen_random_uuid()` | PK  |                         |
| local_id      | `bigint`                   | No       | ``                  |     |                         |
| tenant_id     | `uuid`                     | No       | ``                  |     |                         |
| company_id    | `uuid`                     | Sí       | ``                  |     |                         |
| branch_id     | `uuid`                     | Sí       | ``                  |     |                         |
| created_at    | `timestamp with time zone` | No       | `now()`             |     |                         |
| updated_at    | `timestamp with time zone` | No       | `now()`             |     |                         |
| deleted_at    | `timestamp with time zone` | Sí       | ``                  |     |                         |
| created_by    | `uuid`                     | Sí       | ``                  |     |                         |
| updated_by    | `uuid`                     | Sí       | ``                  |     |                         |
| deleted_by    | `uuid`                     | Sí       | ``                  |     |                         |
| version       | `integer`                  | No       | `1`                 |     |                         |
| row_version   | `bigint`                   | No       | `0`                 |     |                         |
| is_active     | `boolean`                  | No       | `true`              |     |                         |
| is_deleted    | `boolean`                  | Sí       | ``                  |     |                         |
| observations  | `text`                     | Sí       | ``                  |     |                         |
| metadata      | `jsonb`                    | No       | `'{}'::jsonb`       |     |                         |
| warehouse_id  | `uuid`                     | No       | ``                  |     | inventory.warehouses.id |
| name          | `text`                     | No       | ``                  |     |                         |
| zone_function | `text`                     | No       | ``                  |     |                         |

## inventory.warehouses

| Columna        | Tipo                       | Nullable | Default             | PK  | FK  |
| -------------- | -------------------------- | -------- | ------------------- | --- | --- |
| id             | `uuid`                     | No       | `gen_random_uuid()` | PK  |     |
| local_id       | `bigint`                   | No       | ``                  |     |     |
| tenant_id      | `uuid`                     | No       | ``                  |     |     |
| company_id     | `uuid`                     | No       | ``                  |     |     |
| branch_id      | `uuid`                     | No       | ``                  |     |     |
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
| name           | `text`                     | No       | ``                  |     |     |
| code           | `text`                     | No       | ``                  |     |     |
| warehouse_type | `text`                     | No       | `'physical'::text`  |     |     |
