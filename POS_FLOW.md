# Flujo de Venta — Punto de Venta (POS)

Ver `POS_ARCHITECTURE.md §4.3` para la transacción real de checkout. Este documento detalla cada
paso del flujo pedido por el prompt maestro, marcando qué está construido en Parte 01.

```
Cliente
  ↓
Buscar producto                        [Real — GET /productos + GET /inventario/stock]
  ↓
Agregar al carrito                     [Real — solo en memoria del frontend hasta confirmar]
  ↓
Validar stock disponible               [Real — StockService.obtenerDisponible, on_hand-reserved]
  ↓
Validar reservas                       [Real — la disponibilidad ya descuenta quantity_reserved;
                                         no se crea una reserva nueva para la venta POS misma
                                         (la venta es instantánea, no hay ventana de tiempo que
                                         proteger — reservar tendría sentido para un Apartado,
                                         Parte 02, no para el mostrador]
  ↓
Aplicar promociones                    [NO construido — motor de promociones es Parte 02+]
  ↓
Aplicar descuentos                     [Real, parcial — descuento manual % por línea
                                         (invoice_lines.discount_percentage, ya en el schema).
                                         Sin descuento automático por categoría/cliente/cantidad]
  ↓
Calcular impuestos                     [Real — TasasImpuestoService, tasa vigente del impuesto
                                         asignado al producto; producto sin impuesto = 0]
  ↓
Seleccionar cliente                    [Real — CustomersService, default "Consumidor Final"]
  ↓
Seleccionar forma de pago              [Real — configuration.payment_forms, catálogo ya sembrado]
  ↓
Confirmar venta                        [Real — PosCheckoutService.confirmarVenta, transacción única]
  ↓
Descontar inventario                   [Real — MovimientosService.registrarLote, bloqueo de filas]
  ↓
Registrar Kardex                       [Real — automático: cada stock_movement ya alimenta
                                         inventory.v_kardex (Fase 05 Parte 02), sin código nuevo]
  ↓
Actualizar caja                        [Real — cash.cash_movements, contra la apertura activa]
  ↓
Registrar asiento contable             [NO construido — modules/contabilidad no existe todavía,
                                         ver POS_ARCHITECTURE.md §3 y TECHNICAL_DEBT.md]
  ↓
Emitir factura                         [Real, parcial — sales.invoices con número correlativo
                                         interno; NO es timbrado fiscal electrónico real]
  ↓
Imprimir                               [Real — vista de comprobante lista para impresión del
                                         navegador (Ctrl/Cmd+P); sin integración con impresora
                                         térmica ESC/POS dedicada]
  ↓
Enviar por correo                      [NO conectado — infraestructura SMTP ya existe
                                         (core/notifications, usada por reset de contraseña),
                                         falta el disparador desde POS, Parte 02]
  ↓
Enviar por WhatsApp                    [NO conectado — canal ya existe (core/notifications,
                                         Fase 01), falta el disparador desde POS, Parte 02]
  ↓
Auditoría                              [Real — created_by/updated_by/created_at ya se registran
                                         en cada fila (patrón estándar del proyecto), visible vía
                                         core.audit_logs si el módulo que la escribe está
                                         instrumentado; POS no agrega instrumentación de
                                         auditoría específica en Parte 01 más allá de eso]
```

## Suspender / recuperar venta

- **Suspender**: la factura se crea en `status='draft'` con sus líneas al momento de tocar F6 (no
  se descontó stock todavía — eso pasa recién al confirmar el cobro). El carrito queda persistido
  en base, no solo en memoria del navegador.
- **Recuperar**: listar `invoices` en `draft` filtradas por caja/cajero activo, retomar desde
  "Seleccionar forma de pago".

## Venta por código de barras / SKU / nombre

Un único input de búsqueda (`GET /pos/productos?query=...`) resuelve los tres casos: si el texto
matchea un `sku` exacto (o un código de barras, si el producto lo tiene registrado en
`products.products`) agrega directo la línea con cantidad 1; si no, busca por nombre y muestra la
grilla de resultados para selección manual.

## Fuera de alcance de Parte 01 (ver `POS_ARCHITECTURE.md §3` para el detalle completo)

Cotización, Apartado, Pedido (como documentos previos a la factura), Devolución, Cambio, Garantía,
venta por lote/serie, clientes a crédito con validación de límite.
