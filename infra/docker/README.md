# infra/docker/ — Runbook operativo

> Este documento es el "como lo corro hoy en mi maquina". El diseno del
> schema ya esta documentado en docs/database/ — no se repite aca. Este
> README cubre exclusivamente Docker/Postgres/Prisma como infraestructura
> operativa (auditoria 2026-08-11).

## 1. Que corre aca

| Servicio | Imagen                           | Puerto dev | Rol                                                                         |
| -------- | -------------------------------- | ---------- | --------------------------------------------------------------------------- |
| postgres | gorazus-postgres17-partman:local | 5432       | La base real de GORAZUS                                                     |
| api      | build de apps/api/Dockerfile     | 3000       | NestJS, consume Postgres via Prisma                                         |
| web      | build de apps/web/Dockerfile     | 5173       | Frontend (Vite, solo dev)                                                   |
| nginx    | nginx:1.27-alpine                | 80/443     | Unico punto de entrada                                                      |
| redis    | redis:7-alpine                   | 6379       | Cache/colas                                                                 |
| rabbitmq | rabbitmq:3.13-management-alpine  | 5672/15672 | Mensajeria                                                                  |
| minio    | minio/minio:latest               | 9000/9001  | Object storage                                                              |
| ollama   | ollama/ollama:latest             | 11434      | Opt-in (`--profile ollama-docker`), no arranca por defecto — ver seccion 10 |
| backup   | misma imagen que postgres        | -          | pg_dump diario, retencion 7 dias                                            |
| pgadmin  | dpage/pgadmin4:8                 | 5050       | GUI de base de datos elegida                                                |
| mailhog  | mailhog/mailhog:v1.0.1           | 1025/8025  | Captura de correo, solo dev                                                 |

Base: docker-compose.yml. Overlay dev: docker-compose.dev.yml. Prod: docker-compose.prod.yml.

## 2. PostgreSQL — datos reales

- Version real verificada: PostgreSQL 17.10 (Debian, postgres:17 + postgresql-17-partman).
- Base de datos: gorazus (unica).
- Schemas (23 = 21 de negocio + partman + public): accounting, assets, banks, bi, cash, configuration, core, crm, customers, hr, inventory, payroll, products, projects, purchases, reports, sales, security, services, suppliers, taxes.
- Extensiones instaladas: pg_partman, pg_trgm, pgcrypto, plpgsql.
- Roles: gorazus_superuser, gorazus_app (RLS activo), gorazus_migrator (bypass RLS), gorazus_backup (bypass RLS, solo lectura), gorazus_readonly, gorazus_audit_writer (sin login).
- Escala real verificada (auditoria 2026-08-11): 736 tablas, 5217 foreign keys, 3260 indices, 2108 politicas RLS, 1222 triggers, 132 funciones, 11 vistas, 4 vistas materializadas.

## 3. Prisma — como se relaciona con la base

El SQL crudo de docs/database/sql/ es la fuente de verdad. Prisma NUNCA gestiona el schema. No existe prisma migrate en este proyecto (no hay carpetas migrations/). Flujo real:

docs/database/sql/01__.sql .. 49__.sql -> pnpm db:migrate (psql, en orden) -> PostgreSQL real -> pnpm db:pull (prisma db pull) -> core/database/prisma/schema.prisma -> db:split -> core/database/prisma/schemas/(modulo)/schema.prisma (21 archivos) -> pnpm db:generate -> generated/ (clientes, gitignored).

