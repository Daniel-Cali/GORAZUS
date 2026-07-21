# Modelo Lógico — Payroll (`payroll`)

Consume datos maestros de `hr` (empleado, contrato, ausencias) por ID
suelto — nunca los duplica. Publica hacia `accounting` (asiento) y
`banks` (lote de pago, reutilizando `banks.bank_payment_batches`).

## Estructura salarial

| Tabla                       | Propósito                                                                    | FKs no-universales                                                  |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `concept_types`             | Tipo de concepto (haber, descuento, aporte patronal)                         | —                                                                   |
| `payroll_concepts`          | Concepto de nómina (sueldo básico, horas extra, bono) con fórmula de cálculo | `concept_type_id → concept_types`                                   |
| `salary_structures`         | Estructura salarial por puesto/categoría                                     | `job_position_id → hr.job_positions` (ID suelto)                    |
| `salary_structure_concepts` | Conceptos aplicables a una estructura, con fórmula/monto override (N:M)      | `structure_id → salary_structures`, `concept_id → payroll_concepts` |
| `tax_withholding_tables`    | Tramos de retención de impuesto sobre la renta                               | `company_id`                                                        |
| `social_security_tables`    | Tabla de aportes/contribuciones (AFP, ARS, seguridad social)                 | `company_id`                                                        |

## Liquidación

| Tabla                        | Propósito                                                                      | FKs no-universales                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `payroll_periods`            | Período a liquidar (mensual, quincenal)                                        | `company_id`                                                                                              |
| `payroll_runs`               | Corrida de cálculo masivo de un período                                        | `period_id → payroll_periods`                                                                             |
| `payroll_run_status`         | Catálogo de estados (calculando, calculado, cerrado)                           | `company_id`                                                                                              |
| `payroll_run_status_history` | Historial de transición                                                        | `run_id → payroll_runs`, `status_id → payroll_run_status`                                                 |
| `payroll_entries`            | Liquidación individual de un empleado dentro de una corrida (recibo de sueldo) | `run_id → payroll_runs`, `employee_id → hr.employees` (ID suelto)                                         |
| `payroll_entry_lines`        | Desglose de conceptos aplicados                                                | `entry_id → payroll_entries`, `concept_id → payroll_concepts`                                             |
| `payroll_novelties`          | Ajuste manual puntual fuera de la estructura estándar                          | `employee_id → hr.employees`, `period_id → payroll_periods`                                               |
| `overtime_records`           | Horas extra registradas para el período                                        | `employee_id → hr.employees`, `period_id → payroll_periods`                                               |
| `payroll_commission_entries` | Comisión de `sales.commission_entries` incorporada a la liquidación            | `payroll_entry_id → payroll_entries`, `source_commission_entry_id → sales.commission_entries` (ID suelto) |

## Préstamos y beneficios

| Tabla                          | Propósito                                                    | FKs no-universales                                                         |
| ------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `loans`                        | Préstamo a empleado con plan de cuotas                       | `employee_id → hr.employees`                                               |
| `loan_installments`            | Cuota de préstamo a descontar en nómina                      | `loan_id → loans`, `payroll_entry_id → payroll_entries` (cuando se aplica) |
| `employee_benefits`            | Catálogo de beneficios recurrentes (seguro, vale, bono fijo) | `company_id`                                                               |
| `employee_benefit_assignments` | Beneficio asignado a un empleado                             | `benefit_id → employee_benefits`, `employee_id → hr.employees`             |
| `deductions`                   | Descuento recurrente asignado a un empleado (cuota sindical) | `employee_id → hr.employees`                                               |

## Liquidaciones especiales

| Tabla                           | Propósito                                | FKs no-universales                                                       |
| ------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `severance_calculations`        | Liquidación final (finiquito) por egreso | `employee_id → hr.employees`                                             |
| `thirteenth_month_calculations` | Aguinaldo/bono legal anual               | `employee_id → hr.employees`, `fiscal_year_id → accounting.fiscal_years` |

**Total: 22 tablas.**
