# Table Catalog — GORAZUS

> Generado 2026-07-17 (PHASE 01 — Database Enterprise) desde `pg_catalog`/`pg_stat_user_tables`
> real. Catálogo **operacional** (tipo, filas estimadas, si es particionada) —
> el propósito de negocio de cada tabla ya está documentado en
> `docs/database/logico/<NN>-<schema>.md` y el detalle técnico completo de
> columnas en `docs/database/dictionary/<NN>-<schema>.md`; este documento no
> repite ninguno de los dos, los referencia. 501 tablas lógicas verificadas.
> **Actualización 2026-07-21 (Fase 1 Parte 3, auditoría de tablas):**
> verificación de calidad agregada (CHECK/UNIQUE/comentarios/outliers de
> tamaño) y clasificación Mantener/Mejorar por tabla en
> [DATABASE_ANALYSIS.md](./DATABASE_ANALYSIS.md) — no se repite aquí.

## Resumen por schema

| Schema          | Tablas | Particionadas | Ver propósito                                              | Ver columnas                                                       |
| --------------- | ------ | ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `reports`       | 11     | 0             | [logico/19-reports.md](./logico/19-reports.md)             | [dictionary/19-reports.md](./dictionary/19-reports.md)             |
| `crm`           | 17     | 3             | [logico/13-crm.md](./logico/13-crm.md)                     | [dictionary/13-crm.md](./dictionary/13-crm.md)                     |
| `sales`         | 55     | 1             | [logico/07-sales.md](./logico/07-sales.md)                 | [dictionary/07-sales.md](./dictionary/07-sales.md)                 |
| `cash`          | 11     | 1             | [logico/09-cash.md](./logico/09-cash.md)                   | [dictionary/09-cash.md](./dictionary/09-cash.md)                   |
| `banks`         | 14     | 0             | [logico/10-banks.md](./logico/10-banks.md)                 | [dictionary/10-banks.md](./dictionary/10-banks.md)                 |
| `taxes`         | 13     | 1             | [logico/12-taxes.md](./logico/12-taxes.md)                 | [dictionary/12-taxes.md](./dictionary/12-taxes.md)                 |
| `inventory`     | 34     | 2             | [logico/06-inventory.md](./logico/06-inventory.md)         | [dictionary/06-inventory.md](./dictionary/06-inventory.md)         |
| `projects`      | 17     | 2             | [logico/17-projects.md](./logico/17-projects.md)           | [dictionary/17-projects.md](./dictionary/17-projects.md)           |
| `hr`            | 28     | 1             | [logico/14-hr.md](./logico/14-hr.md)                       | [dictionary/14-hr.md](./dictionary/14-hr.md)                       |
| `suppliers`     | 13     | 0             | [logico/04-suppliers.md](./logico/04-suppliers.md)         | [dictionary/04-suppliers.md](./dictionary/04-suppliers.md)         |
| `products`      | 35     | 0             | [logico/05-products.md](./logico/05-products.md)           | [dictionary/05-products.md](./dictionary/05-products.md)           |
| `security`      | 24     | 2             | [logico/02-security.md](./logico/02-security.md)           | [dictionary/02-security.md](./dictionary/02-security.md)           |
| `customers`     | 18     | 0             | [logico/03-customers.md](./logico/03-customers.md)         | [dictionary/03-customers.md](./dictionary/03-customers.md)         |
| `configuration` | 23     | 0             | [logico/21-configuration.md](./logico/21-configuration.md) | [dictionary/21-configuration.md](./dictionary/21-configuration.md) |
| `core`          | 69     | 6             | [logico/01-core.md](./logico/01-core.md)                   | [dictionary/01-core.md](./dictionary/01-core.md)                   |
| `accounting`    | 28     | 1             | [logico/11-accounting.md](./logico/11-accounting.md)       | [dictionary/11-accounting.md](./dictionary/11-accounting.md)       |
| `purchases`     | 27     | 1             | [logico/08-purchases.md](./logico/08-purchases.md)         | [dictionary/08-purchases.md](./dictionary/08-purchases.md)         |
| `payroll`       | 22     | 0             | [logico/15-payroll.md](./logico/15-payroll.md)             | [dictionary/15-payroll.md](./dictionary/15-payroll.md)             |
| `bi`            | 14     | 3             | [logico/20-bi.md](./logico/20-bi.md)                       | [dictionary/20-bi.md](./dictionary/20-bi.md)                       |
| `services`      | 18     | 2             | [logico/16-services.md](./logico/16-services.md)           | [dictionary/16-services.md](./dictionary/16-services.md)           |
| `assets`        | 10     | 1             | [logico/18-assets.md](./logico/18-assets.md)               | [dictionary/18-assets.md](./dictionary/18-assets.md)               |

