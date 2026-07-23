# Auth — Flujos reales

> Fase 2, Parte 2.1. Flujos tal como el código los implementa hoy — no
> el diseño original especulativo (ver
> [docs/architecture/13-modulo-auth.md](./docs/architecture/13-modulo-auth.md),
> que diverge en algunos nombres/status codes, nota agregada esta sesión
> en su cabecera). Ver `docs/api/API.md` para la referencia de cada
> endpoint.

## 1. Login sin 2FA

```
Cliente → POST /auth/login { tenantSlug, email, password }
  LoginUseCase:
    1. Resuelve tenant por slug — no existe → 401 CREDENCIALES_INVALIDAS
    2. Cuenta fallos recientes (15 min) para (tenant, email)
       → >=5 → 429 CUENTA_BLOQUEADA (sin llegar a buscar el usuario)
    3. Busca el usuario — no existe / inactivo / password incorrecta
       → registra el intento como fallido → 401 CREDENCIALES_INVALIDAS
       (mismo código en los 3 casos — anti-enumeración)
    4. Password correcta → registra el intento como exitoso
    5. ¿Tiene 2FA confirmado? NO → IssueLoginSessionService.issue()
       → crea sesión (core.sessions) + firma access token (15m)
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
    3. Rota: nuevo refresh token (aleatorio 256 bits) + nuevo access token
← 200 { data: { accessToken } } + cookie de refresh rotada
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

## 6. Qué NO existe todavía (Parte 2.2 en adelante)

- Detección de reuso de refresh token (revocar toda la familia de
  sesiones ante un token ya rotado reutilizado) — `RefreshTokenUseCase`
  ya documenta esto como gap conocido en su propio comentario de cabecera.
- Publicación real de los Domain Events preparados esta sesión
  (`modules/auth/backend/events/`) — nadie los instancia ni los publica
  todavía.
- OAuth2, API Keys — diseñados en `docs/architecture/13-modulo-auth.md`
  §3 y §10, sin una sola línea de código.
- `/auth/switch-context` (cambio de empresa/sucursal activa) — contrato
  asumido por el frontend, sin endpoint real (`CHANGELOG.md`, "Pendiente
  conocido").
