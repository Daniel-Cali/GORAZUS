# Notas de versión — Punto de Venta (POS) — Fase 06 Parte 01

## Novedades

- **Punto de Venta operativo de punta a punta.** Nueva pantalla `/pos`, sin menú de navegación,
  pensada para uso rápido con teclado y lector de código de barras: buscar producto → carrito →
  cobrar → confirmar, con atajos F1 (buscar), F5 (cobrar), F6 (suspender venta), F7 (venta nueva),
  Escape (cerrar cobro).
- **Apertura y cierre de caja reales.** Selector de empresa/sucursal/caja con creación inline de
  caja nueva si no existe, apertura de turno con monto inicial, y endpoint de cierre que calcula el
  monto esperado (apertura + movimientos) para conciliar contra el conteo real del cajero.
- **Facturación real por venta.** Cada venta del POS genera una factura (`sales.invoices`,
  `sales_channel='pos'`) con impuestos calculados por línea contra la tasa vigente real
  (`taxes.tax_rates`), no un monto fijo.
- **Pago mixto.** Una venta puede cobrarse con más de una forma de pago (ej. parte efectivo, parte
  tarjeta); el sistema calcula el cambio automáticamente y no permite confirmar si el pago no
  alcanza.
- **Ventas suspendidas.** Un carrito puede guardarse sin cobrar ni descontar stock, para
  retomarlo más tarde — útil para cuando un cliente necesita ir a buscar algo más o falta stock
  temporalmente.
- **Nuevos módulos de dominio reutilizables:** `clientes` (con resolución automática de
  "Consumidor Final" para ventas sin cliente registrado), `caja`, `ventas` — cada uno expone su
  propia API REST además de ser consumido por el POS internamente.

## Correcciones incluidas (bugs preexistentes, no del POS)

- **Stock se aplicaba dos veces en cada movimiento.** Desde Fase 05 Parte 02, cualquier entrada,
  salida, transferencia o ajuste de inventario dejaba el stock final incorrecto (el doble del
  delta real) porque tanto el trigger de base de datos como el código de aplicación escribían el
  mismo valor. Corregido: ahora solo el trigger escribe, la aplicación solo valida y relee.
  **Impacto:** cualquier ambiente con este trigger activo tenía cantidades de stock incorrectas
  desde esa fase; se recomienda auditar `inventory.stock` en producción si este código ya corrió
  ahí antes de este fix.
- **Error de tipo en el bloqueo de filas de stock** (`operator does not exist: uuid = text`) que
  podía romper la validación de stock disponible bajo ciertas condiciones — corregido con casts
  explícitos.

## Alcance de esta parte

Cubre venta de contado/crédito simple con impuestos y pago mixto para un solo canal (POS). **No**
incluye: cotizaciones, pedidos, apartados, devoluciones/cambios/garantías, promociones/cupones/
tarjetas de regalo, crédito real de clientes, asiento contable automático, facturación electrónica
fiscal, envío de comprobante por correo/WhatsApp, venta por lote/serie, ni arqueo de caja por
denominación. Detalle completo en `POS_ARCHITECTURE.md §3`.

## Compatibilidad

Sin cambios incompatibles. Ningún endpoint, tabla ni contrato existente fue modificado —
únicamente se agregaron módulos y rutas nuevas, y se corrigió el comportamiento interno (no la
firma pública) de la aplicación de movimientos de stock para que coincida con lo que la base de
datos ya hacía.

## Cómo probarlo

1. Levantar la infraestructura (`docker compose up`) y la API/web como de costumbre.
2. Iniciar sesión (`admin@demo.local`, tenant `demo`).
3. Ir a `/pos`, elegir empresa/sucursal, crear o elegir una caja, abrir turno.
4. Buscar un producto existente por SKU, agregarlo al carrito, cobrar.

Ver `POS_API.md` para el detalle de cada endpoint y `POS_TEST_REPORT.md` para la evidencia de
verificación real (no solo unitarios).
