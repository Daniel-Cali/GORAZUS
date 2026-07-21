# 02 — Ventas

**Ícono sugerido:** `shopping-cart`
**Tipo:** Dueño de datos
**Descripción:** Ciclo comercial completo desde la cotización hasta la
factura y su cobro, incluyendo devoluciones, facturación electrónica y
facturación recurrente.
**Módulos relacionados:** `clientes` (maestro), `inventario` (stock),
`caja`/`bancos`/`tesoreria` (cobro), `contabilidad` (asiento), `crm`
(origen de oportunidades), `pos` (canal de venta), `documentos`
(adjuntos), `reportes`/`bi` (consumo de solo lectura).

## Submenú: Documentos de Venta

### Formularios

| Formulario               | Qué hace                                                                        | Tablas principales                             | Permiso        | Documento que genera        |
| ------------------------ | ------------------------------------------------------------------------------- | ---------------------------------------------- | -------------- | --------------------------- |
| Cotización / Presupuesto | Registra una oferta de precio sin compromiso de stock ni efecto contable        | `ventas.cotizacion`, `ventas.cotizacion_linea` | `ventas.crear` | Cotización                  |
| Pedido de Venta          | Convierte una cotización (o se crea directo) en un compromiso que reserva stock | `ventas.pedido`, `ventas.pedido_linea`         | `ventas.crear` | Pedido de Venta             |
| Remito / Nota de Entrega | Registra la entrega física de mercadería asociada a un pedido                   | `ventas.remito`, `ventas.remito_linea`         | `ventas.crear` | Remito                      |
| Factura de Venta         | Registra el documento fiscal de venta, a partir de un pedido/remito o directa   | `ventas.factura`, `ventas.factura_linea`       | `ventas.crear` | Factura de Venta            |
| Nota de Crédito          | Ajusta (total o parcialmente) una factura ya emitida                            | `ventas.nota_credito`                          | `ventas.crear` | Nota de Crédito             |
| Nota de Débito           | Registra un cargo adicional sobre una factura ya emitida                        | `ventas.nota_debito`                           | `ventas.crear` | Nota de Débito              |
| Devolución de Venta      | Registra el reingreso físico de mercadería previamente vendida                  | `ventas.devolucion`, `ventas.devolucion_linea` | `ventas.crear` | Nota de Crédito (vinculada) |

### Acciones

| Acción                       | Qué hace                                                                                   | Permiso            | Efecto/Evento                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------- |
| Confirmar documento          | Pasa el documento de borrador a definitivo, ya no editable                                 | `ventas.confirmar` | Publica evento correspondiente (`VentaConfirmada`, `FacturaVentaEmitida`) |
| Anular documento             | Revierte un documento confirmado que aún no tuvo efectos posteriores                       | `ventas.anular`    | Publica `VentaAnulada`; libera stock reservado                            |
| Copiar a documento siguiente | Genera el siguiente documento del flujo (Cotización→Pedido→Remito→Factura) copiando líneas | `ventas.crear`     | —                                                                         |
| Reservar stock               | Solicita a `inventario` reservar cantidad para un Pedido                                   | `ventas.confirmar` | Llamada síncrona a `InventarioQueryService`                               |
| Imprimir / Exportar PDF      | Genera representación imprimible del documento                                             | `ventas.ver`       | —                                                                         |
| Enviar por correo            | Envía el documento al contacto del cliente                                                 | `ventas.ver`       | —                                                                         |

## Submenú: Facturación Electrónica

| Elemento                                              | Detalle                                                                                                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario — Configuración de Facturación Electrónica | Qué hace: registra certificado digital, ambiente (pruebas/producción), tipo de comprobante habilitado. Tablas: `ventas.config_facturacion_electronica`. Permiso: `ventas.configurar`      |
| Acción — Timbrar / Sellar factura                     | Qué hace: envía la factura al proveedor de facturación electrónica o autoridad fiscal y recibe el sello/folio fiscal. Permiso: `ventas.confirmar`. Documento: Factura de Venta (timbrada) |
| Acción — Reenviar comprobante fiscal                  | Reintenta el timbrado/envío tras un rechazo o timeout. Permiso: `ventas.confirmar`                                                                                                        |
| Acción — Cancelar comprobante fiscal                  | Solicita cancelación ante la autoridad fiscal (dentro de la ventana permitida). Permiso: `ventas.anular`                                                                                  |
| Consulta — Estado de comprobantes fiscales            | Qué muestra: comprobantes pendientes, timbrados, rechazados, cancelados. Tablas: `ventas.factura`. Permiso: `ventas.ver`                                                                  |

## Submenú: Precios y Descuentos

### Formularios

