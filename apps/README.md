# apps/

**Propósito:** composition roots — donde se ensamblan `core/*` y `modules/*` en aplicaciones ejecutables.

**Responsabilidad:** arrancar el proceso (backend) o servir el bundle (frontend). Nada más.

## Contenido

| Carpeta    | Framework       | Rol                                                                         |
| ---------- | --------------- | --------------------------------------------------------------------------- |
| `api/`     | NestJS          | Backend — importa `core/*` (siempre) y `modules/*/backend` (cuando existan) |
| `web/`     | React 19 + Vite | Frontend — importa `ui-kit/` y `modules/*/frontend` (cuando existan)        |
| `api-e2e/` | Jest            | Tests end-to-end del backend, contra el stack Dockerizado                   |
| `web-e2e/` | Playwright      | Tests end-to-end del frontend, flujo de usuario real en navegador           |

## Reglas

- **Ninguna app contiene lógica de negocio.** Si encontrás una regla de negocio acá, está en el lugar equivocado — pertenece a `modules/<x>/backend/services/` o `.../frontend/`.
- `apps/api` nunca importa nada de `frontend/`; `apps/web` nunca importa nada de `backend/` (regla de fronteras de Nx, ver `eslint.config.mjs`).
- Cada app tiene su propio `package.json`/`project.json`/`tsconfig.json` — es un proyecto Nx real, no una carpeta de conveniencia.

Detalle completo: [docs/architecture/01-estructura-monorepo.md §3](../docs/architecture/01-estructura-monorepo.md#3-por-qué-modules-está-separado-de-apps).
