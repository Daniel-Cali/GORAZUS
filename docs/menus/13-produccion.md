# 13 — Producción

**Ícono sugerido:** `cog`
**Tipo:** Dueño de datos
**Descripción:** Manufactura: listas de materiales, órdenes de
producción, centros de trabajo, planificación de requerimientos y
control de calidad.
**Módulos relacionados:** `inventario` (consumo de materia prima e
ingreso de producto terminado), `compras` (abastecimiento de
faltantes), `contabilidad` (costo de producción), `proyectos`
(producción bajo pedido asociada a un proyecto).

## Submenú: Listas de Materiales (BOM)

### Formularios

| Formulario                    | Qué hace                                                              | Tablas principales                             | Permiso                 | Documento que genera |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | ----------------------- | -------------------- |
| Lista de Materiales (BOM)     | Define los componentes e insumos necesarios para fabricar un producto | `produccion.bom`, `produccion.bom_componente`  | `produccion.crear`      | —                    |
| Ruta de Fabricación (Routing) | Define la secuencia de operaciones y tiempos estándar por producto    | `produccion.ruta`, `produccion.ruta_operacion` | `produccion.crear`      | —                    |
| Centro de Trabajo             | Define una estación/máquina/línea con su capacidad                    | `produccion.centro_trabajo`                    | `produccion.configurar` | —                    |

## Submenú: Órdenes de Producción

### Formularios

| Formulario                   | Qué hace                                                                              | Tablas principales                           | Permiso            | Documento que genera         |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------ | ---------------------------- |
| Orden de Producción          | Planifica la fabricación de una cantidad de producto en una fecha, a partir de un BOM | `produccion.orden`, `produccion.orden_linea` | `produccion.crear` | Orden de Producción          |
| Requisición de Materiales    | Solicita a `inventario` los componentes necesarios para una orden                     | `produccion.requisicion`                     | `produccion.crear` | Vale de Salida de Materiales |
| Parte de Producción (avance) | Registra avance real de una orden (cantidad producida, tiempo insumido, mermas)       | `produccion.parte_produccion`                | `produccion.crear` | —                            |

### Acciones

| Acción                      | Qué hace                                                                    | Permiso                | Efecto/Evento                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Liberar Orden de Producción | Pasa la orden de planificada a en curso, reserva materiales en `inventario` | `produccion.confirmar` | Publica `OrdenProduccionLiberada`                                                                                               |
| Cerrar Orden de Producción  | Registra el ingreso del producto terminado y el consumo real de materiales  | `produccion.confirmar` | Publica `OrdenProduccionCerrada`; `inventario` ingresa producto terminado y descuenta consumo; `contabilidad` recibe costo real |
| Reportar Merma/Rechazo      | Registra material o producto descartado por falla de calidad                | `produccion.crear`     | —                                                                                                                               |

## Submenú: Planificación (MRP)

| Elemento                                      | Detalle                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Acción — Calcular Requerimiento de Materiales | Qué hace: cruza demanda (pedidos de venta + pronóstico) contra stock disponible y BOM, sugiere qué comprar/fabricar y cuándo | Permiso: `produccion.confirmar` |
| Consulta — Sugerencias de Compra/Producción   | Qué muestra: resultado del cálculo MRP, editable antes de convertir en Orden de Compra/Producción                            | Permiso: `produccion.ver`       |

## Submenú: Control de Calidad

| Elemento                            | Detalle                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Formulario — Plan de Inspección     | Define puntos de control de calidad por producto/operación              | Tablas: `produccion.plan_inspeccion` | Permiso: `produccion.configurar`         |
| Formulario — Registro de Inspección | Registra el resultado de una inspección sobre una orden/lote            | `produccion.inspeccion`              | `produccion.crear`                       |
| Acción — Aprobar/Rechazar Lote      | Determina si el lote producido pasa a stock disponible o queda retenido | `produccion.aprobar`                 | Publica `LoteAprobado` / `LoteRechazado` |

## Submenú: Reportes de Producción

| Reporte                                      | Qué muestra                                             | Filtros principales        |
| -------------------------------------------- | ------------------------------------------------------- | -------------------------- |
| Órdenes de Producción por Estado             | Planificadas, en curso, cerradas, atrasadas             | Período, centro de trabajo |
| Consumo Real vs. Estándar (BOM)              | Desvío de materiales consumidos contra lo planificado   | Orden, producto            |
| Eficiencia de Centro de Trabajo (OEE básico) | Utilización real vs. capacidad planificada              | Centro de trabajo, período |
| Costo de Producción por Orden                | Materiales + mano de obra + costos indirectos aplicados | Orden, período             |
| Mermas y Rechazos                            | Detalle de descartes por causa                          | Período                    |

## Submenú: Consultas

| Consulta                           | Qué muestra                                               | Permiso          |
| ---------------------------------- | --------------------------------------------------------- | ---------------- |
| Dónde está una Orden de Producción | Estado y etapa actual en la ruta de fabricación           | `produccion.ver` |
| Explosión de materiales de un BOM  | Desglose completo de componentes, incluyendo subensambles | `produccion.ver` |

## Configuraciones del módulo

| Parámetro                                            | Qué controla                                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Método de costeo de producción                       | Absorción estándar vs. costo real                                                                |
| Tolerancia de merma aceptada                         | Porcentaje sin requerir justificación                                                            |
| Requiere aprobación de calidad para ingresar a stock | Si el producto terminado necesita `produccion.aprobar` antes de estar disponible en `inventario` |
