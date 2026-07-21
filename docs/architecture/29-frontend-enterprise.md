# 29 — Frontend Enterprise (diseño completo)

> Versión 1.0 — 2026-07-13. Mismo criterio que
> [12-backend-enterprise.md](./12-backend-enterprise.md), su
> contraparte del otro lado del stack: consolida lo ya fijado en
> [01](./01-estructura-monorepo.md) y
> [03-arquitectura-modulos-frontend.md](./03-arquitectura-modulos-frontend.md)
> sin repetirlo, y **cierra dos decisiones que esos documentos dejaban
> explícitamente pendientes** (Stores, motor de `DataTable`) — ver §5 y
> §8. Sin código.

## 1. React

React 19, exclusivamente componentes función + hooks — sin
componentes de clase en ningún módulo nuevo (los patrones de clase no
tienen cabida en las convenciones ya fijadas de
[07-convenciones-y-estandares](./07-convenciones-y-estandares.md)).
La decisión de arquitectura más importante ya está fijada y no se
repite: **no hay capa de `services/`/`repositories/` en el
frontend** — el hook de TanStack Query **es** la capa de acceso a
datos ([03 §1](./03-arquitectura-modulos-frontend.md#1-plantilla-de-carpetas)).
Esto es deliberado (KISS): agregar una capa de "servicio HTTP" entre
el componente y TanStack Query no aportaría nada que TanStack Query no
resuelva ya.

## 2. Rutas

React Router (confirmado por la API ya usada en el ejemplo real de
[03 §5](./03-arquitectura-modulos-frontend.md#5-rutas-cómo-se-ensamblan-sin-acoplar):
`createBrowserRouter`, función propia de React Router v6.4+ — no
TanStack Router, que no está en uso en ningún documento existente).
Rutas federadas por módulo (`modules/<x>/frontend/routes/`),
ensambladas únicamente en `apps/web` — ningún módulo importa las
rutas de otro para navegar, usa el path como string documentado
([03 §5](./03-arquitectura-modulos-frontend.md#5-rutas-cómo-se-ensamblan-sin-acoplar)).

**Code-splitting por módulo — no estaba decidido explícitamente,
necesario a esta escala**: con 24+ módulos de negocio, un único bundle
que cargue todo el código de `ventas`, `contabilidad`, `nómina`, etc.
de una vez sería inaceptable en tiempo de carga inicial. Se fija acá:
cada archivo `<modulo>.routes.tsx` se importa en `apps/web/app/router.tsx`
vía `React.lazy()`, con el `AppShell` (§3) mostrando un fallback de
carga mientras el bundle del módulo se descarga — el usuario paga el
costo de descarga solo de los módulos que efectivamente visita, no de
los 24 en el primer request.

## 3. Layouts

`AppShell` (nav global, selector de empresa, menú de módulos ya
generado desde registro declarativo — ver
[03 §6](./03-arquitectura-modulos-frontend.md#6-layout-y-shell-de-la-aplicación))
es el **layout raíz**, envolviendo todas las rutas vía la ruta padre
de React Router (`{ element: <AppShell />, children: [...] }`, ya en
el ejemplo real de 03 §5).

**Layouts de módulo — nuevo, no estaba definido**: un módulo con
varias páginas relacionadas (listado, detalle, creación) puede
declarar un layout propio opcional
(`modules/<x>/frontend/routes/<x>.layout.tsx`), anidado bajo
`AppShell` vía rutas anidadas de React Router — típicamente para
breadcrumb o navegación por pestañas específica del módulo (p. ej.
"Cliente: datos generales / crédito / historial" como pestañas dentro
del layout de detalle de `customers`). No es obligatorio — un módulo
simple sin necesidad de esa navegación intermedia no declara uno,
usa directamente `AppShell` como único ancestro.

## 4. Hooks — taxonomía consolidada (dispersa en 3 documentos, no existía junta)

| Categoría                    | Ubicación                              | Ejemplo                                               | Fuente ya fijada                                                                             |
| ---------------------------- | -------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Datos de servidor**        | `modules/<x>/frontend/hooks/`          | `useVentas`, `useCrearVenta`                          | [03 §3](./03-arquitectura-modulos-frontend.md#3-datos-tanstack-query--contratos-compartidos) |
| **Tiempo real**              | Ídem                                   | `useVentaRealtime` (suscripción WebSocket del módulo) | [03, árbol de carpetas](./03-arquitectura-modulos-frontend.md#1-plantilla-de-carpetas)       |
| **Formularios**              | Componente o página, no carpeta propia | `useForm` (React Hook Form) + `zodResolver`           | [03 §4](./03-arquitectura-modulos-frontend.md#4-formularios-react-hook-form--zod)            |
| **Autorización**             | `core`/`ui-kit`, transversal           | `usePermiso('ventas.crear')`                          | [09-seguridad-y-multiempresa §2](./09-seguridad-y-multiempresa.md#2-autorización-seguridad)  |
| **UI genérica, sin negocio** | `ui-kit/hooks/`                        | `useDebounce`, `useMediaQuery`                        | [01, árbol de carpetas](./01-estructura-monorepo.md#2-árbol-de-carpetas-raíz)                |
| **Estado global**            | `core`/`ui-kit`, expuesto por hook     | `useAuthStore`, `useActiveCompany`                    | Nuevo — ver §5                                                                               |

Regla que atraviesa las seis categorías: un hook nunca mezcla más de
una — `useVentas` no gestiona permisos, `usePermiso` no toca
TanStack Query. Cada hook tiene una sola razón para cambiar (SOLID a
nivel de hook, no solo de clase/servicio backend).

## 5. Stores — decisión cerrada acá (estaba explícitamente pendiente)

[03 §7](./03-arquitectura-modulos-frontend.md#7-estado-qué-va-en-tanstack-query-vs-qué-va-en-estado-localglobal)
dejaba la elección entre Zustand y Context "a definir en la fase de
implementación". Se fija ahora: **Zustand**, por tres razones
concretas, no por preferencia:

1. **Selectores sin re-render en cascada** — con Context, cualquier
   cambio en el valor provisto re-renderiza a todos los consumidores
   del provider, aunque cada uno solo lea una porción distinta del
   estado (p. ej. `AppShell` leyendo `theme` no debería re-renderizar
   por un cambio en `activeCompanyId`). Zustand resuelve esto con
   selectores granulares sin necesitar dividir el estado en múltiples
   Contexts anidados.
2. **Persistencia sin código adicional** — `activeCompanyId` y `theme`
   necesitan sobrevivir a un refresh de página (`localStorage`).
   Zustand tiene middleware de persistencia de una línea; Context
   requeriría sincronización manual con `localStorage` en cada
   provider.
3. **Consistencia con el resto del stack** — ya se decidió no usar
   Redux por ser demasiado para la superficie real de estado global
   ([03 §7](./03-arquitectura-modulos-frontend.md#7-estado-qué-va-en-tanstack-query-vs-qué-va-en-estado-localglobal));
   Zustand es la opción intermedia coherente con ese mismo razonamiento
   KISS, sin la ceremonia de acciones/reducers que Redux exigiría para
   3-4 valores de estado global reales.

**Alcance exacto de los stores** (para que no crezcan más allá de lo
que este documento ya limitó en 03 §7): usuario autenticado, empresa
activa (`activeCompanyId`, con el flujo de cambio de empresa ya
fijado en
[09-seguridad-y-multiempresa §3](./09-seguridad-y-multiempresa.md#3-multiempresa-multi-tenant)
— cambiar de empresa emite un access token nuevo, el store solo
refleja cuál está activa), tema claro/oscuro, y estado de UI persistente
de bajo nivel (sidebar colapsado/expandido). **Nada de esto vive en
más de un store** — un único store raíz con slices (`authSlice`,
`uiSlice`), no un store por concepto, para no reproducir la
fragmentación que Context habría tenido de todos modos.

## 6. Componentes

División ya fijada, no repetida:
[ui-kit](./03-arquitectura-modulos-frontend.md#2-componentes-propios-del-módulo-vs-compartidos)
(sin conocimiento de negocio) vs. componentes de módulo (con
conocimiento de negocio, expuestos a otros módulos solo vía
`index.ts`). **`ui-kit/` expandido a nivel de archivo** (nuevo, mismo
criterio que
[12-backend-enterprise §1.3](./12-backend-enterprise.md#13-core-expandido-a-nivel-de-archivo-nuevo)
para `core/`):

```
ui-kit/
├── components/
│   ├── primitives/        # copias de shadcn/ui sin modificar lógica — ver §7
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── dropdown-menu.tsx
│   ├── form/               # FormField, FormError — envuelven primitives + React Hook Form
│   ├── data-table/         # DataTable genérico — ver §8 (motor TanStack Table)
│   └── layout/              # AppShell, PageHeader, Breadcrumb
├── theme/
│   ├── tailwind-tokens.ts    # colores/spacing como tokens, no valores sueltos
│   └── theme-provider.tsx     # claro/oscuro, consumido por theme store (§5)
└── hooks/
    ├── use-debounce.ts
    └── use-media-query.ts
```

## 7. Shadcn — cadena de integración (no estaba explicada, solo mencionada)

**shadcn/ui no es una dependencia de `npm`** — es una CLI que
**copia** el código fuente de cada componente al repositorio
(`ui-kit/components/primitives/`), construido sobre **Radix UI**
(primitivas accesibles sin estilo: manejo de foco, ARIA, teclado) más
clases de Tailwind. Esto tiene una consecuencia de diseño real: al no
ser una dependencia externa, GORAZUS **es dueño** de ese código desde
el momento en que se copia — puede modificarse libremente sin esperar
un release upstream, pero también **no recibe actualizaciones
automáticas** de shadcn (una mejora de accesibilidad nueva en shadcn
no llega sola, hay que volver a copiar el componente y remergear
customizaciones).

```
Radix UI (primitivas accesibles, sin estilo)
    → shadcn/ui (CLI: copia + estilo Tailwind por defecto)
        → ui-kit/components/primitives/ (copia propia de GORAZUS, tema aplicado)
            → ui-kit/components/{form,data-table,layout}/ (composición sobre las primitivas)
                → modules/<x>/frontend/components/ (uso con conocimiento de negocio)
```

El tema claro/oscuro (`ui-kit/theme/`) se aplica una sola vez, a nivel
de `tailwind-tokens.ts` — los componentes de `primitives/` nunca
hardcodean un color, siempre referencian el token, para que un cambio
de marca/tema no requiera tocar cada componente copiado de shadcn uno
por uno.

## 8. TanStack — qué está decidido y qué se cierra acá

| Paquete            | Estado                                                                                                              | Uso                                                                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query** | Ya decidido y en uso ([03 §3](./03-arquitectura-modulos-frontend.md#3-datos-tanstack-query--contratos-compartidos)) | Toda lectura/escritura de datos de servidor, sin excepción                                                                                                                                                                                                        |
| **TanStack Table** | **Se decide acá**                                                                                                   | Motor headless del `DataTable` genérico de `ui-kit` (§6) — sin esto, cada módulo reinventaría su propia lógica de ordenamiento/paginación/selección de filas sobre el mismo componente visual, exactamente el tipo de duplicación que `ui-kit` existe para evitar |
| TanStack Router    | **No se usa**                                                                                                       | El enrutamiento ya está resuelto con React Router (§2) — no se introducen dos routers                                                                                                                                                                             |
| TanStack Form      | **No se usa**                                                                                                       | Los formularios ya están resueltos con React Hook Form + Zod ([03 §4](./03-arquitectura-modulos-frontend.md#4-formularios-react-hook-form--zod)) — no se introducen dos librerías de formularios                                                                  |

**Por qué TanStack Table y no una tabla con paginación/orden
implementados a mano en `ui-kit`**: es headless (sin estilo propio,
se renderiza con los `primitives/` de shadcn ya en `ui-kit`) y ya
integra naturalmente con la forma en que TanStack Query devuelve datos
paginados (`meta.page`/`meta.pageSize`/`meta.total`, contrato ya
fijado en
[07-convenciones-y-estandares §4](./07-convenciones-y-estandares.md#4-api-rest)) —
usar la contraparte de la misma familia de librerías evita fricción de
integración entre ecosistemas distintos.

## 8.1 Librería de gráficos — no estaba decidida (agregado por Fase 7)

Ningún documento nombraba una librería de charting — a diferencia de
tablas (TanStack Table, §8), formularios (React Hook Form) y PDF/Excel
(Template Engine / Serialization Utilities,
[32-core-platform/08 §4](./32-core-platform/08-frameworks-de-infraestructura.md#4-template-engine)
y
[32-core-platform/10 §9](./32-core-platform/10-utilidades-comunes.md#9-serialization-utilities)),
que sí tenían resolución explícita. Los widgets de dashboard
(`reports.dashboard_widgets.chart_type`,
[41-modulo-bi.md §1](./41-modulo-bi.md#1-dashboards-y-charts--decisión-de-librería-que-no-existía))
no tenían forma de renderizarse más allá de tabla.

**Se decide acá: Recharts.** Es SVG declarativo por componentes React
(coherente con el resto del stack — no requiere un motor de canvas
separado ni una API imperativa distinta al resto de `ui-kit`), se
integra sin fricción con Tailwind/shadcn (los `primitives/` ya en
`ui-kit` pueden envolver los componentes de Recharts igual que ya
envuelven Radix), y cubre los 5 tipos de `chart_type` ya definidos
(`line`, `bar`, `pie`, `area`, `number` — este último no es un gráfico
de Recharts, es un componente propio simple de "valor grande +
tendencia", ya que no todo KPI necesita visualización gráfica).
Alternativas descartadas: Visx (más flexible pero de más bajo nivel,
requeriría construir cada tipo de gráfico desde cero — sobre-ingeniería
para el alcance actual de BI/Dashboards) y Chart.js (basado en
`<canvas>`, no en componentes React declarativos — rompería la
consistencia de composición del resto de `ui-kit`).

`ui-kit/components/charts/` (nueva carpeta, mismo nivel que
`data-table/` en §6) envuelve cada tipo de gráfico de Recharts con el
tema de colores/tipografía ya fijado en `theme/`, para que ningún
módulo importe Recharts directamente — mismo principio de
encapsulamiento que ya aplica al resto de `ui-kit`.

## 9. Trazabilidad

| Punto solicitado | Documento(s) de detalle normativo                                                                                                   | Novedad de este documento                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| React            | [03](./03-arquitectura-modulos-frontend.md)                                                                                         | — (principio ya fijado, recapitulado)                                                      |
| Rutas            | [03 §5](./03-arquitectura-modulos-frontend.md#5-rutas-cómo-se-ensamblan-sin-acoplar)                                                | React Router confirmado explícitamente + code-splitting por módulo, no decidido antes (§2) |
| Layouts          | [03 §6](./03-arquitectura-modulos-frontend.md#6-layout-y-shell-de-la-aplicación)                                                    | Layouts de módulo anidados, nuevo (§3)                                                     |
| Hooks            | [03](./03-arquitectura-modulos-frontend.md), [09-seguridad-y-multiempresa](./09-seguridad-y-multiempresa.md)                        | Taxonomía de 6 categorías, consolidada por primera vez (§4)                                |
| Stores           | [03 §7](./03-arquitectura-modulos-frontend.md#7-estado-qué-va-en-tanstack-query-vs-qué-va-en-estado-localglobal) (dejaba pendiente) | **Decisión cerrada**: Zustand, con razones + alcance exacto (§5)                           |
| Componentes      | [03 §2](./03-arquitectura-modulos-frontend.md#2-componentes-propios-del-módulo-vs-compartidos)                                      | `ui-kit/` expandido a nivel de archivo (§6)                                                |
| Shadcn           | [01](./01-estructura-monorepo.md) (solo mencionado)                                                                                 | Cadena de integración completa Radix→shadcn→ui-kit, nunca explicada (§7)                   |
| TanStack         | [03](./03-arquitectura-modulos-frontend.md) (solo Query)                                                                            | Tabla de qué paquetes de la familia se usan y cuáles no, + decisión de Table (§8)          |
| Gráficos         | Ninguno — decisión ausente hasta ahora                                                                                              | **Decisión cerrada**: Recharts, con razones + alternativas descartadas (§8.1)              |
