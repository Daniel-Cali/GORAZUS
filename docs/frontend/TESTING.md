# Testing — GORAZUS Frontend

> Expande la fila de frontend de la pirámide ya fijada en
> `docs/architecture/07-convenciones-y-estandares.md §5` (Vitest + Testing Library,
> Playwright para `apps/web-e2e`) — ese documento fija **qué herramienta**, este fija
> **qué se testea en cada capa, cómo se mockea, y con qué criterio de cobertura**, que
> no estaba definido. Ver [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md).
> Sin código.

## 1. Herramientas (referencia, no redecide)

| Capa                                      | Herramienta                 | Ya fijado en                         |
| ----------------------------------------- | --------------------------- | ------------------------------------ |
| Hooks, componentes (unitario/integración) | Vitest + Testing Library    | `07-convenciones-y-estandares.md §5` |
| Flujo de usuario en navegador (e2e)       | Playwright (`apps/web-e2e`) | `07-convenciones-y-estandares.md §5` |

No se introduce Jest en el frontend (Vitest ya cubre el mismo rol, es el runner nativo
del ecosistema Vite que `01-estructura-monorepo.md` ya fija como bundler) ni Cypress
(Playwright ya decidido) — mismo criterio KISS de no duplicar herramientas con
solape de responsabilidad.

## 2. Qué se testea en cada capa (nuevo — no estaba definido)

