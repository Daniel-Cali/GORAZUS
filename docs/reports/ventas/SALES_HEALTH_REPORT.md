# Informe de Salud — Módulo de Ventas Enterprise, Parte 1 (Cotización → Pedido → Factura)

## 1. Resumen

Cotizaciones y Pedidos de venta reales sobre 8 tablas más del schema `sales`, con conversión
completa Cotización → Pedido → Factura reutilizando el motor de Facturación ya construido (que a
su vez ya dispara Contabilidad automáticamente) — la cadena completa Cotización → Pedido → Factura
→ Asiento contable quedó verificada de punta a punta contra infraestructura real, no solo con
mocks.

**Estado general: sano. Un hallazgo real (flakiness heredada de acumulación de datos, no un bug de
esta parte) se encontró y corrigió durante la verificación; ninguna regresión en `inventario-backend`
ni `pos-backend`.**

## 2. Cobertura de pruebas

- 33 tests nuevos, 63/63 totales de `ventas-backend` (ver `SALES_TEST_REPORT.md`).
- 9/9 de `pos-backend`, sin regresión — relevante porque `InventarioModule` ahora se importa dos
  veces en el grafo (`PosModule` y `VentasModule`), confirmado que NestJS lo trata como singleton
  sin duplicar instancias.
- Verificación manual completa con `curl` contra Postgres real, incluida la reserva de inventario
  real (`inventory.stock_reservations`) y su liberación al completarse el pedido.

## 3. Limitaciones reales, documentadas (no fabricadas como resueltas)

| Limitación                                                           | Detalle                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sin liberación parcial de reservas                                   | `ReservasService` solo libera la reserva completa — un pedido con conversión parcial mantiene la reserva íntegra activa hasta quedar 100% facturado. Ver `SALES_PIPELINE_ARCHITECTURE.md §5`.                                                                                                     |
| Sin descuento de inventario real al facturar                         | El pedido reserva pero no descuenta stock (`MovimientosService.registrarLote`) — ese paso depende del proceso de despacho/entrega (§11 del pedido original), fuera de esta parte. Mismo criterio que Facturación Parte 1.                                                                         |
| `warehouseId` no se persiste en el pedido                            | Se usa solo para crear las reservas al momento de creación — `sales_orders` no tiene columna de almacén (no está en el schema certificado), así que no queda registrado cuál almacén surtirá cada línea después de creado el pedido.                                                              |
| Compensación de reservas es best-effort                              | Si falla la reserva de la línea 3 de 5, se intenta liberar las 2 ya creadas, pero cada llamada de liberación puede fallar independientemente (`catch(() => undefined)`) — no hay una garantía transaccional real entre `sales`/`inventory` (mismo límite ya documentado en `PosCheckoutService`). |
| Sin validación de `salespersonId`                                    | Se acepta el UUID sin verificar que exista un `salespeople` real — `salespeople`/comisiones están fuera de esta parte; un id inválido rompería en un error de FK de Postgres sin traducir en vez de un `400` limpio.                                                                              |
| "Convertir cotización directo a factura" no existe como atajo propio | El pedido original lista "convertir en pedido" y "convertir en factura" como dos acciones separadas de una cotización — se implementó solo la cadena lineal (cotización→pedido, pedido→factura); ir directo de cotización a factura requiere las dos llamadas, no una tercera ruta redundante.    |

## 4. Riesgos conocidos

| Riesgo                                      | Severidad | Detalle                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `salespersonId` sin validar                 | Baja      | Ver limitación de arriba — riesgo bajo porque es opcional y el caso de uso principal (comisiones) está fuera de alcance.                                                                                                                                                          |
| Reserva íntegra durante facturación parcial | Media     | Un pedido con 100 unidades del mismo producto, facturado de a 1 unidad muchas veces, mantiene reservadas las 99 restantes hasta la última conversión — puede sobre-restringir disponible para otros pedidos si el patrón de uso real es "muchas conversiones parciales pequeñas". |
| Sin límite de pedidos por cotización        | Baja      | Una cotización se marca `converted` tras el primer pedido — no se puede generar un segundo pedido de la misma cotización ni siquiera para el saldo no convertido (no aplica hoy porque `crearDesdeCotizacion` copia todas las líneas de una vez).                                 |

## 5. Deuda técnica introducida (nueva en esta fase)

- Ninguna deuda estructural nueva — las limitaciones de la tabla de arriba son alcance
  deliberadamente diferido, documentado, no código a medio terminar.

## 6. Deuda técnica heredada, relevante para esta fase (no nueva)

- El checkout de POS (`PosCheckoutService.confirmarVenta`) sigue sin ser una transacción
  distribuida real — el mismo patrón de orquestación no atómica se reutilizó a propósito en
  `PedidosVentaService.reservarLineas`, consistente con el resto del proyecto en vez de inventar
  una garantía nueva que el resto del sistema no tiene.

## 7. Seguridad y permisos

`ventas.gestionar_cotizaciones`/`ventas.gestionar_pedidos` sembrados y confirmados contra la base
real, todos los endpoints los exigen explícitamente. No se detectaron endpoints sin guardia de
permisos.

## 8. Recomendación

Antes de producción: decidir si el patrón de conversión parcial frecuente (muchas facturas
pequeñas por pedido) es un caso de uso real esperado — si lo es, vale la pena extender
`ReservasService` con liberación parcial antes de esta Parte 2.
