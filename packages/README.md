# packages/

**Propósito:** librerías puras, sin dependencia de framework (ni NestJS ni React).

**Responsabilidad:** código compartido que no necesita DI ni ciclo de vida de aplicación — tipos, schemas Zod, funciones utilitarias sin estado.

## Contenido

| Carpeta      | Qué es                                                                                                                                                                                                                                                                                                   | Consumido vía                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `contracts/` | Shared Kernel — tipos y schemas Zod cruzados entre módulos, Value Objects                                                                                                                                                                                                                                | alias de tsconfig `@gorazus/contracts` |
| `tooling/`   | `utils/` — Common Utilities (UUID, Clock, Hash, Encryption). Funciones puras sin estado; se promueven acá solo cuando un segundo caso de uso real lo justifica (KISS, ver [docs/architecture/32-core-platform/10 §1](../docs/architecture/32-core-platform/10-utilidades-comunes.md#1-common-utilities)) | alias de tsconfig `@gorazus/tooling/*` |

## Por qué esto NO son paquetes pnpm reales (a diferencia de `core/*`)

`packages/*` se resuelve por **path alias de TypeScript** (`tsconfig.base.json`), no por `node_modules`/workspace — no tiene `package.json` ni entra al grafo de proyectos de Nx. Es intencional: este código es tan liviano (funciones puras, tipos) que darle el peso de un paquete pnpm completo (versión, build propio, lint propio) sería sobre-ingeniería. `core/*` sí lo necesita porque son servicios con estado/ciclo de vida real que se inyectan vía NestJS DI.

## Reglas

- **`packages/contracts` es hoja del grafo de dependencias** — no importa nada de nadie (ni `core/*` ni `modules/*`). Todo lo demás puede importarlo.
- Nada acá conoce NestJS, React, ni ningún framework — si un archivo necesita `@Injectable()` o JSX, no pertenece a `packages/`.
