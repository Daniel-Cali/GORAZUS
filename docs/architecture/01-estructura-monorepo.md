# 01 — Estructura del monorepo

## 1. Decisión: monorepo con `apps/` delgadas + `modules/` como núcleo

GORAZUS vive en un único repositorio (monorepo) gestionado con
**pnpm workspaces + Nx**.

**Por qué Nx y no solo pnpm workspaces o Turborepo:**

- Nx permite declarar **tags** por módulo (`scope:ventas`,
  `scope:inventario`, `type:backend`, `type:frontend`, `type:shared`) y
  hacer cumplir con lint reglas de qué puede importar a qué. Esto es lo
  que convierte "cada módulo debe ser independiente" de una intención en
  una regla verificada en CI, no una convención de honor.
- Nx calcula el **grafo de dependencias real** entre módulos
  (`nx graph`), lo cual es exactamente el mapa que se necesitará el día
  que se decida extraer un módulo a microservicio (ver
  [10-evolucion-a-microservicios.md](./10-evolucion-a-microservicios.md)).
- **Affected builds/tests**: en un ERP con 14+ módulos, no se debe
  recompilar ni re-testear todo el sistema por un cambio en `pos/`. Nx
  solo construye/testea lo que depende de lo que cambió.
- Turborepo es más simple pero no ofrece enforcement de fronteras ni
  generadores de librerías por dominio — dado que "modularidad estricta"
  es un requisito explícito del proyecto, Nx es la herramienta correcta
  para este caso, no una preferencia arbitraria.

## 2. Árbol de carpetas raíz

