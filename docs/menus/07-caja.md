# 07 — Caja

**Ícono sugerido:** `wallet`
**Tipo:** Dueño de datos
**Descripción:** Movimientos de efectivo y equivalentes, arqueos y
cierres de caja. Cubre tanto cajas administrativas como cajas de punto
de venta.
**Módulos relacionados:** `ventas`/`pos` (cobro de contado),
`compras` (pago menor en efectivo), `bancos` (depósito de efectivo),
`contabilidad` (asiento), `tesoreria` (posición consolidada).

## Submenú: Operación de Caja

### Formularios

| Formulario                | Qué hace                                                         | Tablas principales          | Permiso           | Documento que genera    |
| ------------------------- | ---------------------------------------------------------------- | --------------------------- | ----------------- | ----------------------- |
| Caja                      | Da de alta una caja física/lógica (administrativa o de POS)      | `caja.caja`                 | `caja.configurar` | —                       |
| Apertura de Turno de Caja | Registra el monto inicial con el que arranca un turno            | `caja.turno`                | `caja.crear`      | Comprobante de Apertura |
| Recibo de Cobro           | Registra el ingreso de efectivo asociado a una factura de venta  | `caja.movimiento`           | `caja.crear`      | Recibo de Caja          |
| Comprobante de Egreso     | Registra una salida de efectivo (pago menor, viáticos)           | `caja.movimiento`           | `caja.crear`      | Comprobante de Egreso   |
| Cierre de Turno de Caja   | Registra el conteo final y calcula diferencia contra lo esperado | `caja.turno`, `caja.arqueo` | `caja.crear`      | Acta de Cierre / Arqueo |

### Acciones

| Acción                          | Qué hace                                                              | Permiso          | Efecto/Evento                                                    |
| ------------------------------- | --------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------- |
| Confirmar movimiento            | Pasa un recibo/egreso a definitivo                                    | `caja.confirmar` | Publica `MovimientoCajaConfirmado`, consumido por `contabilidad` |
| Anular movimiento               | Revierte un movimiento confirmado del mismo turno                     | `caja.anular`    | Publica `MovimientoCajaAnulado`                                  |
| Cerrar turno                    | Bloquea nuevos movimientos sobre el turno y calcula sobrante/faltante | `caja.confirmar` | Publica `TurnoCerrado`                                           |
| Transferir efectivo entre cajas | Mueve efectivo de una caja a otra (p. ej. de POS a caja fuerte)       | `caja.confirmar` | —                                                                |
| Depositar a banco               | Registra el traslado de efectivo de caja a una cuenta bancaria        | `caja.confirmar` | Publica evento consumido por `bancos`                            |

## Submenú: Reportes de Caja

| Reporte                  | Qué muestra                                             | Filtros principales |
| ------------------------ | ------------------------------------------------------- | ------------------- |
| Movimientos de Caja      | Detalle de ingresos/egresos de un período               | Caja, período       |
| Arqueo de Caja           | Detalle de aperturas/cierres con diferencias detectadas | Caja, período       |
| Flujo de Efectivo Diario | Totales de ingreso/egreso por día                       | Rango de fechas     |
| Diferencias de Arqueo    | Turnos con sobrante/faltante, para seguimiento          | Período             |

## Submenú: Consultas

| Consulta                  | Qué muestra                                      | Permiso    |
| ------------------------- | ------------------------------------------------ | ---------- |
| Turno activo              | Estado actual del turno abierto por caja/usuario | `caja.ver` |
| Buscar movimiento de caja | Búsqueda libre por número, monto, referencia     | `caja.ver` |

## Configuraciones del módulo

| Parámetro                                          | Qué controla                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| Tolerancia de diferencia en arqueo                 | Monto admitido sin requerir justificación/aprobación                |
| Requiere doble aprobación para egresos mayores a X | Umbral que exige `caja.aprobar` además de `caja.crear`              |
| Cuenta contable por caja                           | Referencia para el asiento automático (coordina con `contabilidad`) |
