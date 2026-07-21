# docs/frontend/ — Arquitectura de Frontend (EPIC 03)

> Versión 1.0 — 2026-07-16. Índice de navegación de este set, mismo criterio que
> `docs/architecture/README.md` y `docs/menus/00-convenciones.md`. Este set **no
> repite** decisiones ya cerradas en `docs/architecture/03,29,44,45,09,07` ni las
> pantallas/flujos ya fijados en `docs/product/` — las expande al nivel de detalle de
> implementación que un EPIC de arquitectura de frontend dedicado requiere. Sin código.

## Documentos

| #   | Documento                                              | Contenido                                                                                                |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) | Visión, Feature-First formalizado, cómo encaja este set con `docs/architecture/` y `docs/product/`, i18n |
| 2   | [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)           | TanStack Query, Zustand, estado local, formularios, taxonomía de hooks                                   |
| 3   | [ROUTING.md](./ROUTING.md)                             | React Router, rutas federadas, code-splitting, layouts, guards, providers                                |
| 4   | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)           | Árbol de carpetas a nivel de archivo, naming, reglas de import                                           |
| 5   | [FEATURES.md](./FEATURES.md)                           | Qué es una Feature, qué expone, composición entre features, registro en el shell                         |
| 6   | [UI_GUIDELINES.md](./UI_GUIDELINES.md)                 | Shadcn/Radix/Tailwind, arquetipos de pantalla, breakpoints, accesibilidad                                |
| 7   | [PERFORMANCE.md](./PERFORMANCE.md)                     | Presupuesto de carga, code-splitting, virtualización, memoización                                        |
| 8   | [ERROR_HANDLING.md](./ERROR_HANDLING.md)               | Error boundaries, contrato de error, desconexión, observabilidad (Sentry)                                |
| 9   | [API_LAYER.md](./API_LAYER.md)                         | Cliente HTTP, interceptores, autenticación/refresh, WebSocket, subida de archivos                        |
| 10  | [TESTING.md](./TESTING.md)                             | Vitest, Testing Library, Playwright, MSW, qué se testea por capa                                         |

## Cómo leer esto si venís de cero

Orden sugerido: `FRONTEND_ARCHITECTURE` → `FOLDER_STRUCTURE` → `FEATURES` → `ROUTING`
→ `STATE_MANAGEMENT` → `API_LAYER` → el resto según necesidad puntual
(`UI_GUIDELINES`/`PERFORMANCE`/`ERROR_HANDLING`/`TESTING` son transversales, se
consultan cuando el trabajo puntual los toca).

## Documentos de origen (no repetidos, solo referenciados)

Este set se apoya en decisiones ya cerradas y **no las reabre**:

- `docs/architecture/01-estructura-monorepo.md` — estructura de monorepo, reglas de import
- `docs/architecture/03-arquitectura-modulos-frontend.md` — plantilla de módulo frontend
- `docs/architecture/07-convenciones-y-estandares.md` — naming, API REST, testing (general), i18n de datos
- `docs/architecture/09-seguridad-y-multiempresa.md` — JWT, RBAC, multiempresa
- `docs/architecture/29-frontend-enterprise.md` — React, rutas, layouts, hooks, Zustand, Shadcn, TanStack
- `docs/architecture/32-core-platform/03-localizacion-y-globalizacion.md` — i18n/l10n de plataforma
- `docs/architecture/44-frontend-plan-fase-10.md` — gate de backend por punto del roadmap de frontend
- `docs/architecture/45-modulo-pos-frontend.md` — POS: UI de mostrador, hardware, offline
- `docs/product/05-10` — información de arquitectura, navegación, catálogo de pantallas, flujos de usuario, wireframes, atajos de teclado

## Trazabilidad de los 10 documentos contra el EPIC

Ver [FRONTEND_ARCHITECTURE.md §9](./FRONTEND_ARCHITECTURE.md#9-trazabilidad) para la
tabla completa de cada punto pedido en el EPIC (Rutas, Estado global/local, TanStack
Query, Zustand, Hooks, Layouts, Providers, Middleware, Autenticación, Autorización,
Internacionalización, Lazy Loading, Code Splitting, Optimización, Convenciones,
Nomenclatura, Imports) contra el documento que lo cierra.
