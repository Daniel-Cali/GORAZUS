# 17 — Invariants

> Un Invariante es una regla que **nunca** puede romperse, sin
> excepción configurable (a diferencia de una Domain Policy, ver
> [16_domain_policies.md](./16_domain_policies.md)) — si se rompe, el
> agregado está en un estado inválido y la operación debe fallar antes
> de persistir. Cada uno de este catálogo ya está protegido, de forma
> dispersa, por una `UNIQUE`/`CHECK` constraint, una State Machine, o
> una regla de negocio ya documentada — se consolidan aquí con nombre
> explícito, por Aggregate Root.

## 1. Invariantes de Inventario

| #   | Invariante                                                                                                       | Protegido por                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | **No vender stock negativo**: `cantidad_disponible` de una Existencia nunca es menor que 0.                      | `ActualizarInventario` ([08_domain_services.md](./08_domain_services.md)) rechaza el Movimiento antes de aplicarlo; Specification `StockDisponible` lo verifica antes de confirmar el Pedido |
| I2  | **Movimientos históricos no se modifican**: un `stock_movements` ya registrado nunca se actualiza ni se elimina. | `MovimientoInventarioRepository` no expone `update`/`delete` ([09_repositories.md](./09_repositories.md))                                                                                    |
| I3  | Una Transferencia siempre tiene origen ≠ destino.                                                                | Validación en `TransferenciaFactory`/agregado                                                                                                                                                |
| I4  | Un Producto se rastrea por Lote **o** por Serie, nunca ambos simultáneamente.                                    | Regla de configuración del Producto, verificada en `ProductoFactory`                                                                                                                         |

## 2. Invariantes de Caja

| #   | Invariante                                                                                                                                                       | Protegido por                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| I5  | **No se cierra una Caja con diferencias no justificadas**: `CerrarCajaUseCase` exige una justificación explícita registrada si `saldo_contado ≠ saldo_esperado`. | `CajaRepository.cerrar()` ([09_repositories.md](./09_repositories.md)) |
| I6  | No se abre una Caja que ya está abierta.                                                                                                                         | Specification implícita en `AbrirCajaUseCase`                          |
| I7  | Movimientos de Caja históricos no se modifican (mismo patrón que I2).                                                                                            | `MovimientoCajaRepository` de solo-append                              |

## 3. Invariantes de Ventas / Facturación

| #   | Invariante                                                                                                                                | Protegido por                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I8  | **No se eliminan Facturas**: una Factura emitida nunca se borra ni edita — toda reversión es una Nota de Crédito nueva que la referencia. | `FacturaVentaRepository` no expone `delete`; regla ya fijada en [database/00-modelo-general.md](../database/00-modelo-general.md) (soft delete universal) |
| I9  | El total de cabecera de un documento (Pedido, Factura, Orden de Compra) siempre coincide con la suma de sus líneas.                       | Verificado en cada escritura por el Aggregate Root, nunca confiado al cliente HTTP                                                                        |
| I10 | Un Pedido de Venta confirmado nunca vuelve a estado `Borrador`.                                                                           | `State Machine` del agregado ([32-core-platform/05 §6](../architecture/32-core-platform/05-motores-de-logica-de-negocio.md#6-state-machine))              |

## 4. Invariantes de Contabilidad

| #   | Invariante                                                                                                                                        | Protegido por                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| I11 | **Todo Asiento Contable balancea**: suma(Débitos) = suma(Créditos), siempre — el invariante fundamental de toda la contabilidad de partida doble. | `AsientoContableFactory` ([10_factories.md](./10_factories.md)) rechaza construir un asiento desbalanceado                          |
| I12 | **No se modifican Movimientos de un Período Contable cerrado.**                                                                                   | Specification `PeriodoContableAbierto` ([11_specifications.md](./11_specifications.md)) verificada antes de cada escritura contable |
| I13 | Un Asiento Contable, una vez registrado, no se edita — una corrección es un Asiento de reversión nuevo.                                           | Mismo patrón que I8                                                                                                                 |

## 5. Invariantes transversales (aplican a todo Aggregate Root)

| #   | Invariante                                                                                                                                                  | Protegido por                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I14 | Todo registro de negocio pertenece exactamente a un `tenant_id` — nunca es visible ni escribible fuera de ese alcance salvo `@AllowCrossTenant()` auditado. | `Repository Base` ([32-core-platform/09 §4](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md#4-repository-base))               |
| I15 | Toda escritura queda atribuida a un actor y un timestamp (`created_by`/`updated_by`, columnas universales) — nunca una escritura anónima.                   | `Base Entity` + `Audit Framework`                                                                                                                      |
| I16 | Una entidad "hija" de un agregado nunca se modifica fuera de una transacción que incluya a su raíz.                                                         | `Transaction Manager` + patrón Aggregate Root ([32-core-platform/09 §2, §6](../architecture/32-core-platform/09-base-transaccional-y-modelado-ddd.md)) |
| I17 | Un evento de dominio, una vez publicado, es inmutable — no se "retira" un evento ya enviado; una corrección se comunica con un evento nuevo.                | Convención de `Domain Events` ([32-core-platform/06 §1](../architecture/32-core-platform/06-eventos-y-mensajeria.md#1-domain-events))                  |

## 6. Invariantes de otros contextos (Supporting)

| #   | Invariante                                                                                                                                                                              | Protegido por                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| I18 | Un Empleado no tiene dos Contratos activos simultáneos en la misma Empresa.                                                                                                             | Validación en `EmpleadoRepository`                                                 |
| I19 | Una Liquidación de Nómina de un período cerrado no se recalcula.                                                                                                                        | `LiquidacionRepository.cerrar()`                                                   |
| I20 | Un BOM no puede referenciarse a sí mismo transitivamente (sin ciclos).                                                                                                                  | `OrdenProduccionFactory` ([10_factories.md](./10_factories.md)) al explotar el BOM |
| I21 | Una Empresa pertenece a lo sumo a un Grupo Corporativo (ver también P10 en [16_domain_policies.md](./16_domain_policies.md) — aquí se trata como invariante estructural sin excepción). | `core.corporate_group_members`, regla de negocio (Fase 5)                          |

## 7. Trazabilidad

Cada invariante de este catálogo ya estaba protegido por un mecanismo
existente (constraint de base de datos, State Machine, regla de
servicio) documentado en algún módulo específico — esta fase los
consolida como catálogo DDD explícito de "reglas que nunca pueden
romperse", cumpliendo exactamente los 4 ejemplos dados en el pedido
(I1, I5, I8, I2/I12) y extendiéndolos de forma consistente al resto de
Aggregate Roots de [04_aggregates.md](./04_aggregates.md).

**Siguiente documento:** [18_business_capabilities.md](./18_business_capabilities.md).
