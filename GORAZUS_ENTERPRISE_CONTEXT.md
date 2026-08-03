# GORAZUS ERP ENTERPRISE — CONTEXTO MAESTRO DEL PROYECTO

|                             |                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre del proyecto**     | GORAZUS ERP Enterprise                                                                                                                                  |
| **Versión**                 | Ver [§16 Versionado](#16-versionado) — existen 3 fuentes de versión desincronizadas entre sí, declarado explícitamente, no se elige una arbitrariamente |
| **Fecha de este documento** | 2026-08-03                                                                                                                                              |
| **Repositorio**             | `https://github.com/Daniel-Cali/GORAZUS.git` (remoto `origin`)                                                                                          |
| **Rama activa**             | `feature/database-finalization` — **49 commits por delante de `origin/feature/database-finalization`, sin pushear**                                     |
| **Autor / propietario**     | Daniel Calí (propietario del repositorio en GitHub)                                                                                                     |
| **Estado actual**           | Pre-1.0, desarrollo activo. 11 de 27 módulos de negocio con backend real; 5 de esos 11 con frontend real                                                |

> **Nota de honestidad metodológica**: este documento se generó leyendo el proyecto real (código, esquema de base de datos, documentación, historial de Git) el 2026-08-03, no de memoria ni por inferencia. Toda cifra trae su fuente citada. Donde el proyecto tiene información contradictoria entre documentos (versión, % de completitud), se declara la contradicción explícitamente en vez de elegir un número arbitrario.

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Historia del Proyecto](#2-historia-del-proyecto)
3. [Estado General](#3-estado-general)
4. [Base de Datos](#4-base-de-datos)
5. [Backend](#5-backend)
6. [Frontend](#6-frontend)
7. [API](#7-api)
8. [Seguridad](#8-seguridad)
9. [Módulos Implementados](#9-módulos-implementados)
10. [Módulos Pendientes](#10-módulos-pendientes)
11. [Documentación](#11-documentación)
12. [Testing](#12-testing)
13. [Docker](#13-docker)
14. [GitHub](#14-github)
15. [Changelog](#15-changelog)
16. [Versionado](#16-versionado)
17. [Roadmap](#17-roadmap)
18. [Deuda Técnica](#18-deuda-técnica)
19. [Decisiones de Arquitectura](#19-decisiones-de-arquitectura)
20. [Continuidad](#20-continuidad)
21. [Instrucciones para Otra IA](#21-instrucciones-para-otra-ia)
22. [Estado Final](#22-estado-final)

---

## 1. Resumen Ejecutivo

**Qué es GORAZUS**: un ERP multiempresa (multi-tenant) para PyMEs/comercios, con dominios de negocio típicos de un ERP completo (Inventario, Ventas, Compras, Contabilidad, CRM, RRHH/Nómina, Activos Fijos, Proyectos, Tesorería, BI, etc.) más un módulo de Punto de Venta (POS) real. El nombre en el `package.json` técnico del monorepo, la estructura de 27 dominios de negocio y el diseño de base de datos (504 modelos Prisma / 501 tablas lógicas declaradas / 730 físicas con particiones) apuntan a un ERP de alcance enterprise completo, construido desde cero.

**Objetivos** (inferidos del propio código y documentación, no de una declaración de misión formal — no existe un documento tipo "vision.md"): cobertura funcional completa de un ERP (ventas, compras, inventario, contabilidad, POS, CRM, RRHH), arquitectura multi-tenant real (aislamiento por `tenant_id`/`company_id`/`branch_id` + RLS de PostgreSQL), auditoría universal (todas las tablas con `created_by`/`updated_by`/`deleted_by`/soft-delete/`row_version`), y una disciplina de documentación de arquitectura inusualmente extensa para un proyecto de este tamaño (32 documentos de arquitectura, 41 archivos SQL versionados, 21 diccionarios de datos, más de una decena de ADRs formales).

**Estado actual**: **11 de 27 módulos de negocio (41%) tienen backend real** (código, no solo esqueleto de carpetas): `auth`, `seguridad`, `configuracion`, `inventario`, `productos`, `clientes`, `caja`, `ventas`, `pos`, `crm`, `contabilidad`. Los 16 restantes son carpetas vacías con la estructura de subdirectorios ya prevista (`controllers/`, `services/`, `repositories/`, etc.) pero sin un solo archivo. De esos 11 módulos con backend, **solo 5 tienen frontend real** (`auth`, `dashboard`, `seguridad` parcial, `pos`, `clientes`); el resto del sitemap (25 entradas en el registro de módulos del frontend) muestra una página "Próximamente" honesta en vez de datos simulados.

> Nota: `PROJECT_STATUS.md` (documento de estado, última actualización 2026-07-26) declara "10 de 27 módulos (37%)" y omite `contabilidad` de esa lista — pero el código real en disco (`modules/contabilidad/backend/`, 46 archivos `.ts`, motor contable completo) confirma que sí es el 11º módulo con backend real, coincidiendo con `ROADMAP.md`. Es una inconsistencia documental real, no un error de este reporte — señalada explícitamente para no ocultarla.

**Arquitectura utilizada**: Clean Architecture + Domain-Driven Design (DDD) por módulo, monorepo Nx con pnpm workspaces, patrón Repository (puerto abstracto + adaptador Prisma) en todos los módulos, aislamiento multi-tenant vía Row-Level Security de PostgreSQL, particionamiento de tablas de alto volumen (27 tablas particionadas por rango de fecha), sin CQRS (decisión explícita), sin bus de eventos de dominio conectado todavía (los eventos están diseñados en varios módulos pero 0 se publican realmente — estado declarado honestamente en el propio código).

**Tecnologías** (stack real, verificado en `package.json` de cada proyecto, no solo en el raíz):

| Capa            | Tecnología                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend         | NestJS 10.4.22, TypeScript 5.7                                                                                                                                 |
| ORM / BD        | Prisma 5.22 (cliente generado, **no** `prisma migrate` — SQL crudo versionado es la fuente de verdad) + PostgreSQL 17 con `pg_partman`                         |
| Monorepo        | Nx 20.3, pnpm 9.15, workspaces (`apps/*`, `core/*`, `modules/*/{backend,frontend,shared}`, `packages/*`, `ui-kit`)                                             |
| Frontend        | React 19 + Vite 6, `react-router-dom` v7, `@tanstack/react-query` v5, `zustand` v5, `react-hook-form` + `zod`                                                  |
| UI Kit          | Paquete propio `@gorazus/ui-kit` sobre Radix UI + `class-variance-authority` + Tailwind CSS (patrón shadcn/ui, sin la librería shadcn instalada)               |
| Autenticación   | JWT (access 15 min + refresh hasheado), 2FA TOTP real (RFC 6238), rate limiting (`@nestjs/throttler`), lockout de cuenta, revocación de sesión con caché Redis |
| Testing         | Jest 29 (unitarios + e2e por módulo contra Postgres real), Playwright 1.49 (e2e de frontend, 2 specs)                                                          |
| Infraestructura | Docker Compose (Postgres+partman, Redis, RabbitMQ, MinIO, Ollama, Nginx), Prometheus/Grafana/Loki para observabilidad                                          |
| CI/CD           | GitHub Actions: PR Validation, Security Scan (semanal), Deploy Staging (automático a `gorazus2`), Deploy Production (manual), Nightly Restore Test (mensual)   |

---

## 2. Historia del Proyecto

No existe un documento único de "historia" narrativa — se reconstruye a partir de `CHANGELOG.md` (140 944 bytes, formato Keep a Changelog, arranca en versiones tempranas y sigue hasta `v0.24.0`), los tags de Git y el propio `docs/00-roadmap-fases.md` (32 fases de documentación de arquitectura).

**Cómo comenzó**: el proyecto arrancó con una fase de diseño de arquitectura extensa antes/en paralelo al código — `docs/architecture/` documenta 32 fases de diseño ("casi todas ✅" según `docs/00-roadmap-fases.md`), cubriendo desde la estructura del monorepo hasta convenciones de API, antes de que existieran muchos de los módulos de negocio reales. Esto explica por qué la documentación de arquitectura está mucho más completa que la cobertura funcional real (41% de módulos con backend).

**Fases realizadas** (según `CHANGELOG.md`, entradas recientes reales, orden cronológico):

| Versión   | Fecha      | Hito                                                                                                                                            |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0.17.0` | 2026-07-26 | CRM/Clientes preparación para producción — integración real de Cuentas por Cobrar, 2 hallazgos de seguridad corregidos                          |
| `v0.18.0` | 2026-07-26 | Roles Enterprise — CRUD completo con scoping tenant/empresa/sucursal                                                                            |
| `v0.19.0` | 2026-07-26 | Roles Enterprise — campos `code`/`description`/`roleType` + migración `39_roles_enterprise_fields.sql`                                          |
| `v0.20.0` | 2026-07-26 | Roles Enterprise — decisión explícita de **no** usar Value Objects en Roles                                                                     |
| `v0.21.0` | 2026-07-26 | Roles Enterprise, Subfase 4.1 — eventos de dominio preparados (sin publicar)                                                                    |
| `v0.22.0` | 2026-07-26 | FASE 04 — Facturación Enterprise Parte 1: ciclo de vida completo de factura                                                                     |
| `v0.23.0` | 2026-07-27 | Contabilidad Enterprise Parte 1: núcleo contable, motor de reglas, Libro Diario/Mayor, Balance General, Estado de Resultados, Flujo de Efectivo |
| `v0.24.0` | 2026-07-27 | Módulo de Ventas Enterprise Parte 1: Cotización → Pedido → Factura con reserva real de inventario                                               |

**Después de `v0.24.0` (no reflejado todavía en `CHANGELOG.md`)**: una serie extensa de trabajo de arquitectura y primera implementación sobre el dominio de Inventario, documentada en Git pero no en el changelog formal:

- Segundo Cerebro / Architecture Knowledge Base (`docs/AKB/`) construido y madurado en 6 niveles (BUILD → ANALYZE → LEARN → OPTIMIZE → GOVERN → INNOVATE), más un modelo de madurez empresarial (GEMM v1.0).
- Serie completa de ADRs de Inventario: `ADR-INV-004` (Costeo) a `ADR-INV-010` (Analítica), más una extensión de Trazabilidad con capacidad de "Digital Twin" (reconstrucción de inventario en un punto del tiempo).
- Primera implementación de código real sobre esa serie: **Motor de Costeo de Inventario Fase 1** (FIFO/LIFO/Costo Promedio Ponderado), commit `2b1dc60`, 2026-08-01.

**Cambios importantes / decisiones técnicas**: ver [§19](#19-decisiones-de-arquitectura) para el detalle — los más relevantes son la corrección crítica de RLS (`gorazus_app` era superusuario, RLS no protegía nada realmente, corregido en `34_rls_hardening.sql`), el abandono de `prisma migrate` a favor de SQL crudo versionado, y la decisión reciente de aplicar un principio de "un motor, N puntos de entrada" en vez de construir un servicio nuevo por cada capacidad pedida (ej. 25 tipos de genealogía de trazabilidad resueltos por un solo `RecorrerGenealogia`).

**Evolución**: el proyecto pasó de una fase de diseño de arquitectura muy extensa (documentos `docs/architecture/*`, `docs/ddd/*`) a una fase de construcción de módulos de negocio reales empezando por los de mayor valor operativo inmediato (Auth → Seguridad → Inventario básico → Productos → POS → Clientes/CRM → Ventas → Contabilidad), y más recientemente a una fase de **documentación de arquitectura retroactiva y disciplinada** sobre el dominio ya construido de Inventario (la serie de ADRs `ADR-INV-*`), seguida del primer ciclo real de "diseño → implementación" sobre esa misma disciplina (Motor de Costeo).

---

## 3. Estado General

| Categoría                                               | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Terminado**                                           | Auth (JWT+2FA+lockout+revocación), RBAC básico (39 permisos/10 módulos), Almacenes/Zonas/Ubicaciones de Inventario, Motor de Movimientos/Stock/Reservas/Transferencias, Ajustes y Conteos Físicos de Inventario, CRUD de Productos, Catálogo de Clientes + Cuentas por Cobrar, Caja básica, POS (checkout real), CRM (Leads/Oportunidades/Campañas/Agenda), Núcleo Contable (plan de cuentas, asientos, 3 estados financieros), Cotización→Pedido→Factura de Ventas, **Motor de Costeo de Inventario Fase 1 (FIFO/LIFO/Promedio)** |
| **Parcialmente terminado**                              | Inventario (15-17 tablas de 34 implementadas según el módulo — recepciones/salidas/costeo avanzado/series/lotes/producción siguen sin código de aplicación completo), Contabilidad (17/28 tablas — CxC/CxP avanzadas, Bancos, Activos Fijos, Impuestos, Presupuestos, Cierre contable, IFRS sin código), Ventas (13/55 tablas — NCF, listas de precios, descuentos avanzados, devoluciones, comisiones sin código), Productos (5/35 tablas), Frontend (solo 5 de 25 módulos con página real)                                       |
| **Falta / sin empezar**                                 | 16 de 27 módulos de negocio sin una sola línea de backend: `activos-fijos`, `administracion`, `bancos`, `bi`, `compras`, `dashboard` (frontend sí tiene, backend no aplica), `documentos`, `impuestos`, `nomina`, `produccion`, `proveedores`, `proyectos`, `recursos-humanos`, `reportes`, `servicios`, `tesoreria`                                                                                                                                                                                                               |
| **En desarrollo activo (al momento de este documento)** | Motor de Costeo de Inventario recién commiteado (Fase 1 de `ADR-INV-004`); decisión pendiente y explícita en `NEXT_STEPS.md` sobre si continuar con POS Fase 06 Parte 02 o con Inventario Fase 05 Parte 05 (Recepciones/Salidas)                                                                                                                                                                                                                                                                                                   |

---

## 4. Base de Datos

**Resumen completo**: PostgreSQL 17 con extensión `pg_partman`, 22 schemas (21 de negocio + `partman` de infraestructura), gestionado con **SQL crudo versionado, no `prisma migrate`** — decisión explícita documentada ("el SQL crudo es la fuente de verdad, Prisma solo consume vía `db pull` + `generate`"), porque un cliente Prisma monolítico con ~500 modelos colgaba `prisma generate` en la práctica.

**Esquemas y modelos** (conteo real vía `schema.prisma` de cada uno, 21 schemas independientes bajo `core/database/prisma/schemas/*/`):

| Schema        | Modelos | Schema    | Modelos                |
| ------------- | ------- | --------- | ---------------------- |
| core          | 68      | crm       | 17                     |
| sales         | 55      | projects  | 17                     |
| products      | 36      | banks     | 14                     |
| inventory     | 34      | bi        | 14                     |
| accounting    | 28      | suppliers | 14                     |
| hr            | 28      | taxes     | 13                     |
| purchases     | 27      | cash      | 11                     |
| security      | 24      | reports   | 11                     |
| configuration | 23      | assets    | 10                     |
| payroll       | 22      |           |                        |
| customers     | 20      | **Total** | **504 modelos Prisma** |
| services      | 18      |           |                        |

`docs/database/DATABASE_INVENTORY.md` (fecha 2026-07-21) declara la cifra oficial con fuente citada: **501 tablas lógicas, 730 tablas físicas (incluyendo particiones), 27 tablas particionadas, 501 secuencias, 0 tablas huérfanas, 0 duplicadas**. La diferencia entre 504 (conteo directo de `model` en Prisma) y 501 (declarado) no se reconcilió — probablemente algunos `model` corresponden a vistas capturadas por `db pull`, no a tablas.

**Tablas / DDL real versionado**: 41 archivos SQL en `docs/database/sql/`, aplicados en orden numérico (`01_core.sql` → `41_ventas_pedidos_facturacion_parcial.sql`) vía `core/database/scripts/migrate.js`. Los primeros 21 son el DDL base por dominio (uno por schema de negocio); `22_seed_data.sql` a `29_partitioning.sql` son infraestructura transversal (índices, vistas, funciones, triggers, procedimientos, vistas materializadas, particionamiento); `30` en adelante son parches incrementales cronológicos, entre ellos **`34_rls_hardening.sql`**, que corrige un hallazgo de seguridad crítico (ver abajo).

**Relaciones**: 185 foreign keys reales cruzan schemas de módulos distintos (señalado en `TECHNICAL_DEBT.md` como una tensión con la regla propia de aislamiento por dominio, no resuelta ni bloqueante).

**Triggers / Funciones / Procedimientos**: definidos en `25_functions.sql`, `26_triggers.sql`, `27_procedures.sql`. Ejemplo real documentado en el código: `inventory.fn_apply_stock_movement` (trigger `AFTER INSERT` sobre `stock_movements`) aplica el delta a `inventory.stock` automáticamente — el código de aplicación (`MovimientoStockRepositoryPrisma`) nunca escribe `stock` directo, solo relee tras el insert.

**Índices**: `23_indexes.sql` + `31_missing_fk_indexes.sql` (parche posterior que agregó índices de FK faltantes). Patrón declarado: `BTree` compuesto en columnas de join frecuente, `BRIN` en columnas `created_at` de tablas append-only de alto volumen.

**Migraciones**: confirmado que **no existe** `core/database/prisma/migrations/`. El flujo real es: escribir/editar SQL en `docs/database/sql/NN_*.sql` → aplicar con `migrate.js` contra Docker → regenerar los 21 clientes Prisma con `db pull` + `generate-all.js` → `split-schema-by-module.js` divide el pull monolítico en los 21 schemas independientes → `copy-generated-to-dist.js` copia los clientes generados (gitignored) a `dist/` para el build.

**Políticas / RLS**: **500 de 501 tablas lógicas tienen Row-Level Security habilitado** (única excepción no formalizada: `core.restore_test_logs`). No son políticas escritas una por una: un bloque `DO $$ ... FOR r IN (SELECT ... FROM information_schema.tables WHERE table_schema IN (21 schemas)) EXECUTE format('CREATE POLICY tenant_isolation ...') END $$;` genera una política `tenant_isolation` por tabla automáticamente. Dos políticas puntuales adicionales: `tenant_lookup_by_slug` (permite resolver el tenant por slug antes de tener sesión) y `session_lookup_by_refresh_hash`.

**Hallazgo de seguridad crítico ya corregido**: `docs/database/SECURITY.md` documenta que, pese a que el diseño afirmaba que ningún rol de aplicación tenía `BYPASSRLS`/superusuario, una re-verificación (2026-07-20) encontró que **`gorazus_app` SÍ era superusuario** (colisión de identidad con el `POSTGRES_USER` de bootstrap de Docker) — es decir, **RLS era inefectivo contra el tráfico real de la API** hasta ese momento. Corregido en `34_rls_hardening.sql`. 5 roles de BD reales: `gorazus_app`, `gorazus_migrator`, `gorazus_readonly`, `gorazus_backup`, `gorazus_audit_writer`.

**Multiempresa**: aislamiento por `tenant_id` (obligatorio, todas las tablas) + `company_id`/`branch_id` (nullable, según el alcance de cada tabla) — jerarquía Empresa → Sucursal → Almacén (para inventario) sin tablas separadas por nivel (decisión de diseño confirmada, `ADR-INV-002`).

**Particionamiento**: 27 tablas particionadas por `RANGE` (ninguna `HASH`/`LIST`), repartidas entre `core` (5), `security` (2), `inventory` (2), `sales`/`purchases`/`cash`/`accounting`/`taxes`/`hr`/`assets` (1 cada una), `crm` (3), `services`/`projects` (2 cada una), `bi` (3). Automatizado con `pg_partman` + `core.scheduled_jobs`, contrato formalizado en `ADR-DB-001 §10` (7 responsabilidades documentadas). **0 de 27 tablas particionadas sin aprovisionar** según `DATABASE_HEALTH_REPORT.md` (2026-07-20).

**Integridad**: 0 tablas huérfanas, 0 duplicadas (fuente: `AUDIT_FASE1_ENTERPRISE.md §4`).

**Diccionario de datos**: `docs/database/dictionary/` — 21 archivos, uno por dominio (`01-core.md` a `21-configuration.md`), documentación tabla por tabla del schema real.

---

## 5. Backend

**Arquitectura**: Clean Architecture + DDD por módulo, aplicada de forma consistente en los 11 módulos con código real:

- **Entities**: clases de dominio con invariantes validadas en el constructor (lanzan `Error` genérico, no `DomainException` — esa traducción ocurre en el service).
- **Repositories**: patrón puerto/adaptador — una clase abstracta (`abstract class XRepository`) define el contrato de dominio; una implementación `XRepositoryPrisma` lo satisface inyectando el cliente Prisma del schema correspondiente (`@Inject(PRISMA_INVENTORY)`, etc.) y envolviendo cada escritura en `withTenantScope(client, context, (tx) => ...)`, que fija el contexto de tenant/usuario en la transacción antes de ejecutar (para que RLS actúe). Dos variantes: `BaseRepository<...>` genérico para catálogos CRUD simples, o interfaz custom con métodos de dominio explícitos para motores con lógica transaccional real (ej. `MovimientoStockRepository.registrar`, `ConteoFisicoRepository.completar`).
- **Services (Domain Services / Application Services)**: orquestan repositorios y otros services del mismo Bounded Context; lanzan excepciones de dominio propias (`class XException extends DomainException`, con `code`/mensaje en español/`HttpStatus`).
- **Controllers**: delgados, delegan 100% en el service; usan `@RequirePermission(...)` (RBAC) + `ZodValidationPipe` sobre schemas de `validators/*.schema.ts`; respuesta siempre `{ data, meta? }`.
- **Concurrencia**: bloqueo pesimista real (`SELECT ... FOR UPDATE`) vía `$queryRawUnsafe` en operaciones críticas (saldo de stock, capas de costo), con orden determinístico de adquisición de locks documentado (`Company → Branch → Warehouse → Location → Product → Lot → Serial → Stock`, `ADR-INF-001 §4`) para prevenir deadlocks.
- **Eventos de dominio**: diseñados extensamente en varios módulos (nomenclatura española, `routingKey <módulo>.<entidad>.<evento>`) pero **0 se publican realmente todavía** — no hay `EventEmitter` conectado en ningún módulo de negocio; estado declarado honestamente en el propio código y en `docs/AKB/03 Shared Kernel/Domain Events.md`.

**Módulos existentes con código real** (11 de 27): ver tabla completa en [§9](#9-módulos-implementados).

**Middlewares / Guards**: `JwtAuthGuard` (autenticación), `PermissionsGuard` (autorización RBAC, global vía `SeguridadModule` marcado `@Global()` para no invertir la regla de capas `type:core` ↛ `type:backend`), `GlobalExceptionFilter` (formato de error único).

**Configuración**: `ConfigModule` propio (`@gorazus/core-config`), variables de entorno tipadas.

**Dependencias de infraestructura reales**: Redis (caché de revocación de sesión, `@gorazus/core-cache`), RabbitMQ (`core/messaging`, **sin un solo consumidor real conectado** — deuda técnica declarada), MinIO (almacenamiento de archivos), scheduler propio (`core/scheduler`, también sin consumidores reales conectados).

**JWT**: access token 15 minutos, refresh token hasheado antes de persistir (`createHash`), revocación real con `revoked_at` + caché Redis con TTL igual al access token (para invalidar tokens ya emitidos antes de su expiración natural).

**Docker**: ver [§13](#13-docker).

**OpenAPI**: ver [§7](#7-api).

**CI/CD**: ver [§14](#14-github).

---

## 6. Frontend

**Estado**: temprano — solo **5 de 25 módulos** en el registro de navegación (`MODULE_REGISTRY`, `app-shell/module-registry.ts`) tienen una página real implementada; el resto muestra un componente `<ComingSoonPage>` genérico, descrito en el propio código como "placeholder honesto en vez de datos simulados" (decisión de diseño explícita, no una omisión accidental).

**Framework**: React 19 + Vite 6. Enrutamiento con `react-router-dom` v7 (`createBrowserRouter`), estado de servidor con `@tanstack/react-query` v5, estado de cliente con `zustand` v5, formularios con `react-hook-form` + `zod`.

**UI Kit**: paquete propio `@gorazus/ui-kit`, no una librería de terceros instalada — construido con el mismo patrón que shadcn/ui (primitivos de Radix UI + `class-variance-authority` + Tailwind CSS + utilidad `cn()`), pero sin depender de la librería `shadcn/ui` en sí. Iconos: `lucide-react`.

**Módulos con frontend real**:

| Módulo    | Archivos `.tsx` | Total `.ts`+`.tsx` | Contenido                                                                                                          |
| --------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Clientes  | 5               | 14                 | Listado, detalle, tabs de contactos/direcciones, 7 hooks de mutación/consulta, rutas propias — el más desarrollado |
| POS       | 4               | 5                  | Página de punto de venta, gate de caja, diálogo de pago, hook, rutas                                               |
| Seguridad | 2               | 6                  | Solo gestión de usuarios (sin pantalla de roles todavía), 4 hooks, rutas                                           |
| Auth      | 2               | 3                  | Login, rutas, hook                                                                                                 |
| Dashboard | 2               | 2                  | Página + rutas (contenido mínimo)                                                                                  |

**Módulos con backend real pero SIN frontend**: Inventario, Productos, Ventas, Caja, CRM, Contabilidad, Configuración — 7 módulos con capacidad de negocio real que hoy no son operables desde la interfaz web.

**Pendiente declarado en el propio código**: `react-i18next` está documentado en `FRONTEND_ARCHITECTURE.md` pero **no está instalado** en ningún `package.json` del monorepo — el `I18nProvider` no existe todavía.

---

## 7. API

**OpenAPI**: `docs/api/openapi.json` (~157 KB). `info.version` está **hardcodeado en `"0.1.0"`**, desincronizado de la versión real del proyecto (deuda técnica declarada en `TECHNICAL_DEBT.md §4`).

| Métrica                    | Valor |
| -------------------------- | ----- |
| Paths documentados         | 161   |
| Operaciones (métodos HTTP) | 234   |
| Tags distintos             | 12    |

| Dominio (tag) | Operaciones |
| ------------- | ----------- |
| inventario    | 50          |
| seguridad     | 36          |
| contabilidad  | 26          |
| ventas        | 23          |
| configuracion | 21          |
| productos     | 20          |
| crm           | 19          |
| clientes      | 15          |
| auth          | 9           |
| caja          | 5           |
| pos           | 5           |
| archivos      | 3           |

**Versionado**: URI (`/api/v1/...`), `VersioningType.URI` + `app.setGlobalPrefix('api')`.

**Errores**: formato propio inspirado en RFC 7807 pero no idéntico (sin campos `type`/`title`/`status`/`instance`, sin `Content-Type: application/problem+json`) — `{ error: { code, message, details } }`, implementado en `core/http/filters/exception.filter.ts` (`GlobalExceptionFilter`). Errores no controlados loguean el stack solo server-side, nunca lo exponen al cliente (`ERR_INTERNAL` genérico).

**Autenticación en la API**: Bearer JWT en todos los endpoints protegidos, `@RequirePermission(...)` por endpoint sobre el catálogo RBAC real (39 permisos).

**Seguridad de API**: rate limiting real (`@nestjs/throttler`) en endpoints sensibles (login), CORS restringido por `Origin`.

---

## 8. Seguridad

| Capacidad            | Estado real        | Evidencia                                                                                                                                                                                               |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT access + refresh | ✅ Real            | `jwt-token.provider.ts`, `refresh-token.usecase.ts` — access 15 min, refresh hasheado                                                                                                                   |
| 2FA / TOTP           | ✅ Real (RFC 6238) | `dos-factores.service.ts`, `packages/tooling/utils/totp.ts`, secreto cifrado en reposo                                                                                                                  |
| Rate limiting        | ✅ Real            | `@nestjs/throttler`, `@Throttle({ default: { limit: 5, ttl: 60_000 } })` en login                                                                                                                       |
| Lockout de cuenta    | ✅ Real            | Umbral/ventana configurables, `CuentaBloqueadaException` (HTTP 429), auto-expirable                                                                                                                     |
| Revocación de sesión | ✅ Real            | `revoked_at` + caché Redis con TTL = access token; revoca una sesión o todas las de un usuario                                                                                                          |
| CSRF                 | 🟡 Parcial         | No hay librería CSRF dedicada — protección real vía validación de `Origin` + cookies `SameSite=strict`, documentado como suficiente para el único flujo sensible, no un token CSRF sincronizado clásico |

**RBAC**: `seed-rbac.ts` — **39 permisos** (`{ moduleCode, actionCode }`) cubriendo **10 módulos de negocio** (`seguridad`, `configuracion`, `inventario`, `productos`, `clientes`, `caja`, `ventas`, `pos`, `crm`, `contabilidad`). Resolución real contra base de datos (`PermissionsResolverService`, rol → permiso), sin caché Redis todavía (declarado como Fase 2 pendiente). Fail-closed por diseño: `NoopPermissionsResolver` deniega todo por defecto si `SeguridadModule` no está registrado — nunca "permitir todo hasta que exista el módulo real".

**Auditoría**: universal en las 501 tablas — `created_by`/`updated_by`/`deleted_by`, soft delete, `version`/`row_version`, trigger automático hacia `core.audit_logs`.

**Vulnerabilidades conocidas**: `TECHNICAL_DEBT.md §1` declara **39 vulnerabilidades de `pnpm audit`** (1 crítica, 19 altas, 18 moderadas, 1 baja), todas transitivas de tooling (no de código propio). Gaps declarados: sin detección de reuso de refresh token, revocación de admin no invalida Redis de inmediato en todos los casos.

---

## 9. Módulos Implementados

| Módulo        | Controllers | Services                   | Repositories      | Entities | Tests unitarios                     | Tests E2E                                 | Frontend                   | Cobertura de schema declarada |
| ------------- | ----------- | -------------------------- | ----------------- | -------- | ----------------------------------- | ----------------------------------------- | -------------------------- | ----------------------------- |
| Inventario    | 14          | 15 (incl. `CosteoService`) | 42 (incl. Costeo) | 12       | 26 (incl. `costeo.service.spec.ts`) | 6 (incl. `costeo.controller.e2e-spec.ts`) | ❌ No                      | 15-17 de 34 tablas            |
| Seguridad     | 5           | 9                          | 18                | 5        | 13                                  | 5                                         | 🟡 Parcial (solo usuarios) | —                             |
| Configuración | 7           | 7                          | 16                | 6        | 6                                   | 4                                         | ❌ No                      | —                             |
| Contabilidad  | 6           | 7                          | 18                | 2        | 4                                   | 1                                         | ❌ No                      | 17 de 28 tablas               |
| CRM           | 4           | 4                          | 20                | 4        | 8                                   | 1                                         | ❌ No                      | —                             |
| Ventas        | 3           | 3                          | 22                | 3        | 7                                   | 2                                         | ❌ No                      | 13 de 55 tablas               |
| Clientes      | 4           | 4                          | 10                | 3        | 7                                   | 1                                         | ✅ Sí (el más completo)    | —                             |
| Productos     | 5           | 5                          | 12                | 5        | 10                                  | 1                                         | ❌ No                      | 5 de 35 tablas                |
| Auth          | 1           | 1                          | 14                | 2        | 11                                  | 3                                         | ✅ Sí                      | —                             |
| Caja          | 1           | 1                          | 12                | 1        | 2                                   | 0                                         | ❌ No                      | —                             |
| POS           | 1           | 1                          | 2                 | 0        | 1                                   | 0                                         | ✅ Sí                      | —                             |

_(Conteos de Inventario actualizados en este documento para incluir el Motor de Costeo Fase 1, commiteado después del inventario original del código.)_

**Detalle por capacidad real (no solo conteo de archivos)**:

- **Inventario**: Almacenes/Zonas/Ubicaciones, Stock + Movimientos (con trigger `fn_apply_stock_movement`), Reservas, Transferencias, Ajustes, Conteos Físicos (con generación automática de ajuste ante discrepancia), Programación de Conteos Cíclicos, **Motor de Costeo FIFO/LIFO/Promedio (nuevo, standalone, sin conexión automática a Movimientos todavía)**.
- **Ventas**: Cotización → Pedido → Factura, con reserva real de inventario en la conversión.
- **Contabilidad**: Plan de cuentas, motor de reglas de asiento, Libro Diario/Mayor, Balance General, Estado de Resultados, Flujo de Efectivo.
- **CRM**: Leads, Oportunidades, Campañas, Agenda.
- **Clientes**: Catálogo, Contactos, Direcciones, Cuentas por Cobrar (real, integrado).
- **POS**: Checkout real con gate de caja y diálogo de pago.
- **Seguridad**: Usuarios, Roles (CRUD + scoping tenant/empresa/sucursal), 2FA, Sesiones, Auditoría.

---

## 10. Módulos Pendientes

Orden real declarado en `NEXT_STEPS.md` (2026-07-26) + estado actualizado por el trabajo posterior verificado en Git:

1. **Decisión abierta, sin resolver todavía**: continuar con **POS Fase 06 Parte 02**, o retomar **Inventario Fase 05 Parte 05** (Recepciones/Salidas/Reglas de Almacén) — `NEXT_STEPS.md` la deja explícitamente "esperando aprobación explícita del usuario".
2. Inventario Parte 06 — Costeo (FIFO/LIFO/Promedio): **Fase 1 ya iniciada e implementada** (commit `2b1dc60`, 2026-08-01) — este paso del roadmap declarado ya está parcialmente en marcha, adelantándose a la decisión del punto 1. Standard/Specific/Landed/Replacement Cost, revaluación, cierre de período y multi-moneda quedan como Fase 2+ (diseñadas en `ADR-INV-004`, sin código).
3. Inventario Parte 07 — Series y Lotes.
4. Inventario Parte 08 — Producción.
5. **16 módulos sin ninguna línea de backend**, sin orden de prioridad declarado más allá de "resto de los 27 módulos de negocio": `activos-fijos`, `administracion`, `bancos`, `bi`, `compras`, `documentos`, `impuestos`, `nomina`, `produccion`, `proveedores`, `proyectos`, `recursos-humanos`, `reportes`, `servicios`, `tesoreria` (`dashboard` tiene frontend mínimo, backend no aplica a ese módulo).

**Deuda de diseño ya completada, sin implementar**: la serie de ADRs de Inventario (`ADR-INV-005` Disponibilidad, `ADR-INV-006` Reabastecimiento, `ADR-INV-007` Optimización de Almacenes, `ADR-INV-008` Trazabilidad + Digital Twin, `ADR-INV-009` Conteo Cíclico, `ADR-INV-010` Analítica) están completamente diseñadas (DDD, DB, API, seguridad, rendimiento, diagramas) pero **sin una sola línea de código** — son candidatas directas a implementación siguiendo el mismo patrón que el Motor de Costeo.

---

## 11. Documentación

| Categoría                            | Ubicación                                                                                                           | Contenido                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADRs (Architecture Decision Records) | `docs/adr/`                                                                                                         | `ADR-DB-001` (particionamiento), `ADR-INV-000` a `ADR-INV-010` (dominio de Inventario completo), `ADR-INF-001` (concurrencia)                                                                                                         |
| Second Brain / AKB                   | `docs/AKB/`                                                                                                         | Bóveda Obsidian: `00 Governance` (Home, ADR Index, Issue Register con 22 issues, Decision Log, reportes de madurez GEMM), `01 Platform`, `02 Domains` (Inventory con 21+ notas), `03 Shared Kernel`, `04 Database`, `05 Integrations` |
| Arquitectura                         | `docs/architecture/`                                                                                                | 32 documentos de fases de diseño, casi todos completos según `docs/00-roadmap-fases.md`                                                                                                                                               |
| DDD                                  | `docs/ddd/`                                                                                                         | Aggregates, Entities, Value Objects, Domain Services, Domain Policies, Repositories, Invariantes — documentación de diseño formal, protegida (requiere autorización explícita para editar)                                            |
| Base de datos                        | `docs/database/`                                                                                                    | 41 SQL versionados, 21 diccionarios de datos, `SECURITY.md`, `DATABASE_INVENTORY.md`, `DATABASE_CHANGELOG.md` (versión de BD independiente del código)                                                                                |
| API                                  | `docs/api/openapi.json`                                                                                             | 161 paths / 234 operaciones                                                                                                                                                                                                           |
| Reportes por dominio                 | `docs/reports/{database,inventory,auth,ventas,backend,pos,frontend,usuarios,contabilidad,crm,almacenes,productos}/` | 12 subcarpetas, reorganizadas desde archivos sueltos en la raíz                                                                                                                                                                       |
| Estado del proyecto                  | Raíz: `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `TECHNICAL_DEBT.md`, `CHANGELOG.md`, `ROADMAP.md`, `VERSION`            | Ver secciones dedicadas — **desincronizados entre sí en fecha/versión**, señalado explícitamente                                                                                                                                      |

---

## 12. Testing

**Cobertura real**: no hay un `coverage-summary.json` consolidado ni un % global medido y publicado. `jest.preset.js` fija un piso de CI de **5% global** (`coverageThreshold`) — un mínimo de seguridad, no una cobertura real medida; `pnpm test:cov` "sigue sin estar wireado a CI" (cita literal de `docs/reports/backend/TEST_REPORT.md`, 2026-07-23, v0.3.1 — **desactualizado**: reporta 36 suites/146 tests, pero solo el módulo Inventario ya tiene 26 suites unitarias hoy tras el Motor de Costeo).

**Unitarios**: Jest puro por servicio, mocks manuales de las interfaces de repositorio (nunca `@nestjs/testing` para unit tests de service, nunca mock directo de Prisma).

**E2E backend**: por controlador, contra **Postgres real** (Docker), JWT firmado a mano, `TestingModule` de Nest completo. Repartidos por módulo según [§9](#9-módulos-implementados) (Inventario 6, Seguridad 5, Configuración 4, Auth 3, Ventas 2, resto 1 o 0).

**E2E frontend**: Playwright (`@playwright/test` 1.49), `apps/web-e2e/`, **2 specs**: `login.spec.ts`, `usuarios.spec.ts`.

**Deuda de testing declarada**: `nx run web:test` **no arranca** (conflicto ESM/`require` de `vite-tsconfig-paths`) — **0 tests de frontend corren** en este momento más allá de los 2 e2e de Playwright. CI sin contenedores de servicio real (Postgres/Redis) — los e2e reales requieren correrse localmente con Docker.

---

## 13. Docker

**Compose files** (todos en `infra/docker/`, no en la raíz):

| Archivo                         | Rol                                                            |
| ------------------------------- | -------------------------------------------------------------- |
| `docker-compose.yml`            | Base/principal                                                 |
| `docker-compose.dev.yml`        | Overlay desarrollo (+ `pgadmin`, `mailhog`)                    |
| `docker-compose.prod.yml`       | Overlay producción                                             |
| `docker-compose.monitoring.yml` | Observabilidad (+ `prometheus`, `grafana`, `loki`, `promtail`) |

**Servicios del compose principal**:

| Servicio   | Imagen / build                                                                  |
| ---------- | ------------------------------------------------------------------------------- |
| `nginx`    | `nginx:1.27-alpine`                                                             |
| `api`      | build (`apps/api/Dockerfile`)                                                   |
| `web`      | build (`apps/web/Dockerfile`)                                                   |
| `postgres` | build (`infra/docker/postgres/Dockerfile`) → `gorazus-postgres17-partman:local` |
| `backup`   | misma imagen, para `pg_dump`/`pg_restore`                                       |
| `redis`    | `redis:7-alpine`                                                                |
| `rabbitmq` | `rabbitmq:3.13-management-alpine`                                               |
| `minio`    | `minio/minio:latest`                                                            |
| `ollama`   | `ollama/ollama:latest`                                                          |

**Nota operativa real**: en varias sesiones de desarrollo previas (y en la más reciente, verificado al escribir este documento), **Docker Desktop no estaba corriendo** — el e2e del Motor de Costeo se escribió y compila, pero no se pudo ejecutar contra Postgres real en el entorno de desarrollo al momento de commitear.

---

## 14. GitHub

**Repositorio**: `https://github.com/Daniel-Cali/GORAZUS.git`.

**Rama activa**: `feature/database-finalization`, **49 commits por delante de `origin/feature/database-finalization`, sin pushear**. `origin/HEAD` apunta a `gorazus2`, no a `main`/`master` (aunque existe una rama local `master`).

**Ramas locales** (11): `design/database-spanish-standard`, `docs/database-setup-verification`, `feature/database-audit`, `feature/database-finalization` (actual), `feature/frontend-ui-audit`, `feature/inventory-adjustments`, `feature/inventory-core`, `feature/sales-pos`, `gorazus2`, `master`, `release/database-v1`.

**Tags** (8): `v0.2.0`, `v0.3.0`, `v0.3.1`, `v0.4.0`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `database-v1.0.0`. **Inconsistencia real**: los tags se detienen en `v0.7.0` pese a que `CHANGELOG.md` documenta hasta `v0.24.0` — no hay releases formales de GitHub para gran parte del historial reciente.

**Commits importantes recientes** (`git log --oneline`, HEAD real):

```
2b1dc60 feat(inventario): implementar motor de costeo fase 1 (fifo/lifo/promedio)
9ad054e docs(adr): agrega ADR-INV-010 motor de analitica de inventario
778a90c docs(adr): agregar adr-inv-009, motor de conteo ciclico de inventario
e25c549 docs(akb): consolidar deuda y decisiones de la serie ADR-INV-004..008
843894e docs(adr): extender adr-inv-008 con Digital Twin (§15)
1977dbc docs(adr): agregar adr-inv-008, motor de trazabilidad de inventario
70bbac0 docs(adr): agregar adr-inv-007, motor de optimizacion de almacenes
2a7e893 docs(adr): agregar adr-inv-006, motor de reabastecimiento de inventario
7f74bbd docs(adr): agregar adr-inv-005, motor de disponibilidad de inventario
5bbb883 docs(adr): agregar adr-inv-004, motor de costeo de inventario
341d52e docs(akb): gemm v1.0 - enterprise maturity model
```

**GitHub Actions** (`.github/workflows/`):

| Workflow             | Se dispara en                                                      |
| -------------------- | ------------------------------------------------------------------ |
| PR Validation        | `pull_request` hacia `gorazus2`                                    |
| Security Scan        | `pull_request`/`push` hacia `gorazus2` + semanal (lunes 06:00 UTC) |
| Deploy Staging       | `push` hacia `gorazus2` (automático)                               |
| Deploy Production    | `workflow_dispatch` manual únicamente                              |
| Nightly Restore Test | mensual (día 1, 03:00 UTC) + manual                                |

También existe `.github/CODEOWNERS`.

---

## 15. Changelog

`CHANGELOG.md` (raíz, formato Keep a Changelog, pre-1.0 — "se registra por fecha, no hay versiones publicadas todavía" según su propia cabecera). Resumen de las 8 entradas más recientes: ver tabla completa en [§2](#2-historia-del-proyecto).

**Importante**: el `CHANGELOG.md` **no incluye** el trabajo posterior a `v0.24.0` (2026-07-27) — toda la serie de ADRs de Inventario y el Motor de Costeo Fase 1 (commits hasta `2b1dc60`, 2026-08-01) están en Git pero no documentados ahí. Existe además un changelog independiente de solo base de datos: `docs/database/DATABASE_CHANGELOG.md` ("Database Enterprise"), que **no debe mezclarse** con la versión de código según indica el propio `CHANGELOG.md`.

---

## 16. Versionado

**Inconsistencia real, declarada explícitamente (no se elige un número arbitrario)**:

| Fuente                                                      | Valor declarado                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| `package.json` (raíz)                                       | `0.21.0`                                                        |
| `VERSION` (raíz)                                            | `0.2.0`                                                         |
| `CHANGELOG.md` (entrada más reciente)                       | `v0.24.0` (2026-07-27)                                          |
| `PROJECT_STATUS.md` / `NEXT_STEPS.md` / `TECHNICAL_DEBT.md` | "versión de app 0.21.0" (2026-07-26)                            |
| `ROADMAP.md`                                                | "fase actual v0.24.0" (2026-07-27)                              |
| `docs/api/openapi.json` (`info.version`)                    | `0.1.0` (hardcodeado, deuda técnica declarada)                  |
| Git (HEAD real)                                             | Sin tag — posterior a todo lo anterior (commits del 2026-08-01) |

**Próxima versión**: no hay un número siguiente formalmente reservado. Si el proyecto sigue el patrón de incrementar minor por cada hito funcional entregado (como hizo de `v0.17.0` a `v0.24.0`), el Motor de Costeo de Inventario Fase 1 sería candidato natural a `v0.25.0`, pero esto no está declarado en ningún documento — es una inferencia de este reporte, marcada como tal.

---

## 17. Roadmap

Fuente: `ROADMAP.md` (raíz) + `NEXT_STEPS.md` (raíz, más operativo/inmediato). Secuencia real declarada, de más reciente a más antigua: `v0.24.0` Ventas (Cotización→Pedido→Factura) → `v0.23.0` Contabilidad → `v0.22.0` Facturación → `v0.14.0` CRM Campañas/Agenda → `v0.13.0` CRM Oportunidades → `v0.12.0` CRM Leads → `v0.11.0` POS.

**Lo pendiente, en el orden exacto declarado** (ver detalle completo en [§10](#10-módulos-pendientes)):

1. Decisión abierta: POS Fase 06 Parte 02 **o** Inventario Fase 05 Parte 05 — sin resolver, requiere aprobación explícita del usuario.
2. Inventario Parte 06 — Costeo (Fase 1 ya en marcha).
3. Inventario Parte 07 — Series y Lotes.
4. Inventario Parte 08 — Producción.
5. Resto de 16 módulos de negocio sin backend, sin orden de prioridad declarado entre ellos.

---

## 18. Deuda Técnica

**Registro principal**: `TECHNICAL_DEBT.md` (raíz, 2026-07-26, v0.21.0) — **63 ítems** clasificados por severidad (🔴/🟠/🟡/🟢), incluyendo ítems ya corregidos que se dejan como registro histórico. Resumen por bloque:

| Bloque                | Contenido                                                                                                                                               | Severidad dominante                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Seguridad             | **39 vulnerabilidades `pnpm audit`** (1 crítica, 19 altas, 18 moderadas, 1 baja, todas transitivas de tooling); sin detección de reuso de refresh token | 🟠                                     |
| Arquitectura          | Sin patrón compartido sort/filter/search; `core/messaging` (RabbitMQ) y `core/scheduler` sin consumidores reales; 185 FK cruzan schemas de módulos      | 🟠/🟡                                  |
| Cobertura funcional   | 16-22 de 27 módulos sin backend (esperado y documentado, no "roto")                                                                                     | 🟡                                     |
| Calidad/CI            | `nx run web:test` no arranca (0 tests de frontend corriendo); `openapi.json` con versión hardcodeada; CI sin contenedores de servicio real              | 🟠                                     |
| Base de datos         | 112 índices propuestos excederían el límite de 63 bytes de nombre de PostgreSQL si se ejecutan tal cual                                                 | 🟠                                     |
| CRM/Roles (corregido) | Bug sistémico: tablas nuevas sin `GRANT` desaparecían de `schema.prisma` al hacer `db:pull` (falta `ALTER DEFAULT PRIVILEGES`)                          | 🔴 corregido, sin prevención sistémica |
| Frontend              | 4 hallazgos de auditoría visual (sin axe-core, sin ancho máximo, etc.)                                                                                  | 🟡                                     |
| Operativo             | Docker Desktop caído en varias sesiones; sin cluster Kubernetes de prueba real                                                                          | nota                                   |

**Registro complementario, scope Inventario**: `docs/AKB/00 Governance/Issue Register.md` — **22 issues** (`ISSUE-01` a `ISSUE-22`) específicos del dominio de Inventario, generados durante la serie de ADRs. No se solapan con `TECHNICAL_DEBT.md` (ese es operativo/transversal; este es de diseño de dominio). Los de mayor severidad sin resolver: `ISSUE-01` (invariante Lote XOR Serie documentada sin implementar), `ISSUE-02` (RLS sin cobertura de sucursal/almacén), `ISSUE-07` (sin idempotencia en solicitudes de movimiento), `ISSUE-08` (riesgo de deadlock en transferencias concurrentes, mitigado por diseño mas no implementado), `ISSUE-14` (falta `CHECK (remaining_quantity <= original_quantity)` en capas de costo — deuda nueva, del propio Motor de Costeo recién construido), `ISSUE-15` (LIFO sin `source_receipt_line_id`, pierde trazabilidad de origen frente a FIFO).

**Riesgos priorizados** (ambos registros coinciden en el patrón): ningún ítem de deuda abierto bloquea seguir construyendo sobre lo ya aceptado, pero varios se vuelven costosos de corregir una vez haya datos reales de producción (fuga de aislamiento RLS, corrupción de datos bajo concurrencia real sin idempotencia).

---

## 19. Decisiones de Arquitectura

| Decisión                                                                                    | Por qué se eligió                                                                                                         | Qué problema resuelve                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL crudo versionado en vez de `prisma migrate`                                             | Un cliente Prisma monolítico con ~500 modelos colgaba `prisma generate` en la práctica                                    | Permite escalar a 21 schemas independientes sin perder un cliente tipado por dominio                                                                                                         |
| RLS de PostgreSQL para multi-tenant, no filtrado en aplicación                              | Defensa en profundidad — un bug de aplicación no puede filtrar tenant si la BD ya lo hace                                 | Aislamiento real incluso si el código de un módulo olvida filtrar por `tenant_id`                                                                                                            |
| Repository = puerto abstracto + adaptador Prisma, en todos los módulos                      | Desacoplar dominio de infraestructura (Clean Architecture)                                                                | Testear services con mocks sin tocar BD; poder reemplazar el ORM sin tocar dominio                                                                                                           |
| Sin CQRS                                                                                    | Decisión explícita documentada, no una omisión                                                                            | Evita complejidad de sincronización de proyecciones sin evidencia de necesidad real                                                                                                          |
| Sin bus de eventos conectado todavía                                                        | Eventos diseñados pero no publicados — "no construir sin necesidad confirmada"                                            | Evita infraestructura (RabbitMQ) sin consumidor real, ya señalado como deuda si sigue así indefinidamente                                                                                    |
| Jerarquía Empresa→Sucursal→Almacén→Zona→Ubicación sin tablas separadas por nivel            | Confirmado leyendo el código real antes de diseñar (`ADR-INV-007 §3.4`)                                                   | Evita 5 tablas casi idénticas; la auto-referencia ya modela la jerarquía                                                                                                                     |
| "Un motor, N puntos de entrada" (aplicado 3 veces: Trazabilidad, Conteo Cíclico, Analítica) | 25 tipos de genealogía / 23 tipos de conteo / 21 KPIs pedidos, todos resolubles con un único Domain Service parametrizado | Evita 25/23/21 servicios casi idénticos — patrón reutilizable documentado en `Engineering Heuristics`                                                                                        |
| Value Object calculado vs. Aggregate persistido                                             | `DisponibilidadDeInventario` se calcula, nunca se persiste; `SugerenciaDeCompra`/`PropuestaDeConteo` sí se persisten      | Evita mantener sincronizado un valor derivado de 7 tablas desde múltiples puntos de escritura; persiste solo lo que representa una decisión de punto-en-el-tiempo con necesidad de auditoría |
| Ajuste vs. Corrección (nunca reescribir historia)                                           | Edición en período abierto = ajuste in situ; error post-cierre = compensación hacia adelante                              | Mismo principio que el ledger append-only de `stock_movements`: nunca `UPDATE`/`DELETE` retroactivo sobre un hecho ya registrado                                                             |
| Colisión de KPI resuelta con jerarquía de composición, no eligiendo un ganador              | `ADR-INV-006` y `ADR-INV-009` definieron "Inventory Health Score" con fórmulas distintas sin saberlo                      | `ADR-INV-010` lo resuelve como compuesto de sub-scores desambiguados, sin invalidar ningún ADR ya aceptado                                                                                   |
| Motor de Costeo Fase 1 sin conexión automática a `MovimientosService`                       | Evitar arriesgar el comportamiento ya probado del motor de movimientos existente                                          | Costeo queda invocable explícitamente; la integración automática es una fase posterior, deliberadamente diferida                                                                             |
| No tocar schema/BD al construir el Motor de Costeo                                          | Había (y hay) trabajo de otra sesión sin commitear tocando schema Prisma en paralelo                                      | Evita colisión de migraciones concurrentes; `ISSUE-14`/`ISSUE-15` quedan como deuda explícita en vez de un cambio de schema apresurado                                                       |

---

## 20. Continuidad

**Dónde quedó el proyecto**: el Motor de Costeo de Inventario Fase 1 (FIFO/LIFO/Promedio Ponderado, `ADR-INV-004`) está implementado, testeado unitariamente (17/17 en verde) y commiteado (`2b1dc60`) en la rama local `feature/database-finalization` — **no pusheado a `origin`** (la rama está 49 commits adelante). El e2e nuevo (`costeo.controller.e2e-spec.ts`) compila y corre, pero no se pudo verificar contra Postgres real porque Docker Desktop no está activo en el entorno de desarrollo actual.

**Qué módulo sigue**: hay una decisión explícita sin resolver en `NEXT_STEPS.md` entre continuar POS Fase 06 Parte 02 o Inventario Fase 05 Parte 05 (Recepciones/Salidas) — **no asumir cuál, preguntar**. Independientemente de esa decisión, la serie completa de ADRs de Inventario ya diseñados (`ADR-INV-005` a `ADR-INV-010`) son candidatos directos a implementación con el mismo patrón usado para Costeo.

**Qué archivos deben modificarse** (para continuar el patrón ya establecido):

- Nuevo motor de dominio → replicar la estructura de `modules/inventario/backend/{services,repositories,controllers,validators}/costeo.*` (o el equivalente `conteos.*`/`movimientos.*` como referencia de patrón más madura).
- Registrar siempre en `inventario.module.ts` (o el `*.module.ts` del módulo correspondiente) — extendiendo el comentario JSDoc de cabecera, nunca reemplazándolo.
- Nuevo permiso RBAC → agregar a `modules/seguridad/backend/scripts/seed-rbac.ts`.
- Nuevo tipo Prisma expuesto → agregar a `core/database/src/index.ts` (barrel de exports), nunca importar el cliente generado directo desde un módulo de negocio.

**Qué NO debe tocarse sin autorización explícita**:

- `docs/ddd/*.md` — documentación de diseño DDD formal, protegida.
- ADRs ya aceptados (`docs/adr/*.md`) — no se editan retroactivamente; correcciones se documentan como recomendación nueva en Issue Register/Decision Log.
- Archivos de gobernanza compartidos del AKB (`Home.md`, `ADR Index.md`, `Issue Register.md`, `Decision Log.md`) — solo ediciones **aditivas**, nunca reescritura completa (son propiedad compartida con otra sesión de trabajo concurrente sobre el mismo repositorio).
- Schema de base de datos / `docs/database/sql/*.sql` — hay trabajo de otra sesión sin commitear tocando estos archivos en paralelo; cualquier cambio de schema debe evaluarse con cuidado adicional de colisión.
- `git push` / creación o cambio de rama — requieren confirmación explícita separada en cada ocasión, incluso si el trabajo de código ya fue autorizado.

**Convenciones que existen y deben respetarse**:

- Todo el contenido (chat, documentación, comentarios, reportes) en **español**, sin excepción.
- Nunca usar la unidad `C:` para escritura permanente — todo vive en `D:`.
- `git commit` siempre con rutas de archivo explícitas listadas en el propio comando (`git commit "file1" "file2" ... -m "..."`), nunca un `git commit -m` a secas — el índice de git en este repositorio suele tener cambios ajenos sin commitear mezclados.
- Formatear con `npx prettier --write` (idealmente junto con `eslint --fix`, ya que el hook de pre-commit del proyecto corre ambos) antes de commitear, para que no queden diffs residuales solo de formato.
- Reportes de cierre de sesión en formato: completado / archivos / pruebas / % real / riesgos / próximo paso.
- Reality-check antes de escribir código o documentación: verificar qué existe realmente contra el schema/código, nunca asumir.

**Errores a evitar** (aprendidos en esta sesión, documentados para que no se repitan):

- No asumir que el índice de git (`git status`) refleja solo el trabajo propio — este repositorio tiene, de forma recurrente, cientos de archivos de otra sesión concurrente sin commitear mezclados en el índice.
- No usar `git checkout -- <archivo>` a ciegas para "limpiar" una diferencia de formato sin antes verificar si la diferencia real está en el índice o en HEAD — puede restaurar la versión equivocada.
- No dar por sentado que un test e2e "falló" por un bug de código sin antes descartar causas de entorno (Docker/Postgres no disponible es la causa más común en este entorno de desarrollo).
- No inventar cifras de porcentaje de avance — citar siempre la fuente exacta o declarar que no existe la cifra.

---

## 21. Instrucciones para Otra IA

Si eres otra IA (ChatGPT, Gemini, Copilot, u otra instancia de Claude) continuando este proyecto a partir de este documento:

1. **No empieces desde cero.** Este proyecto tiene 504 modelos de base de datos reales, 11 módulos de backend funcionando y una disciplina de arquitectura extensa ya establecida (Clean Architecture + DDD, patrón Repository, RLS multi-tenant). Ignorar eso y proponer una reescritura es un error grave.
2. **No reemplaces la arquitectura existente.** El patrón Repository (puerto abstracto + adaptador Prisma + `withTenantScope`), la estructura de excepciones de dominio (`DomainException`), y el formato de respuesta `{ data, meta }` están aplicados consistentemente en 11 módulos — cualquier código nuevo debe seguir el mismo patrón, verificado leyendo un módulo maduro real (ej. `modules/inventario/backend/services/conteos.service.ts`) antes de escribir, no inventando una convención nueva.
3. **No dupliques módulos ni lógica de negocio.** Antes de crear un servicio nuevo, verifica si ya existe una capacidad equivalente (ej. el patrón "un motor, N puntos de entrada" ya resolvió esto varias veces en Inventario). Grep/busca antes de escribir.
4. **Analiza primero todo el proyecto relevante al pedido**, no solo este documento — este documento es un mapa, no un sustituto de leer el código real cuando vayas a modificarlo. Verifica contra el schema/código actual, porque este documento tiene fecha y puede quedar desactualizado.
5. **Respeta Clean Architecture**: Entities con invariantes propias, Repositories como puertos, Services orquestando, Controllers delgados.
6. **Respeta DDD**: usa la nomenclatura española ya establecida para el dominio (`AjusteStock`, `SolicitudDeMovimiento`, `CapaDeCosto`, etc.), no inventes nombres en inglés para conceptos de negocio que ya tienen nombre.
7. **Respeta SOLID**, en particular la inversión de dependencias ya aplicada vía el patrón Repository — no importes el cliente Prisma directo dentro de un service.
8. **Respeta la base de datos real**: no propongas `prisma migrate` (el proyecto lo evita deliberadamente), no asumas columnas que no verificaste en `core/database/prisma/schemas/*/schema.prisma` o en `docs/database/dictionary/`.
9. **Respeta OpenAPI**: 161 paths / 234 operaciones ya documentados — nueva funcionalidad debe seguir el mismo formato de respuesta y convención de error ya establecidos, documentados en `docs/architecture/07-convenciones-y-estandares.md` (`API Standards` en el AKB).
10. **Continúa exactamente desde el último estado** descrito en [§20](#20-continuidad) — no reordenes el roadmap sin que el usuario lo pida, no toques lo marcado como protegido, y pregunta antes de decidir por tu cuenta entre las dos rutas abiertas (POS vs. Inventario Parte 05).

---

## 22. Estado Final

|                                                                                 |                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Proyecto**                                                                    | GORAZUS ERP Enterprise                                                                                                                                                                                                                                                                                                                                                                         |
| **Versión**                                                                     | Sin consenso interno — última entrada de `CHANGELOG.md`: `v0.24.0` (2026-07-27); trabajo real en Git ya supera esa versión sin documentarla todavía                                                                                                                                                                                                                                            |
| **Porcentaje de avance**                                                        | 11 de 27 módulos de negocio con backend real (41%, corrigiendo la cifra desactualizada de 37% en `PROJECT_STATUS.md`); 5 de esos 11 con frontend real (18% del total de 27); cobertura de schema por módulo variable (ej. Contabilidad 17/28 tablas ≈ 61%, Ventas 13/55 ≈ 24%, Productos 5/35 ≈ 14%) — no existe un % agregado único y oficial del proyecto completo, y no se inventa uno aquí |
| **Módulo actual**                                                               | Motor de Costeo de Inventario, Fase 1 (FIFO/LIFO/Promedio Ponderado) — implementado y commiteado, e2e pendiente de verificar contra Postgres real                                                                                                                                                                                                                                              |
| **Próximo módulo**                                                              | Decisión abierta sin resolver: POS Fase 06 Parte 02 vs. Inventario Fase 05 Parte 05 — o continuar implementando la serie ya diseñada de ADRs de Inventario (`ADR-INV-005` a `ADR-INV-010`)                                                                                                                                                                                                     |
| **Riesgos principales**                                                         | RLS con brecha de sucursal/almacén (`ISSUE-02`); sin idempotencia en solicitudes de movimiento (`ISSUE-07`); 39 vulnerabilidades transitivas de `pnpm audit`; `nx run web:test` roto (0 cobertura real de frontend); documentos de estado (`PROJECT_STATUS.md`, `CHANGELOG.md`, `ROADMAP.md`, `NEXT_STEPS.md`) desincronizados entre sí y respecto al Git real                                 |
| **Prioridades sugeridas** (no una decisión tomada, una lectura de la evidencia) | 1) Sincronizar `CHANGELOG.md`/`ROADMAP.md`/`PROJECT_STATUS.md` con el estado real de Git; 2) resolver la decisión abierta POS vs. Inventario Parte 05; 3) conectar Costeo a `MovimientosService` una vez validado el e2e; 4) evaluar si construir frontend para los 7 módulos con backend real pero sin interfaz operable                                                                      |

---

_Fin del documento. Generado el 2026-08-03 leyendo el proyecto real en `D:\15_Codigo_Fuente\GORAZUS`. Ver también `GORAZUS_CONVERSATION_BACKUP.md` para el historial cronológico de decisiones tomadas durante las sesiones de desarrollo asistidas por IA._
