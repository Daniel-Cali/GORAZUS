# Routing — GORAZUS Frontend

> Expande `docs/architecture/03-arquitectura-modulos-frontend.md §5,6` y
> `docs/architecture/29-frontend-enterprise.md §2,3` (React Router, code-splitting por
> módulo, layouts) sin repetirlos. Ver [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md).
> Sin código.

## 1. Librería y decisión (referencia, no redecide)

**React Router v6.4+**, `createBrowserRouter` — confirmado en `03 §5` y ratificado en
`29 §2` ("no TanStack Router, que no está en uso en ningún documento existente"). No se
reabre esta decisión acá.

## 2. Rutas federadas por módulo

Patrón ya fijado en `03 §5`: cada feature exporta su propio array de `RouteObject` en
`modules/<x>/frontend/routes/<x>.routes.tsx`; `apps/web` es la **única** pieza que
conoce la existencia de todas las features a la vez y las ensambla. Ningún módulo
importa las rutas de otro para navegar — usa `<Link to="/clientes/:id">` con el path
como string documentado en el `README.md` del módulo dueño (`03 §5`).

### 2.1 Convención de paths

No estaba fijado a nivel de convención textual — se cierra acá:

- Path base = nombre de la feature en español, kebab-case, igual al nombre de la
  carpeta del módulo (`/ventas`, `/cuentas-por-cobrar` si aplicara) — mismo criterio
  de `docs/architecture/07-convenciones-y-estandares.md §1` para nombres de dominio.
- Listado: `/ventas`. Creación: `/ventas/nueva` (nunca `/ventas/crear` — "nueva" es
  el sustantivo consistente con el resto del catálogo). Detalle/edición:
  `/ventas/:id`. Acción sobre un recurso existente que abre su propia pantalla (poco
  común, la mayoría de las Acciones del catálogo son botones dentro del Detalle, ver
  `docs/product/07_SCREEN_CATALOG.md §2`): `/ventas/:id/<accion>`.
- Submenús de configuración de módulo (una sola pantalla consolidada por módulo, ya
  fijado en `docs/product/07_SCREEN_CATALOG.md §2`): `/ventas/configuracion`.
- Reportes/Consultas del módulo: `/ventas/reportes/<nombre-reporte>`,
  `/ventas/consultas/<nombre-consulta>` — namespace propio dentro del módulo para no
  competir por rutas cortas con los formularios transaccionales, y para que el sidebar
  (`docs/product/06_NAVIGATION.md §3`) pueda agrupar visualmente por esos dos prefijos.

## 3. Code-splitting por módulo

Ya fijado en `29 §2` como necesario a esta escala (25 features navegables). Mecanismo:
cada `<modulo>.routes.tsx` se importa en `apps/web/src/app/router.tsx` vía
`React.lazy()`, con el `AppShell` mostrando un fallback de carga mientras el bundle del
módulo se descarga. Este documento agrega el detalle operativo que `29 §2` dejaba
implícito:

- El `React.lazy()` envuelve el **componente de página**, no el archivo de rutas en
  sí (el archivo `<x>.routes.tsx` es liviano — objetos de configuración, no JSX
  pesado); cada `*.page.tsx` es el punto real de división de bundle.
- El fallback de carga (`<Suspense fallback={...}>`) es un componente único de
  `ui-kit/components/layout/` (`RouteLoadingFallback`), nunca un fallback distinto por
  módulo — consistencia visual (`docs/product/01_PRODUCT_VISION.md §7`).
