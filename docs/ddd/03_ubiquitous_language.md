# 03 — Ubiquitous Language

> Glosario único de GORAZUS ERP. Extiende — no reemplaza — el
> "Glosario mínimo" ya existente en
> [architecture/README.md §4](../architecture/README.md#4-glosario-mínimo)
> (`Módulo`, `Core`, `Shared Kernel`, `Módulo dueño`, `Evento de
dominio`, `Composition root`), que cubre vocabulario de
> **arquitectura**. Este documento cubre vocabulario de **negocio**:
> los términos que un experto de dominio (contador, vendedor, jefe de
> almacén) reconocería y usaría en una conversación, y que el código
> debe nombrar exactamente igual (regla de nomenclatura ya fijada en
> [07-convenciones-y-estandares.md §2](../architecture/07-convenciones-y-estandares.md) —
> entidades y campos de negocio en español, términos de infraestructura
> en inglés).

Organizado por Bounded Context (ver
[01_bounded_contexts.md](./01_bounded_contexts.md)). Un término que
aparece en más de un contexto (p. ej. "Movimiento") se define una vez
en su contexto dueño y se referencia desde los demás.

## 1. Contexto: `productos`

| Término                       | Definición                                                                                                                       | Sinónimos                                                                    | Relaciones                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Producto**                  | Bien o servicio que la empresa vende, compra o produce; unidad maestra del catálogo.                                             | Artículo, Ítem, SKU (uso informal)                                           | Tiene Variantes, pertenece a una Categoría, se mide en una Unidad de Medida    |
| **Variante**                  | Combinación específica de atributos de un Producto (talla, color) con su propio código/barcode.                                  | —                                                                            | Pertenece a un Producto                                                        |
| **BOM (Lista de Materiales)** | Estructura jerárquica de componentes necesarios para producir un Producto terminado.                                             | Bill of Materials, Receta (uso en manufactura de proceso continuo/alimentos) | Se explota en una Orden de Producción                                          |
| **Kit / Combo**               | Agrupación comercial de varios Productos vendidos como una unidad, sin ser una transformación productiva (a diferencia del BOM). | —                                                                            | Distinto de BOM — no consume stock de componentes en producción, solo en venta |
| **Unidad de Medida**          | Unidad en la que se cuantifica un Producto (unidad, kg, litro, caja de 12).                                                      | UoM                                                                          | Un Producto puede tener conversiones entre unidades                            |

## 2. Contexto: `inventario`

| Término                  | Definición                                                                                                                                                                                         | Sinónimos                             | Relaciones                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| **Almacén**              | Ubicación física donde se resguarda Inventario, con Zonas y Ubicaciones internas.                                                                                                                  | Bodega, Depósito                      | Pertenece a una Sucursal                                                  |
| **Sucursal**             | Unidad organizacional física de una Empresa (columna universal `branch_id`) — ver `configuracion`.                                                                                                 | Tienda, Punto de venta físico         | Contiene Almacenes                                                        |
| **Inventario**           | Cantidad de un Producto disponible en un Almacén en un momento dado.                                                                                                                               | Existencias, Stock                    | Se modifica mediante un Movimiento                                        |
| **Movimiento**           | Hecho atómico e inmutable que aumenta o disminuye el Inventario de un Producto en un Almacén (entrada, salida, transferencia, ajuste).                                                             | Movimiento de inventario              | Origina un Kardex                                                         |
| **Kardex**               | Historial cronológico completo de todos los Movimientos de un Producto en un Almacén — la reconstrucción auditable del saldo.                                                                      | Ficha de existencias                  | Compuesto por Movimientos                                                 |
| **Transferencia**        | Movimiento compuesto: una salida de un Almacén y una entrada simultánea en otro, del mismo Producto.                                                                                               | —                                     | Es un tipo de Movimiento                                                  |
| **Reserva**              | Apartado lógico de Inventario a favor de un documento pendiente (una Cotización o Pedido) que reduce el disponible sin reducir la existencia física.                                               | Stock reservado                       | Se libera al Confirmar o Anular el documento que la originó               |
| **Lote**                 | Agrupación de unidades de un Producto producidas o recibidas juntas, con fecha de vencimiento/fabricación común — unidad de trazabilidad cuando el Producto no requiere identificación individual. | Batch                                 | Un Producto se rastrea por Lote o por Serie, no ambos                     |
| **Serie**                | Identificador único de una unidad individual de un Producto — trazabilidad unitaria (a diferencia de Lote, que es grupal).                                                                         | Número de serie                       | Un Producto se rastrea por Lote o por Serie, no ambos                     |
| **Costo Promedio**       | Método de valuación de Inventario donde el costo unitario se recalcula como promedio ponderado tras cada entrada.                                                                                  | Costo Promedio Ponderado              | Alternativa a FIFO — ver [08_domain_services.md](./08_domain_services.md) |
| **FIFO**                 | Método de valuación de Inventario ("primero en entrar, primero en salir"): cada salida consume las capas de costo más antiguas primero.                                                            | First In, First Out                   | Alternativa a Costo Promedio                                              |
| **Picking**              | Proceso de recolección física de los Productos de un Almacén para preparar una salida (venta, transferencia, producción).                                                                          | Recolección                           | Precede al Packing                                                        |
| **Packing**              | Proceso de empaque de los Productos ya recolectados (Picking), previo al despacho.                                                                                                                 | Empaque                               | Sigue al Picking                                                          |
| **Conteo Físico**        | Verificación manual de existencias reales contra el saldo del sistema, que genera Ajustes de Inventario si hay diferencia.                                                                         | Inventario físico, Toma de inventario | Genera Ajustes                                                            |
| **Ajuste de Inventario** | Movimiento que corrige el saldo del sistema para que coincida con la existencia física real verificada.                                                                                            | —                                     | Es un tipo de Movimiento, originado por un Conteo Físico                  |

## 3. Contexto: `ventas`

| Término                 | Definición                                                                                                                                                                 | Sinónimos           | Relaciones                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------- |
| **Cotización**          | Oferta comercial formal a un Cliente, sin compromiso de Inventario ni efecto contable, con vigencia limitada.                                                              | Presupuesto, Oferta | Puede convertirse en Pedido                         |
| **Pedido de Venta**     | Compromiso confirmado del Cliente de comprar, genera Reserva de Inventario, aún sin efecto contable definitivo.                                                            | Orden de Venta      | Se convierte en Factura al confirmarse              |
| **Factura**             | Documento fiscal que registra la venta consumada, con efecto contable y tributario, no editable una vez emitida (Invariante — ver [17_invariants.md](./17_invariants.md)). | Factura de Venta    | Puede generar una Nota de Crédito para su reversión |
| **Nota de Crédito**     | Documento que revierte total o parcialmente el efecto de una Factura (nunca se elimina la Factura original).                                                               | —                   | Referencia siempre a una Factura                    |
| **Devolución de Venta** | Retorno físico de mercancía ya vendida, con o sin Nota de Crédito asociada.                                                                                                | —                   | Genera un Movimiento de entrada en Inventario       |
| **Garantía**            | Cobertura post-venta de un Producto vendido, propiedad de `ventas` (no de `servicios`, deslinde ya documentado).                                                           | —                   | —                                                   |

## 4. Contexto: `compras`

| Término                   | Definición                                                                                              | Sinónimos              | Relaciones                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| **Requisición de Compra** | Solicitud interna de compra, previa a la Orden de Compra formal, sin compromiso con el Proveedor.       | —                      | Puede convertirse en Orden de Compra        |
| **Orden de Compra**       | Compromiso formal con un Proveedor, aún sin efecto de Inventario ni contable.                           | Purchase Order         | Se cierra con una Recepción                 |
| **Recepción**             | Confirmación física de que la mercancía de una Orden de Compra llegó — dispara el ingreso a Inventario. | Recepción de mercancía | Genera un Movimiento de entrada             |
| **Factura de Compra**     | Documento del Proveedor que registra la obligación de pago, con efecto contable.                        | Factura de Proveedor   | Puede generar una Nota de Crédito de Compra |

## 5. Contexto: `clientes` / `proveedores`

| Término               | Definición                                                                                                          | Sinónimos       | Relaciones                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| **Cliente**           | Tercero a quien la empresa vende — maestro único, propiedad exclusiva de `clientes` (patrón módulo dueño).          | —               | Consumido por `ventas`, `crm`, `contabilidad` (cuenta corriente)                         |
| **Proveedor**         | Tercero a quien la empresa compra — maestro único, propiedad exclusiva de `proveedores`.                            | —               | Consumido por `compras`, `bancos`                                                        |
| **Límite de Crédito** | Monto máximo de deuda permitida a un Cliente o de exposición con un Proveedor antes de bloquear nuevas operaciones. | Cupo de crédito | Ver especificación `CréditoDisponible` en [11_specifications.md](./11_specifications.md) |
| **Cuenta Corriente**  | Saldo acumulado de deuda/crédito de un Cliente o Proveedor, mantenido por `contabilidad` a partir de eventos.       | —               | Se actualiza vía `ClienteActualizado`/movimientos de Factura                             |

## 6. Contexto: `caja` / `bancos`

| Término                   | Definición                                                                                                                                             | Sinónimos         | Relaciones                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | -------------------------------------------- |
| **Caja**                  | Punto de manejo de efectivo con apertura, cierre y arqueo — unidad transaccional de `caja`.                                                            | Caja registradora | Contiene Movimientos de Caja                 |
| **Movimiento de Caja**    | Entrada o salida de efectivo registrada en una Caja.                                                                                                   | —                 | Es un tipo de Movimiento del contexto `caja` |
| **Arqueo**                | Conteo físico del efectivo en Caja, comparado contra el saldo del sistema.                                                                             | Conteo de caja    | Análogo al Conteo Físico de `inventario`     |
| **Cierre de Caja**        | Operación que congela los Movimientos de una Caja para un período y produce el saldo final — Invariante: no se cierra con diferencias no justificadas. | —                 | —                                            |
| **Conciliación Bancaria** | Proceso de comparar los Movimientos de una Cuenta Bancaria contra el Extracto Bancario del banco para verificar coincidencia.                          | —                 | Genera `ConciliacionCompletada`              |

## 7. Contexto: `contabilidad`

| Término                      | Definición                                                                                                                                   | Sinónimos         | Relaciones                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Asiento Contable**         | Registro de partida doble (Débito = Crédito) que refleja el efecto financiero de un hecho de negocio ya ocurrido en otro contexto.           | Journal Entry     | Generado por `GenerarAsientoContable`, ver [08_domain_services.md](./08_domain_services.md) — Invariante: siempre balanceado |
| **Plan de Cuentas**          | Catálogo jerárquico de Cuentas Contables de una Empresa.                                                                                     | Chart of Accounts | —                                                                                                                            |
| **Período Contable**         | Ventana de tiempo (mes/año fiscal) durante la cual se pueden registrar Asientos; se cierra y bloquea nuevas escrituras retroactivas.         | Ejercicio fiscal  | Invariante: no se modifican Movimientos históricos de un período cerrado                                                     |
| **Consolidación Financiera** | Agregación de los estados financieros individuales de varias Empresas de un mismo Grupo Corporativo, eliminando transacciones intercompañía. | —                 | Ver [48-erp-enterprise-readiness.md §4](../architecture/48-erp-enterprise-readiness.md)                                      |

## 8. Contexto: `impuestos`

| Término       | Definición                                                                                                     | Sinónimos   | Relaciones                        |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------- |
| **Impuesto**  | Carga tributaria aplicable a una operación, definida por Jurisdicción y Régimen Fiscal.                        | Tax         | Calculado por `CalcularImpuestos` |
| **Retención** | Monto que un Cliente o la empresa retiene de un pago por obligación tributaria, documentado en un Certificado. | Withholding | Genera `RetencionEmitida`         |
| **Exención**  | Condición que libera a una operación o Cliente/Proveedor del pago de un Impuesto específico.                   | —           | —                                 |

## 9. Contexto: `crm`

| Término         | Definición                                                                                            | Sinónimos | Relaciones                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| **Prospecto**   | Contacto comercial aún no calificado como Oportunidad.                                                | Lead      | Puede convertirse en Oportunidad                           |
| **Oportunidad** | Negociación comercial activa con probabilidad de cierre, ligada opcionalmente a un Cliente existente. | Deal      | Al ganarse, genera un Pedido de Venta vía comando síncrono |

## 10. Contexto: `rrhh` / `nomina`

| Término         | Definición                                                                                            | Sinónimos | Relaciones                          |
| --------------- | ----------------------------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| **Empleado**    | Persona con relación laboral vigente o histórica con la Empresa — maestro único, propiedad de `rrhh`. | —         | Consumido por `nomina`, `proyectos` |
| **Liquidación** | Cálculo periódico de la Nómina de todos los Empleados activos de un período.                          | Planilla  | Genera `LiquidacionCerrada`         |

## 11. Contexto: `activos-fijos` / `produccion` / `servicios` / `proyectos`

| Término                                     | Definición                                                                                      | Sinónimos                | Relaciones                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| **Activo Fijo**                             | Bien de uso propio de la empresa (no para la venta), sujeto a Depreciación.                     | —                        | Distinto de "Equipo bajo servicio" de `servicios`                    |
| **Depreciación**                            | Reconocimiento contable periódico de la pérdida de valor de un Activo Fijo.                     | —                        | Genera `DepreciacionCalculada`                                       |
| **Orden de Producción**                     | Documento que autoriza transformar Componentes (según un BOM) en un Producto terminado.         | —                        | Consume Reservas de Inventario, genera ingreso de Producto terminado |
| **Orden de Servicio**                       | Documento que registra un trabajo de servicio a realizar para un Cliente, con Técnico asignado. | —                        | Puede originarse en un Contrato de Servicio (SLA)                    |
| **WBS (Estructura de Desglose de Trabajo)** | Jerarquía de Tareas de un Proyecto.                                                             | Work Breakdown Structure | —                                                                    |
| **Hito**                                    | Punto de facturación parcial de un Proyecto, ligado a avance o fecha.                           | Milestone                | Genera una Factura vía comando síncrono a `ventas`                   |

## 12. Términos transversales (aparecen en varios contextos, sin dueño único)

| Término         | Definición                                                                                                                                                    | Contexto dueño de la definición                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Empresa**     | Entidad legal dentro de un Tenant (`company_id`) — puede pertenecer a un Grupo Corporativo.                                                                   | `configuracion` / `core`                                                                    |
| **Sucursal**    | Ver §2.                                                                                                                                                       | `inventario`/`configuracion`                                                                |
| **Estado**      | Situación actual de un documento en su ciclo de vida (`Borrador`, `Confirmado`, `Anulado`, ...), modelado como Value Object respaldado por una State Machine. | Cada Aggregate Root define sus propios estados — ver [04_aggregates.md](./04_aggregates.md) |
| **Correlativo** | Número secuencial único que identifica un documento dentro de una serie de numeración de una Empresa.                                                         | `configuracion`                                                                             |

## 13. Trazabilidad

Ningún término de este glosario introduce un nombre de clase, evento o
tabla que contradiga lo ya documentado — donde un término tiene
implementación ya nombrada (`VentaConfirmada`, `Kardex` como
`stock_movements`), se usa el nombre real. Los términos sin
implementación de código aún visible (p. ej. "Kardex" como concepto,
no como tabla literal) son el vocabulario de negocio que el código
**debe** adoptar cuando se implemente, por la regla ya fijada de que
entidades y eventos de dominio se nombran en español
([07-convenciones-y-estandares.md §2](../architecture/07-convenciones-y-estandares.md)).

**Siguiente documento:** [04_aggregates.md](./04_aggregates.md).
