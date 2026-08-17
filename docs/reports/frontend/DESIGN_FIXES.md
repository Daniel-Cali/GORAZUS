# Correcciones de Diseño — Fase 01

Cada corrección de abajo se verificó **antes y después** con Playwright real (captura o medición
de `computedStyle`/`boundingBox`), no a ojo. Detalle técnico en `UI_IMPROVEMENTS.md`; esto es el
registro de evidencia.

## 1. Personalización perdida tras recargar (`RequireAuth`)

- **Antes**: `page.goto('/dashboard')` tras login → `<h1>` muestra "Dashboard" (fallback genérico),
  topbar sin nombre de usuario.
- **Después**: mismo flujo → `<h1>` muestra "Hola, Admin Demo", topbar muestra "Admin Demo".
  Verificado explícitamente simulando una recarga completa (`page.goto` de nuevo sobre la misma
  ruta, no navegación por click) — el caso exacto que rompía antes.

## 2. Card del POS sin límite de ancho (`tailwind.config.ts`)

- **Antes**: `getComputedStyle(card).maxWidth === 'none'`, `boundingBox.width === 1334` (a
  1366×768 de viewport) — la card "Abrir caja" ocupaba casi todo el ancho disponible pese a tener
  `className="w-full max-w-md"`.
- **Después**: `getComputedStyle(card).maxWidth === '448px'`, `boundingBox === {x: 459, width:
448}` — centrada, con el ancho pedido. Verificado también a 3840×2160 (mismo resultado, card
  centrada y del ancho correcto sin importar la resolución).

## 3. Contraste del color destructivo

- **Antes**: `--destructive: 0 84% 60%` → 3.61:1 (botón) / 3.78:1 (texto de error) — ambos por
  debajo del mínimo WCAG AA de 4.5:1.
- **Después**: `--destructive: 0 84% 45%` → 5.18:1 / 5.42:1. Verificado visualmente con un login
  fallido real (captura del mensaje "El usuario o la contraseña son incorrectos" en rojo, legible).

## 4. `DataTable` — encabezado que se pierde al scrollear

- **Antes**: al scrollear el body interno de la tabla, el encabezado (`Nombre`/`Correo`/`Estado`/
  `Alta`) desaparecía junto con las filas — sin contexto de columna para filas lejanas.
- **Primer intento fallido, documentado a propósito**: agregar `sticky` al `<thead>` no tuvo
  ningún efecto (verificado: el header seguía desapareciendo). Causa raíz real: el primitive
  `Table` ya envuelve la tabla en su propio `<div overflow-auto>` sin altura límite; agregar un
  SEGUNDO `<div overflow-auto>` por fuera anclaba el `sticky` al de adentro (que nunca scrollea de
  verdad), no al de afuera (que sí). Confirmado con `element.closest('[class*="overflow-auto"]')`
  antes y después del fix — el "ancestro scrolleable" resuelto por el navegador era el equivocado.
- **Después**: `Table` expone `containerClassName`, un solo contenedor con `overflow-auto` +
  `max-h-[60vh]` a la vez. Verificado: el encabezado queda fijo visualmente mientras las filas
  scrollean debajo.

## 5. `DataTable` — paginador fuera de la pantalla

- **Antes** (a 1366×768, antes del `max-h-[60vh]`): `main.scrollHeight = 1282px` vs
  `main.clientHeight = 712px` — había que scrollear el body completo (no solo la tabla) para
  llegar al paginador.
- **Después**: tabla + toolbar "Columnas" + selector "Filas por página" + "Página X de Y" caben
  todos dentro de 768px de alto sin scrollear la página — verificado con captura completa.

## 6. Texto de notificaciones por debajo de 14px

- **Antes**: `text-xs` (12px) en la descripción y hora relativa de cada notificación del
  `NotificationCenter`.
- **Después**: `text-sm` (14px). No se aplicó el mismo cambio a `Badge`, pie de página, atajo de
  teclado de menú, círculo de paso del `Wizard` ni tooltip de gráfico — esos son chrome/etiquetas
  cortas, no texto de lectura; agrandarlos habría roto sus proporciones sin mejorar legibilidad
  real (revisado caso por caso, no con un reemplazo global de `text-xs`).

## 7. Falsos positivos descartados (documentados para no repetir el análisis)

- **"El Dashboard no centra el login card"** — descartado tras medir: el card SÍ está centrado
  vertical y horizontalmente (`h-screen flex items-center justify-center`); la sensación de
  desbalance venía del alto de la ventana completa, no de un bug de centrado real.
- **"El grid del Dashboard no usa el ancho completo a 4K"** — descartado tras medir
  `getComputedStyle`: el grid sí ocupa el 100% del ancho disponible (`grid-template-columns: 1168px
1168px 1168px` a 3840px de viewport) — lo que se veía como "espacio vacío" es contenido corto
  dentro de cards anchas, no un grid mal dimensionado. Ver `LAYOUT_RECOMMENDATIONS.md §1` para la
  recomendación real sobre esto.
