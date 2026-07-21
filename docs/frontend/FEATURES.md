# Features — GORAZUS Frontend

> Formaliza el patrón Feature-First introducido en
> [FRONTEND_ARCHITECTURE.md §3](./FRONTEND_ARCHITECTURE.md#3-feature-first-qué-significa-en-gorazus-formalizado-acá):
> fronteras, composición entre features, exposición pública y registro en el shell.
> Expande `docs/architecture/03-arquitectura-modulos-frontend.md §2,6` y
> `docs/architecture/01-estructura-monorepo.md §4,5` sin repetirlos. Sin código.

## 1. Qué es una Feature

Una **Feature** = un módulo de negocio con parte `frontend/`
(`docs/architecture/04-catalogo-modulos-negocio.md`). Las 25 features navegables son
exactamente los 25 módulos de `docs/menus/` (`docs/menus/00-convenciones.md §7`) — no
hay una feature sin contraparte de menú, y no hay una entrada de menú sin feature
dueña. `auth` es la única excepción con `frontend/` propio pero sin entrada de sidebar
(`docs/product/06_NAVIGATION.md`, pantalla de login previa a `AppShell`).

Una feature es **autocontenida**: alguien puede trabajar en
`modules/ventas/frontend/` sin necesitar entender `modules/contabilidad/frontend/`
(`01 §1`, ya citado). Esto se verifica en dos direcciones:

- **Hacia adentro:** todo lo que una pantalla de `ventas` necesita para renderizarse
  (componentes, hooks, rutas) vive dentro de `modules/ventas/frontend/`, salvo lo
  explícitamente compartido vía `ui-kit/` o consumido de otra feature (§3).
  Los tres tipos de origen tienen distinto tratamiento — ver §3.
- **Hacia afuera:** ninguna otra feature puede alcanzar el interior de `ventas/frontend/`
  directamente — solo lo que `ventas` decide exponer (§2).

## 2. Qué expone una feature

Dos superficies públicas, cada una con un propósito distinto — no intercambiables:

| Superficie                                         | Contenido                                                                                                         | Quién la consume                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `modules/ventas/index.ts`                          | Barrel de más alto nivel — típicamente una fachada de servicio de solo lectura y los tipos de `shared/` (`01 §4`) | Otro módulo backend o frontend que declaró `ventas` como dependencia                 |
| `modules/ventas/frontend/routes/ventas.routes.tsx` | Array de `RouteObject`                                                                                            | Únicamente `apps/web/src/app/router.tsx` (`03 §5`) — ninguna otra feature lo importa |

Una feature **no expone componentes individuales sueltos por convención implícita** —
si `ventas` decide que `SelectorCliente` (de `clientes`, el ejemplo real ya usado en
`03 §2`) es reutilizable por otra feature, `clientes` lo re-exporta explícitamente
desde su `index.ts`/`shared/` (`03 §2`, ya fijado: "solo si `clientes` lo expone...
nunca importando el archivo interno directamente"). Este documento no cambia esa
regla, solo la nombra como parte del contrato de Feature.

## 3. Composición entre features: los tres patrones reales del sistema

No estaba enumerado como catálogo cerrado — se consolida acá a partir de los patrones
que ya existen dispersos en `docs/architecture/`:

### 3.1 Composición por orquestación (POS es el ejemplo real)

Un módulo sin entidades propias que **orquesta** a otros —
`docs/architecture/04-catalogo-modulos-negocio.md`, nota "`pos` no tiene entidades
propias": POS compone `ventas` + `inventario` + `caja`. En frontend, esto significa
que `modules/pos/frontend/` consume los hooks de datos expuestos por esos tres módulos
(vía sus `index.ts`) para construir una experiencia de UI propia y optimizada
(`docs/architecture/45-modulo-pos-frontend.md §1`), sin duplicar lógica de negocio de
ninguno de los tres. `dashboard`, `tesoreria`, `reportes` y `bi` siguen el mismo
patrón desde el lado de solo lectura (`04-catalogo-modulos-negocio.md` — "consume
proyecciones, nunca escribe").

### 3.2 Composición por reutilización de componente expuesto

Una feature usa un componente de negocio de otra porque la otra decidió exponerlo
(`03 §2`, ejemplo real: `ventas` usa el selector de cliente de `clientes`). Es el
patrón más común y de menor acoplamiento — la feature consumidora no sabe nada de
cómo `clientes` busca o valida, solo usa el componente como caja negra con su propia
API pública.

### 3.3 Composición por evento de dominio (sin acoplamiento de UI)

Dos features nunca se componen visualmente pero reaccionan a los mismos hechos de
negocio — p. ej. `inventario` publica `StockActualizado` y cualquier pantalla de
`ventas` que tenga la suscripción WS abierta (`use-venta-realtime.ts`, patrón de
`docs/architecture/05-flujo-de-datos.md §2`) refleja el cambio sin que `ventas`
importe nada de `inventario`. Este patrón esel único de los tres que no requiere
ninguna dependencia declarada de Nx (`01 §5`) porque no hay import de código —
solo un contrato de nombre de evento, ya gobernado por
`docs/architecture/06-comunicacion-entre-modulos.md`.

**Regla general que cierra los tres patrones:** una feature nunca importa el interior
de otra "porque es más rápido" — si dos features necesitan compartir algo que ninguna
de las tres formas de arriba cubre bien, la señal es que ese algo pertenece a
`ui-kit/` (si no tiene conocimiento de negocio) o a una feature nueva propia (si sí lo
tiene y ninguna de las dos existentes es su dueña natural) — no se resuelve con un
import directo que rompa la frontera.

## 4. Permisos a nivel de feature

Cada feature declara, en su propio `README.md` (ya exigido por
`07-convenciones-y-estandares.md §8` a nivel de módulo completo), el permiso base que
determina si aparece siquiera en el menú del usuario (`docs/menus/<módulo>.md`,
columna Permiso de cada pantalla — normalmente `<modulo>.ver` para la entrada de
sidebar). El registro declarativo del shell (§5) lee ese permiso vía `usePermiso()`
para decidir si renderiza la entrada — una feature sin el permiso de `.ver` no aparece
en el sidebar, sin necesitar código condicional disperso por componente.

Dentro de la feature, cada página/acción individual declara su propio permiso más
específico (`ventas.crear`, `ventas.confirmar`) — mecanismo completo en
[ROUTING.md §5](./ROUTING.md#5-guards-de-ruta-autenticación-y-autorización).

## 5. Registro de features en el shell

`03 §6` ya fija que el menú se genera desde "un registro declarativo de módulos
(nombre, icono, ruta base, permiso requerido)", nunca hardcodeado. Se detalla acá:

- `apps/web/src/app/app-shell/module-registry.ts` — único archivo que enumera las 25
  features navegables con: nombre para mostrar, ícono (`lucide-react`, convención ya
  fijada en `docs/menus/00-convenciones.md §2`), path base, permiso `.ver`, y grupo de
  sitemap de nivel 1 al que pertenece (`docs/product/05_INFORMATION_ARCHITECTURE.md §3`
  — "Ventas", "Compras e Inventario", "Finanzas", etc.).
- Este archivo es el único lugar de `apps/web` que **nombra** las 25 features por
  string — el código de ensamblado de rutas (`router.tsx`) las importa por separado,
  pero la agrupación visual del sidebar viene de este registro, no de inferencia
  reflexiva sobre el sistema de archivos (`03 §6`, ya fijado, repetido porque es fácil
  de romper agregando "magia" de auto-descubrimiento que dificultaría ocultar un
  módulo por plan/permiso sin tocar código).
- Agregar una feature nueva al sistema implica: crear `modules/<x>/frontend/`, agregar
  su entrada a `module-registry.ts`, agregar `<x>Routes` al `router.tsx` — tres
  puntos de contacto explícitos, ninguno mágico.

## 6. Alcance Empresa/Sucursal a nivel de feature

Cada feature declara su clasificación de alcance (De sucursal / Consolidable / De
empresa) — clasificación ya construida en
`docs/product/07_SCREEN_CATALOG.md §5` a partir de
`docs/product/05_INFORMATION_ARCHITECTURE.md §5`. El componente de selector de
empresa/sucursal en `AppShell` (§5 arriba) se oculta o restringe automáticamente según
la feature activa lea esa clasificación desde su propio registro — mecanismo de
consumo del store de alcance ya fijado en
[STATE_MANAGEMENT.md §3.1](./STATE_MANAGEMENT.md#31-authslice).

## 7. Trazabilidad

| Punto                            | Ya fijado en                                                                             | Cerrado/detallado acá                          |
| -------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Feature = módulo con `frontend/` | `04-catalogo-modulos-negocio.md`, `01 §4`                                                | Definición operativa formal (§1)               |
| Qué expone un módulo             | `01 §4`, `03 §2,5`                                                                       | Consolidado en tabla de dos superficies (§2)   |
| Composición entre módulos        | Disperso (POS en `45`, eventos en `05-flujo-de-datos.md`)                                | Catálogo cerrado de 3 patrones (§3)            |
| Permisos                         | `09-seguridad-y-multiempresa.md`, `docs/menus/`                                          | Aplicación a nivel de registro de feature (§4) |
| Registro en el shell             | `03 §6` (mención)                                                                        | Archivo concreto, 3 puntos de contacto (§5)    |
| Alcance Empresa/Sucursal         | `docs/product/05_INFORMATION_ARCHITECTURE.md §5`, `docs/product/07_SCREEN_CATALOG.md §5` | Consumo desde el registro de feature (§6)      |
