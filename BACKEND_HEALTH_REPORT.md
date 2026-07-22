# Backend Health Report — GORAZUS ERP

> Fase 2 — Desarrollo del Backend Core. Sesión del 2026-07-22, rama `gorazus2`,
> versión **0.3.0**. Estado real de la infraestructura verificado al cierre de
> la sesión, no una foto de intención. Complementa a
> [BACKEND_INFRASTRUCTURE_REPORT.md](./BACKEND_INFRASTRUCTURE_REPORT.md)
> (sesión de infraestructura previa) sin repetirlo.

## 1. Compila y arranca

| Chequeo                                       | Resultado                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `nx build api` (grafo completo, 17 tareas)    | ✅ compila                                                                 |
| `nx lint` (todos los paquetes tocados)        | ✅ sin errores                                                             |
| Arranque real (`ts-node` directo, sin Docker) | ✅ boot completo contra Postgres/Redis/RabbitMQ/MinIO/MailHog reales       |
| `GET /health/live`                            | ✅ `{"status":"ok"}`                                                       |
| `GET /health/ready`                           | ✅ agrega Postgres/Redis/RabbitMQ (`core/health`), sin cambios esta sesión |

## 2. Servicios de infraestructura — estado real, no supuesto

| Servicio   | Verificado cómo                                                                                                                                    | Estado         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| PostgreSQL | 117+ tests de esta sesión corriendo contra él, incluyendo escritura real en `security.login_attempts`, `security.two_factor_credentials`.          | ✅ Sano        |
| Redis      | `LoginAttemptRepository`/lockout, blacklist de sesión revocada, challenge de 2FA — los tres nuevos, los tres probados contra Redis real (no mock). | ✅ Sano        |
| MinIO      | `StorageController` nuevo — subida/URL firmada/borrado probados contra MinIO real (`core/storage/storage.controller.spec.ts`).                     | ✅ Sano        |
| MailHog    | `EmailPasswordResetNotifier` — correo real enviado y verificado leyendo la API de MailHog (`:8025/api/v2`).                                        | ✅ Sano        |
| RabbitMQ   | Sin cambios esta sesión — sigue sin consumidor real (ver `BACKEND_INFRASTRUCTURE_REPORT.md` §6).                                                   | ⚪ Sin cambios |

## 3. Incidente encontrado y documentado (no un bug de código)

`docker-api-1` (contenedor de 29+ horas de antigüedad) resultó estar corriendo
**sin ningún volumen montado** (`docker inspect` → `"Binds": null`) — una
imagen congelada de hace más de un día, no el contenedor de desarrollo con
hot-reload que documentan `docker-compose.dev.yml`. Ningún cambio de esta
sesión (ni de la sesión de infraestructura previa) se reflejaba ahí. No se
tocó ese contenedor — toda la verificación real de esta sesión se hizo con
dos vías independientes que sí reflejan el código actual:

1. `nx test`/`nx build` — Jest/tsc corriendo en el host, contra los mismos
   Postgres/Redis/RabbitMQ/MinIO/MailHog expuestos por Docker (puertos
   publicados, no el contenedor `api` en sí).
2. `node_modules/.bin/ts-node --transpile-only apps/api/src/main.ts` corrido
   directo en el host (mismo comando que usa la imagen de producción,
   `apps/api/Dockerfile`) — boot real, usado para regenerar
   `docs/api/openapi.json` con las rutas nuevas (ver
   [OPENAPI_REPORT.md](./OPENAPI_REPORT.md)).

## 4. Memoria — limitación conocida de este sandbox, no del código

Correr la suite completa de un paquete con `nx test <proyecto>` (sin
`--runInBand`) satura la memoria de este entorno cuando hay 5+ archivos de
test e2e reales corriendo en paralelo (cada uno levanta su propia app Nest +
conexiones reales). **Cada archivo individual, y la suite completa corrida
con `--runInBand`, pasa limpio** — confirmado para `auth-backend` (33/33),
`seguridad-backend` (46/46), `configuracion-backend` (35/35), `core-storage`
(3/3). Detalle en [TEST_REPORT.md](./TEST_REPORT.md). Mismo patrón ya
documentado en la sesión de infraestructura previa — no es nuevo ni se
originó en el código de esta sesión.

## 5. No verificado esta sesión

- Kubernetes (`infra/kubernetes/`) — sin cambios, no re-verificado.
- CI real (GitHub Actions) — los workflows se corrigieron la sesión anterior
  (rama `main` inexistente → `gorazus2`), pero un run real en GitHub no se
  disparó desde acá (fuera del alcance de un entorno de agente local).