## Detalle por tabla (agrupado por schema)

### core

| Tabla                              | Tipo                              | Filas (estimado) |
| ---------------------------------- | --------------------------------- | ---------------- |
| activity_logs                      | tabla particionada (particionada) | 0                |
| api_key_scopes                     | tabla                             | 0                |
| api_keys                           | tabla                             | 0                |
| approval_matrices                  | tabla                             | 0                |
| approval_steps                     | tabla                             | 0                |
| approvals                          | tabla                             | 0                |
| audit_logs                         | tabla particionada (particionada) | 0                |
| background_jobs                    | tabla particionada (particionada) | 0                |
| branches                           | tabla                             | 0                |
| business_rule_evaluations          | tabla particionada (particionada) | 0                |
| business_rules                     | tabla                             | 0                |
| change_history                     | tabla                             | 0                |
| comments                           | tabla                             | 0                |
| companies                          | tabla                             | 0                |
| consent_records                    | tabla                             | 0                |
| data_retention_policies            | tabla                             | 0                |
| data_subject_requests              | tabla                             | 0                |
| departments                        | tabla                             | 0                |
| document_types                     | tabla                             | 0                |
| document_versions                  | tabla                             | 0                |
| documents                          | tabla                             | 0                |
| edi_transactions                   | tabla                             | 0                |
| entity_tags                        | tabla                             | 0                |
| export_batches                     | tabla                             | 0                |
| feature_flags                      | tabla                             | 0                |
| files                              | tabla                             | 0                |
| group_members                      | tabla                             | 0                |
| groups                             | tabla                             | 0                |
| import_batch_errors                | tabla                             | 0                |
| import_batches                     | tabla                             | 0                |
| integration_credentials            | tabla                             | 0                |
| integrations                       | tabla                             | 0                |
| notification_channels              | tabla                             | 0                |
| notification_delivery_logs         | tabla particionada (particionada) | 0                |
| notification_preferences           | tabla                             | 0                |
| notification_recipients            | tabla                             | 0                |
| notification_template_translations | tabla                             | 0                |
| notification_templates             | tabla                             | 0                |
| notifications                      | tabla                             | 0                |
| permissions                        | tabla                             | 168              |
| restore_test_logs                  | tabla                             | 0                |
| role_permissions                   | tabla                             | 168              |
| roles                              | tabla                             | 1                |
| scheduled_job_runs                 | tabla                             | 0                |
| scheduled_jobs                     | tabla                             | 1                |
| sessions                           | tabla                             | 0                |
| signature_requests                 | tabla                             | 0                |
| signatures                         | tabla                             | 0                |
| system_logs                        | tabla particionada (particionada) | 0                |
| system_parameters                  | tabla                             | 0                |
| system_settings                    | tabla                             | 0                |
| tags                               | tabla                             | 0                |
| template_translations              | tabla                             | 0                |
| templates                          | tabla                             | 0                |
| tenant_subscription_features       | tabla                             | 0                |
| tenant_subscriptions               | tabla                             | 0                |
| tenants                            | tabla                             | 1                |
| tokens                             | tabla                             | 0                |
| user_companies                     | tabla                             | 0                |
| user_devices                       | tabla                             | 0                |
| user_profiles                      | tabla                             | 0                |
| user_roles                         | tabla                             | 0                |
| users                              | tabla                             | 1                |
| webhook_delivery_logs              | tabla                             | 0                |
| webhook_subscriptions              | tabla                             | 0                |
| workflow_instance_steps            | tabla                             | 0                |
| workflow_instances                 | tabla                             | 0                |
| workflow_steps                     | tabla                             | 0                |
| workflows                          | tabla                             | 0                |

