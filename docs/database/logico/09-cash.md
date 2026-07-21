# Modelo Lógico — Cash (`cash`)

Cubre cajas administrativas y cajas de POS por igual (`cash_registers.register_type`).

| Tabla                    | Propósito                                             | FKs no-universales                                                                                              |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `cash_registers`         | Caja física/lógica                                    | `branch_id` (obligatoria)                                                                                       |
| `cash_register_openings` | Apertura de turno con monto inicial                   | `register_id → cash_registers`, `opened_by_user_id → core.users`                                                |
| `cash_register_closings` | Cierre de turno con monto final y diferencia          | `opening_id → cash_register_openings`, `closed_by_user_id → core.users`                                         |
| `cash_counts`            | Arqueo de caja (conteo físico)                        | `closing_id → cash_register_closings`                                                                           |
| `cash_count_lines`       | Desglose por denominación (billete/moneda × cantidad) | `cash_count_id → cash_counts`                                                                                   |
| `cash_movements`         | Movimiento de caja (ingreso/egreso)                   | `register_id → cash_registers`, `movement_type_id → cash_movement_types`, `opening_id → cash_register_openings` |
| `cash_movement_types`    | Catálogo de tipos de movimiento                       | `company_id`                                                                                                    |
| `cash_transfers`         | Transferencia de efectivo entre cajas                 | `source_register_id → cash_registers`, `destination_register_id → cash_registers`                               |
| `petty_cash_funds`       | Fondo de caja chica asignado a un responsable         | `custodian_user_id → core.users`                                                                                |
| `petty_cash_vouchers`    | Vale de caja chica pendiente de rendir                | `fund_id → petty_cash_funds`                                                                                    |
| `cash_refunds`           | Reembolso en efectivo (devolución de venta)           | `register_id → cash_registers`, `sales_return_id → sales.sales_returns`                                         |

**Total: 11 tablas.**
