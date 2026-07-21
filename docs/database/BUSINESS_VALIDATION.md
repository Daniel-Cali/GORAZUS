# Business Validation — GORAZUS (Ferretería Enterprise)

> "Database Enterprise v1.0" — Fase 1, Parte 6 (2026-07-21). Simulación
> completa del funcionamiento de una ferretería/distribuidor real contra
> el modelo de datos ya auditado en las Partes 1-5. **Nota de continuidad
> de rama:** se sigue trabajando en `feature/database-audit` (no se crea
> `feature/database-business-validation`) para no fragmentar el historial
> de esta auditoría de 6 partes en 3 ramas distintas — mismo criterio ya
> aplicado en la Parte 5. Cero DDL aplicado — validación funcional contra
> el modelo real, sin cambios estructurales.

## 1. Metodología

Para cada proceso pedido, se verifica: (a) existe la tabla/cadena de
tablas real que lo soporta (ya inventariada en Partes 1-5), (b) el
Application Service/Domain Event correspondiente ya está diseñado en
`docs/ddd/`, (c) si algo falta, se documenta como gap real en
[FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md), nunca se inventa una tabla
nueva sin marcarla explícitamente como recomendación pendiente de
autorización.

## 2. Apertura del negocio y configuración inicial

| Proceso simulado              | Soportado | Tablas/mecanismo                                                                                         |
| ----------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Creación de empresa           | ✅        | `core.companies`                                                                                         |
| Creación de sucursales        | ✅        | `core.branches`                                                                                          |
| Creación de almacenes         | ✅        | `inventory.warehouses` + `warehouse_locations`/`warehouse_zones`                                         |
| Creación de usuarios          | ✅        | `core.users`                                                                                             |
| Asignación de permisos        | ✅        | `security.role_permissions`, `core.user_roles` (RBAC ya implementado en código real, `auth`/`seguridad`) |
| Registro de proveedores       | ✅        | `suppliers.suppliers`                                                                                    |
| Registro de clientes          | ✅        | `customers.customers`                                                                                    |
| Registro de productos         | ✅        | `products.products`                                                                                      |
| Registro de listas de precios | ✅        | `configuration.price_lists` + `price_list_items`                                                         |
| Registro de impuestos         | ✅        | `taxes.taxes` + `tax_rates`                                                                              |

**10 de 10 procesos de apertura soportados sin excepción.**

## 3. Catálogo de productos — los 19 rubros pedidos

| Rubro                                                                                                                                                                                            | Soportado  | Cómo                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Herramientas, Pinturas, Cemento, Arena, Grava, Hierro, Tubos, PVC, Electricidad, Plomería, Maderas, Tornillería, Ferretería Industrial, Lubricantes, Repuestos, Equipos de seguridad, Maquinaria | ✅         | Jerarquía configurable `product_categories`/`product_families`/`product_lines` — un rubro = una categoría con sus atributos, sin tabla propia por rubro (decisión ya justificada, `AUDIT_DATABASE_ENTERPRISE_V2_FERRETERIA.md §4`) |
| Materiales peligrosos                                                                                                                                                                            | 🟡 Parcial | Categorizable como rubro, pero sin campo dedicado de clasificación regulatoria — gap ya conocido, ver [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md)                                                                                   |
| Productos químicos                                                                                                                                                                               | 🟡 Parcial | Mismo gap — clasificable por categoría, sin hoja de seguridad estructurada                                                                                                                                                         |

**17 de 19 rubros con soporte completo, 2 parciales (mismo gap ya
identificado en la Parte 1, no nuevo).**

## 4. Validación de productos — las 20 capacidades pedidas

| Capacidad                                                               | Soportado | Detalle                                                                                                                                                                 |
| ----------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Por unidad, metro, kilogramo, libra, galón, litro, caja, paquete, rollo | ✅        | `products.units_of_measure` (catálogo abierto de unidades) + `unit_conversions` — cualquier unidad de medida es una fila de configuración, no requiere cambio de schema |
| Fraccionables                                                           | ✅        | `inventory.stock.quantity_on_hand numeric(18,6)`                                                                                                                        |
| Con variantes                                                           | ✅        | `product_variant_attribute_values`                                                                                                                                      |
| Con series                                                              | ✅        | `tracks_serial` + `inventory.inventory_serials`                                                                                                                         |
| Con lotes                                                               | ✅        | `tracks_lot` + `inventory.inventory_lots`                                                                                                                               |
| Con garantía                                                            | ✅        | `sales.warranties`                                                                                                                                                      |
| Con múltiples proveedores                                               | ✅        | `products.product_suppliers`                                                                                                                                            |
| Sustitutos, relacionados, compatibles                                   | ✅        | `product_related_products.relation_type`                                                                                                                                |
| Combos                                                                  | ✅        | `product_combos` + `product_combo_components`                                                                                                                           |
| Kits                                                                    | ✅        | `product_kits` + `product_kit_components`                                                                                                                               |

**20 de 20 capacidades soportadas.**

## 5. Compras — simulación del ciclo completo

