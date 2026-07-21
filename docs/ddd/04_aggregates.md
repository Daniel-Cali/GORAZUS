# 04 — Aggregates

> Aplica el patrón "módulo dueño" (`Aggregate Root` DDD-táctico, ya
> nombrado en
> [32-core-platform/09 §6](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#6-aggregate-root))
> a las tablas raíz identificadas en
> [database/TABLE_CATALOG.md](../database/TABLE_CATALOG.md). No se crea
> ninguna clase base nueva — `Base Entity` ya cubre la parte
> estructural. Este documento decide, para cada agregado, **cuál es la
> raíz, qué entra dentro de su límite de consistencia transaccional, y
> qué invariante protege** — la parte que antes no estaba explícita
> tabla por tabla.

**Regla aplicada de forma consistente:** una tabla `*_lines`,
`*_status_history` o de detalle 1:N nunca es su propio agregado — vive
dentro del agregado de su cabecera y nunca se modifica sin pasar por el
repositorio de la raíz (regla ya fijada en
[32-core-platform/09 §6](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#6-aggregate-root)).

## 1. Agregados detallados (Core Subdomains + ejemplos del pedido)

### 1.1 Producto

- **Root:** `products.products`.
- **Entidades hijas:** `product_variant_attribute_values` (variantes),
  `product_barcodes`, `product_images`, `product_suppliers`,
  `product_tax_profiles`, `product_price_history` (histórico,
  append-only — nunca editado, solo insertado).
- **Value Objects:** `Precio`/`Dinero`, `Peso`, `Volumen`, `Medidas`
  (dimensiones físicas), `Porcentaje` (margen).
- **Invariantes:** el código/SKU es único dentro del tenant; un
  Producto con Movimientos de Inventario o líneas de Factura asociadas
  nunca se elimina físicamente (solo `is_active = false`, columna
  universal); una Variante no puede existir sin al menos un valor para
  cada atributo que la define.
- **Eventos:** `ProductoCreado`, `ProductoActualizado`,
  `ProductoDescontinuado`.
- **Repositorio:** `ProductoRepository` (agregado completo con
  `include` de variantes/atributos en una sola consulta — ver
  [09_repositories.md](./09_repositories.md)).

### 1.2 Cliente

- **Root:** `customers.customers`.
- **Entidades hijas:** `customer_addresses`, `customer_contacts`,
  `customer_bank_accounts`, `customer_credit_profiles`,
  `customer_discounts`.
- **Value Objects:** `Dirección`, `Correo`, `Teléfono`, `Dinero`
  (límite de crédito).
- **Invariantes:** un Cliente bloqueado (`is_blocked`) no puede ser
  destino de un nuevo Pedido de Venta (verificado por la especificación
  `ClienteActivo`, ver [11_specifications.md](./11_specifications.md));
  el saldo de cuenta corriente nunca se edita directamente — solo se
  deriva de eventos de Factura/Pago.
- **Eventos:** `ClienteCreado`, `ClienteActualizado`,
  `ClienteBloqueado`.
- **Repositorio:** `ClienteRepository`.

### 1.3 Proveedor

- **Root:** `suppliers.suppliers`.
- **Entidades hijas:** `supplier_addresses`, `supplier_contacts`,
  `supplier_bank_accounts`, `supplier_credit_profiles`,
  `supplier_evaluations` + `supplier_evaluation_scores`.
- **Value Objects:** `Dirección`, `Correo`, `Teléfono`, `Dinero`.
- **Invariantes:** un Proveedor bloqueado no puede ser destino de una
  nueva Orden de Compra; una Evaluación no puede editarse una vez
  cerrado el período que evalúa.
- **Eventos:** `ProveedorCreado`, `ProveedorActualizado`,
  `ProveedorBloqueado`.
- **Repositorio:** `ProveedorRepository`.

### 1.4 Pedido de Venta ("Orden de Venta")

- **Root:** `sales.sales_orders`.
- **Entidades hijas:** `sales_order_lines`, `sales_order_status_history`.
- **Value Objects:** `Dinero` (totales), `Porcentaje` (descuento),
  `Cantidad`.
- **Invariantes:** la suma de líneas debe coincidir con el total de
  cabecera; no se puede confirmar un Pedido si `StockDisponible`
  (especificación, ver 11) es falso para alguna línea sin backorder
  explícito; un Pedido confirmado no vuelve a `Borrador`.
- **Eventos:** `VentaConfirmada`, `PedidoVentaAnulado`.
- **Repositorio:** `PedidoVentaRepository`.

### 1.5 Factura de Venta

- **Root:** `sales.invoices`.
- **Entidades hijas:** `invoice_lines`, `invoice_status_history`.
- **Value Objects:** `Dinero`, `Impuesto` (desglose por línea).
- **Invariantes:** una Factura emitida **nunca se elimina ni se edita**
  (Invariante dura — ver [17_invariants.md](./17_invariants.md)); toda
  reversión pasa exclusivamente por una Nota de Crédito nueva que la
  referencia.
- **Eventos:** `VentaConfirmada` (la Factura es el artefacto que
  materializa este evento), `FacturaAnulada`.
- **Repositorio:** `FacturaVentaRepository`.

### 1.6 Orden de Compra

- **Root:** `purchases.purchase_orders`.
- **Entidades hijas:** `purchase_order_lines`,
  `purchase_order_status_history`.
- **Value Objects:** `Dinero`, `Cantidad`.
- **Invariantes:** no se puede recibir mercancía (`Recepción`) por
  cantidad mayor a la pendiente de una línea de Orden de Compra sin
  marcarla explícitamente como "recepción parcial excedida" (regla de
  tolerancia, configurable por tenant).
- **Eventos:** `OrdenCompraConfirmada` (nuevo, ver
  [07_domain_events.md](./07_domain_events.md)), `RecepcionConfirmada`.
- **Repositorio:** `OrdenCompraRepository`.

### 1.7 Factura de Compra

- **Root:** `purchases.purchase_invoices`.
- **Entidades hijas:** `purchase_invoice_lines`,
  `purchase_invoice_matching` (conciliación 3 vías OC-Recepción-Factura),
  `purchase_invoice_status_history`.
- **Value Objects:** `Dinero`, `Impuesto`.
- **Invariantes:** el matching de 3 vías debe cuadrar dentro de la
  tolerancia configurada antes de aprobar el pago (regla de negocio ya
  cubierta por `Business Rules Engine`).
- **Eventos:** `FacturaCompraRegistrada`.
- **Repositorio:** `FacturaCompraRepository`.

### 1.8 Inventario (Existencia + Movimiento)

Se modelan **dos agregados distintos**, no uno — decisión explícita
porque tienen ciclos de vida y reglas de consistencia diferentes:

- **Existencia** (`inventory.stock`): raíz mutable, representa el
  saldo actual de un Producto en un Almacén (+ Lote/Serie si aplica).
  Invariante: `cantidad_disponible = cantidad_física - cantidad_reservada`,
  nunca negativa (Invariante dura, ver 17).
- **Movimiento de Inventario** (`inventory.stock_movements`): raíz
  **inmutable, append-only** — nunca se actualiza ni se elimina un
  Movimiento ya registrado; una corrección siempre se hace con un
  Movimiento nuevo de signo contrario, nunca editando el original
  (mismo principio que Factura/Nota de Crédito).
- **Entidades hijas de Existencia:** `fifo_cost_layers`/
  `lifo_cost_layers`/`average_cost_history` (capas de costo, ver
  `CalcularCostoPromedio`/`AplicarFIFO` en
  [08_domain_services.md](./08_domain_services.md)), `stock_reservations`.
- **Value Objects:** `Cantidad`, `Dinero` (costo unitario).
- **Eventos:** `StockActualizado`, `StockInsuficiente`.
- **Repositorios:** `ExistenciaRepository`, `MovimientoInventarioRepository`
  (de solo escritura-append, sin `update`/`delete` expuestos).

### 1.9 Caja

- **Root:** `cash.cash_registers`.
- **Entidades hijas:** `cash_register_openings`, `cash_register_closings`,
  `cash_counts` + `cash_count_lines`.
- **Value Objects:** `Dinero`.
- **Invariantes:** no se puede abrir una Caja que ya está abierta; no
  se cierra una Caja con diferencia entre saldo contado y saldo
  esperado sin una justificación explícita registrada (Invariante
  dura, ver 17).
- **Eventos:** `CajaAbierta`, `CajaCerrada`.
- **Repositorio:** `CajaRepository`. `Movimiento de Caja`
  (`cash.cash_movements`) es su propio agregado, inmutable, análogo a
  Movimiento de Inventario.

### 1.10 Asiento Contable

- **Root:** `accounting.journal_entries`.
- **Entidades hijas:** `journal_entry_lines`,
  `journal_entry_dimension_values`, `journal_entry_status_history`.
- **Value Objects:** `Dinero`.
- **Invariantes:** **suma(Débitos) = suma(Créditos)**, siempre, sin
  excepción (Invariante dura fundamental de toda la contabilidad, ver
  17); un Asiento de un Período Contable cerrado no se modifica.
- **Eventos:** ninguno saliente propio — es el sumidero de los eventos
  de otros contextos (ver
  [13_integration_events.md](./13_integration_events.md)).
- **Repositorio:** `AsientoContableRepository`.

### 1.11 Empleado

- **Root:** `hr.employees`.
- **Entidades hijas:** `employee_contracts`, `employee_dependents`,
  `employee_emergency_contacts`, `employee_bank_accounts`,
  `employee_skills`.
- **Value Objects:** `Dirección`, `Correo`, `Teléfono`, `Dinero`
  (salario).
- **Invariantes:** un Empleado no puede tener dos Contratos activos
  simultáneos en la misma Empresa.
- **Eventos:** `EmpleadoContratado`, `EmpleadoDadoDeBaja`.
- **Repositorio:** `EmpleadoRepository`.

## 2. Catálogo completo de agregados restantes

| Agregado                    | Root                               | Entidades hijas principales                                                                  | Invariante clave                                        | Eventos                                             | Repositorio                      |
| --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| Cotización                  | `sales.quotes`                     | `quote_lines`, `quote_status_history`                                                        | vencida no se puede confirmar                           | `CotizacionEmitida`, `CotizacionVencida`            | `CotizacionRepository`           |
| Nota de Crédito             | `sales.credit_notes`               | `credit_note_lines`                                                                          | siempre referencia una Factura existente                | `NotaCreditoEmitida`                                | `NotaCreditoRepository`          |
| Devolución de Venta         | `sales.sales_returns`              | `sales_return_lines`                                                                         | genera Movimiento de entrada correspondiente            | `DevolucionVentaRegistrada`                         | `DevolucionVentaRepository`      |
| BOM / Receta                | `products.bill_of_materials`       | `bom_components`                                                                             | no puede referenciarse a sí misma (ciclo)               | `BOMActualizado`                                    | `BOMRepository`                  |
| Almacén                     | `inventory.warehouses`             | `warehouse_locations`, `warehouse_zones`                                                     | no se elimina con Existencias > 0                       | `AlmacenCreado`                                     | `AlmacenRepository`              |
| Transferencia de Inventario | `inventory.stock_transfers`        | `stock_transfer_lines`                                                                       | origen ≠ destino                                        | `TransferenciaCompletada`                           | `TransferenciaRepository`        |
| Ajuste de Inventario        | `inventory.stock_adjustments`      | `stock_adjustment_lines`                                                                     | requiere motivo (`stock_adjustment_reasons`)            | `AjusteInventarioAplicado`                          | `AjusteInventarioRepository`     |
| Conteo Físico               | `inventory.physical_counts`        | `physical_count_lines`                                                                       | genera Ajuste solo si hay diferencia                    | `ConteoFisicoCompletado`                            | `ConteoFisicoRepository`         |
| Recepción                   | `purchases.goods_receipt_notes`    | `goods_receipt_note_lines`                                                                   | cantidad ≤ pendiente de Orden de Compra (± tolerancia)  | `RecepcionConfirmada`                               | `RecepcionRepository`            |
| Cuenta Bancaria             | `banks.bank_accounts`              | `bank_cards`                                                                                 | —                                                       | `CuentaBancariaCreada`                              | `CuentaBancariaRepository`       |
| Conciliación Bancaria       | `banks.bank_reconciliations`       | `bank_reconciliation_lines`                                                                  | diferencia final = 0 al completar                       | `ConciliacionCompletada`                            | `ConciliacionBancariaRepository` |
| Presupuesto Contable        | `accounting.budgets`               | `budget_lines`                                                                               | no excede el período fiscal asociado                    | `PresupuestoAprobado`                               | `PresupuestoRepository`          |
| Oportunidad                 | `crm.opportunities`                | `opportunity_lines`                                                                          | al pasar a "Ganada" dispara comando síncrono a `ventas` | `OportunidadGanada`, `OportunidadPerdida`           | `OportunidadRepository`          |
| Liquidación de Nómina       | `payroll.payroll_runs`             | `payroll_entries` + `payroll_entry_lines`                                                    | no se re-liquida un período ya cerrado                  | `LiquidacionCerrada`                                | `LiquidacionRepository`          |
| Orden de Producción         | `inventory.production_orders`      | `production_order_components`, `production_order_outputs`, `production_order_status_history` | consumo real no excede lo planificado sin justificación | `OrdenProduccionLiberada`, `OrdenProduccionCerrada` | `OrdenProduccionRepository`      |
| Orden de Servicio           | `services.service_orders`          | `service_order_lines`, `service_order_status_history`                                        | requiere Técnico asignado antes de "En progreso"        | `OrdenServicioCerrada`                              | `OrdenServicioRepository`        |
| Contrato de Servicio        | `services.service_contracts`       | —                                                                                            | genera Órdenes de Servicio automáticas según SLA        | `ContratoServicioActivado`                          | `ContratoServicioRepository`     |
| Activo Fijo                 | `assets.fixed_assets`              | `asset_depreciation_entries`, `asset_transfers`, `asset_maintenances`                        | no se da de baja sin aprobación (Approval Engine)       | `DepreciacionCalculada`, `ActivoDadoDeBaja`         | `ActivoFijoRepository`           |
| Proyecto                    | `projects.projects`                | `project_tasks`, `project_budgets`, `project_timesheets`                                     | Tareas no exceden el presupuesto sin alerta             | `ProyectoCerrado`, `HitoFacturado`                  | `ProyectoRepository`             |
| Declaración de Impuesto     | `taxes.tax_declarations`           | `tax_declaration_lines`                                                                      | no se re-presenta una declaración ya aceptada           | `DeclaracionPresentada`                             | `DeclaracionImpuestoRepository`  |
| Certificado de Retención    | `taxes.withholding_certificates`   | —                                                                                            | inmutable una vez emitido                               | `RetencionEmitida`                                  | `RetencionRepository`            |
| Grupo Corporativo           | `core.corporate_groups` _(Fase 5)_ | `core.corporate_group_members`                                                               | una Empresa pertenece a lo sumo a un Grupo              | `GrupoCorporativoCreado`                            | `GrupoCorporativoRepository`     |

## 3. Regla de tamaño de agregado

Todos los agregados de este catálogo son deliberadamente pequeños
(raíz + detalle directo, nunca varios niveles de sub-agregados
anidados) — el mismo criterio que
[32-core-platform/09 §6](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#6-aggregate-root)
ya fija como estrategia de escalabilidad: agregados pequeños son lo que
permite que, ante una eventual extracción a microservicio, cada uno se
mueva completo sin partir su consistencia transaccional. Ninguna
referencia entre dos agregados de este catálogo es una carga en
cascada — siempre es un ID suelto o una consulta síncrona al
repositorio del otro agregado (nunca un `include` cruzando límites de
agregado).

## 4. Trazabilidad

Fuente de cada raíz: `database/TABLE_CATALOG.md` (tablas reales,
verificadas en vivo en la auditoría de Fase 1). Los pocos eventos
marcados sin antecedente previo en `12-backend-enterprise.md §6.3`
(p. ej. `ProductoDescontinuado`, `EmpleadoContratado`,
`OrdenProduccionLiberada`) se definen formalmente recién en
[07_domain_events.md](./07_domain_events.md), siguiendo la convención
de nombrado ya fijada — no son funcionalidad nueva, son el nombre que
faltaba para un hecho de negocio que el modelo de datos ya soporta.

**Siguiente documento:** [05_entities.md](./05_entities.md).
