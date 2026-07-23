# Auth Structure — GORAZUS ERP

> Actualizado FASE 03, Parte 02 (Autenticación Enterprise). Árbol real de
> `modules/auth/backend/` a 2026-07-22 — generado a partir del
> filesystem, no de intención. `🆕` = nuevo esta parte.

```
modules/auth/backend/
├── auth.module.ts                          # Wiring de Nest — providers, controllers
│
├── controllers/                            # Presentation
│   ├── auth.controller.ts                    # POST login/login/2fa/refresh/logout/revoke, GET me/session, POST forgot-password/reset-password
│   ├── auth.controller.e2e-spec.ts
│   ├── password-reset.e2e-spec.ts
│   └── two-factor-login.e2e-spec.ts
│
├── dto/                                    # Presentation — forma de respuesta (Swagger)
│   └── login-response.dto.ts                 # + 🆕 CurrentUser/SessionValidation/RevokeToken DTOs
│
├── entities/                               # Domain
│   ├── usuario.entity.ts                     # Invariantes: email válido, puedeAutenticarse()
│   ├── usuario.entity.spec.ts
│   ├── sesion.entity.ts                      # Invariante: estaVigente()
│   └── sesion.entity.spec.ts
│
├── events/                                 # Domain — preparados en Parte 2.1, sin publicar
│   ├── usuario-autenticado.event.ts
│   ├── login-fallido.event.ts
│   ├── cuenta-bloqueada.event.ts
│   ├── sesion-revocada.event.ts
│   └── auth-domain-events.spec.ts
│
├── value-objects/                          # Domain — preparado en Parte 2.1, sin adoptar
│   ├── email.vo.ts                           # Email + EmailInvalidoException
│   └── email.vo.spec.ts
│
├── repositories/                           # Infrastructure — puerto + adaptador Prisma, uno por par
│   ├── tenant.repository.(ts|prisma.ts)
│   ├── user.repository.(ts|prisma.ts)
│   ├── session.repository.(ts|prisma.ts)      # + 🆕 findActiveIdsForUser()
│   ├── token.repository.(ts|prisma.ts)
│   ├── login-attempt.repository.(ts|prisma.ts)     # PRISMA_SECURITY
│   ├── two-factor-credential.repository.(ts|prisma.ts) # PRISMA_SECURITY, solo lectura
│   └── organization-status.repository.(ts|prisma.ts) # 🆕 isCompanyActive()/isBranchActive()
│
├── services/                               # Application (casos de uso) + Infrastructure (providers)
│   ├── login.usecase.(ts|spec.ts)            # Application — + rememberMe/ipAddress/userAgent
│   ├── complete-two-factor-login.usecase.ts   # Application — + propaga rememberMe/ip/UA del challenge
│   ├── refresh-token.usecase.(ts|spec.ts)     # Application — 🆕 spec; + hijacking + empresa/sucursal activa
│   ├── logout.usecase.ts                      # Application
│   ├── get-current-user.usecase.(ts|spec.ts)  # 🆕 Application — GET /auth/me
│   ├── validate-token.usecase.(ts|spec.ts)    # 🆕 Application — GET /auth/session
│   ├── revoke-token.usecase.(ts|spec.ts)      # 🆕 Application — POST /auth/revoke
│   ├── organization-status.exceptions.ts      # 🆕 Domain — compartidas refresh/validate-token
│   ├── forgot-password.usecase.ts             # Application
│   ├── reset-password.usecase.ts              # Application
│   ├── issue-login-session.service.ts         # Application — compartido por login directo y 2FA; + rememberMe/ip/UA
│   ├── two-factor-challenge.ts                # Application — cache key + tipo del challenge; + ip/UA/rememberMe
│   ├── password-reset-notifier.port.ts        # Application — puerto (DIP)
│   ├── email-password-reset-notifier.(ts|spec.ts) # Infrastructure — adaptador SMTP real
│   ├── logging-password-reset-notifier.ts     # Infrastructure — adaptador de respaldo/test
│   └── jwt-token.provider.(ts|spec.ts)        # Infrastructure — preparado en Parte 2.1, adoptado esta parte
│
└── validators/                             # Application — Zod (DTO + validación combinados)
    ├── login.schema.ts                        # + rememberMe (opcional, default false)
    ├── two-factor-login.schema.ts
    ├── password-reset.schema.ts
    └── revoke-token.schema.ts                 # 🆕 sessionId opcional
```

## Infraestructura compartida que `auth` consume (no le pertenece)

```
core/http/
├── guards/
│   ├── jwt-auth.guard.ts        # Presentation: Authenticate — global
│   ├── permissions.guard.ts     # Presentation: Permission/Role — global
│   └── guest.guard.ts           # Presentation: Guest — preparado en Parte 2.1, sin usar
├── interceptors/tenant.interceptor.ts  # Presentation: Tenant — global
├── strategies/jwt-strategy.ts    # Verifica JWT + consulta revocación (Redis)
└── revoked-session-cache-key.ts  # Contrato compartido con LogoutUseCase/RevokeTokenUseCase

core/config/namespaces/
├── auth.config.ts               # JWT secrets + TTLs/umbrales — 🆕 rememberMeTtlDays/strictSessionValidation, todos con consumidor real
└── mail.config.ts               # SMTP (Parte 2 — Backend Core)

packages/tooling/utils/           # Providers puros, sin DI (decisión ya tomada)
├── clock.ts                     # Clock / SystemClock / FixedClock
├── uuid.ts                      # generateUuid()
├── hash.ts                      # hashPassword() / verifyPassword() (Argon2id)
└── totp.ts                      # TOTP RFC 6238
```

## Conteo

| Categoría                         | Archivos `.ts` (sin specs) |  Specs  |
| --------------------------------- | :------------------------: | :-----: |
| Controllers                       |             1              | 3 (e2e) |
| DTO                               |             1              |    0    |
| Entities                          |             2              |    2    |
| Value Objects                     |             1              |    1    |
| Events                            |             4              |    1    |
| Repositories (puerto + adaptador) |             14             |    0    |
| Services (use cases + providers)  |             15             |    7    |
| Validators                        |             4              |    0    |
| **Total módulo**                  |           **42**           | **14**  |
