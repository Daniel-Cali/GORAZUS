# Modelo Lógico — Configuration (`configuration`)

Catálogo puro consumido por todos los demás módulos. Ver reglas de
no-duplicación en
[01-modelo-conceptual §3](../01-modelo-conceptual.md#3-regla-de-no-duplicación-entre-módulos):
este módulo nunca contiene lógica ni transacciones, solo listas
maestras compartidas — casi todas sus tablas usan `tenant_id` con el
sentinela global (ver
[01-modelo-conceptual §1.1](../01-modelo-conceptual.md#11-columnas-universales))
porque son universales salvo que un tenant específico las sobrescriba.

## Monedas y geografía

| Tabla                         | Propósito                                                    | FKs no-universales                                             |
| ----------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| `currencies`                  | Catálogo ISO 4217 + monedas custom                           | —                                                              |
| `currency_translations`       | Nombre de la moneda por idioma                               | `currency_id → currencies`, `language_code`                    |
| `exchange_rates`              | Cotización diaria por par de monedas                         | `from_currency_id → currencies`, `to_currency_id → currencies` |
| `countries`                   | Catálogo ISO 3166                                            | —                                                              |
| `country_translations`        | Nombre del país por idioma                                   | `country_id → countries`, `language_code`                      |
| `state_provinces`             | Estado/provincia/departamento                                | `country_id → countries`                                       |
| `state_province_translations` | Nombre por idioma                                            | `state_province_id → state_provinces`, `language_code`         |
| `municipalities`              | Municipio/ciudad                                             | `state_province_id → state_provinces`                          |
| `sectors`                     | Sector/barrio/zona (nivel más fino, usado en rutas de venta) | `municipality_id → municipalities`                             |

## Formas y métodos de pago

| Tabla             | Propósito                                                                                                          | FKs no-universales                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `payment_forms`   | Categoría amplia (efectivo, cheque, transferencia, tarjeta, crédito)                                               | —                                                                                                |
| `payment_methods` | Instrumento específico habilitado para operar (p. ej. "Visa - Terminal Sucursal Norte")                            | `payment_form_id → payment_forms`, `bank_account_id → banks.bank_accounts` (ID suelto, opcional) |
| `banks`           | Catálogo de entidades financieras del mercado (nombre, código SWIFT) — `banks.bank_accounts` referencia esta tabla | —                                                                                                |

## Numeración y series

| Tabla                     | Propósito                                                                                                                                                                                                                                                                                                                                                  | FKs no-universales                   |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `numbering_series`        | Serie de numeración por tipo de comprobante, empresa y sucursal                                                                                                                                                                                                                                                                                            | `company_id`, `branch_id`            |
| `document_number_formats` | Patrón de formato de una serie (prefijo, longitud, sufijo)                                                                                                                                                                                                                                                                                                 | `series_id → numbering_series`       |
| `correlatives`            | Contador vigente de una serie (siguiente número a emitir, con lock **pesimista** `SELECT...FOR UPDATE` vía `fn_get_next_correlative` — ver [14-modulo-core.md §10](../../architecture/14-modulo-core.md#10-correlatives-configurationcorrelatives--dueño-real-configuration), deliberadamente distinto del optimistic locking universal vía `row_version`) | `series_id → numbering_series` (1:1) |

## Precios

| Tabla              | Propósito                                                                       | FKs no-universales                                                          |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `price_lists`      | Lista de precios (estructura general — consumida por `sales`/`customers`/`crm`) | `company_id`, `currency_id → currencies`                                    |
| `price_list_items` | Precio de un producto dentro de una lista                                       | `price_list_id → price_lists`, `product_id → products.products` (ID suelto) |

## Idioma, huso horario y calendario

| Tabla       | Propósito                                                                            | FKs no-universales       |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------ |
| `languages` | Catálogo de idiomas habilitados (ISO 639-1)                                          | —                        |
| `timezones` | Catálogo de husos horarios (IANA)                                                    | —                        |
| `holidays`  | Feriado/día no laborable, usado por `hr`/`payroll`/`services` para cálculo de plazos | `country_id → countries` |

## Cumplimiento fiscal multi-país

| Tabla                   | Propósito                                                                                                                                                                                                        | FKs no-universales       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `fiscal_regimes`        | Régimen tributario disponible por país (general, simplificado, exportador)                                                                                                                                       | `country_id → countries` |
| `fiscal_document_types` | Catálogo de tipos de comprobante legal por país (CFDI en México, DTE en Chile, NFe en Brasil, Factura A/B/C en Argentina) — determina qué formato de facturación electrónica usa `sales.electronic_invoice_logs` | `country_id → countries` |
| `exchange_rate_types`   | Tipo de cotización cuando un país tiene más de una tasa oficial (compra/venta/oficial/paralela)                                                                                                                  | `country_id → countries` |

**Total: 22 tablas.**
