# Modelo Lógico — Banks (`banks`)

El catálogo de entidades financieras (nombre, código SWIFT) vive en
`configuration.banks` — este módulo es dueño de las cuentas de la
empresa y sus movimientos, no del catálogo de bancos del mercado.

| Tabla                       | Propósito                                                       | FKs no-universales                                                                      |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `bank_accounts`             | Cuenta bancaria de la empresa                                   | `bank_id → configuration.banks`, `company_id`                                           |
| `checkbooks`                | Talonario de cheques asociado a una cuenta                      | `bank_account_id → bank_accounts`                                                       |
| `checks_issued`             | Cheque emitido por la empresa                                   | `checkbook_id → checkbooks`, `supplier_id → suppliers.suppliers` (ID suelto)            |
| `checks_received`           | Cheque recibido de un cliente, en cartera o depositado          | `bank_account_id → bank_accounts`, `customer_id → customers.customers` (ID suelto)      |
| `bank_transfers`            | Transferencia emitida/recibida                                  | `bank_account_id → bank_accounts`                                                       |
| `bank_deposits`             | Depósito (efectivo de caja o cheques recibidos)                 | `bank_account_id → bank_accounts`, `cash_register_id → cash.cash_registers` (ID suelto) |
| `bank_reconciliations`      | Proceso de conciliación de un período                           | `bank_account_id → bank_accounts`                                                       |
| `bank_reconciliation_lines` | Emparejamiento movimiento propio ↔ línea de extracto            | `reconciliation_id → bank_reconciliations`                                              |
| `bank_statements`           | Extracto bancario importado                                     | `bank_account_id → bank_accounts`                                                       |
| `bank_statement_lines`      | Línea del extracto                                              | `statement_id → bank_statements`                                                        |
| `bank_cards`                | Tarjeta (débito/crédito) asociada a una cuenta                  | `bank_account_id → bank_accounts`                                                       |
| `bank_pos_terminals`        | Terminal POS bancario (datáfono) registrado                     | `bank_account_id → bank_accounts`, `branch_id`                                          |
| `bank_payment_batches`      | Lote de pago masivo generado para el banco (proveedores/nómina) | `bank_account_id → bank_accounts`                                                       |
| `bank_payment_batch_lines`  | Pago individual dentro del lote                                 | `batch_id → bank_payment_batches`                                                       |

**Total: 14 tablas.**