### security

| Tabla                    | Tipo                              | Filas (estimado) |
| ------------------------ | --------------------------------- | ---------------- |
| access_control_lists     | tabla                             | 0                |
| acl_entries              | tabla                             | 0                |
| api_key_rate_limits      | tabla                             | 0                |
| data_encryption_keys     | tabla                             | 0                |
| encryption_key_rotations | tabla                             | 0                |
| ip_allowlist_entries     | tabla                             | 0                |
| ip_denylist_entries      | tabla                             | 0                |
| login_attempts           | tabla particionada (particionada) | 0                |
| oauth_client_scopes      | tabla                             | 0                |
| oauth_clients            | tabla                             | 0                |
| oauth_scopes             | tabla                             | 0                |
| oauth_tokens             | tabla                             | 0                |
| password_history         | tabla                             | 0                |
| password_policies        | tabla                             | 0                |
| permission_delegations   | tabla                             | 0                |
| security_audit_logs      | tabla                             | 0                |
| security_incident_events | tabla                             | 0                |
| security_incidents       | tabla                             | 0                |
| security_policies        | tabla                             | 0                |
| session_activity_logs    | tabla particionada (particionada) | 0                |
| trusted_devices          | tabla                             | 0                |
| two_factor_backup_codes  | tabla                             | 0                |
| two_factor_challenges    | tabla                             | 0                |
| two_factor_credentials   | tabla                             | 0                |

### customers

| Tabla                         | Tipo  | Filas (estimado) |
| ----------------------------- | ----- | ---------------- |
| customer_addresses            | tabla | 0                |
| customer_bank_accounts        | tabla | 0                |
| customer_block_history        | tabla | 0                |
| customer_categories           | tabla | 0                |
| customer_classifications      | tabla | 0                |
| customer_contacts             | tabla | 0                |
| customer_credit_limit_history | tabla | 0                |
| customer_credit_profiles      | tabla | 0                |
| customer_discounts            | tabla | 0                |
| customer_loyalty_accounts     | tabla | 0                |
| customer_price_lists          | tabla | 0                |
| customer_references           | tabla | 0                |
| customer_statements           | tabla | 0                |
| customer_visits               | tabla | 0                |
| customer_wishlist_items       | tabla | 0                |
| customers                     | tabla | 0                |
| sales_route_customers         | tabla | 0                |
| sales_routes                  | tabla | 0                |

### suppliers

| Tabla                         | Tipo  | Filas (estimado) |
| ----------------------------- | ----- | ---------------- |
| supplier_addresses            | tabla | 0                |
| supplier_bank_accounts        | tabla | 0                |
| supplier_block_history        | tabla | 0                |
| supplier_classifications      | tabla | 0                |
| supplier_contacts             | tabla | 0                |
| supplier_credit_limit_history | tabla | 0                |
| supplier_credit_profiles      | tabla | 0                |
| supplier_evaluation_criteria  | tabla | 0                |
| supplier_evaluation_scores    | tabla | 0                |
| supplier_evaluations          | tabla | 0                |
| supplier_history              | tabla | 0                |
| supplier_withholding_profiles | tabla | 0                |
| suppliers                     | tabla | 0                |

### products

