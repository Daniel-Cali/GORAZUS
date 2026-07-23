# Auth — Guía rápida

> Fase 2, Parte 2.1. Cómo trabajar con `modules/auth/backend` en el día a
> día. Para el diseño ver [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md);
> para el flujo paso a paso ver [AUTH_FLOW.md](./AUTH_FLOW.md).

## 1. Variables de entorno que necesita

| Variable                           | Requerida | Default                 | Para qué                                                                        |
| ---------------------------------- | :-------: | ----------------------- | ------------------------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`                |    ✅     | —                       | Firma del access token                                                          |
| `JWT_REFRESH_SECRET`               |    ✅     | —                       | Reservada — el refresh token real es aleatorio, no un JWT (ver AUTH_FLOW.md §2) |
| `SEGURIDAD_ENCRYPTION_KEY`         |    ✅     | —                       | Cifra el secreto TOTP (2FA) — hex de 64 caracteres                              |
| `SMTP_HOST`/`SMTP_PORT`            |    ✅     | —                       | Envío real del email de reset de contraseña                                     |
| `CORS_ORIGIN`                      |    No     | `http://localhost:5173` | Origen permitido — también valida `Origin` en `/auth/refresh`                   |
| `JWT_ACCESS_TTL`                   |    No     | `15m`                   | Preparada (Parte 2.1) — sin consumidor todavía                                  |
| `JWT_REFRESH_TTL_DAYS`             |    No     | `7`                     | Preparada — sin consumidor todavía                                              |
| `LOGIN_LOCKOUT_THRESHOLD`          |    No     | `5`                     | Preparada — sin consumidor todavía                                              |
| `LOGIN_LOCKOUT_WINDOW_MINUTES`     |    No     | `15`                    | Preparada — sin consumidor todavía                                              |
| `TWO_FACTOR_CHALLENGE_TTL_MINUTES` |    No     | `5`                     | Preparada — sin consumidor todavía                                              |

Ver `.env.example` para el archivo completo. Todas fallan rápido al boot
si faltan (`core/config/env.schema.ts`, `validateEnv`) — nunca un error
críptico a mitad de request.

## 2. Correr los tests

```bash
# Unitarios (fakes, sin infraestructura real) — rápido
pnpm nx test auth-backend --testPathPattern="usecase|entity|vo\.spec|jwt-token"

# Con infraestructura real (Postgres/Redis/MailHog vía Docker) — más lento,
# --runInBand evita saturar memoria si corrés varios e2e reales a la vez
pnpm nx test auth-backend -- --runInBand
```

Requiere `docker compose up postgres redis rabbitmq minio mailhog` arriba
para los `*.e2e-spec.ts` — los `*.spec.ts` puros (entidades, VOs, casos de
uso con fakes) no lo necesitan.

## 3. Archivos que probablemente edites

| Tarea                                    | Archivo(s)                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| Agregar un endpoint nuevo                | `controllers/auth.controller.ts` + `validators/*.schema.ts`                          |
| Cambiar la lógica de login               | `services/login.usecase.ts` (y su spec)                                              |
| Agregar un tipo de intento/bloqueo nuevo | `repositories/login-attempt.repository.ts` + `.prisma.ts`                            |
| Cambiar cómo se emiten los tokens        | `services/issue-login-session.service.ts`                                            |
| Agregar un canal de notificación nuevo   | `services/password-reset-notifier.port.ts` + nueva implementación                    |
| Adoptar el `Email` VO en `Usuario`       | `entities/usuario.entity.ts` (usar `value-objects/email.vo.ts`) — Parte 2.2          |
| Conectar los TTLs configurables          | Reemplazar las constantes hardcodeadas por `configService.get('auth.*')` — Parte 2.2 |

## 4. Errores comunes

- **"Nest can't resolve dependency of JwtStrategy (?)"** en un test que
  arma su propio `Test.createTestingModule` con `HttpModule` — falta
  `CacheModule` en el array de `imports` (la revocación de sesión hace
  que `JwtStrategy` dependa de `CacheService`, ver `TEST_REPORT.md` de
  la sesión anterior).
- **429 en `/auth/login` en medio de una suite de tests** — el límite
  propio del endpoint es 5 req/60s; si tu test hace varios logins
  seguidos en el mismo archivo, consolidalos en un solo `it()` en vez de
  pedir un login nuevo por test.
- **`ECONNREFUSED`/`Can't reach database server`** — Docker no está
  arriba, o el daemon no está corriendo (`docker ps` para confirmar). No
  es un bug del código.

## 5. No confundir con `modules/seguridad`

`auth` = autenticación (¿quién sos?): login, refresh, logout, 2FA en el
login, reset de contraseña. `seguridad` = autorización + administración
(¿qué podés hacer?, gestión de usuarios/roles/permisos/auditoría/2FA
setup). El _setup_ de 2FA (generar el secreto, confirmar, deshabilitar)
vive en `seguridad`; _exigir_ 2FA durante el login vive en `auth`. Ver
`docs/architecture/04-catalogo-modulos-negocio.md` para el porqué de la
separación.
