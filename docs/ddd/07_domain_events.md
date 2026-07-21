# 07 — Domain Events

> `Domain Events` como componente de `32-core-platform` ya tiene su
> diseño completo (objetivo, estructura `domain-event.base.ts`,
> mecanismo, seguridad) en
> [32-core-platform/06 §1](../architecture/32-core-platform/06-eventos-y-mensajeria.md#1-domain-events) —
> **no se repite aquí**. Ese documento remite a
> [12-backend-enterprise.md §6.3](../architecture/12-backend-enterprise.md#63-catálogo-representativo-de-eventos-por-módulo-nuevo)
> para el catálogo, que es explícitamente "representativo, no
> exhaustivo". Este documento es el **catálogo completo** que faltaba:
> un evento por cada transición relevante de cada Aggregate Root de
> [04_aggregates.md](./04_aggregates.md), reutilizando sin excepción el
> mecanismo, estructura y convención de nombrado ya fijados.

**Convención heredada, no repetida:** sufijo `Event` en el nombre de
clase de código (`VentaConfirmadaEvent`), verbo en participio pasado,
español para el nombre del hecho de negocio
([07-convenciones-y-estandares.md §1-2](../architecture/07-convenciones-y-estandares.md)).
Routing key RabbitMQ: `<módulo>.<entidad>.<evento>`
([08-infraestructura-y-despliegue.md §4](../architecture/08-infraestructura-y-despliegue.md#4-rabbitmq)).
Todo evento incluye `eventId`, `occurredAt`/`ocurridoEn`, `aggregateId`,
`tenantId`/`empresaId`, y **nunca** el objeto de dominio completo — solo
identificadores y campos mínimos
([32-core-platform/06 §1](../architecture/32-core-platform/06-eventos-y-mensajeria.md#1-domain-events)).
Se publica **después** del commit local, nunca dentro de la transacción
([32-core-platform/09 §2](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#2-transaction-manager)).

**Columna Trazabilidad:** ✅ = ya nombrado en documentación previa
(`12-backend-enterprise.md §6.3` u otro documento de Fase 2-5); 🆕 =
nombrado por primera vez en esta fase, derivado directamente de un
Aggregate Root o invariante ya existente en el modelo de datos — no
representa una capacidad de negocio nueva, solo el nombre formal del
hecho que el modelo ya soporta.

## 1. Catálogo completo por contexto publicador

### 1.1 `ventas`

| Evento                      | Trazabilidad | Consumido por                                     | Payload mínimo                                                                              |
| --------------------------- | ------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `CotizacionEmitida`         | 🆕           | — (informativo/reportes)                          | `cotizacionId`, `clienteId`, `total`, `vigenciaHasta`                                       |
| `CotizacionVencida`         | 🆕           | —                                                 | `cotizacionId`                                                                              |
| `VentaConfirmada`           | ✅           | `inventario`, `contabilidad`, `caja`, `logistica` | `ventaId`, `empresaId`, `clienteId`, `lineas[{productoId,cantidad}]`, `total`, `ocurridoEn` |
| `PedidoVentaAnulado`        | 🆕           | `inventario` (libera reserva), `contabilidad`     | `pedidoId`, `motivo`                                                                        |
| `FacturaAnulada`            | ✅           | `contabilidad`                                    | `facturaId`, `notaCreditoId`                                                                |
| `NotaCreditoEmitida`        | 🆕           | `contabilidad`                                    | `notaCreditoId`, `facturaId`, `monto`                                                       |
| `DevolucionVentaRegistrada` | 🆕           | `inventario` (ingresa stock)                      | `devolucionId`, `lineas[]`                                                                  |

### 1.2 `inventario`

| Evento                     | Trazabilidad | Consumido por                                           | Payload mínimo                                  |
| -------------------------- | ------------ | ------------------------------------------------------- | ----------------------------------------------- |
| `StockActualizado`         | ✅           | `core/realtime` (UI en vivo)                            | `productoId`, `almacenId`, `cantidadDisponible` |
| `StockInsuficiente`        | ✅           | `ventas` (compensación)                                 | `ventaId`, `productoId`, `cantidadFaltante`     |
| `AlmacenCreado`            | 🆕           | —                                                       | `almacenId`, `sucursalId`                       |
| `TransferenciaCompletada`  | 🆕           | —                                                       | `transferenciaId`, `origenId`, `destinoId`      |
| `AjusteInventarioAplicado` | 🆕           | `contabilidad` (si el ajuste tiene efecto de valuación) | `ajusteId`, `productoId`, `diferencia`          |
| `ConteoFisicoCompletado`   | 🆕           | —                                                       | `conteoId`, `diferenciasEncontradas`            |

### 1.3 `compras`

| Evento                    | Trazabilidad | Consumido por                               | Payload mínimo                                            |
| ------------------------- | ------------ | ------------------------------------------- | --------------------------------------------------------- |
| `OrdenCompraConfirmada`   | 🆕           | `logistica` (seguimiento de envío entrante) | `ordenId`, `proveedorId`, `lineas[]`                      |
| `RecepcionConfirmada`     | ✅           | `inventario`                                | `recepcionId`, `ordenId`, `lineas[{productoId,cantidad}]` |
| `FacturaCompraRegistrada` | ✅           | `contabilidad`, `bancos`/`caja`             | `facturaId`, `proveedorId`, `total`                       |

### 1.4 `caja`

| Evento                     | Trazabilidad | Consumido por  | Payload mínimo                            |
| -------------------------- | ------------ | -------------- | ----------------------------------------- |
| `CajaAbierta`              | 🆕           | —              | `cajaId`, `montoInicial`, `usuarioId`     |
| `MovimientoCajaRegistrado` | ✅           | `contabilidad` | `movimientoId`, `cajaId`, `monto`, `tipo` |
| `CajaCerrada`              | 🆕           | `contabilidad` | `cajaId`, `saldoFinal`, `diferencia`      |

### 1.5 `bancos`

| Evento                   | Trazabilidad | Consumido por                              | Payload mínimo                                  |
| ------------------------ | ------------ | ------------------------------------------ | ----------------------------------------------- |
| `CuentaBancariaCreada`   | 🆕           | —                                          | `cuentaId`                                      |
| `ConciliacionCompletada` | ✅           | `contabilidad`, `tesoreria` (solo lectura) | `conciliacionId`, `cuentaId`, `diferenciaFinal` |

### 1.6 `contabilidad`

Consumidor puro por diseño (ver
[01_bounded_contexts.md §2.1](./01_bounded_contexts.md#21-core-subdomains)) —
solo publica eventos técnicos de cierre, sin efecto de negocio en otro
contexto:

| Evento                   | Trazabilidad | Consumido por                            | Payload mínimo                  |
| ------------------------ | ------------ | ---------------------------------------- | ------------------------------- |
| `PresupuestoAprobado`    | 🆕           | —                                        | `presupuestoId`, `fiscalYearId` |
| `PeriodoContableCerrado` | 🆕           | todos (bloqueo de escritura retroactiva) | `periodoId`                     |

### 1.7 `clientes` / `proveedores`

| Evento                 | Trazabilidad | Consumido por                     | Payload mínimo                     |
| ---------------------- | ------------ | --------------------------------- | ---------------------------------- |
| `ClienteCreado`        | 🆕           | `crm`                             | `clienteId`                        |
| `ClienteActualizado`   | ✅           | `ventas`, `crm`, `contabilidad`   | `clienteId`, `camposModificados[]` |
| `ClienteBloqueado`     | 🆕           | `ventas` (rechaza nuevos pedidos) | `clienteId`, `motivo`              |
| `ProveedorCreado`      | 🆕           | —                                 | `proveedorId`                      |
| `ProveedorActualizado` | 🆕           | `compras`                         | `proveedorId`                      |
| `ProveedorBloqueado`   | 🆕           | `compras`                         | `proveedorId`, `motivo`            |

### 1.8 `productos`

| Evento                  | Trazabilidad | Consumido por                                                    | Payload mínimo                      |
| ----------------------- | ------------ | ---------------------------------------------------------------- | ----------------------------------- |
| `ProductoCreado`        | 🆕           | `inventario` (inicializa existencia en 0)                        | `productoId`                        |
| `ProductoActualizado`   | 🆕           | `ventas`, `compras` (invalidan proyección local si la mantienen) | `productoId`, `camposModificados[]` |
| `ProductoDescontinuado` | 🆕           | `ventas` (deja de ofrecerse)                                     | `productoId`                        |
| `BOMActualizado`        | 🆕           | `produccion`                                                     | `bomId`, `productoId`               |

### 1.9 `impuestos`

| Evento                  | Trazabilidad | Consumido por                                                      | Payload mínimo             |
| ----------------------- | ------------ | ------------------------------------------------------------------ | -------------------------- |
| `RetencionEmitida`      | 🆕           | `contabilidad`                                                     | `certificadoId`, `monto`   |
| `DeclaracionPresentada` | 🆕           | `administracion` (envío a autoridad fiscal vía Integration Engine) | `declaracionId`, `periodo` |

### 1.10 `crm`

| Evento               | Trazabilidad                                                                                                         | Consumido por | Payload mínimo               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------- |
| `OportunidadGanada`  | ✅ (nota: viaja como **comando síncrono**, no evento — excepción ya documentada en `04-catalogo-modulos-negocio.md`) | `ventas`      | `oportunidadId`, `clienteId` |
| `OportunidadPerdida` | 🆕                                                                                                                   | —             | `oportunidadId`, `motivo`    |

### 1.11 `rrhh` / `nomina`

| Evento               | Trazabilidad | Consumido por                               | Payload mínimo                              |
| -------------------- | ------------ | ------------------------------------------- | ------------------------------------------- |
| `EmpleadoContratado` | 🆕           | `nomina`                                    | `empleadoId`                                |
| `EmpleadoDadoDeBaja` | 🆕           | `nomina`, `proyectos` (libera asignaciones) | `empleadoId`, `fechaBaja`                   |
| `LiquidacionCerrada` | ✅           | `contabilidad`, `bancos`                    | `liquidacionId`, `totalNeto`, `empleados[]` |

### 1.12 `produccion` / `servicios` / `activos-fijos` / `proyectos`

| Evento                     | Trazabilidad | Consumido por                                                      | Payload mínimo                 |
| -------------------------- | ------------ | ------------------------------------------------------------------ | ------------------------------ |
| `OrdenProduccionLiberada`  | 🆕           | `inventario` (reserva componentes)                                 | `ordenId`, `bomId`, `cantidad` |
| `OrdenProduccionCerrada`   | 🆕           | `inventario` (ingresa producto terminado), `contabilidad` (costeo) | `ordenId`, `costoReal`         |
| `ContratoServicioActivado` | 🆕           | — (genera Órdenes de Servicio internamente)                        | `contratoId`                   |
| `OrdenServicioCerrada`     | 🆕           | `contabilidad`, `ventas` (si factura garantía)                     | `ordenId`                      |
| `DepreciacionCalculada`    | ✅           | `contabilidad`                                                     | `activoId`, `monto`            |
| `ActivoDadoDeBaja`         | 🆕           | `contabilidad`                                                     | `activoId`, `valorResidual`    |
| `HitoFacturado`            | 🆕           | `contabilidad` (vía la Factura que genera)                         | `proyectoId`, `hitoId`         |
| `ProyectoCerrado`          | 🆕           | —                                                                  | `proyectoId`                   |

### 1.13 `logistica` _(propuesto, Fase 5)_

| Evento                         | Trazabilidad                                            | Consumido por | Payload mínimo          |
| ------------------------------ | ------------------------------------------------------- | ------------- | ----------------------- |
| `logistics.shipment.delivered` | ✅ (ya nombrado en `48-erp-enterprise-readiness.md §8`) | `ventas`      | `shipmentId`, `ventaId` |

### 1.14 `seguridad` / `core` (técnicos, no de negocio)

| Evento                                 | Trazabilidad | Consumido por                                         | Payload mínimo                                                                                                         |
| -------------------------------------- | ------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `RolModificado`                        | ✅           | invalidación de cache de permisos (todos los módulos) | `rolId`                                                                                                                |
| `document.created` / `document.signed` | ✅ (Fase 2)  | `core` (Workflow/Approval Engine)                     | ver [32-core-platform/14 §2-3](../architecture/32-core-platform/14-motores-enterprise-avanzados.md)                    |
| `integration.*` / `webhook.*`          | ✅ (Fase 2)  | `administracion`                                      | ver [32-core-platform/14 §5](../architecture/32-core-platform/14-motores-enterprise-avanzados.md#5-integration-engine) |
| `bpm.process.*`                        | ✅ (Fase 2)  | `core` (Workflow Engine)                              | ver [32-core-platform/14 §1](../architecture/32-core-platform/14-motores-enterprise-avanzados.md#1-bpm-engine)         |
| `GrupoCorporativoCreado`               | 🆕 (Fase 5)  | `contabilidad` (consolidación)                        | `grupoId`, `empresaMatrizId`                                                                                           |

### 1.15 `ia` _(propuesto, Fase 4)_

| Evento                                          | Trazabilidad | Consumido por                                      | Payload mínimo                                         |
| ----------------------------------------------- | ------------ | -------------------------------------------------- | ------------------------------------------------------ |
| `prediction.created` / `recommendation.created` | ✅ (Fase 4)  | `core` (Approval Engine — nunca escritura directa) | ver [47-modulo-ia.md](../architecture/47-modulo-ia.md) |

## 2. Regla de propiedad de evento (Event Bus la enforced)

Un evento pertenece semánticamente a un único módulo publicador — el
`Event Bus` ya valida esto en tiempo de ejecución
([32-core-platform/06 §2](../architecture/32-core-platform/06-eventos-y-mensajeria.md#2-event-bus)).
Este catálogo es, por construcción, la lista de publicadores
autorizados: si en el futuro un módulo distinto al declarado en este
documento intenta publicar uno de estos eventos, es un error de diseño
a corregir, no una variante válida.

## 3. Trazabilidad

Los eventos marcados 🆕 no son funcionalidad nueva — son el nombre
formal, siguiendo la convención ya fijada, para transiciones que ya
existen en el modelo de datos (columnas de estado, tablas
`*_status_history`) pero que no tenían un nombre de evento de dominio
asignado todavía. Ninguno contradice ni renombra un evento ya
documentado en `12-backend-enterprise.md §6.3` o en las Fases 2-5.

**Siguiente documento:** [08_domain_services.md](./08_domain_services.md).
