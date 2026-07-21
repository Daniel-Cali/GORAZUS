# 03 — Compras

**Ícono sugerido:** `truck`
**Tipo:** Dueño de datos
**Descripción:** Ciclo de abastecimiento desde el requerimiento de
compra hasta la factura del proveedor y su pago, incluyendo
importaciones y evaluación de proveedores.
**Módulos relacionados:** `proveedores` (maestro), `inventario`
(ingreso de stock), `bancos`/`tesoreria` (pago), `contabilidad`
(asiento), `activos-fijos` (alta de bienes por compra), `produccion`
(materia prima), `documentos`, `reportes`/`bi`.

## Submenú: Documentos de Compra

### Formularios

| Formulario                   | Qué hace                                              | Tablas principales                                     | Permiso         | Documento que genera                    |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------- | --------------------------------------- |
| Requerimiento de Compra      | Solicitud interna de compra sujeta a aprobación       | `compras.requerimiento`, `compras.requerimiento_linea` | `compras.crear` | Requerimiento de Compra                 |
| Orden de Compra              | Compromiso formal de compra a un proveedor            | `compras.orden_compra`, `compras.orden_compra_linea`   | `compras.crear` | Orden de Compra                         |
| Recepción de Mercadería      | Registra el ingreso físico contra una Orden de Compra | `compras.recepcion`, `compras.recepcion_linea`         | `compras.crear` | Nota de Recepción                       |
| Factura de Compra            | Registra el documento fiscal del proveedor            | `compras.factura`, `compras.factura_linea`             | `compras.crear` | Factura de Compra (registrada como CxP) |
| Nota de Crédito de Proveedor | Ajusta una factura de compra ya registrada            | `compras.nota_credito`                                 | `compras.crear` | Nota de Crédito de Proveedor            |
| Devolución a Proveedor       | Registra la salida física de mercadería devuelta      | `compras.devolucion`, `compras.devolucion_linea`       | `compras.crear` | Nota de Crédito (vinculada)             |

### Acciones

| Acción                                      | Qué hace                                                                | Permiso             | Efecto/Evento                                      |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------------------- | -------------------------------------------------- |
| Aprobar Requerimiento de Compra             | Autoriza convertir un requerimiento en Orden de Compra                  | `compras.aprobar`   | Publica `RequerimientoAprobado`                    |
| Confirmar documento                         | Pasa el documento a estado definitivo                                   | `compras.confirmar` | Publica evento correspondiente                     |
| Anular documento                            | Revierte un documento confirmado sin efectos posteriores                | `compras.anular`    | Publica `OrdenCompraAnulada`                       |
| Cotejar factura vs. recepción (3-way match) | Compara Orden de Compra, Recepción y Factura antes de habilitar el pago | `compras.confirmar` | Bloquea el pago si hay diferencias no justificadas |
| Copiar a documento siguiente                | Genera el siguiente documento del flujo copiando líneas                 | `compras.crear`     | —                                                  |

## Submenú: Evaluación y Homologación de Proveedores

| Elemento                             | Detalle                                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario — Criterio de Evaluación  | Qué hace: define criterios (calidad, plazo de entrega, precio) y su ponderación. Tablas: `compras.criterio_evaluacion`. Permiso: `compras.configurar` |
| Formulario — Evaluación de Proveedor | Registra la calificación periódica de un proveedor                                                                                                    | `compras.evaluacion_proveedor` | `compras.crear` |
| Reporte — Ranking de Proveedores     | Qué muestra: proveedores ordenados por calificación/cumplimiento                                                                                      | Permiso: `compras.ver`         |

## Submenú: Importaciones

| Elemento                                  | Detalle                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Formulario — Expediente de Importación    | Qué hace: agrupa una Orden de Compra al exterior con sus gastos asociados (flete, seguro, aduana) | Tablas: `compras.importacion`, `compras.importacion_gasto` | `compras.crear`                                       |
| Acción — Prorratear gastos de importación | Distribuye gastos de importación entre las líneas para costeo de inventario                       | `compras.confirmar`                                        | Actualiza costo de ingreso en `inventario` vía evento |
| Consulta — Estado de Expedientes          | Qué muestra: expedientes en tránsito, en aduana, nacionalizados                                   | `compras.ver`                                              |

## Submenú: Reportes de Compras

| Reporte                                     | Qué muestra                                        | Filtros principales |
| ------------------------------------------- | -------------------------------------------------- | ------------------- |
| Libro de Compras                            | Detalle fiscal de facturas recibidas en el período | Rango de fechas     |
| Compras por Proveedor                       | Total comprado agrupado por proveedor              | Período             |
| Compras por Producto/Categoría              | Ranking de productos comprados                     | Período             |
| Órdenes de Compra Pendientes de Recepción   | OC confirmadas sin recepción completa              | —                   |
| Órdenes de Compra Pendientes de Facturación | Recepciones sin factura asociada                   | —                   |
| Análisis de Precio de Compra Histórico      | Evolución de precio de un producto por proveedor   | Producto, período   |

## Submenú: Consultas

| Consulta                    | Qué muestra                                                          | Permiso       |
| --------------------------- | -------------------------------------------------------------------- | ------------- |
| Buscar documento de compra  | Búsqueda libre por número, proveedor, fecha, estado                  | `compras.ver` |
| Trazabilidad de documento   | Cadena Requerimiento→OC→Recepción→Factura de un caso puntual         | `compras.ver` |
| Comparativo de cotizaciones | Compara precios de distintos proveedores para el mismo requerimiento | `compras.ver` |

## Configuraciones del módulo

| Parámetro                                    | Qué controla                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| Series de numeración por tipo de comprobante | Numeración correlativa de OC, Recepción, Factura de Compra                |
| Requiere aprobación de Requerimiento         | Si toda compra necesita pasar por `compras.aprobar` antes de generar OC   |
| Tolerancia de 3-way match                    | Porcentaje de diferencia admitido entre OC/Recepción/Factura sin bloquear |
| Cuenta contable de compras por defecto       | Referencia para el asiento automático (coordina con `contabilidad`)       |
