# UI Guidelines — GORAZUS Frontend

> Expande `docs/architecture/29-frontend-enterprise.md §6,7,8,8.1` (cadena
> Radix→shadcn→ui-kit, TanStack Table, Recharts) y referencia
> `docs/product/09_WIREFRAMES.md` (6 arquetipos) y `docs/product/06_NAVIGATION.md`/
> `docs/product/10_KEYBOARD_SHORTCUTS.md` sin repetirlos. Cierra los gaps de
> breakpoints concretos y compromiso de accesibilidad, no fijados antes. Sin código.

## 1. Cadena de componentes (referencia, no redecide)

```
Radix UI → shadcn/ui (CLI, copia) → ui-kit/components/primitives/ (tema aplicado)
    → ui-kit/components/{form,data-table,charts,layout}/ (composición)
        → modules/<x>/frontend/components/ (con conocimiento de negocio)
```

Cadena completa y su razón de ser ya fijada en `29 §7` — GORAZUS es dueño del código
de `primitives/` desde el momento en que se copia (sin actualizaciones automáticas de
shadcn). No se reabre.

## 2. Los 6 arquetipos de pantalla (referencia)

`docs/product/09_WIREFRAMES.md` fija los 6 arquetipos reutilizables (Dashboard,
Lista/Tabla, Formulario de captura, Detalle de documento, POS, Modal/Diálogo) que
cubren las 336 pantallas del catálogo (`docs/product/07_SCREEN_CATALOG.md`). Cada
arquetipo **es** un componente compuesto de `ui-kit/components/layout/` — regla ya
fijada en `09_WIREFRAMES.md §9` ("todo arquetipo se implementa como componente
compuesto en `ui-kit/components/`, nunca copiado y modificado pantalla por pantalla").
Este documento no rediseña los arquetipos, fija cómo se materializan técnicamente:

| Arquetipo (`09_WIREFRAMES.md`) | Componente de `ui-kit/`                                                                     | Motor headless                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Lista/Tabla                    | `ui-kit/components/data-table/DataTable`                                                    | TanStack Table (`29 §8`)                             |
| Formulario de captura          | `ui-kit/components/form/*` + `DataTable` en modo edición inline                             | React Hook Form + Zod (`03 §4`)                      |
| Detalle de documento           | `ui-kit/components/layout/DetailLayout` (breadcrumb + tabs + badge de estado)               | —                                                    |
| Dashboard                      | `ui-kit/components/layout/DashboardGrid` + `ui-kit/components/charts/*`                     | Recharts (`29 §8.1`)                                 |
| POS                            | Layout propio de `modules/pos/frontend/` (`docs/architecture/45-modulo-pos-frontend.md §1`) | — (caso especial, no reutiliza `DataTable` genérico) |
| Modal/Diálogo                  | `ui-kit/components/primitives/dialog.tsx` (Radix Dialog)                                    | —                                                    |

## 3. Tema: claro/oscuro y tokens

`29 §6,7` ya fija: tokens en `ui-kit/theme/tailwind-tokens.ts`, aplicado una sola vez,
ningún componente de `primitives/` hardcodea un color. Modo oscuro "de fábrica, no
tardío" es principio de producto (`docs/product/01_PRODUCT_VISION.md §7`, punto 6) —
consecuencia técnica: todo componente nuevo de `ui-kit/` se diseña y prueba en ambos
temas antes de darse por completo, nunca como una pasada de "soporte oscuro" posterior
sobre un componente ya construido solo en claro.

## 4. Breakpoints responsive (nuevo — no estaba fijado en valores concretos)

`docs/product/09_WIREFRAMES.md §4,5` y `docs/product/06_NAVIGATION.md §9` ya fijan el
comportamiento (tabla → tarjetas, sidebar → drawer + tab bar inferior) pero no los
valores de corte. Se fijan acá, alineados a los breakpoints por defecto de Tailwind
(sin capa de configuración adicional — KISS):

| Breakpoint | Ancho  | Uso principal en GORAZUS                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| `sm`       | 640px  | Punto donde un formulario de dos columnas pasa a una columna                               |
| `md`       | 768px  | Punto donde `DataTable` colapsa a tarjetas apiladas (`09_WIREFRAMES.md §4`)                |
| `lg`       | 1024px | Punto donde el sidebar dejar de ser drawer y queda fijo/colapsable (`06_NAVIGATION.md §9`) |
| `xl`       | 1280px | Dashboards con grillas de 3-4 columnas de widgets pasan a su layout completo               |

POS es la excepción ya documentada (`09_WIREFRAMES.md §7`) — sin variante mobile,
diseñado para pantalla de escritorio/tablet grande (≥ `lg`), no se le aplican los
breakpoints de colapso de tabla/sidebar de arriba porque no tiene ni tabla genérica ni
sidebar.

## 5. Accesibilidad (nuevo — no estaba fijado como compromiso explícito)

Ningún documento anterior fijaba un nivel de accesibilidad objetivo, aunque la base
técnica (Radix UI) ya lo hace posible por diseño ("primitivas accesibles: manejo de
foco, ARIA, teclado", `29 §7`). Se fija acá:

- **Objetivo: WCAG 2.1 nivel AA** para todo componente de `ui-kit/`, heredado por
  todas las pantallas que los usan — no un nivel distinto por módulo (consistencia,
  `docs/product/01_PRODUCT_VISION.md §7`).
- Gran parte se obtiene gratis de Radix (foco, ARIA, navegación de teclado en menús/
  diálogos/comboboxes) — el trabajo real de este objetivo es **no romperlo** al
  componer (`ui-kit/components/form/` no le quita el `aria-label` que Radix ya provee
  al envolverlo, por ejemplo) y cubrir lo que Radix no resuelve por sí solo: contraste
  de color (validado contra los tokens de tema, §3), texto alternativo de gráficos
  (`ui-kit/components/charts/`, que además del SVG expone una tabla de datos
  equivalente oculta para lectores de pantalla), y foco visible consistente en todo
  elemento interactivo custom.
- Los atajos de teclado globales y de POS (`docs/product/10_KEYBOARD_SHORTCUTS.md`)
  son en sí mismos parte del compromiso de accesibilidad — un usuario que no puede
  usar mouse con fluidez depende de que todo flujo de alto volumen sea operable 100%
  por teclado, ya sea requisito de producto (`10_KEYBOARD_SHORTCUTS.md §6`,
  descubribilidad).

## 6. Iconografía

Ya fijado en `docs/menus/00-convenciones.md §2`: **lucide-react**, nombre de ícono en
kebab-case tal como lo expone la librería, usado directamente como nombre de
componente sin traducción intermedia. `docs/frontend/` no agrega nada — solo confirma
que el registro de features (`FEATURES.md §5`) y el catálogo de pantallas usan
exactamente esos nombres.

## 7. Gráficos (referencia)

Recharts, decisión y razones completas ya en `29 §8.1` — envuelto en
`ui-kit/components/charts/` para que ningún módulo importe Recharts directamente. Este
documento agrega solo la regla de accesibilidad de §5 (tabla de datos equivalente) que
no estaba cubierta en `29 §8.1`.

## 8. Tablas (referencia + regla de escala)

TanStack Table como motor headless (`29 §8`), ya justificado. Regla nueva de este
documento, relevante para módulos de alto volumen de filas (Kardex de `inventario`,
Movimientos de `caja`/`bancos`, Libro Diario de `contabilidad` —
`docs/product/07_SCREEN_CATALOG.md §4.4,§4.7,§4.8,§4.9`): ver
[PERFORMANCE.md §3](./PERFORMANCE.md#3-virtualización-de-listas-largas) para
virtualización — `DataTable` de `ui-kit/` soporta un modo virtualizado activable por
prop, no dos componentes de tabla distintos.

## 9. Formularios (referencia)

React Hook Form + Zod, patrón completo ya en `03 §4`. `ui-kit/components/form/`
provee `FormField`/`FormError` que envuelven `primitives/` (`29 §6`) — todo mensaje de
error de validación se renderiza con ese componente único, nunca un `<span>` de error
construido a mano por módulo (consistencia visual, y punto de enganche único para
traducción de mensajes, ver
[ERROR_HANDLING.md §2](./ERROR_HANDLING.md#2-errores-de-validación-de-formulario)).

## 10. Patrones transversales de `docs/product/08_USER_FLOWS.md`

Cada flujo transversal documentado en `docs/product/08_USER_FLOWS.md` es un componente
de `ui-kit/`, nunca reimplementado por módulo (`08_USER_FLOWS.md §8`, ya fijado):

| Flujo (`08_USER_FLOWS.md`)            | Componente de `ui-kit/`                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| §3 Selector con creación inline       | `ui-kit/components/form/EntitySelector`                                        |
| §4 Confirmación de acción destructiva | `ui-kit/components/primitives/dialog.tsx` en modo `ConfirmDialog`              |
| §5 Error de validación                | `ui-kit/components/form/FormError` (§9 arriba)                                 |
| §6 Acción masiva sobre lista          | `ui-kit/components/data-table/BulkActionBar`                                   |
| §7 Cambio de Empresa/Sucursal         | `ui-kit/components/layout/CompanySwitcher`, consume `STATE_MANAGEMENT.md §3.3` |

## 11. Trazabilidad

| Punto                  | Ya fijado en                       | Cerrado/detallado acá                                      |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------- |
| Cadena Shadcn/Radix    | `29 §7`                            | Referencia (§1)                                            |
| Arquetipos de pantalla | `docs/product/09_WIREFRAMES.md`    | Mapeo a componente concreto de `ui-kit/` (§2)              |
| Tema claro/oscuro      | `29 §6,7`                          | Compromiso de "ambos temas antes de dar por completo" (§3) |
| Breakpoints            | Ninguno — solo comportamiento      | Valores concretos (§4)                                     |
| Accesibilidad          | Ninguno — implícito en Radix       | Objetivo WCAG 2.1 AA explícito (§5)                        |
| Iconografía            | `docs/menus/00-convenciones.md §2` | Referencia (§6)                                            |
| Gráficos, Tablas       | `29 §8,8.1`                        | Accesibilidad de charts (§7), virtualización referida (§8) |
| Formularios            | `03 §4`                            | Punto de enganche de i18n de errores (§9)                  |
| Flujos transversales   | `docs/product/08_USER_FLOWS.md`    | Mapeo a componente concreto (§10)                          |
