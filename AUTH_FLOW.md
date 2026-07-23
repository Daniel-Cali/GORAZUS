# Auth — Flujos reales

> Actualizado FASE 03, Parte 02 (Autenticación Enterprise). Flujos tal
> como el código los implementa hoy — no el diseño original especulativo
> (ver
> [docs/architecture/13-modulo-auth.md](./docs/architecture/13-modulo-auth.md),
> que diverge en algunos nombres/status codes, nota agregada esta sesión
> en su cabecera). Ver `OPENAPI_AUTH.md` para el contrato completo de
> cada endpoint (request/response/errores) y `docs/api/API.md`.

## 1. Login sin 2FA

```
Cliente → POST /auth/login { tenantSlug, email, password, rememberMe? }
  LoginUseCase:
    1. Resuelve tenant por slug — no existe → 401 CREDENCIALES_INVALIDAS
    2. Cuenta fallos recientes (ventana configurable, default 15 min) para
       (tenant, email) → >=umbral (default 5) → 429 CUENTA_BLOQUEADA (sin
       llegar a buscar el usuario)
    3. Busca el usuario — no existe / inactivo / password incorrecta
       → registra el intento como fallido → 401 CREDENCIALES_INVALIDAS
       (mismo código en los 3 casos — anti-enumeración)
    4. Password correcta → registra el intento como exitoso
    5. ¿Tiene 2FA confirmado? NO → IssueLoginSessionService.issue()
       → crea sesión (core.sessions, con ip_address/user_agent del
       request) + firma access token. Refresh token con TTL largo
       (JWT_REMEMBER_ME_TTL_DAYS) si rememberMe=true, TTL estándar si no.
← 200 { data: { accessToken, user, activeCompanyId, activeBranchId } }
  + cookie httpOnly `refreshToken` (SameSite=Strict, path=/api/v1/auth)
```

## 2. Login con 2FA confirmado

```
Cliente → POST /auth/login { tenantSlug, email, password }
  LoginUseCase: pasos 1-4 iguales a §1
    5. ¿Tiene 2FA confirmado? SÍ →
       - Genera challengeToken (UUID), lo guarda en Redis
         (userId+tenantId+email, TTL 5 min)
       - NO crea sesión, NO firma access token todavía
← 200 { data: { requiresTwoFactor: true, challengeToken } }
  (sin cookie)

Cliente → POST /auth/login/2fa { challengeToken, code }
  CompleteTwoFactorLoginUseCase:
    1. Busca el challenge en Redis — no existe/expiró → 401 DESAFIO_DOS_FACTORES_INVALIDO
    2. Lo borra de Redis (de un solo uso, importe o no el resultado de abajo)
    3. Busca la credencial 2FA confirmada del usuario
    4. Descifra el secreto TOTP, verifica el código
       → no coincide → 400 CODIGO_DOS_FACTORES_INVALIDO
    5. Código correcto → IssueLoginSessionService.issue() (igual que §1 paso 5)
← 200 { data: { accessToken, user, ... } } + cookie de refresh
```

## 3. Refresh

```
Cliente → POST /auth/refresh (cookie httpOnly, sin body)
  AuthController.refresh():
    0. Si viene header Origin y no matchea CORS_ORIGIN → 403
    1. Sin cookie → 401 SESION_INVALIDA
  RefreshTokenUseCase:
    2. Hash del refresh token → busca la sesión — no existe/vencida/revocada
       → 401 SESION_INVALIDA
    3. IP/User-Agent del request vs. los guardados en la sesión:
       distintos → siempre warning; además rechaza con 401 SESION_SOSPECHOSA
       si AUTH_STRICT_SESSION_VALIDATION=true (default false)
    4. company_id/branch_id de la sesión (si no son null) → ¿siguen
       activos? NO → 403 EMPRESA_INACTIVA / 403 SUCURSAL_INACTIVA
    5. Rota: nuevo refresh token (aleatorio 256 bits, TTL preservado si
       la sesión original era "recordar sesión" — heurística de
       duración, JWT_CONFIGURATION.md §3) + nuevo access token
← 200 { data: { accessToken } } + cookie de refresh rotada
```

