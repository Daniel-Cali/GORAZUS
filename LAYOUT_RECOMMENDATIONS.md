# Recomendaciones de Layout — Fase 01

Mejoras identificadas pero **no implementadas** en esta fase, con la razón honesta de por qué se
difirieron — no son "olvidos", son decisiones de alcance explícitas.

## 1. Ancho máximo de contenido en pantallas tipo dashboard/tarjetas

**Hallazgo**: a 3840×2160, las 3 tarjetas del Dashboard (`grid-cols-3`) se estiran a ~1168px cada
una con contenido corto adentro — mucho espacio vacío dentro de cada card (`DESIGN_FIXES.md §7`).

**Por qué no se corrigió ahora**: la corrección obvia (un `max-w-*` centrado en el contenedor de
`<main>`, en `AppShell`) afectaría a **todas** las pantallas reales por igual, incluida Usuarios —
y ahí una tabla se beneficia de usar el ancho completo en monitores grandes (más columnas visibles
sin scroll horizontal), no de quedar acotada. Aplicar un límite global sin distinguir "pantalla
tipo dashboard" de "pantalla tipo tabla" cambiaría el comportamiento de una pantalla que hoy
funciona bien, a cambio de mejorar una que hoy es un placeholder temporal.

**Recomendación concreta para la próxima fase**: un wrapper opcional por página (p. ej. `<div
className="mx-auto w-full max-w-screen-2xl">` dentro del `children` de cada página, no en
`AppShell`), que cada pantalla adopte según su propio contenido — el Dashboard real (cuando tenga
KPIs/gráficos de verdad) lo usaría, una tabla de datos densa no.

## 2. Indicador visual de campo obligatorio

**Hallazgo**: ningún formulario (Login, "Nuevo usuario") distingue visualmente un campo requerido
de uno opcional — hoy todos los campos visibles son requeridos, así que no se nota, pero no vas a
poder distinguirlo cuando aparezca el primer formulario con campos mixtos.

**Por qué no se corrigió ahora**: `FormLabel` (`ui-kit/components/form/form-field.tsx`) no recibe
hoy ninguna señal de "requerido" — agregarla bien (no un asterisco hardcodeado a mano en cada
formulario, que se desincroniza del schema de validación real) implica decidir de dónde sale esa
señal: ¿un prop `required` manual en cada `<FormLabel>`, o inferirlo automáticamente del schema Zod
del formulario? La segunda opción es la correcta a largo plazo pero es un cambio de API del
componente compartido que toca **todos** los formularios existentes — más alcance del que
corresponde a una fase de "auditoría visual y mejora", que pide explícitamente no cambiar
funcionalidad.

**Recomendación concreta**: evaluarlo como parte de una fase futura de "Formularios Enterprise",
con la decisión de diseño (asterisco, texto "(opcional)" en los no-requeridos, o ambos) tomada una
sola vez para todo el sistema.

## 3. Slot `left` del Topbar

**Hallazgo**: está vacío en las 4 pantallas reales hoy.

**No es un bug** — `Breadcrumb` (`ui-kit/components/layout/breadcrumb.tsx`) ya está documentado a
propósito para pantallas de detalle/edición, nunca en listas de nivel 1 ni en el Dashboard
(`docs/product/06_NAVIGATION.md §5`, decisión ya tomada antes de esta fase). Hoy no existe ninguna
pantalla de detalle real todavía (ni de usuario, ni de producto, ni de factura) — el componente no
tiene consumidor legítimo todavía, no falta implementarlo.

**Recomendación**: cuando exista la primera pantalla de detalle real (candidato: detalle de
usuario, para asignar roles — hoy dice "pendiente" en `usuarios-listado.page.tsx`), montar
`Breadcrumb` ahí siguiendo la convención ya escrita, no antes.

## 4. Auditoría automatizada de accesibilidad

**Hallazgo**: no hay ninguna herramienta tipo axe-core/Lighthouse CI corriendo sobre el frontend.

**Por qué no se agregó ahora**: instalar y configurar tooling nuevo no estaba en el pedido de esta
fase (que es sobre la UI existente, no sobre CI/tooling), y `nx run web:test` ya está roto por un
motivo no relacionado (`TECHNICAL_DEBT.md §4`, `vite-tsconfig-paths` resuelve como ESM) — agregar
una auditoría automatizada que dependería del mismo executor de test hoy caído no habría podido
verificarse de punta a punta en esta sesión.

**Recomendación**: una vez que `nx run web:test` esté arreglado (deuda técnica ya documentada, no
nueva de esta fase), agregar `@axe-core/playwright` a `apps/web-e2e` (que sí corre hoy) es el
camino de menor fricción — reutiliza la infraestructura de Playwright ya existente en vez de sumar
una herramienta nueva.

## 5. Búsqueda global real en `DataTable`

**Hallazgo**: el master prompt pide "búsqueda global" en las tablas. No se implementó.

**Por qué no se corrigió ahora**: una búsqueda real (que busque en todo el dataset, no solo en la
página cargada) necesita un parámetro de query nuevo en el backend (`GET /seguridad/usuarios` hoy
solo acepta `page`/`pageSize`, sin `search`/`q`) — el master prompt de esta fase prohíbe
explícitamente modificar APIs ("DO NOT modify APIs"). Una búsqueda solo-cliente sobre la página
actual (20 filas) sería activamente engañosa — el usuario esperaría que busque en los cientos de
usuarios reales, no en los 20 visibles.

**Recomendación**: agregar `search`/`q` como query param opcional a los endpoints de listado
(patrón ya usado en otros módulos si existe, o `ILIKE`/`unaccent` sobre las columnas de texto) es
trabajo de backend — corresponde a una fase que sí pueda tocar APIs, con su propio ticket.
