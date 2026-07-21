# GORAZUS ERP — Estructura del proyecto

> Generado a partir del estado real del repositorio. Si algo acá no coincide con el código, el código manda — actualizar este documento, no al revés.

## 1. Árbol de carpetas raíz

```
GORAZUS/
├── apps/                    # Composition roots — ver apps/README.md
│   ├── api/                   # Backend NestJS
│   ├── api-e2e/                 # Tests e2e del backend (Jest, contra stack Dockerizado)
│   ├── web/                   # Frontend React 19 + Vite
│   └── web-e2e/                 # Tests e2e del frontend (Playwright)
│
├── core/                    # Infraestructura técnica transversal — ver core/README.md
│   ├── cache/                  # Redis
│   ├── config/                  # ConfigService + Environment (Zod)
│   ├── database/                 # 21 clientes Prisma (uno por schema de Postgres)
│   ├── health/                  # Health checks (liveness/readiness)
│   ├── http/                   # Exception filter, interceptors, middlewares, pipes, rate limit
│   ├── kernel/                  # bootstrap() — único punto de arranque del backend
│   ├── logging/                 # LoggerService + RequestContext (correlación)
│   ├── messaging/                # EventBusService (RabbitMQ)
│   ├── observability/             # Tracing (OpenTelemetry) + Metrics (Prometheus)
│   ├── realtime/                 # WebSocket Gateway (escafoldado, sin construir)
│   └── scheduler/                # Cron jobs
│
├── modules/                  # 27 dominios de negocio — ver modules/README.md (todos escafoldados, sin implementar)
│   └── <dominio>/backend, frontend, shared, index.ts, README.md
│
├── packages/                 # Librerías puras sin framework — ver packages/README.md
│   ├── contracts/               # Shared Kernel (tipos, Zod schemas cruzados)
│   └── tooling/utils/            # Common Utilities (UUID, Clock, Hash, Encryption)
│
├── ui-kit/                   # Design system compartido del frontend — ver ui-kit/README.md
│   ├── components/, theme/, hooks/
│
├── infra/                    # Infraestructura de despliegue — ver infra/README.md
│   ├── docker/, nginx/, kubernetes/, redis/, postgres/, rabbitmq/, minio/, mailhog/, scripts/
│
├── docs/                     # Documentación oficial — fuente de verdad de arquitectura/datos
│   ├── architecture/            # Arquitectura de software (numerado, con README índice)
│   ├── database/                 # Modelo de datos, SQL fuente de verdad (numerado, con README índice)
│   ├── menus/                   # Estructura de navegación por módulo
│   └── adr/                    # Architecture Decision Records
│
├── .github/                  # CI/CD (4 workflows) + CODEOWNERS
│
├── package.json, pnpm-workspace.yaml, nx.json, tsconfig.base.json, eslint.config.mjs, .prettierrc
└── README.md, PROJECT_STRUCTURE.md (este archivo), .env.example
```

## 2. Convenciones de nomenclatura

| Elemento                                     | Convención                  | Ejemplo                                     |
| -------------------------------------------- | --------------------------- | ------------------------------------------- |
| Carpetas de módulo de negocio                | kebab-case, **español**     | `cuentas-por-cobrar/`                       |
| Carpetas técnicas (`core`, `ui-kit`, `apps`) | kebab-case, **inglés**      | `core/database`                             |
| Paquetes pnpm de `core/*`                    | `@gorazus/core-<nombre>`    | `@gorazus/core-logging`                     |
| Archivos                                     | kebab-case + sufijo de tipo | `crear-venta.usecase.ts`, `venta.entity.ts` |
| Clases / Componentes React                   | PascalCase                  | `CrearVentaUseCase`, `TablaVentas`          |
| Variables, funciones, métodos                | camelCase                   | `calcularTotalVenta()`                      |
| Constantes                                   | UPPER_SNAKE_CASE            | `MAX_LINEAS_POR_VENTA`                      |

Detalle completo: [docs/architecture/07-convenciones-y-estandares.md](docs/architecture/07-convenciones-y-estandares.md).

## 3. Idioma

- **Dominio de negocio** (módulos, entidades, campos, eventos, mensajes de error de usuario): **español**.
- **Términos de arquitectura/infraestructura** (`controller`, `service`, `repository`, `guard`): **inglés**.
- Nunca mezclados dentro del mismo identificador.

## 4. Responsabilidad por carpeta (resumen — ver el README.md de cada una para el detalle)

| Carpeta     | Responsabilidad única                                              |
| ----------- | ------------------------------------------------------------------ |
| `apps/`     | Arrancar/servir. Cero lógica de negocio.                           |
| `core/`     | Infraestructura técnica transversal. Cero conocimiento de negocio. |
| `modules/`  | Toda la lógica de negocio.                                         |
| `packages/` | Código puro sin framework, sin estado.                             |
| `ui-kit/`   | Componentes de UI genéricos, sin negocio.                          |
| `infra/`    | Cómo se despliega, no qué hace.                                    |
| `docs/`     | Fuente de verdad de arquitectura y modelo de datos.                |

## 5. Reglas que no se repiten acá

El flujo de dependencias permitido/prohibido entre estas carpetas está en [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md) — no se duplica en este documento.