```
GORAZUS/
├── apps/
│   ├── api/                  # Composition root del backend (NestJS)
│   ├── web/                  # Composition root del frontend (React 19 + Vite)
│   ├── api-e2e/               # Tests end-to-end del backend
│   └── web-e2e/               # Tests end-to-end del frontend (Playwright)
│
├── modules/                   # <-- El corazón del ERP. Un dominio de negocio = una carpeta.
│   ├── auth/                    # orquestación sobre core.* — ver docs/architecture/13
│   ├── seguridad/                # schema security — ver docs/architecture/15
│   ├── configuracion/             # schema configuration — ver docs/architecture/14 §4-10
│   ├── clientes/                   # schema customers — ver docs/architecture/16
│   ├── proveedores/                 # schema suppliers — ver docs/architecture/17
│   ├── productos/                    # schema products — ver docs/architecture/18
│   ├── inventario/                    # schema inventory — ver docs/architecture/19
│   ├── ventas/                          # schema sales — ver docs/architecture/20
│   ├── compras/                          # schema purchases — ver docs/architecture/21
│   ├── caja/                              # schema cash — ver docs/architecture/23
│   ├── bancos/                             # schema banks — ver docs/architecture/24
│   ├── contabilidad/                        # schema accounting — ver docs/architecture/22
│   ├── impuestos/                            # schema taxes — pendiente de documento propio (ver docs/00-indice-maestro.md)
│   ├── crm/                                    # schema crm — ver docs/architecture/27
│   ├── recursos-humanos/                        # schema hr — ver docs/architecture/25
│   ├── nomina/                                   # schema payroll — ver docs/architecture/26
│   ├── servicios/                                 # schema services — pendiente de documento propio
│   ├── proyectos/                                  # schema projects — pendiente de documento propio
│   ├── activos-fijos/                               # schema assets — pendiente de documento propio
│   ├── reportes/                                     # schema reports — ver docs/architecture/28
│   ├── bi/                                            # schema bi — ver docs/architecture/28
│   ├── pos/                                            # orquestación sobre ventas/inventario/caja, sin schema propio
│   ├── produccion/                                      # BOM en products, ejecución en inventory — pendiente de documento propio
│   ├── documentos/                                       # orquestación sobre core.documents, sin schema propio
│   ├── administracion/                                    # orquestación sobre core.integrations/scheduled_jobs, sin schema propio
│   ├── tesoreria/                                          # vista sobre cash+banks+clientes+proveedores, sin schema propio
│   └── dashboard/                                           # orquestación de proyecciones de otros módulos, sin schema propio
│
├── core/                      # Infraestructura técnica transversal (NO es negocio)
│   ├── database/               # Prisma client, base repository, transacciones
│   ├── cache/                  # Cliente Redis y utilidades de cache
│   ├── messaging/               # Cliente RabbitMQ + bus de eventos de dominio
│   ├── storage/                 # Cliente MinIO
│   ├── realtime/                 # WebSocket Gateway base + adaptador Redis
│   ├── http/                     # Filtros, interceptores, pipes globales
│   └── config/                   # Carga y validación de variables de entorno (Zod)
│
├── ui-kit/                    # Design system compartido del frontend (sobre Shadcn UI)
│   ├── components/              # Botones, tablas, formularios base, layout
│   ├── theme/                    # Tokens de Tailwind, tema claro/oscuro
│   └── hooks/                    # Hooks de UI genéricos (useDebounce, useMediaQuery...)
│
├── packages/                  # Librerías puras, sin dependencia de framework
│   ├── contracts/                # Shared Kernel: tipos/Zod schemas cruzados entre módulos
│   └── tooling/                   # eslint-config, tsconfig base, prettier config
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml     # local (dev) — ver docs/architecture/31 §2.1
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   ├── nginx/                     # config reutilizada como reglas de Ingress en K8s
│   ├── kubernetes/                # staging/production — ver docs/architecture/31 §2
│   │   ├── base/                    # Kustomize base: Deployments, Services, Ingress
│   │   └── overlays/
│   │       ├── staging/
│   │       └── production/
│   └── scripts/                  # Scripts de seed, backup, migraciones batch
│
├── docs/
│   ├── architecture/             # Este set de documentos
│   └── adr/                       # Architecture Decision Records
│
├── nx.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## 3. Por qué `modules/` está separado de `apps/`

Esta es la decisión estructural más importante del repositorio.

`apps/api` y `apps/web` **no contienen lógica de negocio**. Son
_composition roots_: el lugar donde se ensamblan los módulos en una
aplicación ejecutable.

- `apps/api/src/main.ts` arranca Nest e importa el `AppModule`, que a su
  vez importa `AuthModule`, `VentasModule`, `InventarioModule`, etc.
  desde `modules/*/backend`.
- `apps/web/src/app/router.tsx` compone las rutas exportadas por cada
  `modules/*/frontend/routes`.

**Consecuencia práctica:** si mañana se decide que `inventario` se
convierte en un microservicio propio, se crea `apps/inventario-service`
que importa `modules/inventario/backend` — el código del módulo **no se
mueve ni se reescribe**, solo cambia quién lo ensambla. Esto es
exactamente el patrón "apps consumen libs" que Nx recomienda para
monorepos grandes, y es la base técnica de
[10-evolucion-a-microservicios.md](./10-evolucion-a-microservicios.md).

## 4. Anatomía de un módulo (vista desde la raíz)

Cada carpeta bajo `modules/` sigue siempre esta forma (el detalle de
cada subcarpeta se explica en
[02](./02-arquitectura-modulos-backend.md) y
[03](./03-arquitectura-modulos-frontend.md)):

```
modules/ventas/
├── backend/            # NestJS: controllers, services, repositories, dto, entities, validators, events
├── frontend/            # React: components, pages, hooks, routes
├── shared/               # types, constants, utils, contracts Zod compartidos FE↔BE de ESTE módulo
├── index.ts               # Barrel público — lo único que otros módulos pueden importar
└── README.md               # Propósito del módulo, dueño, dependencias declaradas
```

El `index.ts` es la frontera dura: exporta únicamente lo que el módulo
decide hacer público (típicamente una fachada de servicio de solo
lectura y los tipos de `shared/`). Nadie importa
`modules/ventas/backend/repositories/*` desde otro módulo — eso lo
bloquea el lint de fronteras de Nx.

## 5. Reglas de import (enforcement)

Configuradas como Nx module boundary lint rules (`@nx/enforce-module-boundaries`):

| Origen                 | Puede importar                                                                                                        | No puede importar                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `modules/<x>/backend`  | `core/*`, `packages/contracts`, `modules/<y>/index.ts` (solo si `<y>` está en las dependencias declaradas del módulo) | `modules/<y>/backend/*` directo, `modules/<y>/frontend/*` |
| `modules/<x>/frontend` | `ui-kit/*`, `packages/contracts`, `modules/<x>/shared`, `modules/<y>/index.ts`                                        | Cualquier cosa de `backend/` (ni propio ni ajeno)         |
| `apps/api`             | `modules/*/backend`, `core/*`                                                                                         | Nada de `frontend/`                                       |
| `apps/web`             | `modules/*/frontend`, `ui-kit/*`                                                                                      | Nada de `backend/`                                        |
| `core/*`               | `packages/*`                                                                                                          | `modules/*` (core nunca depende de negocio)               |
| `packages/contracts`   | nada (hoja del grafo)                                                                                                 | todo lo demás                                             |

Cada módulo declara explícitamente en su `README.md` y en sus tags de
Nx (`project.json`) de qué otros módulos depende. Una dependencia no
declarada falla el build.

## 6. Convención de nombres de carpeta

Los nombres de módulos de negocio se mantienen en **español y en
minúsculas** (`ventas`, `compras`, `cuentas-por-cobrar` si aplicara),
porque son el vocabulario del dominio (ver
[07-convenciones-y-estandares.md](./07-convenciones-y-estandares.md)).
Las carpetas técnicas (`core`, `packages`, `ui-kit`, `apps`) se mantienen
en inglés por ser términos de infraestructura, no de negocio.