| Paso simulado                  | Soportado                                          | Tablas                                                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solicitud de compra            | ✅                                                 | `purchases.purchase_requisitions`                                                                                                                                                                                |
| Cotización (de proveedor)      | ✅                                                 | `purchases.purchase_quotes`                                                                                                                                                                                      |
| **Comparación de proveedores** | 🔗 Soportado como consulta, no como entidad propia | Varias `purchase_quotes` con el mismo `requisition_id` (una por proveedor) — comparar es un reporte sobre esas filas, no requiere tabla de "comparación" (mismo criterio que el Kardex: derivado, no almacenado) |
| Orden de compra                | ✅                                                 | `purchases.purchase_orders`                                                                                                                                                                                      |
| Recepción parcial              | ✅                                                 | `goods_receipt_notes` acumulativas contra la misma Orden — el saldo pendiente se calcula, no se almacena (ver `RELATIONSHIP_CATALOG.md`)                                                                         |
| Recepción total                | ✅                                                 | Última recepción que salda la Orden — mismo mecanismo                                                                                                                                                            |
| Factura del proveedor          | ✅                                                 | `purchases.purchase_invoices` + `purchase_invoice_matching` (3 vías OC-Recepción-Factura)                                                                                                                        |
| Devolución                     | ✅                                                 | `purchases.purchase_returns`                                                                                                                                                                                     |
| Nota de crédito                | ✅                                                 | `purchases.purchase_credit_notes`                                                                                                                                                                                |
| Cuentas por pagar              | ✅                                                 | `v_accounts_payable_aging` (vista, `suppliers` schema)                                                                                                                                                           |

**10 de 10 pasos soportados.**

## 6. Inventario — las 17 capacidades pedidas

| Capacidad                          | Soportado | Detalle                                                                                                               |
| ---------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| Ingreso, Salida, Transferencia     | ✅        | `stock_movements`, `stock_transfers`                                                                                  |
| Reservas                           | ✅        | `stock_reservations`                                                                                                  |
| Picking, Packing                   | ✅        | `picking_rules`/`putaway_rules` (proceso operativo, ya diseñado en `19-modulo-inventory.md`)                          |
| Conteos, Conteos cíclicos          | ✅        | `physical_counts` + `cycle_count_schedules`                                                                           |
| Ajustes                            | ✅        | `stock_adjustments`                                                                                                   |
| Reposición                         | ✅        | `replenishment_rules`                                                                                                 |
| FIFO                               | ✅        | `fifo_cost_layers`                                                                                                    |
| Costo Promedio                     | ✅        | `average_cost_history`                                                                                                |
| **Costo Específico**               | ❌        | Gap real — ver [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md)                                                             |
| Stock mínimo/máximo                | ✅        | Parámetros de `replenishment_rules`                                                                                   |
| Inventario comprometido/disponible | ✅        | `cantidad_reservada`/`cantidad_disponible` ya modelados (`docs/ddd/04_aggregates.md §1.8`)                            |
| **Inventario en tránsito**         | ✅        | `stock_transfers.status = 'in_transit'` — confirmado explícitamente en esta pasada, valor real del `CHECK` constraint |

**15 de 17 capacidades soportadas, 1 gap real (Costo Específico), 1
confirmación nueva (tránsito, ya existía pero no estaba verificado
explícitamente).**

## 7. Ventas — simulación del ciclo completo

| Paso simulado         | Soportado | Tablas                                                                                                                                                                                                                                              |
| --------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cotización            | ✅        | `sales.quotes`                                                                                                                                                                                                                                      |
| Pedido                | ✅        | `sales.sales_orders`                                                                                                                                                                                                                                |
| Venta POS             | ✅        | Orquestación de `ventas`+`inventario`+`caja`, sin entidad propia (`docs/ddd/01_bounded_contexts.md`)                                                                                                                                                |
| Factura               | ✅        | `sales.invoices`                                                                                                                                                                                                                                    |
| Entrega parcial/total | ✅        | `delivery_notes` acumulativas contra el Pedido                                                                                                                                                                                                      |
| Cobro                 | ✅        | `sales.receipts`                                                                                                                                                                                                                                    |
| Pago mixto            | ✅        | `receipt_allocations` permite que un recibo cubra varias facturas y — por extensión del mismo patrón de cabecera/línea — un cobro puede registrarse con más de un `payment_method_id` mediante múltiples `receipts` asociados al mismo cobro lógico |
| Pago parcial          | ✅        | `receipt_allocations.amount_applied` puede ser menor al total de la factura                                                                                                                                                                         |
| Venta a crédito       | ✅        | Factura sin `receipt` asociado + `customer_credit_profiles.credit_limit` (Specification `CréditoDisponible`, `docs/ddd/11_specifications.md`)                                                                                                       |
| Devolución            | ✅        | `sales.sales_returns`                                                                                                                                                                                                                               |
| Nota de crédito       | ✅        | `sales.credit_notes`                                                                                                                                                                                                                                |
| Nota de débito        | ✅        | `sales.debit_notes`                                                                                                                                                                                                                                 |

**12 de 12 pasos soportados.**

## 8. Caja, Bancos, Contabilidad

