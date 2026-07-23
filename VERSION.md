# Versión — GORAZUS ERP

Versionado [SemVer](https://semver.org/lang/es/), pre-1.0: `MINOR` marca una fase de trabajo
completa y estable (no un release público), `PATCH` una corrección puntual. `0.0.0` no se usa —
el proyecto arrancó en `0.1.0` (bootstrap del monorepo + FASE 01-05). Sin releases públicos
todavía, así que no hay compromiso de compatibilidad entre versiones `0.x`.

## Versión actual: **0.5.0** (2026-07-22)

FASE 03, Parte 03 — Gestión de Usuarios Enterprise. `MINOR`: CRUD administrativo completo
(editar/eliminar/restaurar/estado agregado/reseteo de contraseña), multiempresa (`core.user_companies`,
wireada sin consumidor desde Enterprise v1.0.0) y preferencias/avatar (`core.user_profiles`, ídem) —
más una corrección de seguridad real (fuga de `password_hash` en 5 endpoints preexistentes). Ver
`USERS_REPORT.md` para el detalle completo, `USERS_SECURITY_REPORT.md` para el hallazgo de
seguridad, `USERS_TEST_REPORT.md` para testing, `USERS_API.md` para referencia de endpoints.

## 0.4.0 (2026-07-22)

FASE 03, Parte 02 — Autenticación Enterprise. `MINOR`, no `PATCH`: a diferencia de Parte 2.1
(aditivo/preparatorio), esta parte agrega funcionalidad real y cambia comportamiento de endpoints
existentes — "recordar sesión", protección de session-hijacking, verificación de empresa/sucursal
activa, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, adopción de la config/JWT
Provider preparados en `0.3.1`. Ver `AUTH_REPORT.md` para el detalle completo,
`AUTH_TEST_REPORT.md` para testing, `JWT_CONFIGURATION.md`/`OPENAPI_AUTH.md` para referencia.

## 0.3.1 (2026-07-22)

FASE 2, Parte 2.1 — Infraestructura del módulo `auth`, preparación sin tocar login. `PATCH`, no
`MINOR`: pedido explícito de esta parte era "no desarrollar aún el login" — todo lo agregado fue
aditivo (Value Object, Domain Events preparados, JWT Provider, `GuestGuard`, config de TTLs), sin
cambiar el comportamiento real de ningún endpoint en su momento (`0.4.0` después adoptó la config
y el JWT Provider). Ver `CHANGELOG.md` para el detalle completo.

> **Nota (2026-07-23)** — FASE 03, Parte 01 fue una auditoría completa del
> proyecto (backend, base de datos, API, deuda técnica) sin ningún cambio
> de código de negocio, así que no incrementó la versión — siguió siendo
> `0.3.1` hasta `0.4.0` (Parte 02, arriba). Ver
> `PROJECT_STATUS.md`/`TECHNICAL_DEBT.md`/`BACKEND_HEALTH_REPORT.md`
> (actualizados esa fecha) para el resultado de esa auditoría.

## 0.3.0 (2026-07-22)

FASE 2 — Backend Core (endurecimiento de `auth` + capacidades nuevas de infraestructura). Ver
`CHANGELOG.md` para el detalle completo. Resumen:

- **Auth — 4 gaps de seguridad reales cerrados**: bloqueo de cuenta tras 5 intentos fallidos en 15
  min (`security.login_attempts`, sin escritor hasta ahora), rate limit propio en `/auth/login`
  (5/60s), revocación de access token al hacer logout (antes seguía válido hasta expirar solo),
  protección CSRF explícita en `/auth/refresh` (único endpoint autenticado solo por cookie).
- **Auth — 2FA exigido en el login**: `LoginUseCase` integraba 2FA como "preparado, no exigido"
  desde 0.2.0 — ahora un usuario con TOTP confirmado no entra solo con contraseña, completa un
  segundo paso (`POST /auth/login/2fa`) con un `challengeToken` de un solo uso.
- **`core/storage` con consumidor real**: `StorageController` (`POST`/`GET`/`DELETE /files`),
  bucket por tenant, URLs firmadas de corta duración — antes existía el wrapper de MinIO sin que
  nada lo llamara.
- **Email real de reset de contraseña**: `EmailPasswordResetNotifier` (SMTP/MailHog) reemplaza al
  notifier que solo dejaba el token en el log — `SMTP_HOST`/`SMTP_PORT` estaban validados desde
  0.1.0 sin consumidor.
- 0 regresiones — toda la suite de `auth`/`seguridad`/`configuracion` re-verificada contra
  Postgres/Redis/MinIO/MailHog reales tras cada cambio.

## Historial

| Versión | Fecha      | Resumen                                                                                                                                                                                                                                                                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.5.0   | 2026-07-22 | FASE 03, Parte 03 — Gestión de Usuarios Enterprise: CRUD admin completo (editar/eliminar/restaurar/estado agregado/reseteo de contraseña), multiempresa (`user_companies`), preferencias/avatar (`user_profiles`), corrección de fuga de `password_hash`.                                                                    |
| 0.4.0   | 2026-07-22 | FASE 03, Parte 02 — Autenticación Enterprise: "recordar sesión", protección de session-hijacking (IP/UA), verificación de empresa/sucursal activa, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, adopción de config/JWT Provider preparados en 0.3.1.                                                            |
| 0.3.1   | 2026-07-22 | FASE 2, Parte 2.1 — Infraestructura de `auth` preparada sin tocar login: Value Object `Email`, Domain Events preparados (sin publicar), JWT Provider, `GuestGuard`, config de TTLs/umbrales (sin consumidor todavía).                                                                                                        |
| 0.3.0   | 2026-07-22 | FASE 2 Backend Core — 4 gaps de seguridad de `auth` cerrados (bloqueo por intentos, rate limit propio, revocación de token, CSRF), 2FA exigido en login, `core/storage` con consumidor real, email real de reset de contraseña.                                                                                              |
| 0.2.0   | 2026-07-21 | FASE 02 — Backend Core (Empresas/Sucursales/Config/Monedas/Impuestos) + extensión de Seguridad (Auditoría/Sesiones/Reset de contraseña/2FA) + Usuarios (perfil/self-service/historial).                                                                                                                                      |
| 0.1.0   | 2026-07-20 | Bootstrap del monorepo + FASE 01-05: Foundation Platform (`core/*`), persistencia (21 clientes Prisma, RLS forzado), primeros módulos de negocio reales (`auth`, `seguridad`), frontend (`apps/web`, `ui-kit`), Notification Center (WhatsApp), Ollama, Kubernetes/monitoreo/HTTPS/backup, testing (Playwright, k6, CodeQL). |

## Próxima versión prevista

`0.6.0` — módulo de negocio Almacenes (`modules/inventario`, único ítem real pendiente de la lista
de prioridad "primero" de FASE 03, ver `ROADMAP.md`), después Productos e Inventario con movimiento
de stock real. Sin fecha comprometida (postergada de `0.5.0` — ese número lo tomó Gestión de
Usuarios Enterprise, Parte 03, en su lugar).

## Versionado del modelo de datos (track independiente)

El **modelo de datos** de GORAZUS tiene su propio track de versión,
independiente del código de aplicación de arriba — un cambio de schema
no necesariamente implica una nueva versión de código, y viceversa.

### Database actual: **Enterprise v1.0.0** (2026-07-21)

Certificación formal tras 8 partes de auditoría exhaustiva (rama
`release/database-v1`) — 501 tablas, 5.164 relaciones, 22 schemas, 94/100
de calificación general. Ver
[docs/database/DATABASE_CERTIFICATION.md](docs/database/DATABASE_CERTIFICATION.md)
para la certificación completa y
[docs/database/DATABASE_CHANGELOG.md](docs/database/DATABASE_CHANGELOG.md)
para el historial de las 8 partes. **A partir de esta versión, el modelo
de datos queda congelado en su estructura fundamental** — todo cambio
estructural futuro requiere una migración versionada (`sql/NN_*.sql`)
que incremente esta versión.