## 3.1. Usuario actual / validar sesión / revocar

```
Cliente → GET /auth/me (Authorization: Bearer)
  GetCurrentUserUseCase: busca el usuario por context.userId
    → no existe → 404 USUARIO_NO_ENCONTRADO
← 200 { data: { id, email, fullName, isActive, lastLoginAt, tenantId,
  activeCompanyId, activeBranchId } }

Cliente → GET /auth/session (Authorization: Bearer)
  ValidateTokenUseCase: usuario inactivo/inexistente → 403 USUARIO_INACTIVO
    empresa/sucursal activa inactiva → 403 EMPRESA_INACTIVA/SUCURSAL_INACTIVA
← 200 { data: { valid: true, userId, tenantId, sessionId,
  activeCompanyId, activeBranchId } }

Cliente → POST /auth/revoke { sessionId? } (Authorization: Bearer)
  RevokeTokenUseCase:
    - Con sessionId: busca la sesión, verifica que sea del usuario
      autenticado → no es suya/no existe → 404 SESION_NO_ENCONTRADA
      (mismo mensaje en ambos casos). Revoca solo esa.
    - Sin sessionId: revoca TODAS las sesiones activas del usuario
      ("cerrar sesión en todos los dispositivos")
    - En ambos casos: además de core.sessions.revoked_at, marca cada
      sessionId afectado en la blacklist de Redis — el/los access
      token(s) ya emitidos dejan de servir de inmediato
← 200 { data: { revokedSessions: number } }
```

## 4. Logout

```
Cliente → POST /auth/logout (Authorization: Bearer <accessToken>)
  LogoutUseCase:
    1. Marca la sesión revocada en core.sessions (revoked_at)
    2. Marca el sessionId revocado en Redis (TTL = vida del access token)
       — esto es lo que hace que el access token deje de servir DE INMEDIATO,
       no recién cuando expire solo
← 204, cookie de refresh limpiada

Reuso del mismo access token después de esto:
  JwtStrategy.validate() consulta Redis, lo encuentra revocado → 401
```

## 5. Recuperación de contraseña

```
Cliente → POST /auth/forgot-password { tenantSlug, email }
  ForgotPasswordUseCase:
    - Tenant/email inexistente → igual responde 200 (anti-enumeración)
    - Email existente → genera token, lo guarda hasheado (core.tokens,
      purpose=password_reset, TTL 30 min), llama a PasswordResetNotifier
  EmailPasswordResetNotifier: manda un email real por SMTP con el link
    ${CORS_ORIGIN}/reset-password?tenant=...&token=...
← 200 { data: { message: "Si el correo existe..." } } (siempre, sin importar el caso real)

Cliente → POST /auth/reset-password { tenantSlug, token, newPassword }
  ResetPasswordUseCase:
    - Token inválido/usado/expirado → 400 (mensaje genérico)
    - Válido → fija la nueva contraseña, marca el token usado,
      revoca TODAS las sesiones activas del usuario
← 200 { data: { message: "Contraseña actualizada correctamente." } }
```

## 6. Qué NO existe todavía

- Detección de reuso de refresh token (revocar toda la familia de
  sesiones ante un token ya rotado reutilizado) — `RefreshTokenUseCase`
  ya documenta esto como gap conocido en su propio comentario de cabecera.
- Login por username — `core.users` no tiene esa columna, gap
  deliberadamente documentado en vez de implementado (`AUTH_REPORT.md §4`).
- Publicación real de los Domain Events preparados en Parte 2.1
  (`modules/auth/backend/events/`) — nadie los instancia ni los publica
  todavía.
- OAuth2, API Keys — diseñados en `docs/architecture/13-modulo-auth.md`
  §3 y §10, sin una sola línea de código.
- `/auth/switch-context` (cambio de empresa/sucursal activa) — contrato
  asumido por el frontend, sin endpoint real (`CHANGELOG.md`, "Pendiente
  conocido").