| Tabla                                | Tipo  | Filas (estimado) |
| ------------------------------------ | ----- | ---------------- |
| bill_of_materials                    | tabla | 0                |
| bom_components                       | tabla | 0                |
| brand_translations                   | tabla | 0                |
| brands                               | tabla | 0                |
| product_attribute_translations       | tabla | 0                |
| product_attribute_value_translations | tabla | 0                |
| product_attribute_values             | tabla | 0                |
| product_attributes                   | tabla | 3                |
| product_barcodes                     | tabla | 0                |
| product_categories                   | tabla | 0                |
| product_category_translations        | tabla | 0                |
| product_collections                  | tabla | 0                |
| product_combo_components             | tabla | 0                |
| product_combos                       | tabla | 0                |
| product_families                     | tabla | 0                |
| product_images                       | tabla | 0                |
| product_kit_components               | tabla | 0                |
| product_kits                         | tabla | 0                |
| product_lines                        | tabla | 0                |
| product_models                       | tabla | 0                |
| product_presentations                | tabla | 0                |
| product_price_history                | tabla | 0                |
| product_related_products             | tabla | 0                |
| product_reviews                      | tabla | 0                |
| product_suppliers                    | tabla | 0                |
| product_tax_profiles                 | tabla | 0                |
| product_translations                 | tabla | 0                |
| product_variant_attribute_values     | tabla | 0                |
| product_videos                       | tabla | 0                |
| products                             | tabla | 0                |
| recipe_ingredients                   | tabla | 0                |
| recipes                              | tabla | 0                |
| unit_conversions                     | tabla | 0                |
| unit_of_measure_translations         | tabla | 0                |
| units_of_measure                     | tabla | 0                |

### inventory

| Tabla                           | Tipo                              | Filas (estimado) |
| ------------------------------- | --------------------------------- | ---------------- |
| average_cost_history            | tabla                             | 0                |
| cycle_count_schedules           | tabla                             | 0                |
| fifo_cost_layers                | tabla                             | 0                |
| goods_issue_lines               | tabla                             | 0                |
| goods_issue_reasons             | tabla                             | 0                |
| goods_issues                    | tabla                             | 0                |
| goods_receipt_lines             | tabla                             | 0                |
| goods_receipts                  | tabla                             | 0                |
| inventory_lots                  | tabla                             | 0                |
| inventory_serials               | tabla                             | 0                |
| lifo_cost_layers                | tabla                             | 0                |
| physical_count_lines            | tabla                             | 0                |
| physical_counts                 | tabla                             | 0                |
| picking_rules                   | tabla                             | 0                |
| production_consumptions         | tabla particionada (particionada) | 0                |
| production_order_components     | tabla                             | 0                |
| production_order_outputs        | tabla                             | 0                |
| production_order_status         | tabla                             | 8                |
| production_order_status_history | tabla                             | 0                |
| production_orders               | tabla                             | 0                |
| putaway_rules                   | tabla                             | 0                |
| replenishment_rules             | tabla                             | 0                |
| stock                           | tabla                             | 0                |
| stock_adjustment_lines          | tabla                             | 0                |
| stock_adjustment_reasons        | tabla                             | 0                |
| stock_adjustments               | tabla                             | 0                |
| stock_movement_types            | tabla                             | 0                |
| stock_movements                 | tabla particionada (particionada) | 0                |
| stock_reservations              | tabla                             | 0                |
| stock_transfer_lines            | tabla                             | 0                |
| stock_transfers                 | tabla                             | 0                |
| warehouse_locations             | tabla                             | 0                |
| warehouse_zones                 | tabla                             | 0                |
| warehouses                      | tabla                             | 0                |

### sales

