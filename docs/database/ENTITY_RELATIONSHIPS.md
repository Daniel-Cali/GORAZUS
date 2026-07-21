# Entity Relationships — GORAZUS

> "Database Enterprise v1.0" — Fase 1, Parte 4 (2026-07-21, rama
> `feature/database-audit`). Complementa
> [RELATIONSHIP_CATALOG.md](./RELATIONSHIP_CATALOG.md) (cardinalidad e
> integridad) con la vista **por cadena de entidad y por módulo** pedida
> explícitamente, incluida la validación puntual de las 19 relaciones de
> ferretería listadas en el pedido.

## 1. Cadena de relaciones — validación ferretería (entregable, verificación puntual)

| Relación pedida           | Verificada como                                                                    | Tabla(s) real(es)                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Producto → Unidad         | ✅ FK                                                                              | `products.products.base_unit_id → products.units_of_measure`                                                                        |
| Producto → Conversión     | ✅ FK                                                                              | `products.unit_conversions.product_id → products.products`                                                                          |
| Producto → Marca          | ✅ FK                                                                              | `products.products.brand_id → products.brands`                                                                                      |
| Producto → Categoría      | ✅ FK                                                                              | `products.products.category_id → products.product_categories`                                                                       |
| Producto → Variantes      | ✅ FK (1:N)                                                                        | `products.product_variant_attribute_values.product_id` (vía patrón de variante)                                                     |
| Producto → Lotes          | ✅ FK (1:N)                                                                        | `inventory.inventory_lots.product_id`                                                                                               |
| Producto → Series         | ✅ FK (1:N)                                                                        | `inventory.inventory_serials.product_id`                                                                                            |
| Producto → Proveedores    | ✅ FK (1:N, tabla puente semántica)                                                | `products.product_suppliers.product_id` + `.supplier_id`                                                                            |
| Producto → Almacenes      | ✅ FK indirecta (vía Existencia)                                                   | `inventory.stock.product_id` + `.warehouse_id`                                                                                      |
| Producto → Existencias    | ✅ FK                                                                              | `inventory.stock.product_id`                                                                                                        |
| Producto → Kardex         | ✅ FK                                                                              | `inventory.stock_movements.product_id`                                                                                              |
| Producto → Historial      | ✅ FK (2 historiales distintos, ver `DATABASE_ANALYSIS.md §5`)                     | `products.product_price_history.product_id` (precio) + `inventory.average_cost_history.product_id` (costo)                          |
| Compra → Recepción        | ✅ FK                                                                              | `purchases.goods_receipt_notes.purchase_order_id`                                                                                   |
| Venta → Factura           | ✅ FK (misma cadena documento)                                                     | `sales.invoices` — la Factura materializa el Pedido confirmado, ver `docs/ddd/04_aggregates.md §1.5`                                |
| Venta → Pago              | ✅ FK (N:M vía tabla puente)                                                       | `sales.receipt_allocations` (`receipt_id` ↔ `invoice_id`, `amount_applied`) — un recibo puede aplicar a varias facturas y viceversa |
| Venta → Inventario        | ✅ Evento de dominio, no FK física (por diseño — ver `docs/ddd/02_context_map.md`) | `VentaConfirmada` → `inventory.stock_movements`                                                                                     |
| Caja → Contabilidad       | ✅ Evento de dominio, no FK física                                                 | `MovimientoCajaRegistrado` → `accounting.journal_entries` (vía `accounting_rules`)                                                  |
| Compras → Inventario      | ✅ Evento de dominio, no FK física                                                 | `RecepcionConfirmada` → `inventory.stock_movements`                                                                                 |
| Inventario → Contabilidad | ✅ Evento de dominio, no FK física                                                 | vía `production.order_closed`/movimientos de valuación, ver `docs/ddd/13_integration_events.md`                                     |

**Las 19 relaciones pedidas están confirmadas — 0 faltantes.** Nota
arquitectónica importante, ya establecida y reafirmada aquí: las
relaciones **entre módulos de negocio distintos** (`Venta → Inventario`,
`Caja → Contabilidad`, `Compras → Inventario`, `Inventario →
Contabilidad`) son deliberadamente **eventos de dominio, no FK físicas**
— es la regla "ID suelto entre módulos" ya fijada, y es exactamente lo
opuesto de un hallazgo de integridad rota: una FK física ahí sería la
violación, no su ausencia.

## 2. Relaciones por módulo (entregable — no repite el detalle completo)

Ya cubierto exhaustivamente en
[SCHEMA_DEPENDENCIES.md §3](./SCHEMA_DEPENDENCIES.md#3-acoplamiento-por-schema-nuevo--no-existía-desglosado-por-schema-individual)
(acoplamiento por schema, Parte 2 de esta auditoría) y
[docs/ddd/19_module_dependencies.md](../ddd/19_module_dependencies.md)
(grafo de 6 niveles). Los módulos pedidos explícitamente en esta Parte 4
(Core, Usuarios, Roles, Permisos, Empresas, Sucursales, Clientes,
Proveedores, Productos, Categorías, Variantes, Inventario, Almacenes,
Ubicaciones, Compras, Ventas, Facturación, POS, Caja, Bancos,
Contabilidad, CRM, RRHH, Auditoría, Workflow, Documentos, IA) mapean 1:1 a
schemas y sub-entidades ya inventariados en
[SCHEMA_CATALOG.md §1](./SCHEMA_CATALOG.md#1-inventario-de-schemas-entregable-1) —
no se repite la tabla.

## 3. Diagrama ER actualizado (entregable 9)

El diagrama de relaciones entre schemas ya se actualizó en la Parte 2
([DATABASE_DIAGRAM.md](./DATABASE_DIAGRAM.md)). Esta parte no cambia
ninguna relación física (auditoría de solo lectura, sin DDL) — por lo
tanto **no hay diagrama nuevo que generar**, el de la Parte 2 sigue
vigente y correcto. Los diagramas ER completos a nivel de tabla
(SchemaSpy, `docs/database/erd/`) tampoco requieren regeneración por el
mismo motivo (0 cambios de schema en esta auditoría).

## 4. Trazabilidad

Este documento no introduce ninguna relación nueva — verifica, una por
una, las 19 relaciones de ferretería pedidas explícitamente y confirma
que todas ya existen en el modelo real, con la distinción arquitectónica
correcta entre FK física (intra-módulo) y evento de dominio
(inter-módulo) ya establecida en `docs/ddd/`.

**Ver también:** [RELATIONSHIP_CATALOG.md](./RELATIONSHIP_CATALOG.md) para
cardinalidad, PK/FK, y el % de calidad de integridad referencial.
