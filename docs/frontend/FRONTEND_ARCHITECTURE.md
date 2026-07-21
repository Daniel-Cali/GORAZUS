# Frontend Architecture — GORAZUS

> Versión 1.0 — 2026-07-16. Documento marco de `docs/frontend/` (EPIC 03).
> **No repite** lo ya fijado en `docs/architecture/03-arquitectura-modulos-frontend.md`,
> `docs/architecture/29-frontend-enterprise.md`, `docs/architecture/44-frontend-plan-fase-10.md`,
> `docs/architecture/45-modulo-pos-frontend.md` y `docs/architecture/09-seguridad-y-multiempresa.md`
> — los referencia y los **formaliza** dentro de la estructura de 10 documentos pedida
> (`FRONTEND_ARCHITECTURE`, `STATE_MANAGEMENT`, `ROUTING`, `FOLDER_STRUCTURE`, `FEATURES`,
> `UI_GUIDELINES`, `PERFORMANCE`, `ERROR_HANDLING`, `API_LAYER`, `TESTING`), cerrando los
> gaps genuinos que esos documentos no cubrían (i18n a nivel de implementación frontend,
> error boundaries, testing frontend dedicado, cliente HTTP/WebSocket, presupuesto de
> performance). Sin código — documentación de arquitectura únicamente, ver
> [[feedback-gorazus-architect-role]].

## 1. Cómo leer este set

| Documento                                    | Responde                                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **FRONTEND_ARCHITECTURE.md** (este)          | Visión, principios, Feature-First, cómo se relacionan los otros 9 documentos y con `docs/architecture/`/`docs/product/` |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | Qué estado vive dónde: TanStack Query, Zustand, estado local, formularios, tiempo real                                  |
| [ROUTING.md](./ROUTING.md)                   | React Router, rutas federadas por módulo, code-splitting, guards, layouts anidados                                      |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Árbol de carpetas a nivel de archivo — `apps/web`, `modules/<x>/frontend`, `ui-kit`, `packages`                         |
| [FEATURES.md](./FEATURES.md)                 | Qué es una "Feature" en GORAZUS, fronteras, composición entre features, registro en el shell                            |
| [UI_GUIDELINES.md](./UI_GUIDELINES.md)       | Shadcn/Radix/Tailwind, tema, breakpoints, accesibilidad, arquetipos de pantalla, iconografía                            |
| [PERFORMANCE.md](./PERFORMANCE.md)           | Presupuesto de carga, lazy loading, virtualización, memoización, caching                                                |
| [ERROR_HANDLING.md](./ERROR_HANDLING.md)     | Error boundaries, contrato de error de API, offline, observabilidad de frontend                                         |
| [API_LAYER.md](./API_LAYER.md)               | Cliente HTTP, cliente WebSocket, autenticación/refresh, subida de archivos, contratos Zod                               |
| [TESTING.md](./TESTING.md)                   | Vitest, Testing Library, Playwright, qué se testea en cada capa, mocking                                                |

Orden sugerido de lectura si venís de cero: este documento → `FOLDER_STRUCTURE` → `FEATURES`
→ `ROUTING` → `STATE_MANAGEMENT` → `API_LAYER` → el resto según necesidad puntual.

## 2. Visión y encaje con el resto del proyecto

GORAZUS frontend es la capa de presentación de un ERP de 25 módulos navegables
(`docs/menus/`, `docs/product/07_SCREEN_CATALOG.md` — 336 pantallas) sobre un backend
modular de 27 bounded contexts (`docs/architecture/04-catalogo-modulos-negocio.md`).
Tres documentos ya fijan las decisiones estructurales de más alto nivel que este set
**no vuelve a decidir, solo aplica**:

1. **Monorepo con `apps/` delgadas + `modules/` como núcleo**
   (`docs/architecture/01-estructura-monorepo.md §1,3`) — `apps/web` es el
   _composition root_: ensambla módulos, no contiene lógica de negocio propia.
2. **Un módulo de negocio = una carpeta con `backend/`, `frontend/`, `shared/`**
   (`01 §4`) — la parte `frontend/` de cada módulo sigue la plantilla ya fijada en
   `03-arquitectura-modulos-frontend.md §1` (`components/`, `pages/`, `hooks/`, `routes/`).
3. **Sin capa de `services/`/`repositories/` en el frontend** — el hook de TanStack
   Query **es** la capa de acceso a datos (`03 §1`, `29 §1`). Este set nunca introduce
   una capa adicional que la contradiga.

