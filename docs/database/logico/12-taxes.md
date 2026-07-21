# Modelo Lógico — Taxes (`taxes`)

Dueño único del catálogo y cálculo de impuestos (ITBIS/IVA, ISR,
retenciones, exenciones, percepciones). `sales`/`purchases` solo
referencian `tax_rates` — nunca recalculan una tasa por su cuenta. El
libro de IVA ventas/compras es una vista sobre `sales.invoice_lines` /
`purchases.purchase_invoice_lines` + `tax_rates` (ver
[24_views.sql](../sql/24_views.sql)), no una tabla base — la
declaración periódica sí se congela como tabla real por su valor legal.

| Tabla                        | Propósito                                                                 | FKs no-universales                                                                           |
| ---------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `taxes`                      | Impuesto (ITBIS, IVA, ISR, impuesto local específico)                     | `jurisdiction_id → tax_jurisdictions`                                                        |
| `tax_translations`           | Nombre del impuesto por idioma                                            | `tax_id → taxes`, `language_code`                                                            |
| `tax_rates`                  | Tasa vigente de un impuesto, con vigencia desde/hasta (histórico)         | `tax_id → taxes`                                                                             |
| `tax_jurisdictions`          | Jurisdicción fiscal (país, estado/provincia) que define el régimen        | `country_id → configuration.countries`                                                       |
| `tax_rules`                  | Regla de aplicabilidad (qué categoría de producto/tipo de cliente aplica) | `tax_id → taxes`                                                                             |
| `withholding_rules`          | Regla de retención (ISR, IVA retenido) por tipo de proveedor/servicio     | `jurisdiction_id → tax_jurisdictions`                                                        |
| `withholding_certificates`   | Comprobante de retención emitido/recibido                                 | `withholding_rule_id → withholding_rules`, `source_module`, `source_entity_id` (polimórfico) |
| `tax_exemptions`             | Exención aplicable a un cliente/producto                                  | `tax_id → taxes`                                                                             |
| `tax_exemption_certificates` | Certificado que respalda la exención                                      | `exemption_id → tax_exemptions`, `document_id → core.documents`                              |
| `tax_perceptions`            | Percepción aplicable (régimen específico de algunos países)               | `jurisdiction_id → tax_jurisdictions`                                                        |
| `tax_perception_rules`       | Regla de cálculo de la percepción                                         | `perception_id → tax_perceptions`                                                            |
| `tax_declarations`           | Declaración periódica presentada ante la autoridad fiscal (congelada)     | `fiscal_period_id → accounting.fiscal_periods`                                               |
| `tax_declaration_lines`      | Detalle de la declaración                                                 | `declaration_id → tax_declarations`, `tax_id → taxes`                                        |

**Total: 13 tablas.**
