# Folder Structure — GORAZUS Frontend

> Expande a **nivel de archivo** el árbol ya fijado en
> `docs/architecture/01-estructura-monorepo.md §2,4` y
> `docs/architecture/03-arquitectura-modulos-frontend.md §1`, mismo criterio que
> `docs/architecture/12-backend-enterprise.md §1.3` aplicó al backend ("core expandido
> a nivel de archivo") y `docs/architecture/29-frontend-enterprise.md §6` aplicó a
> `ui-kit/`. No repite la justificación de por qué `modules/` está separado de `apps/`
> (`01 §3`) — solo el árbol concreto. Sin código.

## 1. `apps/web` — composition root

```
apps/web/
├── src/
│   ├── app/
│   │   ├── router.tsx              # createBrowserRouter — ensambla routes de TODAS las features
│   │   ├── providers.tsx           # Árbol de providers (ROUTING.md §6)
│   │   ├── app-shell/
│   │   │   ├── app-shell.tsx        # Layout raíz (nav global, selector empresa/sucursal)
│   │   │   ├── module-registry.ts    # Registro declarativo de features (FEATURES.md §5)
│   │   │   └── sidebar.tsx            # Consume module-registry + docs/product/06_NAVIGATION.md §3
│   │   ├── error-boundary.tsx      # ErrorBoundary raíz (ERROR_HANDLING.md §1)
│   │   └── not-found.page.tsx      # 404 (ROUTING.md §7)
│   ├── main.tsx                    # Punto de entrada — monta <App/>, nada de lógica de negocio
│   └── vite-env.d.ts
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

`apps/web` importa exclusivamente `modules/*/frontend` (vía sus barrels públicos) y
`ui-kit/*` — nunca `modules/*/backend` (regla de import ya fijada en `01 §5`, no se
repite el enforcement, solo se confirma que este árbol lo respeta).

## 2. `modules/<x>/frontend` — anatomía de una feature

Expansión a nivel de archivo de la plantilla ya fijada en `03 §1`, usando `ventas`
como ejemplo real (mismo módulo usado en los documentos de arquitectura ya existentes,
para que el ejemplo sea comparable):

```
modules/ventas/frontend/
├── components/
│   ├── tabla-ventas.tsx
│   ├── formulario-venta.tsx
│   ├── selector-cliente.tsx
│   └── ...
│
├── pages/
│   ├── ventas-listado.page.tsx
│   ├── venta-crear.page.tsx
│   ├── venta-detalle.page.tsx
│   ├── ventas-configuracion.page.tsx     # Pantalla de configuración consolidada del módulo
│   ├── reportes/
│   │   ├── libro-de-ventas.page.tsx
│   │   └── ventas-por-cliente.page.tsx
│   └── consultas/
│       └── buscar-documento-venta.page.tsx
│
├── hooks/
│   ├── use-ventas.ts                  # useQuery: listado
│   ├── use-venta.ts                   # useQuery: detalle
│   ├── use-crear-venta.ts             # useMutation
│   ├── use-confirmar-venta.ts         # useMutation
│   └── use-venta-realtime.ts          # Suscripción WebSocket
│
├── routes/
│   ├── ventas.routes.tsx              # RouteObject[] exportado
│   └── ventas.layout.tsx              # Opcional (ROUTING.md §4)
│
├── i18n/
│   ├── es.json                        # Términos de negocio propios del módulo
│   └── en.json
│
└── (ver modules/ventas/ — nivel de módulo completo, no solo frontend/, en §3)
```

**No existen `services/` ni `repositories/`** (`03 §1`) — cualquier archivo con ese
nombre dentro de `frontend/` es una violación de la convención, no una variante válida.

### 2.1 Convención de sufijo por tipo de archivo

No estaba consolidada en una sola tabla — se cierra acá referenciando el naming ya
fijado en `docs/architecture/07-convenciones-y-estandares.md §1` (kebab-case + sufijo):

| Tipo de archivo                                                                               | Sufijo                                              | Ejemplo                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------- |
| Página (destino de una ruta)                                                                  | `.page.tsx`                                         | `venta-detalle.page.tsx`                 |
| Layout de módulo                                                                              | `.layout.tsx`                                       | `ventas.layout.tsx`                      |
| Archivo de rutas                                                                              | `.routes.tsx`                                       | `ventas.routes.tsx`                      |
| Hook                                                                                          | prefijo `use-`, sin sufijo                          | `use-crear-venta.ts`                     |
| Componente (no página)                                                                        | sin sufijo, PascalCase el nombre exportado          | `tabla-ventas.tsx` exporta `TablaVentas` |
| Store de Zustand (solo en `apps/web`/`ui-kit`, nunca en un módulo — `STATE_MANAGEMENT.md §3`) | `.store.ts`                                         | `app.store.ts`                           |
| Test                                                                                          | `.test.ts(x)`, colocado junto al archivo que testea | `use-crear-venta.test.ts`                |

## 3. `modules/<x>/` — el módulo completo (recordatorio de frontera)

```
modules/ventas/
├── backend/          # Fuera del alcance de docs/frontend/ — ver docs/architecture/02
├── frontend/          # §2 arriba
├── shared/             # types, constants, Zod schemas — el ÚNICO lugar del que
│   │                    frontend/ puede importar contratos (API_LAYER.md §2)
│   ├── contracts/
│   │   ├── venta.schema.ts        # Zod — mismo schema que valida el backend
│   │   └── venta.types.ts          # Tipos derivados de los schemas Zod (z.infer)
│   └── constants/
│       └── estados-venta.ts
├── index.ts             # Barrel público — lo único importable desde OTRO módulo
└── README.md             # Propósito, dueño, dependencias declaradas (07-convenciones §8)
```

`frontend/` de un módulo puede importar `shared/` del **mismo** módulo directamente, y
`index.ts`/`shared/` de **otros** módulos solo si la dependencia está declarada
(`01 §5`) — nunca el `frontend/` interno de otro módulo. Detalle de qué se expone y
cómo se compone entre features en [FEATURES.md](./FEATURES.md).

## 4. `ui-kit/` — a nivel de archivo

Ya expandido en `29 §6`, se referencia tal cual sin repetirlo — árbol completo:
`ui-kit/components/{primitives,form,data-table,charts,layout}/`,
`ui-kit/theme/{tailwind-tokens.ts,theme-provider.tsx}`,
`ui-kit/hooks/{use-debounce.ts,use-media-query.ts}`. Este documento agrega dos
carpetas que `29 §6` no incluía porque pertenecen a decisiones cerradas después
(i18n, `FRONTEND_ARCHITECTURE.md §8`; utilidades de formato,
`FRONTEND_ARCHITECTURE.md §8`):

```
ui-kit/
├── components/        # Ya fijado en 29 §6 — primitives/, form/, data-table/, charts/, layout/
├── theme/              # Ya fijado en 29 §6
├── hooks/               # Ya fijado en 29 §6
├── i18n/
│   ├── common/
│   │   ├── es.json      # Diccionario base: botones, acciones genéricas, validación
│   │   └── en.json
│   └── i18n-provider.tsx
└── utils/
    └── format/
        ├── date.ts        # Envuelve Intl.DateTimeFormat
        ├── number.ts       # Envuelve Intl.NumberFormat
        └── money.ts         # Envuelve Intl.NumberFormat (estilo currency)
```

## 5. `packages/contracts` — Shared Kernel

Ya fijado en `01 §2` (glosario) y `01 §5` (regla de import: hoja del grafo, no importa
nada). Contiene únicamente los tipos que **todos** los módulos pueden usar sin
declarar dependencia (`Money`, `TenantId`, `UserContext` — mismo glosario de
`01-estructura-monorepo.md §4`). El frontend lo consume igual que el backend; no tiene
una versión "frontend" distinta de estos tipos.

## 6. Imports: reglas de frontera (referencia consolidada)

Tabla ya fijada en `01-estructura-monorepo.md §5`, repetida acá **solo la fila
relevante al frontend** porque este documento es justamente donde un desarrollador de
frontend la va a buscar primero:

| Origen                 | Puede importar                                                                                                                   | No puede importar                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `modules/<x>/frontend` | `ui-kit/*`, `packages/contracts`, `modules/<x>/shared` (propio), `modules/<y>/index.ts` (solo si `<y>` es dependencia declarada) | Cualquier cosa de `backend/` (ni propio ni ajeno), `modules/<y>/frontend/*` directo    |
| `apps/web`             | `modules/*/frontend`, `ui-kit/*`                                                                                                 | Nada de `backend/`                                                                     |
| `ui-kit/*`             | `packages/contracts`                                                                                                             | `modules/*` (ui-kit nunca depende de negocio, mismo principio que `core/*` en backend) |

Enforcement vía Nx module boundary lint rules (`@nx/enforce-module-boundaries`),
mecanismo ya fijado en `01 §1,5` — una dependencia no declarada falla el build, no es
una convención de honor.

## 7. Trazabilidad

| Punto                           | Ya fijado en                                   | Cerrado/detallado acá                                       |
| ------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Árbol de `modules/<x>/frontend` | `03 §1` (plantilla)                            | Expansión a nivel de archivo con ejemplo real completo (§2) |
| `apps/web`                      | `01 §2` (mención)                              | Árbol de archivo completo (§1)                              |
| `ui-kit/`                       | `29 §6`                                        | Carpetas nuevas de i18n/format (§4)                         |
| Naming/sufijos                  | `07-convenciones-y-estandares.md §1` (general) | Tabla específica de frontend (§2.1)                         |
| Reglas de import                | `01 §5`                                        | Referenciado, no repetido completo (§6)                     |
