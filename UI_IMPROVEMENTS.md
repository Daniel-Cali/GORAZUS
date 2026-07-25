# Mejoras de UI implementadas — Fase 01

Detalle técnico de cada cambio real hecho en esta fase. Ver `FRONTEND_VISUAL_AUDIT.md` para el
resumen de hallazgos y `DESIGN_FIXES.md` para la evidencia antes/después de cada uno.

## 1. Sesión: el usuario ya no desaparece tras recargar

**Archivo**: `apps/web/src/app/require-auth.tsx`

`initSession()` (ya existente, corrige que el access token se pierda en memoria tras un F5)
restauraba el token pero nunca repoblaba `useAppStore.user` — el store excluye `user` de lo que
persiste en `localStorage` a propósito (nunca guardar `fullName`/`email` ahí). Resultado real: tras
cualquier recarga completa, la sesión seguía activa (no redirigía a `/login`) pero "Hola,
{nombre}" del Dashboard y el nombre en el Topbar quedaban en blanco hasta un logout/login manual.

Fix: tras confirmar el token (recién restaurado o ya presente), `RequireAuth` llama a
`GET /auth/me` (endpoint ya existente desde FASE 03 Parte 02, sin tocar el backend) y repuebla el
store con `setSession`. Best-effort — si falla, el usuario sigue autenticado, solo sin
personalización hasta la próxima navegación.

## 2. Tailwind: `modules/*/frontend/` ahora se escanea

**Archivo**: `apps/web/tailwind.config.ts`

`content` no incluía `modules/*/frontend/**/*.{ts,tsx}` — solo `apps/web/src`, `ui-kit/components`
y `ui-kit/theme`. Cualquier clase de Tailwind usada **solo** dentro de un módulo de negocio (y
nunca repetida literalmente en `ui-kit`/`apps/web`) se purgaba en silencio del CSS final. Caso real
encontrado: `CashRegisterGate` (`modules/pos/frontend`) usa `max-w-md` sin prefijo; el único otro
uso de esa cadena exacta en todo el proyecto era `sm:max-w-md` (con breakpoint, en
`ui-kit/components/primitives/drawer.tsx`) — para Tailwind son dos utilidades distintas. La card
"Abrir caja" del POS quedaba sin límite de ancho real (`max-width: none` en cómputo, verificado con
Playwright), ocupando casi todo el viewport en vez de los 448px pedidos.

Fix: se agregó `path.join(__dirname, '../../modules/*/frontend/**/*.{ts,tsx}')` al array
`content`. Es un fix de raíz — previene esta clase de bug para cualquier clase de Tailwind usada
por cualquier módulo futuro, no solo para este caso puntual.

## 3. Contraste del color destructivo (WCAG AA)

**Archivo**: `apps/web/src/styles/globals.css`

`--destructive: 0 84% 60%` — verificado con el algoritmo de contraste relativo real (no a ojo):
texto blanco sobre ese fondo da 3.61:1; el mismo rojo usado como color de texto
(`text-destructive`, el uso activo real hoy — todo mensaje de error de formulario, `FormMessage`,
login) sobre el fondo blanco da 3.78:1. El mínimo WCAG AA para texto normal es 4.5:1 — ambos
fallaban.

Fix: se bajó la luminosidad de `--destructive` de 60% a 45% (mismo matiz/saturación). Verificado:
5.18:1 (texto blanco sobre el fondo) y 5.42:1 (texto rojo sobre blanco) — ambos con margen cómodo
sobre el mínimo. Solo se tocó el modo claro — el modo oscuro ya daba 9.43:1, sin problema.

## 4. `DataTable` — encabezado fijo, columnas, tamaño de página, skeleton

**Archivos**: `ui-kit/components/data/data-table.tsx`, `ui-kit/components/primitives/table.tsx`
(nuevo `containerClassName`), `ui-kit/components/primitives/skeleton.tsx` (nuevo),
`modules/seguridad/frontend/pages/usuarios-listado.page.tsx` (primer consumidor real).

- **Encabezado fijo**: el `<thead>` original no tenía forma de quedar visible al scrollear filas
  largas. Se agregó `position: sticky` — **en cada `<th>`, no en `<thead>`** (confirmado con
  Playwright real que `sticky` sobre `display: table-header-group` no es consistente entre
  motores). Al intentarlo apareció un segundo bug real: `Table` (primitive) ya envuelve la tabla en
  su propio `<div overflow-auto>` sin límite de altura; agregar OTRO `<div overflow-auto>` por
  fuera anclaba el `sticky` al de adentro, que nunca scrollea de verdad, y el encabezado se seguía
  perdiendo. Fix de raíz: `Table` ahora acepta `containerClassName` para inyectar `max-height`
  directo en su propio wrapper, sin duplicarlo.
- **Mostrar/ocultar columnas**: dropdown nuevo (`enableColumnVisibility`, opt-in para no romper
  tablas angostas ya existentes) usando `DropdownMenuCheckboxItem` + el estado de visibilidad de
  columnas de TanStack Table. La columna de acciones (`enableHiding: false`) no se puede ocultar —
  no es una columna de datos, es funcionalidad.
- **Tamaño de página**: selector 10/20/50 (`onPageSizeChange`, opcional). Usa el parámetro
  `pageSize` que `GET /seguridad/usuarios` **ya soportaba** — sin tocar el backend.
- **Skeleton loader**: nuevo primitive `Skeleton` (`animate-pulse` genérico) — reemplaza el spinner
  - "Cargando…" de una sola fila por 5 filas fantasma del ancho real de las columnas visibles, para
    que la pantalla no "salte" cuando llegan los datos.
- **Efecto colateral positivo**: al limitar la altura de la tabla (`max-h-[60vh]`), el paginador
  deja de quedar fuera de la pantalla en resoluciones chicas — antes, en `/seguridad/usuarios` a
  1366×768, había que scrollear el body entero para llegar a "Página X de Y" (verificado:
  `scrollHeight` 1282px vs `clientHeight` 712px del contenedor principal).

Compatibilidad: todos los props nuevos son opcionales — ninguna tabla existente cambia de
comportamiento a menos que adopte explícitamente `enableColumnVisibility`/`onPageSizeChange`.

## 5. Tipografía: texto real de notificaciones a 14px

**Archivo**: `ui-kit/components/layout/notification-center.tsx`

Descripción y hora relativa de cada notificación estaban en `text-xs` (12px) — por debajo del
mínimo de 14px para texto real que el usuario lee (pedido explícito del master prompt). Otros usos
de `text-xs` en el proyecto (`Badge`, pie de página, atajo de teclado en menú, número de paso del
wizard, tooltip de gráfico) se dejaron igual a propósito — son chrome decorativo/etiquetas cortas,
no texto de lectura, y agrandarlos rompería sus proporciones (ver `DESIGN_FIXES.md §2` para el
detalle de por qué se distinguió caso por caso en vez de un cambio global).
