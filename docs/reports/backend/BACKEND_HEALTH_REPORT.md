# Backend Health Report — GORAZUS ERP

> FASE 03 — Backend Core Enterprise, Parte 01 (auditoría). Sesión del
> 2026-07-23, versión **0.3.1**, rama `gorazus2`. Snapshot de estado
> ACTUAL del backend completo (no solo lo que cambió en una sesión
> puntual — para eso ver `CHANGELOG.md`). Reemplaza como fuente de
> verdad al `BACKEND_HEALTH_REPORT.md` anterior (sesión de
> infraestructura, 2026-07-21), que quedaba desactualizado.

## 1. Compila y pasa lint — verificado esta sesión

| Chequeo                                                                                                                                   |                 Resultado                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------: |
| `nx build api` (grafo completo, 17+ tareas dependientes)                                                                                  |                ✅ compila                 |
| `nx lint` — `api`, `auth-backend`, `seguridad-backend`, `configuracion-backend`, `core-http`, `core-config`, `core-storage`, `core-cache` |               ✅ 0 errores                |
| `git status` / `git fetch` contra `origin/gorazus2`                                                                                       | ✅ limpio, sin cambios remotos pendientes |

## 2. Servicios de infraestructura

| Servicio   | Última verificación real                                                                           |                 Estado ahora                 |
| ---------- | -------------------------------------------------------------------------------------------------- | :------------------------------------------: |
| PostgreSQL | Sesión anterior (Parte 2.1) — 127 tests contra él, incl. `login_attempts`/`two_factor_credentials` | ⏳ Docker no disponible esta sesión, ver §4  |
| Redis      | Sesión anterior — lockout, blacklist de sesión, challenge 2FA                                      |                   ⏳ ídem                    |
| MinIO      | Sesión "Backend Core" — upload/URL firmada/borrado reales                                          |                   ⏳ ídem                    |
| MailHog    | Sesión "Backend Core" — email real capturado y verificado                                          |                   ⏳ ídem                    |
| RabbitMQ   | Container sano en sesiones previas, sin productor/consumidor real                                  | ⏳ ídem, sin cambio funcional de todos modos |

## 3. Módulos de negocio — estado real de código

| Módulo             | Backend                                                                               | Tests reales (última corrida completa) |
| ------------------ | ------------------------------------------------------------------------------------- | -------------------------------------- |
| `auth`             | ✅ Login, 2FA exigido, refresh+CSRF, logout+revocación, reset de contraseña por email | 33                                     |
| `seguridad`        | ✅ RBAC, usuarios, auditoría, sesiones, 2FA (setup)                                   | 46                                     |
| `configuracion`    | ✅ Empresas, Sucursales, Parámetros, Monedas, Impuestos                               | 35                                     |
| `core/storage`     | ✅ Infraestructura (no es un módulo de negocio)                                       | 3                                      |
| Resto (24 módulos) | ❌ Carpetas escafoldadas, sin backend                                                 | 0                                      |

**127 tests totales** en los 4 paquetes con código real — 31 de ellos
(unitarios puros, sin infraestructura) re-verificados en esta misma
sesión. El resto (e2e/integración contra Postgres/Redis/MinIO/MailHog
reales) tiene su última corrida completa confirmada en la sesión previa
(Parte 2.1, 2026-07-22) — ver §4 para por qué no se re-corrieron hoy.

## 4. Limitación de esta sesión: Docker Desktop no disponible

Durante toda esta sesión, `docker ps` devuelve
`failed to connect to the docker API at npipe:...` — el daemon de Docker
Desktop no responde a nivel del host Windows, algo que este entorno de
agente no puede reiniciar ni diagnosticar más allá de confirmar que el
problema es del host, no del proyecto (mismo síntoma exacto que ya se
documentó al cierre de la sesión anterior, sin resolverse entre
sesiones).

**Qué se pudo verificar sin Docker** (todo ✅): compilación completa del
grafo, lint de los 8 paquetes principales, los 31 tests unitarios puros
de `auth-backend` (Value Object, eventos, JWT provider, entidades, casos
de uso con fakes), auditoría de dependencias (`pnpm audit`, no necesita
infraestructura).

**Qué NO se pudo re-verificar hoy**: los ~96 tests restantes que
requieren Postgres/Redis/MinIO/MailHog reales. No hay razón para creer
que fallarían — ningún archivo de código de negocio cambió desde la
última corrida completa exitosa (esta sesión fue de auditoría, sin
desarrollo, ver `PROJECT_STATUS.md`) — pero tampoco se puede afirmar
"127/127 verificados hoy" con honestidad. Recomendación operativa: correr
`pnpm nx run-many -t test -- --runInBand` completo la próxima vez que
Docker esté disponible, antes de empezar cualquier desarrollo nuevo
(Almacenes, per `ROADMAP.md`).

## 5. No verificado esta sesión (sin relación con Docker)

- Kubernetes (`infra/kubernetes/`) — sin cambios, no re-verificado.
- Ejecución real de un workflow de GitHub Actions — corregidos en una
  sesión previa (rama `main` → `gorazus2`), sin un run real disparado
  desde este entorno.
