# 09 — Repositories

> `Repository Base` como componente de `32-core-platform` ya tiene su
> diseño completo (filtro de tenant inescapable, dependencias,
> comunicación con `Audit Framework`, `@AllowCrossTenant()`) en
> [32-core-platform/09 §4](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#4-repository-base) —
> **no se repite aquí**. Este documento aplica esa base a cada
> Aggregate Root de [04_aggregates.md](./04_aggregates.md): un
> repositorio por agregado, nunca por tabla individual, con sus
> métodos específicos por encima del CRUD genérico que `Repository
Base` ya provee.

**Regla heredada y no repetida:** un repositorio concreto extiende
`Repository Base`, hereda `findMany`/`findOne`/`create`/`update` con
filtro de `tenant_id`/`company_id`/`branch_id` automático e
inescapable, y añade únicamente los métodos de consulta específicos
del agregado. Ningún repositorio expone acceso a una entidad hija de
otro agregado de forma independiente (regla de
[32-core-platform/09 §6](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#6-aggregate-root)).

## 1. Repositorios — Core Subdomains

| Repositorio                      | Agregado                 | Métodos específicos (sobre el CRUD base)                                                                                                                                                                   | Consultas destacadas                              |
| -------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `PedidoVentaRepository`          | Pedido de Venta          | `confirmar()`, `anular()` (encapsulan transición de `Estado` + publicación de evento tras commit)                                                                                                          | `buscarPendientesPorCliente(clienteId)`           |
| `FacturaVentaRepository`         | Factura de Venta         | ningún método de edición expuesto tras emisión (solo `crear()`, `anular()` vía Nota de Crédito)                                                                                                            | `buscarPorRangoFecha(rango: RangoFecha)`          |
| `OrdenCompraRepository`          | Orden de Compra          | `confirmar()`, `cerrar()`                                                                                                                                                                                  | `buscarPendientesDeRecepcion(proveedorId)`        |
| `FacturaCompraRepository`        | Factura de Compra        | `registrarMatching()` (3 vías OC-Recepción-Factura)                                                                                                                                                        | `buscarPendientesDePago()`                        |
| `ExistenciaRepository`           | Existencia (Inventario)  | `reservar()`, `liberarReserva()`, `consultarDisponible()`                                                                                                                                                  | `buscarBajoPuntoDeReorden()`                      |
| `MovimientoInventarioRepository` | Movimiento de Inventario | `registrar()` (único método de escritura — **sin** `update`/`delete` expuestos, regla del patrón "movimiento inmutable" de [05_entities.md §3](./05_entities.md#3-patrón-movimiento-inmutable-_movements)) | `reconstruirKardex(productoId, almacenId, rango)` |
| `AsientoContableRepository`      | Asiento Contable         | `registrar()` (valida balance débito=crédito antes de persistir)                                                                                                                                           | `buscarPorPeriodo(periodoId)`                     |

## 2. Repositorios — Supporting Subdomains

| Repositorio                      | Agregado                | Métodos específicos                                                                               | Consultas destacadas                                                                         |
| -------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ProductoRepository`             | Producto                | `descontinuar()`                                                                                  | `buscarPorCodigoBarra(codigo)`, `buscarConVariantes(id)` (agregado completo en un `include`) |
| `ClienteRepository`              | Cliente                 | `bloquear()`, `desbloquear()`                                                                     | `buscarActivosConCreditoDisponible()`                                                        |
| `ProveedorRepository`            | Proveedor               | `bloquear()`                                                                                      | `buscarPorEvaluacionMinima(score)`                                                           |
| `CajaRepository`                 | Caja                    | `abrir()`, `cerrar()` (valida invariante de arqueo antes de permitir cierre)                      | `buscarAbiertasPorSucursal(sucursalId)`                                                      |
| `CuentaBancariaRepository`       | Cuenta Bancaria         | —                                                                                                 | `buscarPorMoneda(moneda)`                                                                    |
| `ConciliacionBancariaRepository` | Conciliación Bancaria   | `completar()`                                                                                     | `buscarPendientes(cuentaId)`                                                                 |
| `EmpleadoRepository`             | Empleado                | `darDeBaja()`                                                                                     | `buscarConContratoActivo()`                                                                  |
| `LiquidacionRepository`          | Liquidación de Nómina   | `cerrar()` (bloquea re-liquidación del período)                                                   | `buscarPorPeriodo(periodoId)`                                                                |
| `OrdenProduccionRepository`      | Orden de Producción     | `liberar()`, `cerrar()`                                                                           | `buscarPendientesPorProducto(productoId)`                                                    |
| `OrdenServicioRepository`        | Orden de Servicio       | `asignarTecnico()`, `cerrar()`                                                                    | `buscarPorTecnico(tecnicoId, rango)`                                                         |
| `ActivoFijoRepository`           | Activo Fijo             | `darDeBaja()` (requiere aprobación previa — ver [16_domain_policies.md](./16_domain_policies.md)) | `buscarPendientesDeDepreciacion(periodo)`                                                    |
| `ProyectoRepository`             | Proyecto                | `cerrar()`, `facturarHito()`                                                                      | `buscarConPresupuestoExcedido()`                                                             |
| `DeclaracionImpuestoRepository`  | Declaración de Impuesto | `presentar()`                                                                                     | `buscarPorPeriodoYJurisdiccion()`                                                            |

## 3. Repositorios — Generic Subdomains

| Repositorio                  | Agregado                       | Nota                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GrupoCorporativoRepository` | Grupo Corporativo              | Fase 5 — `core.corporate_groups`.                                                                                                                                                                                  |
| —                            | `documentos`, `administracion` | Repositorios ya diseñados como parte de `Document Management System` / `Integration Engine` en [32-core-platform/14](../architecture/32-core-platform/14-motores-enterprise-avanzados.md) — no se re-diseñan aquí. |

## 4. Contextos sin repositorio propio

`pos`, `tesoreria`, `dashboard`, `reportes`, `bi` no tienen
repositorios de escritura propios (ver
[01_bounded_contexts.md §2.3](./01_bounded_contexts.md#23-generic-subdomains)) —
consumen los repositorios de otros contextos exclusivamente a través
de sus Query Services públicos (solo lectura), nunca instancian un
repositorio de un agregado ajeno directamente.

## 5. Regla de un repositorio por agregado, no por tabla

Ejemplo aplicado: `PedidoVentaRepository` opera sobre `sales_orders` +
`sales_order_lines` + `sales_order_status_history` como una unidad —
no existe un `SalesOrderLineRepository` independiente, porque
`sales_order_lines` no tiene ciclo de vida propio (regla ya fijada en
[04_aggregates.md](./04_aggregates.md) y
[05_entities.md §1](./05_entities.md#1-patrón-línea-de-documento-_lines)).
Esta regla se aplica sin excepción a los ~30 repositorios de este
catálogo.

## 6. Trazabilidad

Ningún repositorio de este documento introduce una tecnología o
mecanismo nuevo — todos extienden `Repository Base`
([32-core-platform/09 §4](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#4-repository-base)),
ya diseñado. Lo nuevo es exclusivamente la enumeración uno-a-uno con
los Aggregate Roots de [04_aggregates.md](./04_aggregates.md), que no
existía como catálogo explícito antes de esta fase.

**Siguiente documento:** [10_factories.md](./10_factories.md).
