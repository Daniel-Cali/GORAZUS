# Auth Test Report — FASE 03, Parte 02

> Entregable de esta parte (Autenticación Enterprise). Cubre solo lo
> nuevo/modificado de esta sesión — para el inventario completo de toda
> la suite del backend ver `TEST_REPORT.md`.

## 1. Qué se agregó/modificó

| Archivo                                     | Tipo       | Motivo                                                                                                                                                                                   |
| ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/refresh-token.usecase.spec.ts`    | Nuevo      | `RefreshTokenUseCase` no tenía spec unitario antes de esta parte — ahora tiene lógica nueva (hijacking, empresa/sucursal activa, remember-me) que necesitaba cobertura real, no solo e2e |
| `services/get-current-user.usecase.spec.ts` | Nuevo      | `GetCurrentUserUseCase` es nuevo esta parte                                                                                                                                              |
| `services/validate-token.usecase.spec.ts`   | Nuevo      | `ValidateTokenUseCase` es nuevo esta parte                                                                                                                                               |
| `services/revoke-token.usecase.spec.ts`     | Nuevo      | `RevokeTokenUseCase` es nuevo esta parte                                                                                                                                                 |
| `services/login.usecase.spec.ts`            | Modificado | Nuevo fake de `ConfigService`, nuevas aserciones (`ipAddress`/`userAgent`/`rememberMe` propagados a `IssueLoginSessionService.issue()` y al `TwoFactorChallenge`)                        |

Mismo patrón que el resto del proyecto: fakes mínimos del colaborador
exacto que la clase bajo prueba necesita, nunca un mock framework
genérico; nada de infraestructura real en los `*.usecase.spec.ts`.

## 2. Cobertura de la lógica nueva — por caso

**`RefreshTokenUseCase`** (9 tests): rotación exitosa con IP/UA
coincidente; sesión inexistente/revocada/expirada (3 casos,
`SesionInvalidaException`); IP distinta con `AUTH_STRICT_SESSION_
VALIDATION=false` (warning, sin rechazo) y `=true` (rechazo,
`SesionSospechosaException`); empresa inactiva (`EmpresaInactivaException`);
sucursal inactiva (`SucursalInactivaException`); preservación del TTL
largo de "recordar sesión" a través de la rotación.

**`GetCurrentUserUseCase`** (2 tests): identidad devuelta correctamente;
usuario inexistente (`UsuarioNoEncontradoException`).

**`ValidateTokenUseCase`** (6 tests): sesión válida; usuario
inactivo/inexistente (mismo tratamiento, `UsuarioInactivoException`);
empresa/sucursal inactiva (2 casos); `companyId`/`branchId` en `null` no
dispara la verificación (no llama al repositorio).

**`RevokeTokenUseCase`** (5 tests): revocar una sesión propia (marca
Redis); `sessionId` de otro usuario (`SesionNoEncontradaException`, sin
enumeración); `sessionId` inexistente (mismo error); `sessionId` ya
revocado (`revokedSessions: 0`, no reintenta); sin `sessionId` revoca
todas las activas y marca cada una en Redis.

**`LoginUseCase`** (actualizado, 6 tests preexistentes siguen pasando):
umbral/ventana de bloqueo y TTL del desafío 2FA ahora vienen de un fake
de `ConfigService` en vez de constantes; nueva aserción de que
`ipAddress`/`userAgent`/`rememberMe` se propagan tanto al emitir sesión
directa como al armar el `TwoFactorChallenge`.

## 3. Corrida real de esta sesión

Igual que la sesión de auditoría previa (`TEST_REPORT.md §2`), `Docker
Desktop` siguió sin conectar (`failed to connect to the docker API`,
nivel host de Windows) durante toda esta parte — confirmado al inicio
con `docker ps` y no resuelto en el transcurso de la sesión.

```
auth-backend (unitarios, --runInBand): 53/53 ✅
  10 suites: value-objects/email.vo, events/auth-domain-events,
  services/jwt-token.provider, services/login.usecase,
  services/refresh-token.usecase (nuevo), services/get-current-user.usecase
  (nuevo), services/validate-token.usecase (nuevo),
  services/revoke-token.usecase (nuevo), entities/usuario.entity,
  entities/sesion.entity

4 suites e2e fallaron con ECONNREFUSED/Can't reach database server
(auth.controller.e2e-spec, two-factor-login.e2e-spec,
email-password-reset-notifier.spec, y un cuarto de la misma familia) —
consistente con Docker caído, no con una regresión: ninguno de esos 4
suites prueba código nuevo de esta parte que no esté YA cubierto a nivel
unitario arriba.
```

Build (`nx run auth-backend:build`) y lint (`nx run auth-backend:lint`)
✅ limpios. `nx run api:build` (type-checkea `apps/api` + las 17 tareas de
las que depende, incluido todo `core/*` y los 3 módulos de negocio) ✅
sin errores — confirma que los cambios de `auth.config.ts`/
`env.schema.ts` no rompieron ningún otro consumidor.

## 4. Pendiente de re-confirmar cuando Docker esté arriba

Los 4 endpoints existentes que SÍ cambiaron de comportamiento
(`POST /auth/login` con `rememberMe`/User-Agent, `POST /auth/refresh` con
hijacking + empresa/sucursal activa) y los 3 nuevos (`GET /auth/me`,
`GET /auth/session`, `POST /auth/revoke`) están cubiertos a nivel
unitario (con fakes) pero **no** con un e2e real contra Postgres/Redis —
mismo patrón de riesgo ya documentado y aceptado en `TEST_REPORT.md §5`
para la sesión anterior (riesgo estructuralmente bajo: la lógica de
negocio está probada, lo que falta es la integración real con Prisma/RLS/
Redis). Primera acción recomendada la próxima vez que Docker esté
disponible: `pnpm nx run auth-backend:test -- --runInBand` completo,
seguido de una prueba manual de los 3 endpoints nuevos vía `curl`/Postman
contra un tenant de prueba real.
