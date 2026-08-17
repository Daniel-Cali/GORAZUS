# Experiencia de Usuario — Punto de Venta (POS)

Ver `POS_ARCHITECTURE.md` para el alcance real de esta fase. Este documento describe la
experiencia completa (incluye lo diferido) para que el diseño visual no quede corto cuando se
construyan las partes siguientes — pero solo lo marcado como "Parte 01" tiene código detrás hoy.

## 1. Principios

- **Pantalla completa, sin distracciones**: el POS ocupa toda la ventana, sin el `AppShell`/menú
  lateral del resto del ERP (mismo criterio que `auth` — rutas fuera de `RequireAuth`+`AppShell`
  cuando la pantalla lo justifica, `docs/menus/00-convenciones.md §6`).
- **Teclado primero, mouse opcional, touch nativo**: cada acción tiene un atajo de teclado
  (`POS_SHORTCUTS.md`) y un target táctil de al menos 44×44px — nunca hay una acción que solo
  funcione con mouse.
- **Cero pasos innecesarios**: agregar un producto al carrito no abre un modal ni navega — pasa
  directo del buscador a la línea del carrito.
- **El operador nunca ve un error críptico**: toda excepción de dominio (`StockInsuficienteException`,
  `CajaNoAbiertaException`, etc.) se traduce a un mensaje corto y accionable, nunca un stack trace.

## 2. Perfil del usuario

Cajero de ferretería — puede o no tener experiencia previa con sistemas POS, trabaja de pie o
sentado frente a una pantalla táctil con teclado numérico/lector de código de barras conectado
como HID (se comporta como teclado: escribe el código + Enter). Turnos de alta rotación
(temporada), tolerancia cero a lentitud.

## 3. Layout (Parte 01 — real)

```
+-----------------------------------------------------------+
| Barra superior: caja abierta / cajero / hora / F1 ayuda   |
+----------------------+------------------------------------+
| Categorías            | Búsqueda rápida (SKU/nombre/scan) |
| (scroll vertical)      |------------------------------------|
|                      | Grilla de productos (imagen+nombre  |
| Favoritos (Parte 02) | +precio+stock)                     |
| Recientes (Parte 02) |                                    |
+----------------------+------------------------------------+
| Carrito (líneas: producto, cant, precio, desc%, subtotal)  Resumen |
|                                                             Subtotal |
|                                                             Impuestos |
|                                                             Total    |
+-----------------------------------------------------------+
| Acciones rápidas: F2 Cliente F3 Desc F4 Pago F5 Cobrar     |
|                   F6 Suspender F7 Nueva F8 Imprimir ESC    |
+-----------------------------------------------------------+
```

## 4. Estados de la pantalla

1. **Caja cerrada**: bloquea toda la pantalla salvo "Abrir caja" (monto inicial) — sin esto no se
   puede vender (real, `CajaNoAbiertaException`).
2. **Venta en curso**: layout de §3, carrito editable.
3. **Modal de cliente** (F2): buscar cliente existente o continuar con "Consumidor Final"
   (siempre disponible, sembrado por tenant).
4. **Modal de pago** (F4): forma de pago (efectivo/tarjeta/transferencia/cheque/crédito — reales,
   `configuration.payment_forms`), monto recibido, cambio calculado en cliente. Pago mixto: agregar
   más de una línea de pago antes de confirmar (F5).
5. **Confirmación de venta**: número de comprobante, cambio, opciones imprimir (Parte 01, ver
   `POS_COMPONENTS.md`)/enviar por correo o WhatsApp (diseñado, no conectado — Parte 02).
6. **Ventas suspendidas**: lista de carritos guardados (`invoices` en `draft`) para recuperar.

## 5. Accesibilidad y hardware

- Lector de código de barras: el input de búsqueda captura el patrón "ráfaga de caracteres +
  Enter" típico de un lector HID sin diferenciarlo de tipeo — funciona sin driver especial. No se
  puede verificar contra un lector físico real en este entorno (`POS_ARCHITECTURE.md §3`).
- Táctil: sin hover-only, sin tooltips como único medio de descubrir una acción, targets grandes en
  el carrito (aumentar/disminuir cantidad con +/-, no solo edición numérica).
- Teclado: navegación completa sin mouse, ver `POS_SHORTCUTS.md`.

## 6. Rendimiento percibido

Objetivo del prompt maestro: apertura <2s, agregar producto <100ms, cobrar <500ms. En Parte 01 se
mide en el entorno de desarrollo (ver `POS_TEST_REPORT.md`) — no es una garantía de producción sin
profiling dedicado contra infraestructura real (`POS_ARCHITECTURE.md §3`).