| Proceso                                                  | Soportado | Tablas                                                                                                                                                    |
| -------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Caja: Apertura, Movimientos, Arqueo, Cierre, Diferencias | ✅        | `cash_registers`, `cash_movements`, `cash_counts`, `cash_register_closings` — diferencias ya cubiertas por el Invariante I5 (`docs/ddd/17_invariants.md`) |
| Bancos: Transferencias, Depósitos, Cheques, Conciliación | ✅        | `bank_transfers`, `bank_deposits`, `checks_issued`/`checks_received`, `bank_reconciliations`                                                              |
| Contabilidad: Asientos, Libro Diario/Mayor               | ✅        | `journal_entries` + `v_general_ledger`                                                                                                                    |
| Balance, Estado de Resultados, Flujo de Caja             | ✅        | `balance_sheet_snapshots`, `income_statement_snapshots`, `cash_flow_snapshots` — confirmado en esta pasada                                                |
| Centros de Costo                                         | ✅        | `accounting.cost_centers` — confirmado en esta pasada                                                                                                     |

**Todos los procesos de Caja/Bancos/Contabilidad soportados.**

## 9. Clientes y Proveedores

| Proceso                                                                                               | Soportado | Detalle                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clientes: Crédito, Límite, Historial, Direcciones múltiples, Contactos, Descuentos, Listas de precios | ✅        | `customer_credit_profiles`, `customer_addresses`, `customer_contacts`, `customer_discounts`, `customer_price_lists`                                                 |
| Proveedores: Catálogos, Tiempo de entrega, Historial, Calificación                                    | ✅        | `product_suppliers` (catálogo + `lead_time_days`), `supplier_history`, `supplier_evaluations`                                                                       |
| **Proveedores: Contratos**                                                                            | ❌        | Gap real — ver [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md)                                                                                                           |
| Proveedores: Condiciones de pago                                                                      | 🔗        | Vía `configuration.payment_methods`/términos en Orden de Compra, sin tabla de "condiciones negociadas" persistente por proveedor — parte del mismo gap de Contratos |

## 10. Reportes

| Reporte pedido                                                     | Soportado                                                                                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kardex                                                             | ✅ `v_kardex`                                                                                                                                          |
| Inventario valorizado                                              | ✅ derivado de `average_cost_history`/`fifo_cost_layers`                                                                                               |
| Rotación                                                           | ✅ derivado de `stock_movements` + `bi.kpis`                                                                                                           |
| Ventas, Compras, Clientes, Proveedores, Caja, Bancos, Contabilidad | ✅ `reports.report_definitions` (motor genérico) + vistas ya existentes (`v_accounts_receivable_aging`, `v_accounts_payable_aging`, `v_trial_balance`) |
| Utilidad, Rentabilidad                                             | ✅ derivado de `income_statement_snapshots` + `bi.kpis`                                                                                                |

**12 de 12 reportes soportados** — ninguno requiere tabla nueva, todos
son proyecciones sobre datos ya modelados.

## 11. Validación empresarial (entregable, por tamaño de empresa)

| Pregunta                                             | Respuesta                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ¿Soporta una empresa pequeña?                        | ✅ Sí — el modelo no impone mínimos                                                                                  |
| ¿Soporta una mediana?                                | ✅ Sí                                                                                                                |
| ¿Soporta una cadena nacional (múltiples sucursales)? | ✅ Sí — `branch_id` universal, sin límite estructural                                                                |
| ¿Soporta múltiples empresas?                         | ✅ Sí — `tenant_id`/`company_id` universal, + Grupo Corporativo (`core.corporate_groups`, Fase 5 de arquitectura)    |
| ¿Soporta múltiples sucursales?                       | ✅ Sí                                                                                                                |
| ¿Soporta miles de usuarios?                          | ✅ Sí — `core.users` sin límite estructural, RBAC ya diseñado                                                        |
| ¿Soporta millones de movimientos?                    | ✅ Sí — particionamiento aprovisionado en las 27 tablas de alto volumen (`stock_movements`, `journal_entries`, etc.) |

**Ninguna respuesta "No" — no se propone ningún rediseño estructural.**

## 12. Entregables 1-4 (resumen cuantitativo)

| Entregable                        | Resultado                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1. Procesos simulados             | ~95 procesos individuales, agrupados en 10 áreas (§2-10)                                         |
| 2. Procesos soportados            | ~91 de ~95 (96%)                                                                                 |
| 3. Procesos incompletos (parcial) | 2 (materiales peligrosos/químicos — clasificables por categoría, sin campo regulatorio dedicado) |
| 4. Procesos no soportados         | 2 (Costo Específico, Contratos de Proveedor) — ver [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md)    |

**Ver [FUNCTIONAL_GAPS.md](./FUNCTIONAL_GAPS.md) para el detalle completo
de los 4 gaps (2 nuevos de esta parte + 2 ya conocidos de partes
anteriores) con problema/justificación/beneficio/impacto/complejidad, y
[BUSINESS_RULES.md](./BUSINESS_RULES.md) para las reglas de negocio ya
verificadas.**
