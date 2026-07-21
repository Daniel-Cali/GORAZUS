# 12 — Application Services

> Un Application Service (`*.usecase.ts`, convención ya fijada en
> [12-backend-enterprise.md §1](../architecture/12-backend-enterprise.md#1-árbol-de-carpetas)
> y [02-arquitectura-modulos-backend.md](../architecture/02-arquitectura-modulos-backend.md))
> orquesta: recibe un comando, resuelve dependencias vía Repositorios y
> Query Services de otros contextos, invoca la Factory o el método del
> Aggregate Root correspondiente, persiste vía `Transaction Manager`, y
> publica los Domain Events resultantes tras el commit. No contiene
> lógica de negocio propia (esa vive en el agregado, el Domain Service
> o la Specification) — solo coordina.

**Formato de cada entrada:** Caso de uso | Entradas | Salidas |
Eventos publicados | Dependencias (repositorios/servicios que invoca).
Catálogo representativo (mismo criterio que
[12-backend-enterprise.md §6.3](../architecture/12-backend-enterprise.md#63-catálogo-representativo-de-eventos-por-módulo-nuevo) —
no exhaustivo, cada módulo agrega los suyos al implementarse).

## 1. `ventas`

| Caso de uso                  | Entradas                    | Salidas           | Eventos publicados                         | Dependencias                                                                  |
| ---------------------------- | --------------------------- | ----------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| `CrearCotizacionUseCase`     | clienteId, líneas           | Cotización        | `CotizacionEmitida`                        | `ProductosQueryService`, `ClientesQueryService`                               |
| `ConfirmarPedidoUseCase`     | pedidoId                    | Pedido confirmado | `VentaConfirmada`                          | `PedidoVentaFactory`, Specifications §1.1-1.5 de [11](./11_specifications.md) |
| `EmitirFacturaUseCase`       | pedidoId                    | Factura           | (la Factura materializa `VentaConfirmada`) | `FacturaFactory`                                                              |
| `AnularFacturaUseCase`       | facturaId, motivo           | Nota de Crédito   | `FacturaAnulada`, `NotaCreditoEmitida`     | `FacturaVentaRepository`                                                      |
| `RegistrarDevolucionUseCase` | facturaId, líneas devueltas | Devolución        | `DevolucionVentaRegistrada`                | `InventarioQueryService`                                                      |

## 2. `compras`

| Caso de uso                     | Entradas                    | Salidas           | Eventos publicados        | Dependencias                                               |
| ------------------------------- | --------------------------- | ----------------- | ------------------------- | ---------------------------------------------------------- |
| `ConfirmarOrdenCompraUseCase`   | ordenId                     | Orden confirmada  | `OrdenCompraConfirmada`   | `ProveedoresQueryService`, Specification `ProveedorActivo` |
| `RegistrarRecepcionUseCase`     | ordenId, líneas recibidas   | Recepción         | `RecepcionConfirmada`     | `RecepcionRepository`                                      |
| `RegistrarFacturaCompraUseCase` | recepciónId, datos fiscales | Factura de Compra | `FacturaCompraRegistrada` | matching 3 vías                                            |

## 3. `inventario`

| Caso de uso                                                              | Entradas                       | Salidas                    | Eventos publicados                                   | Dependencias                                                |
| ------------------------------------------------------------------------ | ------------------------------ | -------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `DescontarStockPorVentaUseCase` (consumidor de `VentaConfirmada`)        | evento `VentaConfirmada`       | Movimientos registrados    | `StockActualizado` o `StockInsuficiente`             | `ActualizarInventario` (Domain Service)                     |
| `IngresarStockPorRecepcionUseCase` (consumidor de `RecepcionConfirmada`) | evento                         | Movimientos de entrada     | `StockActualizado`                                   | `ActualizarInventario`                                      |
| `TransferirStockUseCase`                                                 | almacén origen/destino, líneas | Transferencia              | `TransferenciaCompletada`                            | `ExistenciaRepository` (ambos almacenes, misma transacción) |
| `RealizarConteoFisicoUseCase`                                            | almacénId, conteo              | Conteo + Ajustes si aplica | `ConteoFisicoCompletado`, `AjusteInventarioAplicado` | —                                                           |

## 4. `contabilidad`

| Caso de uso                                                                   | Entradas                           | Salidas              | Eventos publicados       | Dependencias                                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------- | -------------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `GenerarAsientoDesdeEventoUseCase` (consumidor genérico de todo `event_code`) | evento de negocio de otro contexto | Asiento Contable     | —                        | `AsientoContableFactory`, `GenerarAsientoContable`                                      |
| `CerrarPeriodoContableUseCase`                                                | periodoId                          | Período cerrado      | `PeriodoContableCerrado` | Specification `PeriodoContableAbierto` (inversa)                                        |
| `ConsolidarGrupoCorporativoUseCase`                                           | grupoId, periodo                   | Snapshot consolidado | —                        | ver [48-erp-enterprise-readiness.md §4](../architecture/48-erp-enterprise-readiness.md) |

## 5. `caja` / `bancos`

| Caso de uso                        | Entradas             | Salidas      | Eventos publicados       | Dependencias                                                      |
| ---------------------------------- | -------------------- | ------------ | ------------------------ | ----------------------------------------------------------------- |
| `AbrirCajaUseCase`                 | cajaId, montoInicial | Caja abierta | `CajaAbierta`            | —                                                                 |
| `CerrarCajaUseCase`                | cajaId, arqueo       | Caja cerrada | `CajaCerrada`            | Invariante de arqueo (ver [17_invariants.md](./17_invariants.md)) |
| `ConciliarExtractoBancarioUseCase` | cuentaId, extracto   | Conciliación | `ConciliacionCompletada` | —                                                                 |

## 6. `produccion`

| Caso de uso                     | Entradas              | Salidas        | Eventos publicados        | Dependencias                                              |
| ------------------------------- | --------------------- | -------------- | ------------------------- | --------------------------------------------------------- |
| `LiberarOrdenProduccionUseCase` | productoId, cantidad  | Orden liberada | `OrdenProduccionLiberada` | `OrdenProduccionFactory`, `StockDisponible` (componentes) |
| `CerrarOrdenProduccionUseCase`  | ordenId, consumo real | Orden cerrada  | `OrdenProduccionCerrada`  | `ActualizarInventario` (ingreso de producto terminado)    |

## 7. `rrhh` / `nomina`

| Caso de uso                | Entradas                     | Salidas     | Eventos publicados   | Dependencias       |
| -------------------------- | ---------------------------- | ----------- | -------------------- | ------------------ |
| `ContratarEmpleadoUseCase` | datos del empleado, contrato | Empleado    | `EmpleadoContratado` | —                  |
| `LiquidarNominaUseCase`    | periodoId                    | Liquidación | `LiquidacionCerrada` | `RRHHQueryService` |

## 8. `crm`

| Caso de uso               | Entradas      | Salidas                | Eventos publicados                                                  | Dependencias                                       |
| ------------------------- | ------------- | ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| `GanarOportunidadUseCase` | oportunidadId | Pedido de Venta creado | (comando síncrono a `ventas`, no evento — excepción ya documentada) | `VentasCommandService.confirmarDesdeOportunidad()` |

## 9. `servicios` / `proyectos` / `activos-fijos`

| Caso de uso                          | Entradas                    | Salidas           | Eventos publicados      | Dependencias                                     |
| ------------------------------------ | --------------------------- | ----------------- | ----------------------- | ------------------------------------------------ |
| `AsignarTecnicoUseCase`              | ordenId, técnicoId, horario | Orden con técnico | —                       | Specification `TecnicoDisponible`                |
| `FacturarHitoUseCase`                | proyectoId, hitoId          | Factura           | `HitoFacturado`         | `VentasCommandService.facturarHito()` (síncrono) |
| `CalcularDepreciacionPeriodoUseCase` | periodoId                   | Depreciaciones    | `DepreciacionCalculada` | —                                                |

## 10. Regla de composición: un Application Service, una transacción

Cada caso de uso de este catálogo abre **como máximo una** transacción
local (`Transaction Manager`,
[32-core-platform/09 §2](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#2-transaction-manager)) —
ninguno abre una transacción que abarque dos contextos. Cuando un caso
de uso necesita el efecto de otro contexto, siempre es a través de una
consulta síncrona previa (antes de abrir su propia transacción) o de
reaccionar a un evento ya confirmado (después de que el otro contexto
cerró la suya) — nunca una transacción distribuida implícita, regla ya
fijada en
[06-comunicacion-entre-modulos.md](../architecture/06-comunicacion-entre-modulos.md).

## 11. Trazabilidad

El catálogo es una extensión directa, con la misma disciplina, del
"Catálogo representativo de eventos por módulo" de
[12-backend-enterprise.md §6.3](../architecture/12-backend-enterprise.md#63-catálogo-representativo-de-eventos-por-módulo-nuevo) —
cada caso de uso listado corresponde a una transición ya identificada
en [04_aggregates.md](./04_aggregates.md)/[07_domain_events.md](./07_domain_events.md).
No exhaustivo por diseño (mismo criterio que la fuente): cada módulo
declara los suyos al implementarse.

**Siguiente documento:** [13_integration_events.md](./13_integration_events.md).