| Tabla                       | Tipo                              | Filas (estimado) |
| --------------------------- | --------------------------------- | ---------------- |
| commission_entries          | tabla                             | 0                |
| commission_rules            | tabla                             | 0                |
| coupon_redemptions          | tabla                             | 0                |
| coupons                     | tabla                             | 0                |
| credit_note_lines           | tabla                             | 0                |
| credit_notes                | tabla                             | 0                |
| debit_note_lines            | tabla                             | 0                |
| debit_notes                 | tabla                             | 0                |
| delivery_note_lines         | tabla                             | 0                |
| delivery_notes              | tabla                             | 0                |
| discounts                   | tabla                             | 0                |
| electronic_invoice_logs     | tabla                             | 0                |
| gift_card_transactions      | tabla                             | 0                |
| gift_cards                  | tabla                             | 0                |
| invoice_lines               | tabla                             | 0                |
| invoice_status              | tabla                             | 10               |
| invoice_status_history      | tabla                             | 0                |
| invoices                    | tabla particionada (particionada) | 0                |
| layaway_lines               | tabla                             | 0                |
| layaway_payments            | tabla                             | 0                |
| layaways                    | tabla                             | 0                |
| loyalty_points_transactions | tabla                             | 0                |
| loyalty_program_tiers       | tabla                             | 0                |
| loyalty_programs            | tabla                             | 0                |
| online_store_configs        | tabla                             | 0                |
| promotion_rules             | tabla                             | 0                |
| promotions                  | tabla                             | 0                |
| quote_lines                 | tabla                             | 0                |
| quote_status                | tabla                             | 10               |
| quote_status_history        | tabla                             | 0                |
| quotes                      | tabla                             | 0                |
| receipt_allocations         | tabla                             | 0                |
| receipts                    | tabla                             | 0                |
| recurring_sale_generations  | tabla                             | 0                |
| recurring_sale_templates    | tabla                             | 0                |
| sales_contract_lines        | tabla                             | 0                |
| sales_contracts             | tabla                             | 0                |
| sales_order_lines           | tabla                             | 0                |
| sales_order_status          | tabla                             | 12               |
| sales_order_status_history  | tabla                             | 0                |
| sales_orders                | tabla                             | 0                |
| sales_return_lines          | tabla                             | 0                |
| sales_returns               | tabla                             | 0                |
| sales_targets               | tabla                             | 0                |
| sales_team_members          | tabla                             | 0                |
| sales_teams                 | tabla                             | 0                |
| sales_territories           | tabla                             | 0                |
| salespeople                 | tabla                             | 0                |
| shopping_cart_items         | tabla                             | 0                |
| shopping_carts              | tabla                             | 0                |
| subscription_billing_cycles | tabla                             | 0                |
| subscription_lines          | tabla                             | 0                |
| subscriptions               | tabla                             | 0                |
| warranties                  | tabla                             | 0                |
| warranty_claims             | tabla                             | 0                |

### purchases

| Tabla                               | Tipo                              | Filas (estimado) |
| ----------------------------------- | --------------------------------- | ---------------- |
| goods_receipt_note_lines            | tabla                             | 0                |
| goods_receipt_notes                 | tabla                             | 0                |
| import_expenses                     | tabla                             | 0                |
| import_status                       | tabla                             | 0                |
| import_status_history               | tabla                             | 0                |
| imports                             | tabla                             | 0                |
| purchase_credit_note_lines          | tabla                             | 0                |
| purchase_credit_notes               | tabla                             | 0                |
| purchase_expenses                   | tabla                             | 0                |
| purchase_invoice_lines              | tabla                             | 0                |
| purchase_invoice_matching           | tabla                             | 0                |
| purchase_invoice_status             | tabla                             | 0                |
| purchase_invoice_status_history     | tabla                             | 0                |
| purchase_invoices                   | tabla particionada (particionada) | 0                |
| purchase_order_lines                | tabla                             | 0                |
| purchase_order_status               | tabla                             | 10               |
| purchase_order_status_history       | tabla                             | 0                |
| purchase_orders                     | tabla                             | 0                |
| purchase_quote_lines                | tabla                             | 0                |
| purchase_quotes                     | tabla                             | 0                |
| purchase_requisition_lines          | tabla                             | 0                |
| purchase_requisition_status         | tabla                             | 0                |
| purchase_requisition_status_history | tabla                             | 0                |
| purchase_requisitions               | tabla                             | 0                |
| purchase_return_lines               | tabla                             | 0                |
| purchase_returns                    | tabla                             | 0                |
| purchase_withholdings               | tabla                             | 0                |

### cash

| Tabla                  | Tipo                              | Filas (estimado) |
| ---------------------- | --------------------------------- | ---------------- |
| cash_count_lines       | tabla                             | 0                |
| cash_counts            | tabla                             | 0                |
| cash_movement_types    | tabla                             | 0                |
| cash_movements         | tabla particionada (particionada) | 0                |
| cash_refunds           | tabla                             | 0                |
| cash_register_closings | tabla                             | 0                |
| cash_register_openings | tabla                             | 0                |
| cash_registers         | tabla                             | 0                |
| cash_transfers         | tabla                             | 0                |
| petty_cash_funds       | tabla                             | 0                |
| petty_cash_vouchers    | tabla                             | 0                |

### banks