| Capa                                                          | Qué se prueba                                                                                                                                                                                                                                                                                                             | Qué NO se prueba ahí                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Hooks de datos** (`use-ventas.ts`)                          | Que la `queryKey` se construye correctamente, que la validación Zod de la respuesta ([API_LAYER.md §2](./API_LAYER.md#2-contratos-tipados-zod-compartido)) rechaza un payload inválido, que una mutación invalida las queries correctas ([STATE_MANAGEMENT.md §2.3](./STATE_MANAGEMENT.md#23-invalidación-tras-mutación)) | Lógica de negocio del backend (eso lo testea `apps/api-e2e`, `07-convenciones §5`)   |
| **Componentes de negocio** (`SelectorCliente`, `TablaVentas`) | Renderizado condicional por estado (vacío/cargando/error, `docs/product/09_WIREFRAMES.md`), interacción de usuario (click, tipeo) dispara el callback/mutación esperada                                                                                                                                                   | Estilos visuales pixel-perfect (fuera de alcance, ver §5)                            |
| **Componentes de `ui-kit/`**                                  | Los mismos que arriba, más accesibilidad (rol ARIA correcto, navegable por teclado — verifica el compromiso de [UI_GUIDELINES.md §5](./UI_GUIDELINES.md#5-accesibilidad-nuevo--no-estaba-fijado-como-compromiso-explícito))                                                                                               | Nada de negocio — `ui-kit/` no lo tiene                                              |
| **Stores de Zustand** (`authSlice`, `uiSlice`)                | Transiciones de estado puras (`switchCompanyContext` deja el store en el estado esperado, [STATE_MANAGEMENT.md §3.3](./STATE_MANAGEMENT.md#33-persistencia))                                                                                                                                                              | Efectos de red que el store dispara (eso se prueba en el hook que lo invoca)         |
| **Páginas** (`*.page.tsx`)                                    | Integración: que la página compone correctamente sus hooks + componentes (con MSW, §3) — smoke test de que la pantalla completa renderiza sin crashear en sus 3-4 estados principales                                                                                                                                     | Flujo completo multi-pantalla (eso es e2e, §4)                                       |
| **E2E** (`apps/web-e2e`, Playwright)                          | Flujos de usuario reales punta a punta contra un stack Dockerizado (`07-convenciones §5`) — un caso de negocio completo (crear cotización → confirmar → facturar)                                                                                                                                                         | Casos borde de validación de cada campo (eso ya está cubierto a nivel de componente) |

Regla de proporcionalidad ya fijada a nivel general en `07-convenciones §5` y aplicada
acá: no se exige el mismo nivel de cobertura e2e para todos los módulos — se prioriza
donde el costo de un bug es alto (ventas, compras, caja, contabilidad, POS) sobre
pantallas de solo consulta (reportes, catálogos simples).

## 3. Mocking de la capa de datos (nuevo)

No estaba decidido cómo se aísla un componente/página de la red real en un test. Se
fija: **MSW (Mock Service Worker)** — intercepta a nivel de red (`fetch`), no a nivel
de módulo importado, lo que significa que el mismo cliente HTTP real
([API_LAYER.md §1](./API_LAYER.md#1-el-cliente-http-una-instancia-no-una-capa)) corre
en el test sin mockear manualmente cada hook — más fiel al comportamiento real
(incluye los interceptores de [API_LAYER.md §3](./API_LAYER.md#3-interceptores-el-equivalente-frontend-a-middleware))
que mockear `useQuery` directamente. Los handlers de MSW para cada feature se colocan
junto a sus tests (`modules/<x>/frontend/**/*.mocks.ts`) y reutilizan los mismos Zod
schemas de `shared/contracts` para generar respuestas válidas — evita que un mock
quede desincronizado del contrato real sin que ningún test lo note.

## 4. Testing e2e (Playwright) — qué cubre

- Un flujo por caso de negocio crítico, no por pantalla — mismo criterio de
  priorización que `07-convenciones §5`.
- Corre contra el stack completo Dockerizado (`apps/api` + Postgres + Redis real, no
  mockeado) — es la única capa de todo el testing de frontend que valida contra un
  backend real, incluyendo el contrato de error real
  ([ERROR_HANDLING.md](./ERROR_HANDLING.md)) y el flujo real de refresh de token
  ([API_LAYER.md §4](./API_LAYER.md#4-autenticación-y-refresh-de-token)).
- Datos de prueba: seed determinístico por test (no se reutiliza estado entre tests
  para evitar dependencias de orden de ejecución) — mecanismo de seed ya existe a nivel
  de infraestructura (`infra/scripts/`, `docs/architecture/01-estructura-monorepo.md §2`),
  este documento no lo rediseña, solo confirma que `web-e2e` lo reutiliza en vez de
  tener su propio mecanismo de fixtures paralelo.

## 5. Fuera de alcance (explícito)

- **Testing visual de regresión** (Chromatic, Percy o similar) — no adoptado en esta
  fase por falta de necesidad de negocio confirmada, mismo criterio que otras
  decisiones "fuera de alcance hasta confirmación" del proyecto
  (`docs/architecture/42-integraciones-plan-fase-8.md`, mismo patrón). La consistencia
  visual se protege por diseño (arquetipos únicos de `ui-kit/`,
  [UI_GUIDELINES.md §2](./UI_GUIDELINES.md#2-los-6-arquetipos-de-pantalla-referencia))
  más que por snapshot pixel a pixel.
- **Testing de accesibilidad automatizado exhaustivo** (axe-core) — se adopta de forma
  acotada solo dentro de los tests de componentes de `ui-kit/` (tabla, §2), no como
  gate de CI sobre las 336 pantallas del catálogo — mismo criterio de proporcionalidad.

## 6. Performance testing

Referencia a los objetivos ya fijados en
[PERFORMANCE.md §1](./PERFORMANCE.md#1-presupuesto-de-carga-nuevo) (tamaño de bundle,
LCP/INP/TTI) — verificados en CI vía Lighthouse CI sobre las páginas de mayor tránsito
(Dashboard, listado de Ventas, POS) en cada build de `main`, no en cada PR (costo de
ejecución vs. señal — un check de bundle-size sí corre por PR, más barato y más
inmediato).

## 7. Trazabilidad

| Punto pedido / gap                                 | Ya fijado en                                                       | Cerrado/detallado acá                |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| Herramientas (Vitest, Testing Library, Playwright) | `07-convenciones-y-estandares.md §5`                               | Referencia (§1)                      |
| Qué se testea por capa                             | Ninguno                                                            | Tabla completa (§2)                  |
| Mocking de red                                     | Ninguno                                                            | MSW, decisión cerrada (§3)           |
| E2E                                                | `07-convenciones §5` (herramienta)                                 | Alcance y datos de prueba (§4)       |
| Visual regression / a11y automatizado              | Ninguno                                                            | Explícitamente fuera de alcance (§5) |
| Performance testing                                | [PERFORMANCE.md §1](./PERFORMANCE.md#1-presupuesto-de-carga-nuevo) | Mecanismo de verificación en CI (§6) |
