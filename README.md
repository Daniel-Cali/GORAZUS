# GORAZUS ERP

ERP Enterprise para pequeñas/medianas empresas — alcance funcional
comparable a SAP Business One, Odoo y Microsoft Dynamics. Monolito
modular (Clean Architecture + DDD), preparado para extracción a
microservicios sin reescritura (ver
[docs/architecture/10-evolucion-a-microservicios.md](docs/architecture/10-evolucion-a-microservicios.md)).

## Estado del proyecto

- [VERSION.md](VERSION.md) — versión actual y qué significa cada número.
- [ROADMAP.md](ROADMAP.md) — qué módulo de negocio tiene backend/frontend real hoy, fase actual y siguiente.
- [CHANGELOG.md](CHANGELOG.md) — historial detallado por sesión de trabajo (qué se construyó, bugs reales encontrados).
- [docs/api/](docs/api/) — OpenAPI exportado automáticamente al arrancar el backend (`openapi.json`), documentación de API en `docs/api/API.md`.

## Documentación

La documentación es la fuente oficial de arquitectura y no se repite
acá:

- [docs/00-indice-maestro.md](docs/00-indice-maestro.md) — punto de entrada a todos los documentos.
- [docs/architecture/README.md](docs/architecture/README.md) — arquitectura de software (monorepo, módulos, infraestructura, CI/CD, seguridad).
- [docs/database/README.md](docs/database/README.md) — modelo de datos, SQL fuente de verdad, backup/HA.
- [docs/menus/](docs/menus/) — estructura de navegación por módulo de negocio.

## Stack

| Capa            | Tecnología                                                                     |
| --------------- | ------------------------------------------------------------------------------ |
| Monorepo        | Nx + pnpm workspaces                                                           |
| Backend         | NestJS + TypeScript, Prisma (consumidor de un schema SQL versionado, no dueño) |
| Frontend        | React + Vite + TailwindCSS + Shadcn UI + TanStack Query                        |
| Datos           | PostgreSQL 17, Redis, RabbitMQ, MinIO                                          |
| Infraestructura | Docker Compose (local) / Kubernetes (staging, production)                      |

Detalle y justificación de cada decisión en
[docs/architecture/](docs/architecture/) — este README no las repite.

## Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- Docker + Docker Compose (para Postgres/Redis/RabbitMQ/MinIO en local)

## Primeros pasos

```bash
pnpm install
cp .env.example .env   # completar valores reales, .env nunca se commitea
pnpm docker:up          # levanta Postgres, Redis, RabbitMQ, MinIO (docker-compose.dev.yml)
```

Comandos frecuentes (ver `package.json`):

```bash
pnpm lint            # lint de todo el workspace
pnpm lint:affected   # lint solo de lo afectado desde main (usado en CI)
pnpm test:affected   # tests solo de lo afectado
pnpm build:affected  # build solo de lo afectado
pnpm graph           # grafo de dependencias real entre proyectos Nx
pnpm format          # formatea con Prettier
```

## Estructura

```
apps/        composition roots (api, web) — sin lógica de negocio
modules/     un dominio de negocio = una carpeta (ventas, inventario, contabilidad...)
core/        infraestructura técnica transversal (database, cache, messaging, storage, realtime, http, config)
ui-kit/      design system compartido del frontend
packages/    librerías puras sin dependencia de framework (contracts, tooling)
infra/       Docker, NGINX, Kubernetes, scripts de operación
docs/        arquitectura, base de datos, menús — fuente oficial
```

Detalle completo del árbol y de por qué `modules/` está separado de
`apps/` en
[docs/architecture/01-estructura-monorepo.md](docs/architecture/01-estructura-monorepo.md).

## Convenciones

Naming, idioma (dominio en español / técnica en inglés), Git
(trunk-based, Conventional Commits, CODEOWNERS por módulo) y testing
ya fijados en
[docs/architecture/07-convenciones-y-estandares.md](docs/architecture/07-convenciones-y-estandares.md)
— no se repiten acá.