| Tabla                     | Tipo  | Filas (estimado) |
| ------------------------- | ----- | ---------------- |
| bank_accounts             | tabla | 0                |
| bank_cards                | tabla | 0                |
| bank_deposits             | tabla | 0                |
| bank_payment_batch_lines  | tabla | 0                |
| bank_payment_batches      | tabla | 0                |
| bank_pos_terminals        | tabla | 0                |
| bank_reconciliation_lines | tabla | 0                |
| bank_reconciliations      | tabla | 0                |
| bank_statement_lines      | tabla | 0                |
| bank_statements           | tabla | 0                |
| bank_transfers            | tabla | 0                |
| checkbooks                | tabla | 0                |
| checks_issued             | tabla | 0                |
| checks_received           | tabla | 0                |

### accounting

| Tabla                               | Tipo                              | Filas (estimado) |
| ----------------------------------- | --------------------------------- | ---------------- |
| account_reconciliations             | tabla                             | 0                |
| account_types                       | tabla                             | 0                |
| accounting_dimension_values         | tabla                             | 0                |
| accounting_dimensions               | tabla                             | 0                |
| accounting_rule_lines               | tabla                             | 0                |
| accounting_rules                    | tabla                             | 0                |
| balance_sheet_snapshots             | tabla                             | 0                |
| budget_lines                        | tabla                             | 0                |
| budgets                             | tabla                             | 0                |
| cash_flow_snapshots                 | tabla                             | 0                |
| chart_of_accounts                   | tabla                             | 0                |
| consolidated_financial_snapshots    | tabla                             | 0                |
| cost_centers                        | tabla                             | 0                |
| currency_revaluations               | tabla                             | 0                |
| fiscal_periods                      | tabla                             | 0                |
| fiscal_years                        | tabla                             | 0                |
| ifrs_adjustments                    | tabla                             | 0                |
| income_statement_snapshots          | tabla                             | 0                |
| intercompany_transactions           | tabla                             | 0                |
| journal_entries                     | tabla particionada (particionada) | 0                |
| journal_entry_dimension_values      | tabla                             | 0                |
| journal_entry_lines                 | tabla                             | 0                |
| journal_entry_status                | tabla                             | 6                |
| journal_entry_status_history        | tabla                             | 0                |
| period_closing_logs                 | tabla                             | 0                |
| profit_centers                      | tabla                             | 0                |
| recurring_journal_entry_generations | tabla                             | 0                |
| recurring_journal_entry_templates   | tabla                             | 0                |

### taxes

| Tabla                      | Tipo                              | Filas (estimado) |
| -------------------------- | --------------------------------- | ---------------- |
| tax_declaration_lines      | tabla                             | 0                |
| tax_declarations           | tabla                             | 0                |
| tax_exemption_certificates | tabla                             | 0                |
| tax_exemptions             | tabla                             | 0                |
| tax_jurisdictions          | tabla                             | 0                |
| tax_perception_rules       | tabla                             | 0                |
| tax_perceptions            | tabla                             | 0                |
| tax_rates                  | tabla                             | 0                |
| tax_rules                  | tabla                             | 0                |
| tax_translations           | tabla                             | 0                |
| taxes                      | tabla                             | 0                |
| withholding_certificates   | tabla particionada (particionada) | 0                |
| withholding_rules          | tabla                             | 0                |

### crm

| Tabla                    | Tipo                              | Filas (estimado) |
| ------------------------ | --------------------------------- | ---------------- |
| calendar_event_attendees | tabla                             | 0                |
| calendar_events          | tabla                             | 0                |
| call_logs                | tabla particionada (particionada) | 0                |
| campaign_members         | tabla                             | 0                |
| campaigns                | tabla                             | 0                |
| email_logs               | tabla particionada (particionada) | 0                |
| follow_up_activities     | tabla                             | 0                |
| lead_sources             | tabla                             | 0                |
| lead_status              | tabla                             | 0                |
| lead_status_history      | tabla                             | 0                |
| leads                    | tabla                             | 0                |
| opportunities            | tabla                             | 0                |
| opportunity_lines        | tabla                             | 0                |
| opportunity_loss_reasons | tabla                             | 0                |
| sales_funnel_stages      | tabla                             | 0                |
| sales_funnels            | tabla                             | 0                |
| whatsapp_logs            | tabla particionada (particionada) | 0                |