React 19, exclusivamente componentes función + hooks, sin componentes de clase
(`29 §1`). TypeScript estricto en todo el frontend, mismo nivel de rigor que el
backend (`docs/architecture/07-convenciones-y-estandares.md`).

## 3. Feature-First: qué significa en GORAZUS (formalizado acá)

El EPIC pide explícitamente una arquitectura **Feature First**. GORAZUS ya la tiene
— nunca se llamó así por nombre hasta este documento, pero es la consecuencia directa
de la decisión de `01-estructura-monorepo.md §1`: _"cada dominio de negocio es una
unidad autocontenida... un desarrollador debe poder trabajar en `ventas/` sin necesidad
de entender `contabilidad/`"_. Este documento fija el vocabulario y lo cierra como
principio explícito para que ningún desarrollador nuevo reintroduzca una organización
por tipo técnico (`components/`, `hooks/`, `pages/` a nivel de **toda la app**, mezclando
30+ dominios en una sola carpeta plana — el antipatrón clásico que Feature-First existe
para evitar).

**Definición operativa:** una **Feature** = un módulo de negocio de
`docs/architecture/04-catalogo-modulos-negocio.md` con parte `frontend/`. La unidad de
organización del código no es "qué tipo de archivo es" (patrón por capa técnica) sino
"a qué feature pertenece" (patrón por dominio) — dentro de cada feature sí existen
subcarpetas técnicas (`components/`, `pages/`, `hooks/`, `routes/`, ya fijadas en
`03 §1`), pero **nunca cruzan features**. El detalle completo de fronteras, composición
entre features y qué expone cada una está en [FEATURES.md](./FEATURES.md).

```
❌ Organización por capa (NO usada en GORAZUS)     ✅ Feature-First (SÍ usada)
src/
├── components/       (500+ archivos de 25 dominios)   modules/
├── pages/             (mezclados sin frontera)         ├── ventas/frontend/{components,pages,hooks,routes}
├── hooks/                                              ├── inventario/frontend/{components,pages,hooks,routes}
└── services/                                           └── ... (25 features, cada una autocontenida)
```

## 4. Principios rectores (heredados + aplicados al frontend)

| Principio                                      | Ya fijado en                                           | Cómo se aplica en `docs/frontend/`                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature-First / modularidad real               | `01 §1`, formalizado en §3 arriba                      | Toda decisión de este set respeta fronteras de feature — ver [FEATURES.md](./FEATURES.md)                                                                           |
| KISS — sin capas que no aportan                | `03 §1` (sin `services/`), `29 §5` (Zustand, no Redux) | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md), [API_LAYER.md](./API_LAYER.md) no reintroducen ceremonia innecesaria                                                  |
| DRY sin acoplar por conveniencia               | `01 §2`                                                | `ui-kit/` es el único lugar de código compartido sin negocio — ver [UI_GUIDELINES.md](./UI_GUIDELINES.md)                                                           |
| Preparado para microservicios                  | `01 §5` (reglas de import Nx)                          | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) y [FEATURES.md](./FEATURES.md) heredan el enforcement de fronteras tal cual                                            |
| Consistencia sobre creatividad                 | `docs/product/01_PRODUCT_VISION.md §7`                 | [UI_GUIDELINES.md](./UI_GUIDELINES.md) referencia los 6 arquetipos de `docs/product/09_WIREFRAMES.md` sin reinventarlos                                             |
| Reducir clics / atajos / responsive            | `docs/product/01_PRODUCT_VISION.md §7`                 | [ROUTING.md](./ROUTING.md) (deep-linking), [PERFORMANCE.md](./PERFORMANCE.md) (percepción de velocidad), [UI_GUIDELINES.md](./UI_GUIDELINES.md) (responsive/atajos) |
| El frontend nunca es la única línea de defensa | `03 §4`                                                | [ERROR_HANDLING.md](./ERROR_HANDLING.md), [API_LAYER.md](./API_LAYER.md) — toda validación de UI se re-valida en backend                                            |

## 5. Relación con `docs/product/`

`docs/product/` (10 documentos, completos) define **qué** construye el frontend
(pantallas, flujos, navegación, atajos) desde la perspectiva de producto/UX. `docs/frontend/`
define **cómo** se construye técnicamente. La correspondencia es directa y no debe
divergir:

