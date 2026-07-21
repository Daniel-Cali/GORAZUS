# 12 — POS (Punto de Venta)

**Ícono sugerido:** `store`
**Tipo:** Composición (sin datos propios) — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#pos-no-tiene-entidades-propias)
**Descripción:** Interfaz optimizada para venta rápida de mostrador
(teclado/lector de código de barras, pantalla táctil). Una venta hecha
por POS es, en el modelo de datos, una `Venta` de `ventas` con canal
"POS" — no crea un maestro de ventas paralelo.
**Módulos relacionados:** `ventas` (documento de venta), `inventario`
(disponibilidad/salida), `caja` (turno y cobro), `clientes` (cliente de
mostrador opcional).

## Submenú: Venta Rápida

### Formularios

| Formulario                        | Qué hace                                                                                         | Tablas principales                                                       | Permiso     | Documento que genera      |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ----------- | ------------------------- |
| Pantalla de Venta POS             | Captura de líneas por lector de código de barras/búsqueda rápida, aplica precio de lista vigente | Escribe en `ventas.factura`/`ventas.pedido` (según configuración fiscal) | `pos.crear` | Factura de Venta o Ticket |
| Selección de Cliente de Mostrador | Asocia la venta a un cliente genérico o a uno identificado                                       | Lee `clientes.cliente`                                                   | `pos.crear` | —                         |

### Acciones

| Acción                       | Qué hace                                                                  | Permiso         | Efecto/Evento                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| Cobrar (multi-forma de pago) | Registra el cobro combinando efectivo/tarjeta/otros medios                | `pos.confirmar` | Llamada a `caja` (efectivo) y/o pasarela de pago; confirma la venta en `ventas`                         |
| Aplicar descuento rápido     | Aplica descuento manual dentro del límite autorizado                      | `pos.editar`    | Requiere `ventas.aprobar` si excede el límite (ver [Ventas](./02-ventas.md#configuraciones-del-módulo)) |
| Suspender / Recuperar Venta  | Guarda una venta a medias para atender otro cliente y continuarla después | `pos.crear`     | —                                                                                                       |
| Reimprimir Ticket            | Reimprime el comprobante de una venta ya cobrada                          | `pos.ver`       | —                                                                                                       |
| Anular Venta POS             | Anula una venta del turno actual                                          | `pos.anular`    | Igual que anular en `ventas`; libera stock reservado                                                    |

## Submenú: Turno de Caja POS

Reutiliza el submenú [Operación de Caja](./07-caja.md#submenú-operación-de-caja)
de `caja`, con la caja configurada como tipo "POS": Apertura de Turno,
Cierre de Turno, Arqueo.

## Submenú: Reportes de POS

| Reporte                       | Qué muestra                               | Filtros principales |
| ----------------------------- | ----------------------------------------- | ------------------- |
| Ventas por Turno              | Total vendido y cobrado por turno/cajero  | Turno, fecha        |
| Ventas por Terminal POS       | Comparativo entre puntos de venta físicos | Período             |
| Productos Más Vendidos en POS | Ranking de productos por canal POS        | Período             |
| Formas de Pago Utilizadas     | Desglose efectivo/tarjeta/otros           | Turno, período      |

## Submenú: Consultas

| Consulta                   | Qué muestra                                                        | Permiso   |
| -------------------------- | ------------------------------------------------------------------ | --------- |
| Buscar venta POS del turno | Búsqueda rápida dentro del turno activo para reimpresión/anulación | `pos.ver` |

## Configuraciones del módulo

| Parámetro                                       | Qué controla                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Terminal / Punto de Venta                       | Identifica cada caja POS física y su serie de numeración                      |
| Emite factura o ticket simplificado por defecto | Comportamiento fiscal por defecto de la terminal                              |
| Formas de pago habilitadas                      | Qué medios de pago acepta esa terminal                                        |
| Requiere identificar cliente                    | Si toda venta POS debe asociarse a un cliente o se permite "Consumidor Final" |