### hr

| Tabla                           | Tipo                              | Filas (estimado) |
| ------------------------------- | --------------------------------- | ---------------- |
| attendance_devices              | tabla                             | 0                |
| attendance_records              | tabla particionada (particionada) | 0                |
| candidate_stage_history         | tabla                             | 0                |
| candidate_stages                | tabla                             | 0                |
| candidates                      | tabla                             | 0                |
| contract_types                  | tabla                             | 0                |
| disciplinary_action_types       | tabla                             | 0                |
| disciplinary_actions            | tabla                             | 0                |
| employee_asset_assignments      | tabla                             | 0                |
| employee_bank_accounts          | tabla                             | 0                |
| employee_contracts              | tabla                             | 0                |
| employee_dependents             | tabla                             | 0                |
| employee_emergency_contacts     | tabla                             | 0                |
| employee_skills                 | tabla                             | 0                |
| employees                       | tabla                             | 0                |
| job_positions                   | tabla                             | 0                |
| job_vacancies                   | tabla                             | 0                |
| leave_request_status            | tabla                             | 0                |
| leave_request_status_history    | tabla                             | 0                |
| leave_requests                  | tabla                             | 0                |
| leave_types                     | tabla                             | 0                |
| performance_evaluation_criteria | tabla                             | 0                |
| performance_evaluation_scores   | tabla                             | 0                |
| performance_evaluations         | tabla                             | 0                |
| skills_catalog                  | tabla                             | 0                |
| training_enrollments            | tabla                             | 0                |
| trainings                       | tabla                             | 0                |
| vacation_balances               | tabla                             | 0                |

### payroll

| Tabla                         | Tipo  | Filas (estimado) |
| ----------------------------- | ----- | ---------------- |
| concept_types                 | tabla | 0                |
| deductions                    | tabla | 0                |
| employee_benefit_assignments  | tabla | 0                |
| employee_benefits             | tabla | 0                |
| loan_installments             | tabla | 0                |
| loans                         | tabla | 0                |
| overtime_records              | tabla | 0                |
| payroll_commission_entries    | tabla | 0                |
| payroll_concepts              | tabla | 0                |
| payroll_entries               | tabla | 0                |
| payroll_entry_lines           | tabla | 0                |
| payroll_novelties             | tabla | 0                |
| payroll_periods               | tabla | 0                |
| payroll_run_status            | tabla | 0                |
| payroll_run_status_history    | tabla | 0                |
| payroll_runs                  | tabla | 0                |
| salary_structure_concepts     | tabla | 0                |
| salary_structures             | tabla | 0                |
| severance_calculations        | tabla | 0                |
| social_security_tables        | tabla | 0                |
| tax_withholding_tables        | tabla | 0                |
| thirteenth_month_calculations | tabla | 0                |

### services

| Tabla                        | Tipo                              | Filas (estimado) |
| ---------------------------- | --------------------------------- | ---------------- |
| equipment                    | tabla                             | 0                |
| equipment_types              | tabla                             | 0                |
| maintenance_plans            | tabla                             | 0                |
| scheduled_maintenances       | tabla                             | 0                |
| service_contract_types       | tabla                             | 0                |
| service_contracts            | tabla                             | 0                |
| service_order_lines          | tabla                             | 0                |
| service_order_reasons        | tabla                             | 0                |
| service_order_status         | tabla                             | 8                |
| service_order_status_history | tabla                             | 0                |
| service_orders               | tabla                             | 0                |
| service_parts_consumed       | tabla particionada (particionada) | 0                |
| service_types                | tabla                             | 0                |
| service_visits               | tabla particionada (particionada) | 0                |
| service_work_reports         | tabla                             | 0                |
| sla_definitions              | tabla                             | 0                |
| technician_assignments       | tabla                             | 0                |
| technicians                  | tabla                             | 0                |

### projects

