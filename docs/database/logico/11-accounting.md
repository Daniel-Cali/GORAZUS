# Modelo Lógico — Accounting (`accounting`)

Consumidor puro de eventos de `sales`, `purchases`, `cash`, `banks`,
`payroll`, `assets` — nunca orquesta, solo contabiliza (ver
[04-catalogo-modulos-negocio.md](../../architecture/04-catalogo-modulos-negocio.md#contabilidad-como-consumidor-no-como-orquestador)).
Decisión de consolidación: **Libro Mayor/Auxiliar** (saldos corrientes
por cuenta) no son tablas base — son vistas materializadas sobre
`journal_entry_lines` (ver
[28_materialized_views.sql](../sql/28_materialized_views.sql)), porque
son 100% derivables y recalculables. Sí se materializan como tabla real
los **snapshots de estados financieros** una vez que un período cierra,
porque ahí sí hay valor legal en congelar el resultado tal como se
presentó, aunque se corrija después vía asiento de ajuste.

## Plan de cuentas y reglas

| Tabla                   | Propósito                                                                        | FKs no-universales                                                         |
| ----------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `chart_of_accounts`     | Cuenta contable, jerárquica (auto-referenciada)                                  | `parent_account_id → chart_of_accounts`, `account_type_id → account_types` |
| `account_types`         | Activo, pasivo, patrimonio, ingreso, gasto — con naturaleza (deudora/acreedora)  | —                                                                          |
| `accounting_rules`      | Mapeo de un evento de otro módulo (`VentaConfirmada`) a una plantilla de asiento | `company_id`                                                               |
| `accounting_rule_lines` | Línea débito/crédito de la plantilla, con cuenta o fórmula                       | `rule_id → accounting_rules`, `account_id → chart_of_accounts`             |

## Asientos

| Tabla                                 | Propósito                                                     | FKs no-universales                                                                                      |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `journal_entries`                     | Encabezado de asiento (manual o generado por regla)           | `fiscal_period_id → fiscal_periods`, `source_module`, `source_entity_id` (polimórfico si es automático) |
| `journal_entry_lines`                 | Línea débito/crédito                                          | `journal_entry_id → journal_entries`, `account_id → chart_of_accounts`, `cost_center_id → cost_centers` |
| `journal_entry_status`                | Catálogo de estados (borrador, mayorizado, reversado)         | `company_id`                                                                                            |
| `journal_entry_status_history`        | Historial de transición                                       | `journal_entry_id → journal_entries`, `status_id → journal_entry_status`                                |
| `recurring_journal_entry_templates`   | Plantilla de asiento recurrente (amortizaciones, previsiones) | `company_id`                                                                                            |
| `recurring_journal_entry_generations` | Registro de cada generación automática                        | `template_id → recurring_journal_entry_templates`, `journal_entry_id → journal_entries`                 |

## Dimensiones analíticas

| Tabla                            | Propósito                                                        | FKs no-universales                                                                                |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `cost_centers`                   | Centro de costo (sucursal, área, proyecto)                       | `company_id`                                                                                      |
| `profit_centers`                 | Centro de beneficio                                              | `company_id`                                                                                      |
| `accounting_dimensions`          | Dimensión analítica custom más allá de centro de costo/beneficio | `company_id`                                                                                      |
| `accounting_dimension_values`    | Valor posible de una dimensión                                   | `dimension_id → accounting_dimensions`                                                            |
| `journal_entry_dimension_values` | Asignación de valores de dimensión a una línea de asiento (N:M)  | `journal_entry_line_id → journal_entry_lines`, `dimension_value_id → accounting_dimension_values` |

## Presupuesto y ejercicios

| Tabla                 | Propósito                                                        | FKs no-universales                                                       |
| --------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `budgets`             | Presupuesto por ejercicio/centro de costo                        | `fiscal_year_id → fiscal_years`, `cost_center_id → cost_centers`         |
| `budget_lines`        | Monto presupuestado por cuenta/período                           | `budget_id → budgets`, `account_id → chart_of_accounts`                  |
| `fiscal_years`        | Ejercicio fiscal de una empresa                                  | `company_id`                                                             |
| `fiscal_periods`      | Período (mes) dentro de un ejercicio, con estado abierto/cerrado | `fiscal_year_id → fiscal_years`                                          |
| `period_closing_logs` | Auditoría de cierre/reapertura de un período                     | `fiscal_period_id → fiscal_periods`, `performed_by_user_id → core.users` |

## Estados financieros y ajustes especiales

| Tabla                        | Propósito                                                                                             | FKs no-universales                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `balance_sheet_snapshots`    | Balance General congelado a una fecha de cierre                                                       | `fiscal_period_id → fiscal_periods`  |
| `income_statement_snapshots` | Estado de Resultados congelado                                                                        | `fiscal_period_id → fiscal_periods`  |
| `cash_flow_snapshots`        | Estado de Flujo de Efectivo congelado                                                                 | `fiscal_period_id → fiscal_periods`  |
| `currency_revaluations`      | Revaluación de saldos en moneda extranjera al cierre                                                  | `fiscal_period_id → fiscal_periods`  |
| `ifrs_adjustments`           | Ajuste de conversión a NIIF sobre el registro contable local                                          | `journal_entry_id → journal_entries` |
| `account_reconciliations`    | Conciliación de una cuenta de control contra su auxiliar (p. ej. CxC contable vs. módulo `customers`) | `account_id → chart_of_accounts`     |

## Multiempresa: intercompañía y consolidación

| Tabla                              | Propósito                                                                                                                      | FKs no-universales                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `intercompany_transactions`        | Transacción entre dos empresas del mismo tenant (préstamo interno, transferencia de costos), con el asiento espejo en cada una | `source_company_id → core.companies`, `target_company_id → core.companies` |
| `consolidated_financial_snapshots` | Estado financiero consolidado de varias empresas del tenant                                                                    | `tenant_id`, `fiscal_period_id → fiscal_periods`                           |

**Total: 28 tablas.**
