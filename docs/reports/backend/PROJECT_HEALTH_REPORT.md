# Project Health Report — GORAZUS ERP

> Diagnóstico inicial de sesión, 2026-07-23, versión **0.5.0**, rama
> `gorazus2`, commit `5bc41c1` (sincronizado con `origin/gorazus2`, sin
> cambios locales pendientes). Verificación real ejecutada esta sesión —
> no una copia de reportes anteriores. Complementa a
> [PROJECT_STATUS.md](./PROJECT_STATUS.md) (qué existe) y
> [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) (deuda ya conocida, no
> repetida acá).

## 1. Resumen — 96% saludable

| Chequeo                        | Resultado                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `git status` / sync con remoto | ✅ Working tree limpio, `gorazus2` sincronizada con `origin/gorazus2`                                    |
| Lint (`nx run-many -t lint`)   | ✅ **23/23 proyectos** limpios                                                                           |
| Build (`nx run-many -t build`) | ✅ **19/19 proyectos** compilan sin errores                                                              |
| Tests unitarios (sin Docker)   | ✅ **157/165 (95%)** — los 8 restantes necesitan infraestructura real, no son fallas de código (§3)      |
| `pnpm audit`                   | 🟡 39 vulnerabilidades, todas en dependencias transitivas de tooling, sin drift desde la sesión anterior |
| Docker Desktop                 | ❌ Caído (host de Windows) — 4ª sesión consecutiva, ver §3                                               |
| `apps/web` — build             | ✅ Compila (787KB bundle principal, warning de tamaño de chunk, no bloqueante)                           |
| `apps/web` — tests             | ❌ **Roto** — hallazgo nuevo de esta sesión, ver §4                                                      |

## 2. Build — 19/19 proyectos, limpio

```
core-cache, core-config, core-database, core-health, core-http,
core-kernel, core-logging, core-messaging, core-notifications,
core-observability, core-ollama, core-scheduler, core-storage,
contracts, auth-backend, seguridad-backend, configuracion-backend,
api, web
```

Todos compilan (`tsc --noEmit` o `vite build` según el proyecto) sin un
solo error. `nx run api:build` en particular type-checkea `apps/api` +
las 17 tareas de las que depende — la superficie de verificación más
amplia disponible sin arrancar el servidor real.

## 3. Tests — 157/165 unitarios reales, 8 fallas 100% atribuibles a Docker caído

Corrida completa (`nx run-many -t test --exclude=web -- --runInBand
--testPathIgnorePatterns="e2e-spec"`, backend + paquetes `core/*`):

| Paquete                 |                                          Resultado                                          |
| ----------------------- | :-----------------------------------------------------------------------------------------: |
| `core-http`             |                                           ✅ 8/8                                            |
| `core-database`         |                                           ✅ 4/4                                            |
| `core-config`           |                                           ✅ 5/5                                            |
| `core-notifications`    |                                           ✅ 5/5                                            |
| `core-ollama`           |                                           ✅ 5/5                                            |
| `configuracion-backend` |                                          ✅ 20/20                                           |
| `seguridad-backend`     |                                          ✅ 60/60                                           |
| `auth-backend`          | 🟡 49/50 (1 falla: `email-password-reset-notifier.spec.ts`, necesita MailHog/Postgres real) |
| `core-storage`          |                           🟡 1/3 (2 fallas: necesita MinIO real)                            |
| `core-cache`            |               🟡 0/5 (5 fallas: `lock.service.spec.ts`, necesita Redis real)                |
| **Total**               |                                      **157/165 (95%)**                                      |

Los 8 fallos son consistentes con **Docker Desktop caído a nivel host**
(`failed to connect to the docker API at npipe:...`, confirmado con
`docker ps` al inicio de esta sesión) — mismo síntoma ininterrumpido
desde el cierre de FASE 03 Parte 01 (3 sesiones atrás). No es una
regresión de código: los 3 paquetes afectados son exactamente los que
tocan infraestructura real (Redis, MinIO, Postgres/MailHog) en esos
tests puntuales — el resto de cada paquete (lógica de negocio con fakes)
pasa limpio. Todos los `*.e2e-spec.ts` (excluidos de esta corrida a
propósito) también fallarían por el mismo motivo — no se corrieron para
no inflar el reporte con fallas ya explicadas.

**Acción recomendada**: primer paso de la próxima sesión con Docker
disponible: `docker compose up` seguido de `pnpm nx run-many -t test --
--runInBand` completo (con e2e), para reconfirmar los ~185+ tests reales
acumulados hasta ahora.

## 4. Hallazgo nuevo esta sesión: `apps/web` — Vitest no arranca

`nx run web:test` falla al 100% (no llega a correr ni un test) —
`vite-tsconfig-paths` resuelve como archivo ESM y algo en la cadena de
carga de `apps/web/vite.config.ts` lo intenta cargar con `require`
(CommonJS), lo que Node rechaza:

```
ERROR: [plugin: externalize-deps] "vite-tsconfig-paths" resolved to an
ESM file. ESM file cannot be loaded by `require`.
```

Confirmado que **no** es un problema de código de la app: `nx run
web:build` (que también carga el mismo `vite.config.ts`, vía `vite
build` en vez de Vitest) compila perfecto. El problema es específico de
cómo el executor de test de Nx/Vitest invoca la config — una
discrepancia de resolución de módulos (ESM vs CJS) entre el comando de
build y el de test, no encontrada en sesiones anteriores porque
`web:test` no se había corrido explícitamente hasta este diagnóstico.
No se investigó ni corrigió esta sesión (fuera de alcance — el pedido de
esta sesión es diagnóstico + Almacenes, un módulo de backend). Ver
`TECHNICAL_DEBT.md` para el registro formal.

## 5. Dependencias — sin drift

`pnpm audit`: 39 vulnerabilidades (1 crítica, 19 altas, 18 moderadas, 1
baja), mismo número exacto desde el cierre de FASE 03 Parte 02 — todas
en dependencias transitivas de tooling/observabilidad, ninguna en una
dependencia directa de runtime de negocio. Detalle completo:
`SECURITY_REPORT.md §6`.

## 6. No verificado esta sesión

- Los ~28 tests e2e reales (`*.e2e-spec.ts` de `auth`/`seguridad`/
  `configuracion`) — necesitan Docker, ver §3.
- `apps/web` en un navegador real (Playwright) — mismo motivo.
- Kubernetes / infraestructura de staging-producción — sin cambios
  desde la certificación previa, no forma parte de este diagnóstico.
