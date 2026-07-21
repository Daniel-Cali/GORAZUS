# GORAZUS ERP — Reglas de arquitectura

> Este documento **formaliza** reglas ya fijadas en `docs/architecture/` y ya verificadas automáticamente por `eslint.config.mjs` (`@nx/enforce-module-boundaries`) — no introduce reglas nuevas. Si algo acá contradice `docs/architecture/`, ese es el error a corregir, no al revés.

## 1. Flujo de dependencias permitido

```
packages/contracts   (hoja — no importa nada)
        ↑
packages/tooling/utils
        ↑
      core/*   (se apila entre sí: http → logging, kernel → http+config+observability...)
        ↑
   modules/*/backend  ──X──  modules/<otro>/backend   (prohibido, salvo index.ts declarado como dependencia)
        ↑
     apps/api

   packages/contracts ← ui-kit ← modules/*/frontend ← apps/web
```

## 2. Tabla de import enforcement (verificada por ESLint, no solo por convención)

| Origen                                   | Puede importar                                                                                                                                              | Prohibido                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api` (`type:app-api`)              | `modules/*/backend`, `core/*`                                                                                                                               | `modules/*/frontend`                                      |
| `apps/web` (`type:app-web`)              | `modules/*/frontend`, `ui-kit/*`                                                                                                                            | `modules/*/backend`                                       |
| `modules/<x>/backend` (`type:backend`)   | `core/*`, `packages/contracts`, `modules/<x>/shared`, `modules/<y>/index.ts` **solo si `<y>` está declarado como dependencia en el `README.md` del módulo** | `modules/<y>/backend/*` directo, `modules/<y>/frontend/*` |
| `modules/<x>/frontend` (`type:frontend`) | `ui-kit/*`, `packages/contracts`, `modules/<x>/shared`, `modules/<y>/index.ts`                                                                              | cualquier cosa de `backend/` (ni propio ni ajeno)         |
| `modules/<x>/shared` (`type:shared`)     | `packages/contracts`                                                                                                                                        | todo lo demás                                             |
| `core/*` (`type:core`)                   | **otro `core/*`**, `packages/contracts`, `packages/tooling`                                                                                                 | `modules/*` — core nunca conoce negocio                   |
| `ui-kit/*` (`type:ui-kit`)               | `packages/contracts`, `packages/tooling`                                                                                                                    | `modules/*`, `core/*`                                     |
| `packages/contracts` (`type:contracts`)  | nada — hoja del grafo                                                                                                                                       | todo lo demás                                             |
| `packages/tooling/utils`                 | nada (funciones puras)                                                                                                                                      | todo lo demás                                             |

**Por qué `core/*` sí puede importar otro `core/*`, pero `modules/<x>/backend` no puede importar `modules/<y>/backend` directo:** son capas distintas. `core/*` es infraestructura apilada (`http` necesita `logging`, `kernel` necesita `http`+`config`+`observability`) — apilarse entre sí es el diseño, no una fuga. `modules/*` es negocio horizontal — dos módulos de negocio hablándose directo por import sería acoplamiento no controlado; la única vía permitida es el barrel público (`index.ts`) de un módulo declarado como dependencia explícita, nunca sus archivos internos.

## 3. Reglas que el lint NO puede verificar (disciplina, no automatización)

- **Sin FK de Postgres entre schemas de distintos módulos.** Referencias cruzadas son IDs sueltos (`ventas.venta.clienteId`), nunca `REFERENCES clientes.cliente(id)`. Ya reflejado en los 21 clientes Prisma de `core/database` (relaciones cross-schema podadas en `split-schema-by-module.js`, no son un descuido).
- **`index.ts` es la única puerta pública de un módulo.** El lint bloquea imports directos a `modules/<y>/backend/repositories/*`, pero no puede saber si el barrel exporta _demasiado_ — eso es revisión de código.
- **Un dueño por módulo** (`.github/CODEOWNERS`) — un PR que toca un módulo requiere su aprobación, aunque cualquiera pueda contribuir.
- **Toda transacción de base de datos se abre y cierra en `services/`**, nunca en `controllers/` ni `repositories/`.

## 4. Convención de paquete para `core/*`

Todo paquete nuevo en `core/` sigue el mismo scaffold (ver cualquiera existente como plantilla):

```
core/<nombre>/
├── package.json     # name: "@gorazus/core-<nombre>", dependencies reales (no "workspace:*" sin uso — ver auditoría)
├── project.json      # targets build (@nx/js:tsc), lint (@nx/eslint:lint), test (@nx/jest:jest)
├── tsconfig.json      # extends ../../tsconfig.base.json
├── jest.config.ts
├── index.ts             # barrel — único punto de import externo
└── <nombre>.module.ts, <nombre>.service.ts, ...
```

- `tags: ["type:core"]` en `project.json` — sin esto, el lint de fronteras no aplica.
- `@Global()` en el módulo NestJS — se importa una vez en `AppModule`.
- Si el paquete necesita config, inyecta `ConfigService` de `@nestjs/config` directo (no hace falta pasar por `@gorazus/core-config` — ese paquete solo centraliza el `.forRoot()` con validación Zod + namespaces, no es un intermediario obligatorio para consumir `ConfigService`).

## 5. Qué falta para que este documento esté 100% verificado

- `scope:<módulo>` (qué módulo de negocio puede importar a cuál otro) no tiene tag de Nx todavía — no existen `project.json` por módulo (0 de 27 módulos escafoldados con código real). Se agrega cuando el primer módulo se construya, sin cambiar el resto de esta tabla.

Fuente normativa completa: [docs/architecture/01-estructura-monorepo.md §5](docs/architecture/01-estructura-monorepo.md#5-reglas-de-import-enforcement), [12-backend-enterprise.md §2](docs/architecture/12-backend-enterprise.md), `eslint.config.mjs`.