| Formulario                      | Qué hace                                                | Tablas principales                                | Permiso             | Documento que genera |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------- | ------------------- | -------------------- |
| Lista de Precios                | Define precios de venta por producto, moneda y vigencia | `ventas.lista_precio`, `ventas.lista_precio_item` | `ventas.configurar` | —                    |
| Descuento por Cliente/Categoría | Define reglas de descuento automático                   | `ventas.regla_descuento`                          | `ventas.configurar` | —                    |
| Promoción / Oferta              | Define combos o descuentos por volumen con vigencia     | `ventas.promocion`                                | `ventas.configurar` | —                    |

## Submenú: Equipo de Ventas

### Formularios

| Formulario                 | Qué hace                                                             | Tablas principales      | Permiso             | Documento que genera |
| -------------------------- | -------------------------------------------------------------------- | ----------------------- | ------------------- | -------------------- |
| Vendedor                   | Da de alta un vendedor y lo vincula a un usuario del sistema         | `ventas.vendedor`       | `ventas.configurar` | —                    |
| Zona / Territorio de Venta | Define zonas geográficas o de cartera                                | `ventas.zona`           | `ventas.configurar` | —                    |
| Regla de Comisión          | Define porcentaje/escala de comisión por vendedor, línea o categoría | `ventas.regla_comision` | `ventas.configurar` | —                    |
| Meta de Venta              | Define objetivo de venta por vendedor/equipo/período                 | `ventas.meta`           | `ventas.configurar` | —                    |

### Reportes

| Reporte                 | Qué muestra                             | Filtros principales | Permiso      |
| ----------------------- | --------------------------------------- | ------------------- | ------------ |
| Comisiones por Vendedor | Comisión devengada por período          | Vendedor, período   | `ventas.ver` |
| Cumplimiento de Metas   | Venta real vs. meta por vendedor/equipo | Período, vendedor   | `ventas.ver` |

## Submenú: Facturación Recurrente

| Elemento                                         | Detalle                                                                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario — Plantilla de Facturación Recurrente | Qué hace: define un contrato de facturación periódica (cliente, líneas, frecuencia, duración). Tablas: `ventas.plantilla_recurrente`. Permiso: `ventas.crear`             |
| Acción — Generar facturas del período            | Qué hace: crea automáticamente las facturas pendientes según las plantillas activas. Permiso: `ventas.confirmar`. Documento: Factura de Venta (una por plantilla vencida) |
| Consulta — Próximas facturaciones                | Qué muestra: plantillas con próxima fecha de generación. Permiso: `ventas.ver`                                                                                            |

## Submenú: Reportes de Ventas

| Reporte                          | Qué muestra                                                      | Filtros principales                  |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| Libro de Ventas                  | Detalle fiscal de facturas emitidas en el período                | Rango de fechas, tipo de comprobante |
| Ventas por Cliente               | Total facturado agrupado por cliente                             | Período, vendedor, zona              |
| Ventas por Producto/Categoría    | Ranking de productos vendidos                                    | Período, categoría                   |
| Ventas por Vendedor/Zona         | Desempeño comercial                                              | Período                              |
| Márgenes de Venta                | Utilidad bruta por documento/producto                            | Período                              |
| Notas de Crédito/Débito Emitidas | Detalle de ajustes a facturas                                    | Período                              |
| Pedidos Pendientes de Entrega    | Pedidos confirmados sin remito completo                          | —                                    |
| Facturas Pendientes de Cobro     | Ver submenú Cuentas por Cobrar en [Tesorería](./10-tesoreria.md) |

## Submenú: Consultas

| Consulta                       | Qué muestra                                                                         | Permiso      |
| ------------------------------ | ----------------------------------------------------------------------------------- | ------------ |
| Buscar documento de venta      | Búsqueda libre por número, cliente, fecha, estado                                   | `ventas.ver` |
| Historial de venta por cliente | Todos los documentos de un cliente en un timeline                                   | `ventas.ver` |
| Trazabilidad de documento      | Cadena completa Cotización→Pedido→Remito→Factura→Nota de Crédito de un caso puntual | `ventas.ver` |

## Configuraciones del módulo

| Parámetro                                    | Qué controla                                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Series de numeración por tipo de comprobante | Numeración correlativa de Cotización, Pedido, Factura, NC, ND (coordina con `configuracion`) |
| Punto de venta / sucursal emisora            | Determina la serie fiscal aplicable en multisucursal                                         |
| Requiere aprobación de descuento manual      | Si un descuento fuera de lista requiere `ventas.aprobar`                                     |
| Permite facturar sin stock                   | Si el pedido puede confirmarse con stock insuficiente (backorder)                            |
| Moneda de venta por defecto                  | Moneda usada si el cliente no especifica una                                                 |