| Tabla                        | Tipo                              | Filas (estimado) |
| ---------------------------- | --------------------------------- | ---------------- |
| project_billing_milestones   | tabla                             | 0                |
| project_billing_plans        | tabla                             | 0                |
| project_budget_lines         | tabla                             | 0                |
| project_budgets              | tabla                             | 0                |
| project_costs                | tabla particionada (particionada) | 0                |
| project_resource_assignments | tabla                             | 0                |
| project_risks                | tabla                             | 0                |
| project_role_rates           | tabla                             | 0                |
| project_status               | tabla                             | 8                |
| project_status_history       | tabla                             | 0                |
| project_task_dependencies    | tabla                             | 0                |
| project_task_status          | tabla                             | 0                |
| project_tasks                | tabla                             | 0                |
| project_timesheet_status     | tabla                             | 0                |
| project_timesheets           | tabla particionada (particionada) | 0                |
| project_types                | tabla                             | 0                |
| projects                     | tabla                             | 0                |

### assets

| Tabla                      | Tipo                              | Filas (estimado) |
| -------------------------- | --------------------------------- | ---------------- |
| asset_categories           | tabla                             | 0                |
| asset_custodian_history    | tabla                             | 0                |
| asset_depreciation_entries | tabla particionada (particionada) | 0                |
| asset_disposals            | tabla                             | 0                |
| asset_maintenance_types    | tabla                             | 0                |
| asset_maintenances         | tabla                             | 0                |
| asset_revaluations         | tabla                             | 0                |
| asset_transfers            | tabla                             | 0                |
| depreciation_methods       | tabla                             | 0                |
| fixed_assets               | tabla                             | 0                |

### reports

| Tabla                        | Tipo  | Filas (estimado) |
| ---------------------------- | ----- | ---------------- |
| dashboard_widgets            | tabla | 0                |
| dashboards                   | tabla | 0                |
| report_definitions           | tabla | 0                |
| report_executions            | tabla | 0                |
| report_exports               | tabla | 0                |
| report_favorites             | tabla | 0                |
| report_parameters            | tabla | 0                |
| report_schedule_recipients   | tabla | 0                |
| report_schedules             | tabla | 0                |
| report_template_translations | tabla | 0                |
| report_templates             | tabla | 0                |

### bi

| Tabla                | Tipo                              | Filas (estimado) |
| -------------------- | --------------------------------- | ---------------- |
| bi_alert_triggers    | tabla                             | 0                |
| bi_alerts            | tabla                             | 0                |
| data_cube_dimensions | tabla                             | 0                |
| data_cube_measures   | tabla                             | 0                |
| data_cubes           | tabla                             | 0                |
| data_mart_tables     | tabla                             | 0                |
| forecast_models      | tabla                             | 0                |
| forecasts            | tabla                             | 0                |
| indicator_snapshots  | tabla particionada (particionada) | 0                |
| indicators           | tabla                             | 0                |
| kpi_snapshots        | tabla particionada (particionada) | 0                |
| kpis                 | tabla                             | 0                |
| metric_snapshots     | tabla particionada (particionada) | 0                |
| metrics              | tabla                             | 0                |

### configuration

| Tabla                       | Tipo  | Filas (estimado) |
| --------------------------- | ----- | ---------------- |
| banks                       | tabla | 0                |
| correlatives                | tabla | 0                |
| countries                   | tabla | 0                |
| country_translations        | tabla | 0                |
| currencies                  | tabla | 8                |
| currency_translations       | tabla | 0                |
| document_number_formats     | tabla | 0                |
| exchange_rate_types         | tabla | 0                |
| exchange_rates              | tabla | 0                |
| fiscal_document_types       | tabla | 0                |
| fiscal_regimes              | tabla | 0                |
| holidays                    | tabla | 0                |
| languages                   | tabla | 3                |
| municipalities              | tabla | 0                |
| numbering_series            | tabla | 0                |
| payment_forms               | tabla | 5                |
| payment_methods             | tabla | 0                |
| price_list_items            | tabla | 0                |
| price_lists                 | tabla | 0                |
| sectors                     | tabla | 0                |
| state_province_translations | tabla | 0                |
| state_provinces             | tabla | 0                |
| timezones                   | tabla | 0                |
