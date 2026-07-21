# Modelo Lógico — Suppliers (`suppliers`)

Nota de no-duplicación: las compras reales viven en `purchases`, los
pagos reales en `banks`/`cash` — este módulo es dueño del **maestro**
de proveedores y su evaluación, no de las transacciones (ver
[04-catalogo-modulos-negocio.md](../../architecture/04-catalogo-modulos-negocio.md)).
Todas las tablas incluyen las 18 columnas universales.

## Maestro de proveedores

| Tabla                    | Propósito                                                                  | FKs no-universales        |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------- |
| `suppliers`              | Proveedor: razón social, identificación fiscal, condición de pago acordada | `company_id`              |
| `supplier_contacts`      | Persona de contacto                                                        | `supplier_id → suppliers` |
| `supplier_addresses`     | Dirección (`address_type` vía `CHECK`)                                     | `supplier_id → suppliers` |
| `supplier_bank_accounts` | Cuenta bancaria del proveedor para transferencia de pago                   | `supplier_id → suppliers` |

## Crédito y retenciones

| Tabla                           | Propósito                                                   | FKs no-universales                                                         |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `supplier_credit_profiles`      | Condiciones de crédito que el proveedor otorga a la empresa | `supplier_id → suppliers` (1:1)                                            |
| `supplier_credit_limit_history` | Historial de cambios                                        | `supplier_id → suppliers`                                                  |
| `supplier_withholding_profiles` | Régimen de retención por defecto aplicado a este proveedor  | `supplier_id → suppliers`, `withholding_rule_id → taxes.withholding_rules` |
| `supplier_block_history`        | Historial de bloqueo/desbloqueo, con motivo                 | `supplier_id → suppliers`                                                  |

## Clasificación y evaluación

| Tabla                          | Propósito                                                                                         | FKs no-universales                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `supplier_classifications`     | Categoría (bienes, servicios, importación)                                                        | `company_id`                                                                         |
| `supplier_evaluation_criteria` | Criterio de evaluación (calidad, plazo, precio) con ponderación                                   | `company_id`                                                                         |
| `supplier_evaluations`         | Evaluación periódica de un proveedor                                                              | `supplier_id → suppliers`, `evaluated_by_user_id → core.users`                       |
| `supplier_evaluation_scores`   | Puntaje por criterio dentro de una evaluación                                                     | `evaluation_id → supplier_evaluations`, `criteria_id → supplier_evaluation_criteria` |
| `supplier_history`             | Línea de tiempo de eventos clave del proveedor (cambios de clasificación, evaluaciones, bloqueos) | `supplier_id → suppliers`                                                            |

**Total: 13 tablas.**
