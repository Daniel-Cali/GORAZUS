# 08 — Domain Services

> Un Domain Service modela un proceso de negocio que no pertenece
> naturalmente a una sola entidad ni a un solo Aggregate Root — opera
> sobre varios, o encapsula un algoritmo que no tiene un "dueño de
> estado" claro. La mayoría de los solicitados por esta fase **ya
> tienen su algoritmo completamente diseñado** en los documentos de
> módulo existentes; este documento los nombra formalmente como Domain
> Services y referencia dónde vive cada uno, sin reimplementarlos.

## 1. Catálogo

### 1.1 `AplicarFIFO`

- **Objetivo:** determinar el costo de una salida de Inventario
  consumiendo las capas de costo más antiguas primero.
- **Opera sobre:** el agregado Existencia (`fifo_cost_layers`), no
  pertenece a Producto ni a Almacén individualmente.
- **Ya diseñado en:**
  [19-modulo-inventory.md §10](../architecture/19-modulo-inventory.md#10-fifo-inventoryfifo_cost_layers) —
  algoritmo completo de consumo de capas con trazabilidad a la
  recepción origen. No se repite aquí.
- **Contexto:** `inventario`.

### 1.2 `CalcularCostoPromedio`

- **Objetivo:** recalcular el costo promedio ponderado de un Producto
  en un Almacén tras cada entrada, cuando `costing_method = 'average'`.
- **Ya diseñado en:**
  [19-modulo-inventory.md §11](../architecture/19-modulo-inventory.md#11-promedio-inventoryaverage_cost_history) —
  fórmula de recálculo completa.
- **Contexto:** `inventario`. Mutuamente excluyente con `AplicarFIFO`
  por Producto (`costing_method` decide cuál se invoca).

### 1.3 `ActualizarInventario`

- **Objetivo:** aplicar un Movimiento de Inventario contra la
  Existencia correspondiente, disparando `AplicarFIFO` o
  `CalcularCostoPromedio` según el método de costeo del Producto, y
  verificando la invariante de disponible no-negativo.
- **Opera sobre:** dos agregados (Movimiento de Inventario, Existencia)
  dentro de la misma transacción de `inventario` — la razón por la que
  es un Domain Service y no un método de un solo agregado.
- **Contexto:** `inventario`. Invocado por los Application Services que
  consumen `VentaConfirmada`, `RecepcionConfirmada`,
  `TransferenciaCompletada`, `AjusteInventarioAplicado`.

### 1.4 `CalcularImpuestos`

- **Objetivo:** resolver, para una línea de venta/compra, qué
  Impuestos aplican y su monto, siguiendo la cadena
  producto → categoría → régimen fiscal.
- **Ya diseñado en:**
  [46-modulo-taxes.md §3](../architecture/46-modulo-taxes.md) — "flujo
  completo de resolución producto→categoría→régimen" (Reglas de
  Aplicabilidad). No se repite aquí.
- **Opera sobre:** una línea de `ventas`/`compras`/`payroll` (retención
  de nómina, mecanismo deliberadamente independiente — ver §7 de ese
  mismo documento) y el catálogo de `impuestos` — cruza contextos, de
  ahí su naturaleza de Domain Service en vez de método de entidad.
- **Contexto:** `impuestos` (dueño del algoritmo), invocado desde
  `ventas`/`compras`/`nomina`.

### 1.5 `GenerarAsientoContable`

- **Objetivo:** traducir un evento de negocio ya ocurrido en otro
  contexto (`VentaConfirmada`, `FacturaCompraRegistrada`,
  `LiquidacionCerrada`, `DepreciacionCalculada`, ...) en un Asiento
  Contable balanceado.
- **Ya diseñado en:**
  [22-modulo-accounting.md §3](../architecture/22-modulo-accounting.md) —
  mecanismo de `accounting_rules` + `accounting_rule_lines`: mapeo de
  un `event_code` a una plantilla débito/crédito vía `amount_formula`.
  No se repite aquí — ver también
  [13_integration_events.md](./13_integration_events.md) para la tabla
  completa de `event_code` ya definidos por módulo.
- **Contexto:** `contabilidad`, consumidor puro (nunca se invoca
  síncronamente desde otro contexto — siempre reacciona a un evento).
- **Invariante que protege:** suma(Débitos) = suma(Créditos), siempre
  (ver [17_invariants.md](./17_invariants.md)).

### 1.6 `GenerarFactura`

- **Objetivo:** materializar una Factura de Venta a partir de un
  Pedido de Venta confirmado (o directamente, en venta de mostrador),
  aplicando `CalcularImpuestos` y `AplicarDescuento` a cada línea antes
  de fijar los totales.
- **Opera sobre:** Pedido de Venta (lectura) y Factura (escritura) —
  dos agregados del mismo contexto `ventas`, coordinados en una única
  transacción por `Transaction Manager`.
- **Contexto:** `ventas`. Es el Domain Service que la
  `FacturaFactory` ([10_factories.md](./10_factories.md)) invoca
  internamente para construir el agregado válido.

### 1.7 `AplicarDescuento`

- **Objetivo:** calcular el descuento aplicable a una línea o al total
  de un documento, resolviendo la fuente de la regla (descuento manual,
  lista de precios del Cliente, promoción vigente) en orden de
  precedencia ya fijado por `configuration.price_lists` +
  `sales.promotions`.
- **Contexto:** `ventas`. Usa el Value Object `Porcentaje`
  ([06_value_objects.md §1.2](./06_value_objects.md#12-porcentaje)).
- **Regla de precedencia:** descuento manual explícito > promoción
  vigente (`RangoFecha.contiene(hoy)`) > lista de precios del Cliente >
  precio base — mismo orden que ya usa `Business Rules Engine` para
  resolución de reglas por especificidad.

## 2. Por qué estos siete y no más

El pedido original lista exactamente estos siete procesos como
ejemplo. Se documentan como Domain Services porque los siete comparten
la característica que define el patrón en DDD: ninguno pertenece
naturalmente a un único Aggregate Root (cruzan agregados, o
representan un algoritmo sin estado propio). Otros cálculos del
sistema (p. ej. validar que una línea de Factura sume correctamente)
**no** son Domain Services — son invariantes de un único agregado, ya
cubiertas en [04_aggregates.md](./04_aggregates.md) y
[17_invariants.md](./17_invariants.md), y no se promueven
artificialmente a servicio de dominio.

## 3. Trazabilidad

Cuatro de los siete (`AplicarFIFO`, `CalcularCostoPromedio`,
`CalcularImpuestos`, `GenerarAsientoContable`) tienen su algoritmo
100% diseñado en documentos ya existentes — este documento solo les da
nombre formal de Domain Service DDD y señala dónde vive el diseño real,
sin reimplementarlo. `ActualizarInventario`, `GenerarFactura` y
`AplicarDescuento` son la coordinación entre agregados que faltaba
nombrar explícitamente, construida enteramente sobre mecanismos ya
existentes (`Transaction Manager`, `Business Rules Engine`,
`configuration.price_lists`).

**Siguiente documento:** [09_repositories.md](./09_repositories.md).