| `docs/product/`                                                                                                                         | `docs/frontend/` que lo implementa                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `05_INFORMATION_ARCHITECTURE.md` (sitemap, alcance Empresa/Sucursal)                                                                    | [ROUTING.md](./ROUTING.md) (estructura de rutas), [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) (store de empresa/sucursal activa)                   |
| `06_NAVIGATION.md` (sidebar, búsqueda global, breadcrumbs, tabs, comando rápido)                                                        | [FEATURES.md](./FEATURES.md) (registro de módulos en el shell), [UI_GUIDELINES.md](./UI_GUIDELINES.md) (componentes de `ui-kit/components/layout/`) |
| `07_SCREEN_CATALOG.md` (336 pantallas por arquetipo)                                                                                    | [FEATURES.md](./FEATURES.md) (una página = un archivo en `pages/` de la feature dueña)                                                              |
| `08_USER_FLOWS.md` (patrones transversales: selector con creación inline, confirmación destructiva, error de validación, acción masiva) | [ERROR_HANDLING.md](./ERROR_HANDLING.md), [UI_GUIDELINES.md](./UI_GUIDELINES.md) — cada patrón se implementa una sola vez en `ui-kit/`              |
| `09_WIREFRAMES.md` (6 arquetipos de pantalla)                                                                                           | [UI_GUIDELINES.md](./UI_GUIDELINES.md) — cada arquetipo es un componente compuesto de `ui-kit/`                                                     |
| `10_KEYBOARD_SHORTCUTS.md` (atajos globales + POS)                                                                                      | [UI_GUIDELINES.md](./UI_GUIDELINES.md) §6, implementado a nivel de `AppShell`/`ui-kit/hooks`                                                        |

Ningún documento de `docs/frontend/` redefine una pantalla, flujo o atajo — todos
citan `docs/product/` como fuente de verdad de UX. Si algo de `docs/product/` resulta
técnicamente inviable, la corrección se propone allá, no se resuelve en silencio acá.

## 6. Relación con `docs/architecture/`

`docs/frontend/` es una **capa de detalle de implementación** sobre las decisiones ya
tomadas en `docs/architecture/03,29,44,45,09,07`. Regla de precedencia: ante cualquier
conflicto aparente, `docs/architecture/` gana — este set existe para expandir el detalle
de implementación (a nivel de archivo, convención, patrón concreto), no para revisar
decisiones ya cerradas (React Router, Zustand, TanStack Query/Table, Shadcn, Recharts,
React Hook Form + Zod, todas confirmadas en `29-frontend-enterprise.md` y no
reabiertas acá).

Alcance explícitamente fuera de `docs/frontend/` — ya completos o fuera de gate en
otros documentos, no se repiten:

- **POS** (UI de mostrador, hardware, offline) — completo en
  `docs/architecture/45-modulo-pos-frontend.md`. Se referencia como el caso
  especial de arquetipo en [FEATURES.md](./FEATURES.md) y [UI_GUIDELINES.md](./UI_GUIDELINES.md),
  no se rediseña.
- **Portal del cliente / Portal del proveedor** — no diseñados, fallan el gate de
  backend (`docs/architecture/44-frontend-plan-fase-10.md §3`). Ningún documento de
  este set asume su existencia.
- **Gráficos (Recharts)** y **DataTable (TanStack Table)** — decisión ya cerrada en
  `29 §8, §8.1`, solo referenciados en [UI_GUIDELINES.md](./UI_GUIDELINES.md).

## 7. Autenticación y autorización (referencia, no redecide)

El mecanismo completo (JWT access/refresh, RBAC `<modulo>.<accion>`, aislamiento
multiempresa vía `TenantInterceptor`) está fijado en
`docs/architecture/09-seguridad-y-multiempresa.md` y `docs/architecture/13-modulo-auth.md`.
`docs/frontend/` solo documenta el consumo desde el cliente:

