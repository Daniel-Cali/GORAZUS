# Modelo Lógico — Customers (`customers`)

Nota de no-duplicación: los documentos adjuntos a un cliente usan
`core.documents` (polimórfico `source_module`/`source_entity_id`) — no
existe `customer_documents`. El vendedor (`salesperson`) vive en
`sales` (ver [07-sales.md](./07-sales.md)), no acá, porque sus atributos
(comisión, cuota) son de negocio de ventas, aunque este módulo lo
referencie. Todas las tablas incluyen las 18 columnas universales.

## Maestro de clientes

| Tabla                    | Propósito                                                                                         | FKs no-universales                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customers`              | Cliente: razón social/nombre, identificación fiscal, régimen, moneda preferida, vendedor asignado | `assigned_salesperson_id → sales.salespeople` (ID suelto, sin FK cruzada real — ver [01-modelo-conceptual §1.5](../01-modelo-conceptual.md#15-excepción-a-no-fk-entre-schemas)) |
| `customer_contacts`      | Persona de contacto dentro de una cuenta cliente                                                  | `customer_id → customers`                                                                                                                                                       |
| `customer_addresses`     | Dirección de facturación/entrega (`address_type` vía `CHECK`, no tabla catálogo)                  | `customer_id → customers`                                                                                                                                                       |
| `customer_bank_accounts` | Cuenta bancaria del cliente para débito directo/reembolsos                                        | `customer_id → customers`                                                                                                                                                       |

## Crédito y cuenta corriente

| Tabla                           | Propósito                                                                                        | FKs no-universales                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `customer_references`           | Referencias comerciales/personales para evaluación crediticia                                    | `customer_id → customers`                                     |
| `customer_credit_profiles`      | Límite de crédito vigente, condición de pago, día de corte                                       | `customer_id → customers` (1:1)                               |
| `customer_credit_limit_history` | Historial de cambios de límite de crédito, con aprobador                                         | `customer_id → customers`, `approved_by_user_id → core.users` |
| `customer_statements`           | Snapshot generado de estado de cuenta (valor probatorio/legal, no se recalcula retroactivamente) | `customer_id → customers`                                     |
| `customer_block_history`        | Historial de bloqueo/desbloqueo comercial, con motivo                                            | `customer_id → customers`                                     |

## Comercial

| Tabla                      | Propósito                                            | FKs no-universales                                                     |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `customer_discounts`       | Regla de descuento específica de un cliente          | `customer_id → customers`                                              |
| `customer_price_lists`     | Lista de precios asignada a un cliente               | `customer_id → customers`, `price_list_id → configuration.price_lists` |
| `customer_classifications` | Clasificación de riesgo/crédito (A/B/C)              | `company_id`                                                           |
| `customer_categories`      | Segmento de negocio (minorista, mayorista, gobierno) | `company_id`                                                           |

## Rutas y visitas

| Tabla                   | Propósito                                                     | FKs no-universales                                                                      |
| ----------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `sales_routes`          | Ruta geográfica de visita a clientes                          | `company_id`, `assigned_salesperson_id → sales.salespeople`                             |
| `sales_route_customers` | Clientes asignados a una ruta (N:M, con orden de visita)      | `route_id → sales_routes`, `customer_id → customers`                                    |
| `customer_visits`       | Registro de una visita realizada (geolocalización, resultado) | `customer_id → customers`, `route_id → sales_routes`, `visited_by_user_id → core.users` |

## Fidelización y canal digital

| Tabla                       | Propósito                                                       | FKs no-universales                                                                         |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `customer_loyalty_accounts` | Cuenta de puntos/fidelización de un cliente                     | `customer_id → customers` (1:1), `loyalty_program_id → sales.loyalty_programs` (ID suelto) |
| `customer_wishlist_items`   | Producto marcado como deseado por el cliente (canal e-commerce) | `customer_id → customers`, `product_id → products.products`                                |

**Total: 18 tablas.**
