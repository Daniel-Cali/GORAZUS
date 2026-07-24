# Atajos de Teclado — Punto de Venta (POS)

Todos activos solo cuando el foco no está dentro de un campo de texto que los necesite para otra
cosa (p. ej. `F5` no debe interceptar un refresh de navegador dentro de un input; se implementan
con `preventDefault()` a nivel de `window` salvo que el foco esté en `BarcodeScannerInput`, donde
`Enter` ya está tomado por el propio componente para el escaneo).

| Tecla    | Acción                                            | Notas                                                                               |
| -------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `F1`     | Buscar / foco al buscador                         | Lleva el foco a `BarcodeScannerInput` sin borrar el carrito.                        |
| `F2`     | Cliente                                           | Abre `CustomerPickerDialog`.                                                        |
| `F3`     | Descuento                                         | Aplica descuento manual a la línea seleccionada del carrito.                        |
| `F4`     | Pago                                              | Abre `PaymentDialog`.                                                               |
| `F5`     | Cobrar                                            | Confirma la venta si hay al menos un pago cargado que cubre el total.               |
| `F6`     | Suspender                                         | Guarda el carrito actual como venta suspendida (`draft`), limpia pantalla.          |
| `F7`     | Nueva venta                                       | Limpia el carrito actual (pide confirmación si no está vacío).                      |
| `F8`     | Imprimir                                          | Reimprime el último comprobante confirmado.                                         |
| `ESC`    | Cancelar                                          | Cierra el modal activo; si no hay modal, pide confirmar vaciar el carrito.          |
| `ENTER`  | Confirmar                                         | Confirma el modal/diálogo activo (mismo criterio en todos los diálogos del ui-kit). |
| `+`/`-`  | Aumentar/disminuir cantidad                       | Sobre la línea de carrito seleccionada (también con botones táctiles).              |
| `Delete` | Quitar línea                                      | Sobre la línea de carrito seleccionada.                                             |
| `↑`/`↓`  | Navegar líneas del carrito / resultados de grilla | Accesibilidad de teclado sin mouse.                                                 |

## Fuera de alcance de Parte 01

Atajos configurables por usuario, macros, soporte de pedal/teclado numérico dedicado con mapeo
custom — no se pidieron explícitamente y agregan superficie sin un caso de uso concreto todavía.
