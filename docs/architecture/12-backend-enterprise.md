# 12 — Backend Enterprise (vista consolidada)

> Versión 1.0 — 2026-07-13. Igual criterio que
> [00-arquitectura-general.md](./00-arquitectura-general.md): este
> documento es un **punto de entrada** al backend, no una fuente de
> verdad paralela a [01](./01-estructura-monorepo.md),
> [02](./02-arquitectura-modulos-backend.md),
> [05](./05-flujo-de-datos.md),
> [06](./06-comunicacion-entre-modulos.md) y
> [08](./08-infraestructura-y-despliegue.md) — consolida las siete
> dimensiones pedidas (árbol de carpetas, organización,
> responsabilidades, flujo interno, dependencias, eventos,
> configuración) con foco exclusivo en el backend, y agrega únicamente
> lo que no existía todavía: el árbol interno de `apps/api/` y `core/`
> expandido a nivel de archivo, un catálogo representativo de eventos
> de dominio por módulo, y la arquitectura de configuración completa.

## 1. Árbol de carpetas

### 1.1 Vista repo — ya fijada, no se repite

El árbol raíz completo (`apps/`, `modules/`, `core/`, `ui-kit/`,
`packages/`, `infra/`) y la anatomía de un módulo
(`modules/<x>/backend/`) están en
[01-estructura-monorepo.md §2 y §4](./01-estructura-monorepo.md#2-árbol-de-carpetas-raíz).
Acá solo se ancla lo relevante al backend: `apps/api` (composition
root), `modules/*/backend` (lógica de negocio), `core/*`
(infraestructura técnica transversal), `packages/contracts` (Shared
Kernel).

### 1.2 `apps/api/` expandido a nivel de archivo (nuevo)

```
apps/api/
├── src/
│   ├── main.ts                    # bootstrap: NestFactory.create(AppModule), pipes/filters globales, arranque HTTP + WS
│   ├── app/
│   │   ├── app.module.ts          # composition root: importa CoreModules + todos los *Module de negocio
│   │   └── health/
│   │       └── health.controller.ts   # liveness/readiness para orquestador (Docker healthcheck)
│   └── bootstrap/
│       ├── swagger.setup.ts       # documentación OpenAPI generada desde los DTO/Zod de cada módulo
│       └── graceful-shutdown.ts   # cierre ordenado: deja de aceptar requests, drena conexiones activas, cierra Postgres/Redis/RabbitMQ
├── test/                          # config de Jest e2e (ver apps/api-e2e/ para los specs)
├── Dockerfile
└── project.json                   # config de build/serve/test de Nx para este proyecto
```

`main.ts` y `app.module.ts` son deliberadamente delgados — su única
responsabilidad es _ensamblar_, nunca decidir. Ver
[01 §3](./01-estructura-monorepo.md#3-por-qué-modules-está-separado-de-apps).

### 1.3 `core/` expandido a nivel de archivo (nuevo)

```
core/
├── database/
│   ├── prisma-client.provider.ts   # cliente Prisma generado por introspección (prisma db pull) — ver 02 §4
│   ├── base.repository.ts          # clase base: inyecta filtro tenant_id/company_id/branch_id (ver 09 §3)
│   └── transaction-manager.ts      # wrapper de prisma.$transaction, usado únicamente desde services/
├── cache/
│   ├── redis.provider.ts
│   └── cache.service.ts            # get/set/invalidate con namespace de claves (cache:*, ver 08 §3)
├── messaging/
│   ├── rabbitmq.provider.ts
│   ├── domain-event.base.ts        # clase base de todo evento de dominio (empresaId, ocurridoEn — ver §6)
│   └── event-bus.service.ts        # publish() usado por services/; los consumers viven en cada módulo (events/)
├── storage/
│   └── minio.provider.ts           # URLs firmadas de corta duración — ver 08 §5
├── realtime/
│   ├── websocket.gateway.ts        # gateway base, rooms por empresa
│   └── redis-adapter.provider.ts   # fan-out entre réplicas de apps/api — ver 05 §2
├── http/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # autenticación — ver 09 §1
│   │   └── permissions.guard.ts    # autorización — ver 09 §2
│   ├── interceptors/
│   │   └── tenant.interceptor.ts   # resuelve TenantContext antes de cualquier lógica de negocio — ver 05 §1
│   ├── filters/
│   │   └── exception.filter.ts     # excepción de dominio → HTTP consistente — ver 05 §3, 07 §4
│   └── pipes/
│       └── zod-validation.pipe.ts  # valida body contra el schema Zod del módulo
└── config/
    ├── env.schema.ts               # schema Zod de TODAS las variables de entorno requeridas
    ├── config.module.ts            # NestJS ConfigModule, global, carga env.schema.ts al boot
    └── namespaces/                 # un archivo por dominio de configuración — ver §7
        ├── database.config.ts
        ├── redis.config.ts
        ├── rabbitmq.config.ts
        ├── storage.config.ts
        └── auth.config.ts
```

Cada carpeta de `core/` es la contraparte técnica de exactamente un
servicio de infraestructura de
[08-infraestructura-y-despliegue.md](./08-infraestructura-y-despliegue.md)
(Postgres, Redis, RabbitMQ, MinIO) más `http/` (transversal a toda
request) y `config/` (transversal al proceso completo).

## 2. Organización

Dos decisiones ya fijadas gobiernan toda la organización del backend,
sin excepción — no se repiten en detalle, solo se enuncian como marco:

1. **`apps/` delgadas, `modules/` como núcleo**
   ([01 §3](./01-estructura-monorepo.md#3-por-qué-modules-está-separado-de-apps)):
   `apps/api` ensambla, nunca decide.
2. **Clean Architecture / Hexagonal dentro de cada módulo**
   ([02 §1](./02-arquitectura-modulos-backend.md#1-las-capas-y-la-regla-de-dependencia)):
   dominio → aplicación → infraestructura/interfaz, dependencias
   siempre hacia adentro.

La organización del backend es, en el fondo, la superposición de estas
dos reglas: **horizontalmente** (entre módulos) manda la fachada
pública + eventos (§5-6); **verticalmente** (dentro de un módulo)
manda la regla de dependencia de Clean Architecture.

## 3. Responsabilidades

| Carpeta/capa                        | Responsabilidad                                                                   | Lo que NUNCA hace                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/api`                          | Ensamblar módulos en un proceso ejecutable; bootstrap, Swagger, graceful shutdown | Contener una sola regla de negocio                                                             |
| `modules/<x>/backend/entities/`     | Invariantes de dominio puras (`venta.confirmar()`)                                | Conocer Nest, Prisma, HTTP                                                                     |
| `modules/<x>/backend/repositories/` | Puerto (interfaz) + adaptador Prisma; filtra por tenant vía `base.repository.ts`  | Exponer detalles de Prisma en su interfaz pública                                              |
| `modules/<x>/backend/services/`     | Casos de uso, abre/cierra transacciones, publica eventos post-commit              | Lógica de presentación HTTP                                                                    |
| `modules/<x>/backend/controllers/`  | Traducir HTTP → caso de uso → HTTP; aplicar guards/pipes                          | Un solo `if` de regla de negocio                                                               |
| `modules/<x>/backend/events/`       | Definir contratos de evento publicados; handlers de eventos consumidos            | Publicar antes de confirmar la transacción local                                               |
| `core/database`                     | Cliente Prisma, filtro base de tenant, manejo de transacciones                    | Conocer una sola entidad de negocio                                                            |
| `core/messaging`                    | Cliente RabbitMQ, bus de publicación, clase base de evento                        | Contener lógica de reacción a un evento específico (eso vive en `events/` de cada módulo)      |
| `core/http`                         | Guards, interceptors, filters, pipes globales                                     | Reglas de autorización específicas de un módulo (solo ejecuta las que `seguridad` ya resolvió) |
| `core/realtime`                     | Gateway WebSocket + adaptador Redis                                               | Decidir qué evento de negocio se emite (eso lo decide cada módulo al publicar)                 |
| `core/config`                       | Validar y tipar variables de entorno al boot                                      | Contener secretos en sí — solo su _forma_ validada                                             |
| `packages/contracts`                | Shared Kernel mínimo (`Money`, `TenantId`, `UserContext`)                         | Cualquier tipo de negocio de un módulo específico                                              |

## 4. Flujo interno

Detalle completo con diagramas de secuencia (request HTTP, evento
WebSocket, manejo de errores, escrituras cross-módulo sin
transacciones distribuidas):
[05-flujo-de-datos.md](./05-flujo-de-datos.md). Se consolida acá el
**mapeo directo carpeta → paso del flujo**, que conecta el árbol de
§1 con la secuencia ya documentada en 05:

| Paso del flujo (ver [05 §1](./05-flujo-de-datos.md#1-ciclo-de-vida-de-una-request-http-estándar)) | Carpeta responsable                                                          |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Proxy/enrutamiento                                                                                | `infra/nginx` (fuera del backend Nest en sí)                                 |
| Autenticación                                                                                     | `core/http/guards/jwt-auth.guard.ts`                                         |
| Resolución de empresa activa (`TenantContext`)                                                    | `core/http/interceptors/tenant.interceptor.ts`                               |
| Validación de forma del body                                                                      | `core/http/pipes/zod-validation.pipe.ts` + `modules/<x>/backend/validators/` |
| Traducción HTTP → caso de uso                                                                     | `modules/<x>/backend/controllers/`                                           |
| Ejecución de la regla de negocio                                                                  | `modules/<x>/backend/services/` + `entities/`                                |
| Persistencia                                                                                      | `modules/<x>/backend/repositories/` → `core/database`                        |
| Publicación de evento (post-commit)                                                               | `modules/<x>/backend/events/` → `core/messaging`                             |
| Fan-out en tiempo real                                                                            | `core/realtime`                                                              |
| Mapeo de error de dominio → HTTP                                                                  | `core/http/filters/exception.filter.ts`                                      |

## 5. Dependencias

Regla de import y su enforcement (Nx module boundaries) ya completos
en
[01 §5](./01-estructura-monorepo.md#5-reglas-de-import-enforcement).
Resumen aplicado al backend:

- `modules/<x>/backend` puede importar `core/*`, `packages/contracts`
  y `modules/<y>/index.ts` (**solo** si `<y>` es una dependencia
  declarada) — nunca `modules/<y>/backend/*` directo.
- `core/*` puede importar `packages/*` — nunca `modules/*` (core no
  depende de negocio, jamás al revés).
- `apps/api` puede importar `modules/*/backend` y `core/*` — nada de
  `frontend/`.
- Un ciclo de dependencias entre módulos es error de build, no
  advertencia ([06 §1](./06-comunicacion-entre-modulos.md#1-dos-formas-de-comunicación-y-solo-dos)).

Estas reglas son las mismas para las dos formas válidas de
comunicación entre módulos (síncrona vía fachada, asíncrona vía
eventos) — ver [06](./06-comunicacion-entre-modulos.md) para el
detalle completo, no repetido acá.

## 6. Eventos

### 6.1 Reglas ya fijadas (no se repiten)

Mecanismo (RabbitMQ, topic exchange `gorazus.eventos`, routing key
`<modulo>.<entidad>.<evento>`, cola propia por consumidor, dead-letter
queue): [08 §4](./08-infraestructura-y-despliegue.md#4-rabbitmq-convención-de-exchanges-y-colas).
Patrón síncrono vs. asíncrono y ejemplo end-to-end:
[06](./06-comunicacion-entre-modulos.md). Naming (sufijo `Event`,
verbo en participio pasado): [07 §1](./07-convenciones-y-estandares.md#1-naming).

### 6.2 Estructura de un evento (convención, no repetida como código)

Todo evento de dominio, sin excepción, incluye: identificadores
mínimos (nunca el objeto de dominio completo), `empresaId` (ningún
consumidor asume una única empresa — ver
[09 §4](./09-seguridad-y-multiempresa.md#4-qué-pasa-en-los-módulos-con-esto)),
y `ocurridoEn`. Se publica **después** de confirmada la transacción
local, nunca antes.

### 6.3 Catálogo representativo de eventos por módulo (nuevo)

No existía hasta ahora un inventario de eventos — solo ejemplos
puntuales dispersos en 05/06. Esta tabla es **representativa de los
flujos ya decididos** (deriva directamente del mapa de dependencias de
[04-catalogo-modulos-negocio.md](./04-catalogo-modulos-negocio.md) y
del ejemplo end-to-end de
[06 §5](./06-comunicacion-entre-modulos.md#5-ejemplo-end-to-end-confirmar-una-venta)),
no exhaustiva — cada módulo agrega los suyos al implementarse, según
[11-gobernanza-y-adrs.md §1](./11-gobernanza-y-adrs.md#1-cómo-se-agrega-un-módulo-nuevo)
(un evento publicado es un contrato público, se documenta en el
`README.md` del módulo desde el primer commit).

| Módulo publicador | Evento                     | Consumido por                                                                                                                                                                |
| ----------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ventas`          | `VentaConfirmada`          | `inventario` (descuenta stock), `contabilidad` (asiento), `caja` (si es de contado)                                                                                          |
| `ventas`          | `FacturaAnulada`           | `contabilidad` (asiento de reversión)                                                                                                                                        |
| `inventario`      | `StockActualizado`         | `core/realtime` (fan-out UI en vivo)                                                                                                                                         |
| `inventario`      | `StockInsuficiente`        | `ventas` (compensación — revierte a "pendiente de stock")                                                                                                                    |
| `compras`         | `FacturaCompraRegistrada`  | `contabilidad` (asiento), `bancos`/`caja` (pago)                                                                                                                             |
| `compras`         | `RecepcionConfirmada`      | `inventario` (ingresa stock)                                                                                                                                                 |
| `caja`            | `MovimientoCajaRegistrado` | `contabilidad`                                                                                                                                                               |
| `bancos`          | `ConciliacionCompletada`   | `contabilidad`, `tesoreria` (proyección, solo lectura)                                                                                                                       |
| `nomina`          | `LiquidacionCerrada`       | `contabilidad` (asiento de sueldos), `bancos` (lote de pago)                                                                                                                 |
| `clientes`        | `ClienteActualizado`       | `ventas`, `crm`, `contabilidad` (cuenta corriente) — patrón "módulo dueño", ver [06 §4](./06-comunicacion-entre-modulos.md#4-patrón-módulo-dueño-para-entidades-compartidas) |
| `crm`             | `OportunidadGanada`        | `ventas` (vía comando síncrono, no evento — ver nota de `crm` en [04](./04-catalogo-modulos-negocio.md))                                                                     |
| `activos-fijos`   | `DepreciacionCalculada`    | `contabilidad`                                                                                                                                                               |
| `seguridad`       | `RolModificado`            | invalidación de cache de permisos en `core/http` (todos los módulos, técnico no de negocio)                                                                                  |

## 7. Configuración

No existía antes como arquitectura consolidada — solo la mención
puntual de "Zod al boot" en
[08 §6](./08-infraestructura-y-despliegue.md#6-entornos). Se completa
acá la cadena completa:

1. **Origen**: variables de entorno (`.env` en `local`, secretos
   inyectados por el orquestador en `staging`/`production` — ver gap
   de gestor de secretos centralizado en
   [00-arquitectura-general §10](./00-arquitectura-general.md#10-gaps-identificados-candidatos-a-adr-no-decisiones-tomadas)).
2. **Validación**: `core/config/env.schema.ts` (Zod) valida el proceso
   completo al boot — variable faltante o inválida = la aplicación no
   arranca (fail fast), nunca un error críptico en producción a mitad
   de request.
3. **Tipado y namespaces**: `core/config/namespaces/*.config.ts`
   agrupa la configuración validada por dominio técnico (`database`,
   `redis`, `rabbitmq`, `storage`, `auth`) — ningún módulo de negocio
   lee `process.env` directamente, siempre inyecta el `ConfigService`
   tipado de `core/config`.
4. **Consumo**: `core/config.module.ts` es `@Global()` — se inyecta
   una vez en `app.module.ts` y está disponible en cualquier
   provider sin reimportarlo módulo por módulo.
5. **Alcance por entorno**: la forma de la configuración (el schema)
   es idéntica en `local`/`staging`/`production` — solo cambian los
   valores, nunca la estructura, para no tener lógica condicional por
   entorno dispersa en el código (ver tabla de entornos en
   [08 §6](./08-infraestructura-y-despliegue.md#6-entornos)).

## 8. Trazabilidad

| Punto solicitado  | Documento(s) de detalle normativo                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Árbol de carpetas | [01](./01-estructura-monorepo.md) (repo completo) + §1 de este documento (nuevo: `apps/api/` y `core/` a nivel de archivo)                                                                                                                        |
| Organización      | [01](./01-estructura-monorepo.md), [02](./02-arquitectura-modulos-backend.md)                                                                                                                                                                     |
| Responsabilidades | [02](./02-arquitectura-modulos-backend.md) + §3 de este documento (tabla consolidada, incluye `core/*`)                                                                                                                                           |
| Flujo interno     | [05](./05-flujo-de-datos.md) + §4 de este documento (mapeo carpeta→paso, nuevo)                                                                                                                                                                   |
| Dependencias      | [01 §5](./01-estructura-monorepo.md#5-reglas-de-import-enforcement), [06](./06-comunicacion-entre-modulos.md)                                                                                                                                     |
| Eventos           | [06](./06-comunicacion-entre-modulos.md), [08 §4](./08-infraestructura-y-despliegue.md#4-rabbitmq-convención-de-exchanges-y-colas), [07 §1](./07-convenciones-y-estandares.md#1-naming) + §6.3 de este documento (catálogo representativo, nuevo) |
| Configuración     | [08 §6](./08-infraestructura-y-despliegue.md#6-entornos) + §7 de este documento (cadena completa, nuevo)                                                                                                                                          |
