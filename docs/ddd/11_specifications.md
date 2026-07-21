# 11 — Specifications

> El patrón _Specification_ encapsula una regla de negocio reutilizable
> y con nombre propio, evaluable como predicado (`isSatisfiedBy(candidato)`)
> y combinable (`.and()`, `.or()`, `.not()`). Gap genuino — no existía
> como patrón nombrado en GORAZUS, aunque las reglas individuales que
> encapsula ya existen dispersas como validaciones puntuales en varios
> módulos. Este documento las nombra y centraliza como Specifications
> reutilizables, sin cambiar ninguna regla de negocio existente.

**Por qué Specification y no solo un `if`:** una Specification con
nombre (`StockDisponible`) se puede reutilizar idéntica en la
validación de un Pedido de Venta, en la Factory que lo construye
([10_factories.md](./10_factories.md)), y en un reporte de "productos
no vendibles" — sin repetir la lógica en tres lugares.

## 1. Catálogo

### 1.1 `ClienteActivo`

- **Regla:** `cliente.is_active === true AND cliente.is_blocked === false`.
- **Usada por:** `PedidoVentaFactory` (rechaza crear un Pedido para un
  Cliente inactivo/bloqueado).
- **Contexto dueño:** `clientes`.

### 1.2 `CréditoDisponible`

- **Regla:** `cliente.saldo_cuenta_corriente + monto_operacion <= cliente.limite_credito`
  (Value Object `Dinero` en ambos lados de la comparación —
  [06_value_objects.md §1.1](./06_value_objects.md#11-dinero-money)).
- **Usada por:** `PedidoVentaFactory`, antes de confirmar una venta a
  crédito.
- **Contexto dueño:** `clientes` (el límite), evaluada con datos que
  `contabilidad` mantiene (saldo, vía proyección actualizada por
  eventos — patrón "módulo dueño").

### 1.3 `StockDisponible`

- **Regla:** `existencia.cantidad_disponible >= cantidad_solicitada`,
  para cada línea de un Pedido de Venta, con `cantidad_disponible`
  definido en [04_aggregates.md §1.8](./04_aggregates.md#18-inventario-existencia--movimiento)
  como `cantidad_física - cantidad_reservada`.
- **Usada por:** `PedidoVentaFactory`, `OrdenProduccionFactory`
  (componentes).
- **Contexto dueño:** `inventario`.

### 1.4 `FacturaVigente`

- **Regla:** `factura.estado !== 'anulada' AND NOT EXISTS nota_credito_total_asociada`.
- **Usada por:** procesos que necesitan verificar que una Factura
  sigue siendo válida antes de referenciarla (p. ej. un reclamo de
  Garantía).
- **Contexto dueño:** `ventas`.

### 1.5 `ProductoVendible`

- **Regla:** `producto.is_active === true AND producto.discontinued_at IS NULL`.
- **Usada por:** `PedidoVentaFactory`, catálogo público (`pos`,
  tienda online).
- **Contexto dueño:** `productos`.

### 1.6 `ProveedorActivo`

- **Regla:** `proveedor.is_active === true AND proveedor.is_blocked === false`.
- **Usada por:** `OrdenCompraRepository` antes de permitir una nueva
  Orden de Compra.
- **Contexto dueño:** `proveedores`.

### 1.7 `LoteVigente`

- **Regla:** `lote.fecha_vencimiento IS NULL OR lote.fecha_vencimiento > hoy`.
- **Usada por:** `AplicarFIFO` (excluye lotes vencidos del consumo,
  salvo venta explícita con descuento por vencimiento próximo — regla
  de negocio configurable por tenant).
- **Contexto dueño:** `inventario`.

### 1.8 `PeriodoContableAbierto`

- **Regla:** `periodo.estado === 'abierto'` para la fecha del Asiento
  Contable a registrar.
- **Usada por:** `AsientoContableFactory` — rechaza construir un
  asiento contra un período cerrado (Invariante dura, ver
  [17_invariants.md](./17_invariants.md)).
- **Contexto dueño:** `contabilidad`.

### 1.9 `CajaAbiertaParaSucursal`

- **Regla:** `EXISTS cash_registers WHERE branch_id = X AND estado = 'abierta'`.
- **Usada por:** `pos`, antes de permitir una venta de contado.
- **Contexto dueño:** `caja`.

### 1.10 `TecnicoDisponible`

- **Regla:** el Técnico no tiene otra Orden de Servicio asignada que
  se solape (`RangoFecha.seSolapaCon`) con el horario propuesto.
- **Usada por:** asignación de Técnico en `servicios`.
- **Contexto dueño:** `servicios`.

## 2. Tabla resumen

| Specification             | Contexto dueño              | Consumida principalmente por                   |
| ------------------------- | --------------------------- | ---------------------------------------------- |
| `ClienteActivo`           | `clientes`                  | `PedidoVentaFactory`                           |
| `CréditoDisponible`       | `clientes` / `contabilidad` | `PedidoVentaFactory`                           |
| `StockDisponible`         | `inventario`                | `PedidoVentaFactory`, `OrdenProduccionFactory` |
| `FacturaVigente`          | `ventas`                    | Reclamos de Garantía                           |
| `ProductoVendible`        | `productos`                 | `PedidoVentaFactory`, `pos`                    |
| `ProveedorActivo`         | `proveedores`               | `OrdenCompraRepository`                        |
| `LoteVigente`             | `inventario`                | `AplicarFIFO`                                  |
| `PeriodoContableAbierto`  | `contabilidad`              | `AsientoContableFactory`                       |
| `CajaAbiertaParaSucursal` | `caja`                      | `pos`                                          |
| `TecnicoDisponible`       | `servicios`                 | Asignación de Técnico                          |

## 3. Composición de Specifications

Ejemplo de uso combinado (`PedidoVentaFactory` antes de confirmar):

```
puedeConfirmarse =
    ClienteActivo
    .and(CréditoDisponible)
    .and(StockDisponible.paraTodasLasLineas())
    .and(ProductoVendible.paraTodasLasLineas())
```

Cada Specification individual sigue siendo evaluable y probable de
forma aislada — la composición es la ventaja del patrón sobre un único
método de validación monolítico.

## 4. Trazabilidad

Ninguna de estas diez reglas es nueva como comportamiento de negocio
— todas ya se aplicaban de forma implícita (validaciones puntuales en
servicios de módulo). Lo nuevo es exclusivamente nombrarlas como
Specification reutilizable y centralizarlas, siguiendo el pedido
explícito de la fase (`ClienteActivo`, `StockDisponible`,
`CréditoDisponible`, `FacturaVigente`, `ProductoVendible` eran los
ejemplos dados).

**Siguiente documento:** [12_application_services.md](./12_application_services.md).