- **Autenticación** — flujo de tokens, almacenamiento, refresh automático:
  [API_LAYER.md §4](./API_LAYER.md#4-autenticación-y-refresh-de-token).
- **Autorización** — hook `usePermiso()` ya nombrado en `09 §2`/`29 §4`, su contrato
  completo y dónde se aplica (ocultar acción vs. bloquear ruta):
  [ROUTING.md §5](./ROUTING.md#5-guards-de-ruta-autenticación-y-autorización) y
  [FEATURES.md §4](./FEATURES.md#4-permisos-a-nivel-de-feature).
- Regla que atraviesa todo el set, repetida deliberadamente por su importancia:
  **la autorización del frontend es siempre UX, nunca el mecanismo de seguridad real**
  (`09 §2` — "eso es solo UX, la autorización real y obligatoria ocurre siempre en el
  backend"). Ningún documento de `docs/frontend/` introduce una excepción a esta regla.

## 8. Internacionalización (i18n) — nuevo, cierra gap de implementación frontend

`docs/architecture/32-core-platform/03-localizacion-y-globalizacion.md §2,5` ya fija
el diseño de plataforma: diccionario de claves de UI servido desde `ui-kit/`, hook
`useTranslation()`, backend nunca traduce (devuelve códigos de error estables como
`ERR_CREDIT_LIMIT_EXCEEDED`), idioma resuelto una vez por sesión. Lo que faltaba —y
se cierra en este set— es el detalle de implementación frontend:

- **Librería:** `react-i18next` (implementación estándar de facto sobre `i18next` para
  React, compatible con el patrón de hook ya nombrado `useTranslation()` en `32.03 §2`
  — no se reinventa un mecanismo propio de resolución de claves cuando la librería de
  referencia de la industria ya expone exactamente esa API).
- **Ubicación:** `ui-kit/i18n/` — diccionarios base (`common.json`: botones, acciones
  genéricas, mensajes de validación) + un diccionario por feature
  (`modules/<x>/frontend/i18n/<lang>.json`) para los términos de negocio propios de
  ese módulo, cargado solo cuando la feature se carga (mismo code-splitting por módulo
  que ya aplica al bundle de código, ver [PERFORMANCE.md §2](./PERFORMANCE.md#2-code-splitting-y-lazy-loading)).
- **Resolución de idioma:** el store global (`authSlice`, ver
  [STATE_MANAGEMENT.md §3](./STATE_MANAGEMENT.md#3-zustand--estado-global-de-la-aplicación))
  guarda el idioma activo del usuario (reflejo de `Language Manager`, `32.03 §5`,
  resuelto server-side al login) — el frontend nunca decide el idioma por su cuenta
  fuera de lo que el backend ya resolvió para ese usuario/tenant.
- **Formato de fecha/número/moneda:** `Intl.DateTimeFormat`/`Intl.NumberFormat` nativos
  del navegador, envueltos en utilidades de `ui-kit/utils/format/` — nunca librerías de
  formato adicionales (`date-fns` solo para aritmética de fechas si hace falta, no para
  presentación) porque `32.03 §1` ya fija que la presentación usa `Intl` sin reinventar
  tablas de formato por país.
- **Mensajes de error traducidos:** ver [ERROR_HANDLING.md §3](./ERROR_HANDLING.md#3-traducción-de-códigos-de-error).
- Alcance de idiomas soportados al lanzamiento (español + los que el negocio confirme
  para mercados LatAm específicos) es una decisión de negocio, no de arquitectura — este
  documento solo garantiza que el mecanismo soporta agregar un idioma nuevo sin
  redeploy de código (archivo de diccionario nuevo, sin tocar componentes).

## 9. Trazabilidad

| Punto pedido en el EPIC               | Documento de detalle                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Rutas                                 | [ROUTING.md](./ROUTING.md)                                                                                                   |
| Estado global / Estado local          | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)                                                                                 |
| TanStack Query                        | [STATE_MANAGEMENT.md §2](./STATE_MANAGEMENT.md#2-tanstack-query--estado-de-servidor), [API_LAYER.md](./API_LAYER.md)         |
| Zustand                               | [STATE_MANAGEMENT.md §3](./STATE_MANAGEMENT.md#3-zustand--estado-global-de-la-aplicación)                                    |
| Hooks                                 | [STATE_MANAGEMENT.md §5](./STATE_MANAGEMENT.md#5-taxonomía-de-hooks-aplicada), [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)  |
| Layouts                               | [ROUTING.md §4](./ROUTING.md#4-layouts-anidados)                                                                             |
| Providers                             | [ROUTING.md §6](./ROUTING.md#6-providers-de-la-aplicación)                                                                   |
| Middleware                            | [API_LAYER.md §3](./API_LAYER.md#3-interceptores-el-equivalente-frontend-a-middleware)                                       |
| Autenticación                         | §7 arriba, [API_LAYER.md §4](./API_LAYER.md#4-autenticación-y-refresh-de-token)                                              |
| Autorización                          | §7 arriba, [ROUTING.md §5](./ROUTING.md#5-guards-de-ruta-autenticación-y-autorización)                                       |
| Internacionalización                  | §8 arriba                                                                                                                    |
| Lazy Loading / Code Splitting         | [PERFORMANCE.md §2](./PERFORMANCE.md#2-code-splitting-y-lazy-loading)                                                        |
| Optimización                          | [PERFORMANCE.md](./PERFORMANCE.md)                                                                                           |
| Convenciones / Nomenclatura / Imports | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) (referencia `docs/architecture/07-convenciones-y-estandares.md`, no la duplica) |