Verificado en esta auditoria: los 49 archivos SQL estan aplicados (confirmado contra sales.pos_checkout_idempotency_keys, la tabla mas nueva) y pnpm db:generate corre limpio para los 21 schemas. No se corrio db:pull a proposito: schema.prisma y varios schemas/*/schema.prisma tenian cambios sin commitear de otra sesion de trabajo.

## 4. GUI de base de datos — pgAdmin

Ya estaba configurado en docker-compose.dev.yml (no se agrego una segunda herramienta).

- URL: http://localhost:5050 (solo host, no expuesto a internet).
- Login: dev@gorazus.dev / clave en .env -> PGADMIN_PASSWORD.
- Registrar el server con host postgres, puerto 5432 (nombre de servicio Docker, no localhost), usuario/clave de .env.

## 5. Donde vive fisicamente la base — hallazgo importante

postgres_data es un volumen Docker nombrado (no bind mount). Docker Desktop en este equipo usa backend WSL2; su disco virtual completo vive en:

C:\Users\(usuario)\AppData\Local\Docker\wsl\main

Esto esta en C:\, no en D:\. Por regla explicita del proyecto, esta auditoria NO movio el volumen — requiere backup previo verificado y ventana de mantenimiento. Ver seccion 7.

## 6. Conexion de desarrollo

| Contexto                     | DATABASE_URL / host                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| nx serve api en el host      | .env -> DATABASE_URL=postgresql://gorazus_app:...@localhost:5432/gorazus?schema=core |
| api dentro de Docker Compose | docker-compose.yml sobreescribe con postgres:5432                                    |
| Cliente SQL manual           | localhost:5432 (solo docker-compose.dev.yml), credenciales de .env                   |

## 7. Backup / Restore

Dos mecanismos:

1. Automatico (servicio backup): pg_dump al arrancar + diario, retencion 7 dias. Escribe en el volumen Docker postgres_backups — hoy tambien fisicamente en C:\ (mismo hallazgo de la seccion 5).
2. Manual, a demanda, directo a D:\ (agregado en esta auditoria): pnpm db:backup — corre pg_dump via docker compose exec y escribe el archivo en backups/ del repo (D:\), luego lo verifica con pg_restore --list sin restaurar nada.

Restaurar reemplaza objetos existentes (pg_restore --clean) — pnpm db:restore (archivo) nunca restaura solo, imprime el comando exacto para correrlo a mano.

## 8. Comandos

pnpm docker:up # levantar todo
pnpm docker:stop # detener sin borrar
pnpm docker:down # bajar contenedores (conserva volumenes, nunca -v)
pnpm docker:status # ver estado
pnpm docker:logs # logs en vivo
pnpm db:gui # URL/credenciales de pgAdmin
pnpm db:migrate # aplica 01..49 SQL (falla con "already exists" si ya estan aplicadas)
pnpm db:generate # regenera clientes Prisma, no toca la base
pnpm db:backup # backup manual verificado, directo a D:\backups\
pnpm db:restore gorazus_TIMESTAMP.dump # imprime el comando de restore, no lo ejecuta

## 9. Ollama — IA local (FASE 3)

Se decidio reutilizar el **Ollama nativo de Windows** en vez de correr un segundo Ollama dentro de Docker:

- Ya estaba instalado y corriendo (`C:\Users\<usuario>\AppData\Local\Programs\Ollama\ollama.exe`, version 0.32.9) con 3 modelos reales descargados (~34GB: gemma4:12b, qwen3.6:latest, llama2:latest).
- Sus modelos ya viven en D: (`OLLAMA_MODELS` apunta a `D:\...\ollama\models`, variable de entorno de usuario ya configurada antes de esta fase) — nada que migrar.
- Ningun modulo de negocio consume `OllamaService` todavia (`core/ollama`) y `api` no tiene `depends_on: ollama` — es infraestructura preparada, no un requisito de arranque.

Por eso el servicio Docker `ollama` **no arranca por defecto** (`profiles: ['ollama-docker']` en `docker-compose.yml`) — evita competir por el puerto 11434 y evita correr una segunda instancia innecesaria. Sigue definido por si algun dia hace falta un Ollama 100% en Docker (ej. una maquina sin Ollama nativo, o CI):

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml --profile ollama-docker up -d ollama
```

`api` llega al Ollama nativo via `host.docker.internal:11434` (`OLLAMA_BASE_URL` en `docker-compose.yml`, distinto del `http://localhost:11434` de `.env` que es para cuando `nx serve api` corre directo en el host, no en Docker) — verificado real con el cliente `ollama` de Node desde dentro del contenedor `api`, lista los 3 modelos correctamente.

## 10. Que NO hace este runbook

- No reemplaza docs/database/08-estrategia-respaldo.md (PITR/WAL, Fase 2).
- No corre prisma migrate — este proyecto no lo usa (seccion 3).
- No gestiona el Ollama nativo (instalacion, modelos, actualizaciones) — eso es responsabilidad del usuario, fuera del alcance de Docker/GORAZUS.
- No recrea los roles de aplicacion de PostgreSQL (`gorazus_app`, `gorazus_backup`, etc.) si faltan — ver seccion 11, "Known Issues".

## 11. GORAZUS Infrastructure Baseline

> Fotografia tecnica congelada al cierre de la Fase 5 (2026-08-12). Sirve como
> punto de referencia para detectar drift futuro — si algo de esto cambia sin
> una razon documentada, es una regresion, no una mejora silenciosa.

**Versiones**

| Componente     | Version                                                             |
| -------------- | ------------------------------------------------------------------- |
| Node.js        | v24.18.0                                                            |
| pnpm           | 9.15.0 (`packageManager` en package.json)                           |
| Docker         | 29.7.2                                                              |
| Docker Compose | v5.3.1                                                              |
| PostgreSQL     | 17.10 (Debian, imagen `gorazus-postgres17-partman:local`)           |
| Prisma         | ^5.22.0                                                             |
| pg_partman     | 5.5.0 (ver "Known Issues" — el baseline original documentaba 5.4.3) |
| pg_trgm        | 1.6                                                                 |
| pgcrypto       | 1.3                                                                 |

**Base de datos `gorazus` — estructura**

| Metrica                   | Valor                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| Schemas                   | 23 (21 de negocio + `partman` + `public`)                             |
| Tables                    | 736                                                                   |
| Foreign keys              | 5217                                                                  |
| Indexes                   | 3260                                                                  |
| RLS policies              | 2108                                                                  |
| Triggers                  | 1222                                                                  |
| Functions                 | 134 (ver "Known Issues")                                              |
| Views                     | 11                                                                    |
| Materialized views        | 4 (`ispopulated=false` las 4 — pendiente operacional, no es un error) |
| Invalid indexes           | 0                                                                     |
| Unvalidated constraints   | 0                                                                     |
| Migraciones SQL aplicadas | 49/49 (`docs/database/sql/01_*.sql` .. `49_*.sql`)                    |

**Datos de negocio (conteos de referencia)**

```
core.companies 40 | core.branches 25 | core.users 41 | customers.customers 7
products.products 21 | inventory.warehouses 2 | configuration.payment_forms 5
sales.invoices 49 | sales.quotes 3 | sales.sales_orders 5 | cash.cash_registers 3
```

**Storage**

| Dato                                         | Ubicacion                                                       |
| -------------------------------------------- | --------------------------------------------------------------- |
| Codigo fuente                                | `D:\15_Codigo_Fuente\GORAZUS`                                   |
| PostgreSQL (datos reales)                    | `D:\15_Codigo_Fuente\GORAZUS\docker-data\postgres` (bind mount) |
| Backups                                      | `D:\15_Codigo_Fuente\GORAZUS\backups\`                          |
| Modelos Ollama (nativo, fuera de Docker)     | `D:\15_Codigo_Fuente\disco_c\ollama\models`                     |
| Volumen Docker `postgres_data` (legacy, C:\) | preservado sin eliminar como rollback — ver mas abajo           |

**Servicios**

| Servicio | Health                                            | Notas                                                                                                       |
| -------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| postgres | healthy                                           |                                                                                                             |
| redis    | healthy                                           |                                                                                                             |
| rabbitmq | healthy                                           |                                                                                                             |
| minio    | healthy                                           |                                                                                                             |
| pgadmin  | up (sin healthcheck)                              |                                                                                                             |
| mailhog  | up (sin healthcheck)                              |                                                                                                             |
| web      | up (sin healthcheck)                              | dependencias de terceros rotas por el mismo patron que tenia `api` antes de arreglarse — ver Known Issues   |
| backup   | up (contenedor), proceso interno falla            | rol `gorazus_backup` inexistente — ver Known Issues                                                         |
| api      | unhealthy                                         | build de TS 100% limpio, crashea por mismatch `serve`/`build` en `apps/api/project.json` — ver Known Issues |
| ollama   | no arranca por diseno (`profiles: ollama-docker`) | se usa el Ollama nativo de Windows en su lugar                                                              |

**Known Issues (heredados, no introducidos por esta fase)**

1. **Roles de aplicacion faltantes** — `gorazus_app`, `gorazus_migrator`, `gorazus_readonly`, `gorazus_backup`, `gorazus_audit_writer` no existen en el cluster migrado a D:\ (solo `gorazus_superuser`). Causa: `pg_dump`/`pg_restore` no incluye roles de cluster. Fix conocido, no aplicado (requiere tocar secretos — autorizacion del usuario): re-aplicar `docs/database/sql/30_backup_restore.sql` + `34_rls_hardening.sql`, luego `ALTER ROLE ... WITH PASSWORD` con los valores reales de `.env`.
2. **`api` no queda `healthy`** — `apps/api/project.json`'s target `serve` (`@nx/js:node`, `buildTarget: api:build`) espera `dist/apps/api/main.js`, pero `api:build` es intencionalmente `tsc --noEmit`. No es un problema de dependencias (esas ya se resuelven limpio).
3. **`web` tiene node_modules por-paquete tapados por bind mount** — mismo patron que tenia `api` antes del fix, nunca aplicado a `web` (fuera de alcance declarado).
4. **`pg_partman` 5.5.0 vs 5.4.3** — la imagen local se reconstruyo sin pinnear version de apt entre la creacion del baseline original y la migracion a D:\. Explica tambien el `functions=134` vs `132` (2 funciones nuevas del minor de partman).
5. *_`postgres_data` (volumen Docker legacy) sigue en C:\*_ — intencional, es el rollback de la migracion de la Fase 1; no se elimina sin autorizacion explicita.
