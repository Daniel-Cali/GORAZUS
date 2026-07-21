# Modelo Lógico — Assets (`assets`)

Alta desde `purchases.purchase_invoice_lines` marcadas como activables;
publica depreciación y bajas hacia `accounting`.

| Tabla                        | Propósito                                                                     | FKs no-universales                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `asset_categories`           | Categoría con método y vida útil por defecto                                  | `default_depreciation_method_id → depreciation_methods`                                                            |
| `depreciation_methods`       | Línea recta, saldos decrecientes, etc.                                        | `company_id`                                                                                                       |
| `fixed_assets`               | Bien de uso: descripción, valor de adquisición, ubicación, responsable actual | `category_id → asset_categories`, `source_purchase_invoice_line_id → purchases.purchase_invoice_lines` (ID suelto) |
| `asset_depreciation_entries` | Depreciación calculada por período                                            | `asset_id → fixed_assets`, `fiscal_period_id → accounting.fiscal_periods`                                          |
| `asset_maintenance_types`    | Catálogo (preventivo, correctivo)                                             | `company_id`                                                                                                       |
| `asset_maintenances`         | Mantenimiento realizado sobre un activo propio                                | `asset_id → fixed_assets`, `maintenance_type_id → asset_maintenance_types`                                         |
| `asset_transfers`            | Cambio de ubicación/responsable                                               | `asset_id → fixed_assets`                                                                                          |
| `asset_custodian_history`    | Historial de responsables asignados                                           | `asset_id → fixed_assets`, `custodian_user_id → core.users`                                                        |
| `asset_revaluations`         | Ajuste de valor contable                                                      | `asset_id → fixed_assets`, `approved_by_user_id → core.users`                                                      |
| `asset_disposals`            | Baja por venta, donación o desecho, con valor residual                        | `asset_id → fixed_assets`                                                                                          |

**Total: 10 tablas.**