- Un módulo con páginas relacionadas de alto tránsito conjunto (p. ej. Ventas:
  listado → detalle, un usuario casi siempre navega de uno a otro) puede agruparse en
  un mismo chunk vía convención de nombre de import dinámico, para evitar una cascada
  de 2-3 descargas de red en un flujo de un solo caso de uso — decisión puntual por
  módulo, no una regla general, evaluada en [PERFORMANCE.md §2](./PERFORMANCE.md#2-code-splitting-y-lazy-loading).

## 4. Layouts anidados

Dos niveles ya fijados, este documento los consolida en una sola jerarquía:

```
<AppShell>                                    (raíz — 29 §3, 03 §6)
  └─ <ModuloLayout> (opcional, 29 §3)          (p. ej. tabs de "Cliente: datos/crédito/historial")
      └─ <Página>                              (pages/*.page.tsx de la feature)
```

- **`AppShell`** — nav global, selector de empresa/sucursal, menú de módulos generado
  desde el registro declarativo (`03 §6`, detallado en
  [FEATURES.md §5](./FEATURES.md#5-registro-de-features-en-el-shell)). Envuelve todas
  las rutas autenticadas vía la ruta padre de React Router.
- **Layout de módulo** — opcional (`29 §3`), declarado en
  `modules/<x>/frontend/routes/<x>.layout.tsx`, anidado bajo `AppShell` vía rutas
  anidadas de React Router. Un módulo simple (la mayoría de los ~90 catálogos simples
  del sistema, `docs/product/07_SCREEN_CATALOG.md §6`) no declara uno.
- **POS es la única excepción a `AppShell` como ancestro obligatorio**
  (`docs/architecture/45-modulo-pos-frontend.md §1`, `docs/product/06_NAVIGATION.md §8`):
  ruta de pantalla completa sin sidebar/breadcrumbs, mismo mecanismo de layout anidado
  pero declarando su propio layout raíz (`venta-pos.layout.tsx`) sin envolver con
  `AppShell`. Es la única ruta del sistema que se ensambla así — cualquier otro módulo
  que quiera replicar este patrón necesita la misma justificación de UX de alta
  frecuencia que POS antes de hacerlo (no se generaliza sin necesidad real,
  `01-estructura-monorepo.md §2` — "alcance real, no simetría").

## 5. Guards de ruta: autenticación y autorización

No estaba fijado a nivel de mecánica de enrutamiento (`09-seguridad-y-multiempresa.md`
fija el modelo, no cómo se aplica a nivel de rutas de React Router). Se cierra acá:

### 5.1 Autenticación

Un elemento `<RequireAuth>` envuelve el árbol completo de rutas autenticadas (todo lo
que cuelga de `AppShell`) — verifica que exista un access token válido en memoria
(ver [API_LAYER.md §4](./API_LAYER.md#4-autenticación-y-refresh-de-token) para dónde
vive y cómo se refresca); si no hay sesión válida, redirige a `/login` preservando la
ruta destino original (`?redirect=/ventas/123`) para volver ahí tras autenticarse. Las
rutas de `auth` (`/login`, `/recuperar-password`) son las únicas fuera de este guard —
`docs/menus/00-convenciones.md §6` ya aclara que `auth` no tiene menú de navegación
porque es la puerta de entrada, consistente con que tampoco tiene `AppShell`.

### 5.2 Autorización

El permiso requerido por cada ruta es el mismo código `<modulo>.<accion>` ya fijado en
`docs/menus/<módulo>.md` y recogido en
`docs/product/07_SCREEN_CATALOG.md` (columna Permiso). Mecanismo:

- Cada objeto de ruta declara su permiso en metadata (`{ path: 'ventas/nueva', element: <VentaCrearPage />, handle: { permission: 'ventas.crear' } }`
  — usando el campo `handle` de React Router 6.4+, pensado exactamente para metadata
  no-visual asociada a una ruta).
- Un `<RequirePermission>` de `ui-kit/` lee ese `handle` y llama a `usePermiso()`
  (`09 §2`, `29 §4`) — si el usuario no tiene el permiso, la ruta redirige a una
  pantalla de "sin acceso" (nunca un 404 — un 404 sugiere que la ruta no existe, un
  "sin acceso" comunica correctamente que existe pero está fuera del alcance del
  usuario, evitando confusión de soporte).
- Repetido de [FRONTEND_ARCHITECTURE.md §7](./FRONTEND_ARCHITECTURE.md#7-autenticación-y-autorización-referencia-no-redecide)
  porque en rutas es donde más se tiende a relajar la regla: esto es UX (evita que el
  usuario navegue a una pantalla para luego ver todo bloqueado), la autorización real
  ocurre en cada request del backend vía `PermissionsGuard` — quitar el guard de ruta
  no es un hueco de seguridad, es simplemente peor UX.

## 6. Providers de la aplicación

No estaba enumerado en un solo lugar — se consolida acá el árbol de providers que
envuelve el router, en el orden en que deben anidarse (de afuera hacia adentro):

```
<QueryClientProvider>        (TanStack Query — STATE_MANAGEMENT.md §2)
  <ThemeProvider>              (ui-kit/theme — UI_GUIDELINES.md)
    <I18nProvider>               (react-i18next — FRONTEND_ARCHITECTURE.md §8)
      <ErrorBoundary>              (raíz — ERROR_HANDLING.md §1)
        <RouterProvider />           (React Router — este documento)
```

`Zustand` no aparece como provider — es deliberado: los stores de Zustand no requieren
un `<Provider>` de React (a diferencia de Context), se importan y usan directamente
donde haga falta (`STATE_MANAGEMENT.md §3`). Esta es una de las razones prácticas
(no solo las 3 ya dadas en `29 §5`) por las que Zustand simplifica el árbol de
providers de la aplicación frente a una alternativa basada en Context.

## 7. Rutas de error y estados terminales

No estaba fijado — se agrega:

- **404** — ruta comodín (`path: '*'`) a nivel raíz del router, componente
  `NotFoundPage` de `ui-kit/`, nunca un 404 por módulo reimplementado.
- **Error de carga de chunk** (falla la descarga de un bundle lazy — típico tras un
  deploy nuevo mientras el usuario tiene una pestaña vieja abierta): capturado por el
  `ErrorBoundary` de ruta (no el raíz, uno por rama de `React.lazy`, ver
  [ERROR_HANDLING.md §1](./ERROR_HANDLING.md#1-error-boundaries-por-nivel)), ofrece
  "Recargar" en vez de un error genérico — caso operativo real a esta escala de
  code-splitting (24+ módulos con deploys frecuentes).
- **Sin acceso** (guard de permiso, §5.2) y **Sin conexión** (ver
  [ERROR_HANDLING.md §4](./ERROR_HANDLING.md#4-manejo-de-desconexión-fuera-de-pos)) son
  también rutas/estados terminales de `ui-kit/`, no páginas de módulo.

## 8. Deep-linking y alcance Empresa/Sucursal

El alcance de Empresa/Sucursal activo **no viaja en la URL** — vive en el store
(`STATE_MANAGEMENT.md §3.1`) y en el access token, nunca como parámetro de ruta
(`/empresa/:id/ventas/:id` fue evaluado implícitamente y descartado): un link
compartido a `/ventas/123` debe funcionar para cualquier usuario autorizado
independientemente de en qué empresa/sucursal esté parado en ese momento — si el
recurso `123` no existe en su alcance activo, la respuesta de la API (404 o 403 según
corresponda) se maneja como cualquier otro error de datos
([ERROR_HANDLING.md](./ERROR_HANDLING.md)), no como un problema de enrutamiento. Esto
es consistente con `09-seguridad-y-multiempresa.md §3` — el alcance viaja en el JWT,
no en la URL.

## 9. Trazabilidad

| Punto                               | Ya fijado en                                 | Cerrado/detallado acá                                             |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| React Router, `createBrowserRouter` | `03 §5`, `29 §2`                             | — (referencia)                                                    |
| Rutas federadas por módulo          | `03 §5`                                      | Convención de paths (§2.1)                                        |
| Code-splitting                      | `29 §2`                                      | Detalle de qué se envuelve en `lazy()`, agrupación de chunks (§3) |
| `AppShell`, layouts de módulo       | `03 §6`, `29 §3`                             | Jerarquía consolidada + excepción POS (§4)                        |
| Guards de auth/autorización         | `09-seguridad-y-multiempresa.md` (mecanismo) | Aplicación concreta a nivel de ruta (§5)                          |
| Providers                           | Ninguno — disperso                           | Árbol consolidado (§6)                                            |
| Rutas de error                      | Ninguno                                      | 404, error de chunk, sin acceso (§7)                              |
| Deep-linking / alcance en URL       | Ninguno                                      | Decisión explícita: alcance no viaja en URL (§8)                  |
