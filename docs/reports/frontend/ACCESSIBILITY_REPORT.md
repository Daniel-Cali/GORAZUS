# Informe de Accesibilidad — Fase 01

## 1. Contraste de color — medido, no estimado

Se calculó el ratio de contraste real (algoritmo de luminancia relativa, WCAG 2.1) de cada par
color de texto/fondo definido en `apps/web/src/styles/globals.css`, para modo claro y oscuro.
Mínimos exigidos: **4.5:1** texto normal, **3:1** texto grande/componentes de UI.

| Par                                                            | Modo   |  Antes  |  Después   | Resultado                 |
| -------------------------------------------------------------- | ------ | :-----: | :--------: | ------------------------- |
| `foreground` / `background`                                    | Claro  | 17.90:1 | sin cambio | ✅                        |
| `muted-foreground` / `background`                              | Claro  | 4.72:1  | sin cambio | ✅ (al límite, pero pasa) |
| `primary-foreground` / `primary` (botón)                       | Claro  | 4.96:1  | sin cambio | ✅                        |
| `destructive-foreground` / `destructive` (botón)               | Claro  | 3.61:1  | **5.18:1** | ❌ → ✅ **corregido**     |
| `destructive` / `background` (texto de error, uso activo real) | Claro  | 3.78:1  | **5.42:1** | ❌ → ✅ **corregido**     |
| `foreground` / `background`                                    | Oscuro | 18.62:1 | sin cambio | ✅                        |
| `muted-foreground` / `background`                              | Oscuro | 7.58:1  | sin cambio | ✅                        |
| `primary-foreground` / `primary` (botón)                       | Oscuro | 4.93:1  | sin cambio | ✅                        |
| `destructive-foreground` / `destructive` (botón)               | Oscuro | 9.43:1  | sin cambio | ✅ (ya pasaba)            |

**Hallazgo real**: `text-destructive` (el color de texto, no el de fondo de botón) es el que más
importa hoy — es el que usa `FormMessage` (todo mensaje de error de validación de todo formulario
de la plataforma) y el mensaje de error de login. A 3.78:1 estaba **fallando** el mínimo AA para
texto normal en cada pantalla con un formulario. Corregido en `globals.css` (`--destructive`
60%→45% de luminosidad), ver `UI_IMPROVEMENTS.md §3`.

`muted-foreground`/`background` en modo claro (4.72:1) pasa, pero por poco margen — se usa mucho
(descripciones, texto secundario). No se tocó porque sí cumple el mínimo, pero se deja anotado como
punto a vigilar si el tono de `--muted-foreground` cambia en el futuro.

## 2. Navegación por teclado y foco

Verificado con Playwright real (Tab/Shift+Tab, no solo lectura de código):

- **Login**: Tab recorre Organización → Correo → Contraseña → Iniciar sesión, en orden lógico.
  Cada campo muestra el anillo de foco (`focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2`, ya presente en `Input`/`Button`).
- **Diálogo (Usuarios → "Nuevo usuario")**: Radix `Dialog` ya atrapa el foco dentro del modal y lo
  devuelve al trigger al cerrar (comportamiento de la librería, verificado que sigue funcionando).
  `Escape` cierra el diálogo.
- **Sidebar**: los ítems son `<a>`/`<button>` reales (no `<div onClick>`), navegables con
  Tab/Enter. Los grupos expandibles (`Ventas`, `Finanzas`, etc.) son `<button>` con `ChevronDown`,
  también accesibles por teclado.
- **DataTable — nuevo dropdown "Columnas"**: Radix `DropdownMenu` (ya usado en el proyecto para
  otros menús) — foco atrapado, `Escape` cierra, flechas navegan los ítems, `Space`/`Enter`
  alternan el checkbox. No se escribió lógica de teclado nueva, se reutilizó el primitive existente
  a propósito.

## 3. Etiquetas de formulario (`FormLabel`/`aria-*`)

`ui-kit/components/form/form-field.tsx` ya implementaba, desde antes de esta fase, el patrón
correcto: `FormLabel` con `htmlFor` real hacia el input, `FormControl` inyecta
`aria-describedby`/`aria-invalid` reales según haya error. Verificado que sigue así — no se tocó
esta pieza porque ya cumplía. Confirmado con Playwright que `getByLabel('Correo')` resuelve
correctamente al input real en el formulario de login.

## 4. Tamaño de controles (touch/click targets)

`Button` usa `h-10` (40px) por defecto, `h-9` (36px) en `size="sm"` — ambos por encima del mínimo
recomendado de 24×24px (WCAG 2.5.8) y razonablemente cerca del ideal de 44×44px para touch. Los
botones "Desactivar" de la tabla de Usuarios usan `size="sm"` — aceptable para un contexto de
mouse/teclado de escritorio (el target real del POS, que si necesita targets grandes para uso
táctil, ya usa botones `size="lg"` en su propia pantalla, `pos.page.tsx`).

## 5. Lo que no se verificó (honesto, no fingido)

- **Lector de pantalla real** (NVDA/JAWS/VoiceOver) — no se ejecutó ninguno en esta sesión; la
  verificación fue estructural (roles ARIA correctos, labels asociados, `aria-live` donde
  corresponde vía Radix), no auditiva. Recomendado para una fase dedicada de accesibilidad si el
  proyecto lo requiere formalmente (ver `LAYOUT_RECOMMENDATIONS.md`).
- **Zoom del navegador / `prefers-reduced-motion`** — no se probó.
- **Auditoría automatizada tipo axe-core/Lighthouse** — no había ninguna configurada en el proyecto
  y no se agregó en esta fase (se priorizaron fixes reales verificados sobre agregar tooling
  nuevo); recomendado como paso siguiente, ver `LAYOUT_RECOMMENDATIONS.md §4`.
