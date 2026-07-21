# 04 — Inventario

**Ícono sugerido:** `boxes`
**Tipo:** Dueño de datos
**Descripción:** Maestro de productos, control de existencias,
movimientos de stock, almacenes/ubicaciones y valorización. Único
módulo autorizado a modificar existencias — todo otro módulo que
afecte stock lo hace a través de este módulo.
**Módulos relacionados:** `ventas` (reserva/salida), `compras`
(ingreso), `pos` (salida rápida), `produccion` (consumo/ingreso de
materia prima y producto terminado), `servicios` (consumo de
repuestos), `contabilidad` (valorización), `documentos`.

## Submenú: Maestro de Productos

### Formularios

| Formulario                         | Qué hace                                                                     | Tablas principales                                      | Permiso                 | Documento que genera |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- | -------------------- |
| Producto                           | Alta/edición de producto o servicio, con código, unidad de medida, categoría | `inventario.producto`                                   | `inventario.crear`      | —                    |
| Categoría de Producto              | Clasifica productos jerárquicamente                                          | `inventario.categoria`                                  | `inventario.configurar` | —                    |
| Unidad de Medida                   | Define unidades y sus factores de conversión                                 | `inventario.unidad_medida`                              | `inventario.configurar` | —                    |
| Lista de Composición (Kit/Combo)   | Define un producto compuesto por otros para venta agrupada                   | `inventario.kit`, `inventario.kit_componente`           | `inventario.crear`      | —                    |
| Código de Barras / SKU alternativo | Asocia códigos adicionales a un producto                                     | `inventario.codigo_alterno`                             | `inventario.editar`     | —                    |
| Producto por Lote / Serie          | Habilita seguimiento por número de lote o número de serie                    | `inventario.producto_lote`, `inventario.producto_serie` | `inventario.configurar` | —                    |

## Submenú: Almacenes y Ubicaciones

| Elemento                                 | Detalle                                         |
| ---------------------------------------- | ----------------------------------------------- |
| Formulario — Almacén                     | Da de alta un almacén/depósito físico o virtual | `inventario.almacen`   | `inventario.configurar`             |
| Formulario — Ubicación dentro de Almacén | Define pasillo/estante/nivel para picking       | `inventario.ubicacion` | `inventario.configurar`             |
| Acción — Transferencia entre Almacenes   | Mueve stock de un almacén a otro                | `inventario.confirmar` | Genera Comprobante de Transferencia |

## Submenú: Movimientos de Stock

### Formularios

| Formulario                | Qué hace                                                           | Tablas principales                                       | Permiso                                        | Documento que genera  |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- | --------------------- |
| Ajuste de Inventario      | Corrige existencias por diferencia detectada (positivo o negativo) | `inventario.ajuste`, `inventario.ajuste_linea`           | `inventario.crear`                             | Comprobante de Ajuste |
| Toma Física de Inventario | Registra un conteo físico programado y sus diferencias             | `inventario.toma_fisica`, `inventario.toma_fisica_linea` | `inventario.crear`                             | Acta de Toma Física   |
| Reserva de Stock          | Bloquea cantidad para un pedido de venta u orden de producción     | `inventario.reserva`                                     | Automático (llamado por `ventas`/`produccion`) | —                     |

### Acciones

| Acción                       | Qué hace                                                        | Permiso                 | Efecto/Evento              |
| ---------------------------- | --------------------------------------------------------------- | ----------------------- | -------------------------- |
| Confirmar ajuste/toma física | Aplica la diferencia a la existencia                            | `inventario.confirmar`  | Publica `StockActualizado` |
| Liberar reserva              | Libera stock reservado no consumido (pedido vencido/anulado)    | `inventario.confirmar`  | Publica `StockActualizado` |
| Congelar producto            | Bloquea nuevas ventas/compras sobre un producto (descontinuado) | `inventario.configurar` | —                          |

## Submenú: Valorización de Inventario

| Elemento                                             | Detalle                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Formulario — Método de Costeo por Producto/Categoría | Define PEPS, promedio ponderado o costo estándar                     | `inventario.metodo_costeo` | `inventario.configurar`                                  |
| Acción — Recalcular Costo Promedio                   | Recalcula el costo tras un ajuste retroactivo                        | `inventario.confirmar`     | Publica `CostoActualizado`, consumido por `contabilidad` |
| Reporte — Valorización de Inventario                 | Qué muestra: valor de existencias a una fecha, por almacén/categoría | Permiso: `inventario.ver`  |

## Submenú: Reportes de Inventario

| Reporte                     | Qué muestra                                                    | Filtros principales        |
| --------------------------- | -------------------------------------------------------------- | -------------------------- |
| Kardex de Producto          | Movimientos detallados de un producto (entradas/salidas/saldo) | Producto, almacén, período |
| Existencias Actuales        | Stock disponible/reservado/comprometido por almacén            | Almacén, categoría         |
| Productos Bajo Mínimo       | Productos por debajo de su punto de reorden                    | Almacén                    |
| Productos Sin Movimiento    | Productos sin ventas/consumo en N días                         | Rango de días              |
| Diferencias de Toma Física  | Detalle de ajustes generados por conteo físico                 | Período                    |
| Trazabilidad por Lote/Serie | Historial completo de un lote o número de serie                | Lote/serie                 |
| Valorización por Almacén    | Valor de inventario agrupado por almacén                       | Fecha de corte             |

## Submenú: Consultas

| Consulta                      | Qué muestra                                 | Permiso          |
| ----------------------------- | ------------------------------------------- | ---------------- |
| Disponibilidad de Producto    | Stock disponible por almacén en tiempo real | `inventario.ver` |
| Dónde está el producto        | Ubicación física dentro de un almacén       | `inventario.ver` |
| Histórico de precios de costo | Evolución del costo de un producto          | `inventario.ver` |

## Configuraciones del módulo

| Parámetro                     | Qué controla                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Permitir stock negativo       | Si se puede confirmar una salida sin existencia suficiente                    |
| Método de costeo por defecto  | Método aplicado a productos nuevos si no se especifica                        |
| Punto de reorden por defecto  | Umbral que dispara la alerta de "stock bajo mínimo"                           |
| Requiere aprobación de ajuste | Si un ajuste de inventario necesita `inventario.aprobar` antes de confirmarse |
