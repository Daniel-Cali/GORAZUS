# 10 — Keyboard Shortcuts

## 1. Objetivo

Catalogar los atajos de teclado del sistema — soporte directo al principio "atajos de teclado en todo flujo de alto volumen" (`01_PRODUCT_VISION.md §7`) y a la persona que más los necesita (Miguel, cajero, `02_USER_PERSONAS.md §3.1`).

## 2. Alcance

Atajos **globales** (toda la aplicación) y atajos **de POS** (la pantalla de mayor densidad de uso repetitivo). No cubre atajos específicos de cada uno de los 160 formularios del catálogo (`07_SCREEN_CATALOG.md`) — un formulario estándar hereda los atajos globales (§3) y los de edición de tabla (§5), sin necesitar su propio set.

## 3. Atajos globales

| Atajo (Win/Linux) | Atajo (Mac) | Acción                                                                                                         |
| ----------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `Ctrl+K`          | `⌘K`        | Abrir búsqueda global / comando rápido (`06_NAVIGATION.md §4-7`)                                               |
| `Ctrl+N`          | `⌘N`        | Nuevo (contextual al módulo activo — nueva venta en Ventas, nuevo cliente en Clientes)                         |
| `Ctrl+S`          | `⌘S`        | Guardar (formulario activo) — nunca navega fuera de la pantalla                                                |
| `Ctrl+Enter`      | `⌘Enter`    | Guardar y confirmar (equivalente al botón primario de acción, distinto de "guardar como borrador")             |
| `Esc`             | `Esc`       | Cancelar / cerrar modal activo — nunca cierra sin confirmar si hay cambios sin guardar (`08_USER_FLOWS.md §7`) |
| `/`               | `/`         | Foco directo al buscador de la lista actual (sin abrir búsqueda global)                                        |
| `Ctrl+B`          | `⌘B`        | Colapsar/expandir sidebar (`06_NAVIGATION.md §3`)                                                              |
| `?`               | `?`         | Mostrar overlay de atajos disponibles en la pantalla actual                                                    |

## 4. Atajos de POS (ver arquetipo en `09_WIREFRAMES.md §7`)

| Atajo              | Acción                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `F2`               | Foco al buscador de producto (equivalente a escanear)                                                           |
| `F4`               | Ir a cobrar (abre selector de método de pago)                                                                   |
| `F6`               | Asociar cliente a la venta actual                                                                               |
| `F8`               | Aplicar descuento a la línea seleccionada                                                                       |
| `F9`               | Cancelar venta completa (pide confirmación — única confirmación que POS no se salta, ver `06_NAVIGATION.md §8`) |
| `↑` `↓`            | Moverse entre líneas de la venta                                                                                |
| `+` `-`            | Ajustar cantidad de la línea seleccionada                                                                       |
| `Delete`           | Quitar la línea seleccionada                                                                                    |
| `Esc`              | Cancelar la línea que se está capturando (no la venta completa — ver `F9`)                                      |
| `Enter` (en cobro) | Confirmar el pago con el monto ingresado                                                                        |

**Regla de diseño:** en POS, los atajos son de **una sola tecla o `F-key`** (no combinaciones con `Ctrl`/`⌘`) porque la velocidad de un cajero experimentado (persona 3.1) se mide en milisegundos por venta — una combinación de 2 teclas es medible más lenta a ese volumen.

## 5. Atajos de edición de tabla (formularios de captura, `09_WIREFRAMES.md §5`)

| Atajo           | Acción                                    |
| --------------- | ----------------------------------------- |
| `Tab`           | Siguiente celda editable                  |
| `Shift+Tab`     | Celda anterior                            |
| `Ctrl+↵` / `⌘↵` | Agregar nueva línea desde la última celda |
| `Alt+Delete`    | Eliminar la línea actual                  |

## 6. Descubribilidad (nadie memoriza un atajo que no ve)

```
┌─────────────────────────────────────┐
│  Nueva venta                    ⌘N   │  ← el atajo se muestra junto
│  Buscar                         ⌘K   │     a cada acción en menús y
│  Guardar                        ⌘S   │     botones — no vive solo
└─────────────────────────────────────┘     en este documento
```

**Regla:** todo atajo de §3 y §4 se muestra visualmente junto a su acción correspondiente (tooltip de botón, entrada de comando rápido) — un atajo que no se puede descubrir usando la interfaz no cumple su propósito, obliga a leer un manual.

## 7. Conflictos con atajos del navegador/SO

`Ctrl+N`/`Ctrl+S` colisionan con atajos nativos del navegador (nueva ventana, guardar página). Se capturan a nivel de aplicación con `preventDefault()` **solo cuando el usuario está autenticado y dentro del layout principal** — nunca en la pantalla de login, para no romper el atajo nativo de guardar contraseña del navegador ahí. (Nota técnica de frontera, no de implementación — el detalle de cómo se captura vive en `docs/architecture/`, no acá.)

## 8. Buenas prácticas

- Antes de asignar un atajo nuevo a una acción de módulo, verificar que no colisiona con §3 (global) — los atajos globales tienen prioridad, un módulo no puede reasignar `Ctrl+K`.
- Los atajos de POS (§4) son deliberadamente distintos en estilo (F-keys, una tecla) del resto del sistema (`Ctrl`/`⌘` + letra) — es la única inconsistencia intencional del catálogo, justificada en `06_NAVIGATION.md §8`.

## 9. Reglas

- Todo atajo nuevo se agrega primero a este documento antes de implementarse — evita que dos módulos distintos reclamen el mismo atajo para acciones distintas sin que nadie lo note hasta que un usuario lo reporte.
- Los atajos son configurables solo a nivel de accesibilidad (usuarios que no pueden usar ciertas combinaciones) — no personalizables libremente por usuario, para que la documentación (y la ayuda en pantalla, `?`) siga siendo válida para todos.
