# Auth Structure — GORAZUS ERP

> Fase 2, Parte 2.1. Árbol real de `modules/auth/backend/` a
> 2026-07-22 — generado a partir del filesystem, no de intención. `🆕` =
> nuevo esta parte.

```
modules/auth/backend/
├── auth.module.ts                          # Wiring de Nest — providers, controllers
│
├── controllers/                            # Presentation
│   ├── auth.controller.ts                    # POST login/login/2fa/refresh/logout/forgot-password/reset-password
│   ├── auth.controller.e2e-spec.ts
│   ├── password-reset.e2e-spec.ts
│   └── two-factor-login.e2e-spec.ts
│
├── dto/                                    # Presentation — forma de respuesta (Swagger)
│   └── login-response.dto.ts
│
├── entities/                               # Domain
│   ├── usuario.entity.ts                     # Invariantes: email válido, puedeAutenticarse()
│   ├── usuario.entity.spec.ts
│   ├── sesion.entity.ts                      # Invariante: estaVigente()
│   └── sesion.entity.spec.ts
│
├── events/                                 # Domain — 🆕 preparados, sin publicar
│   ├── usuario-autenticado.event.ts
│   ├── login-fallido.event.ts
│   ├── cuenta-bloqueada.event.ts
│   ├── sesion-revocada.event.ts
│   └── auth-domain-events.spec.ts
│
├── value-objects/                          # Domain — 🆕 preparado, sin adoptar
│   ├── email.vo.ts                           # Email + EmailInvalidoException
│   └── email.vo.spec.ts
│
├── repositories/                           # Infrastructure — puerto + adaptador Prisma, uno por par
│   ├── tenant.repository.(ts|prisma.ts)
│   ├── user.repository.(ts|prisma.ts)
│   ├── session.repository.(ts|prisma.ts)
│   ├── token.repository.(ts|prisma.ts)
│   ├── login-attempt.repository.(ts|prisma.ts)     # PRISMA_SECURITY
│   └── two-factor-credential.repository.(ts|prisma.ts) # PRISMA_SECURITY, solo lectura
│
├── services/                               # Application (casos de uso) + Infrastructure (providers)
│   ├── login.usecase.(ts|spec.ts)            # Application
│   ├── complete-two-factor-login.usecase.ts   # Application
│   ├── refresh-token.usecase.ts               # Application
│   ├── logout.usecase.ts                      # Application
│   ├── forgot-password.usecase.ts             # Application
│   ├── reset-password.usecase.ts              # Application
│   ├── issue-login-session.service.ts         # Application — compartido por login directo y 2FA
│   ├── two-factor-challenge.ts                # Application — cache key + tipo del challenge
│   ├── password-reset-notifier.port.ts        # Application — puerto (DIP)
│   ├── email-password-reset-notifier.(ts|spec.ts) # Infrastructure — adaptador SMTP real
│   ├── logging-password-reset-notifier.ts     # Infrastructure — adaptador de respaldo/test
│   └── jwt-token.provider.(ts|spec.ts)        # Infrastructure — 🆕 preparado, sin adoptar
│
└── validators/                             # Application — Zod (DTO + validación combinados)
    ├── login.schema.ts
    ├── two-factor-login.schema.ts
    └── password-reset.schema.ts
```

## Infraestructura compartida que `auth` consume (no le pertenece)

```
core/http/
├── guards/
│   ├── jwt-auth.guard.ts        # Presentation: Authenticate — global
│   ├── permissions.guard.ts     # Presentation: Permission/Role — global
│   └── guest.guard.ts           # 🆕 Presentation: Guest — preparado, sin usar
├── interceptors/tenant.interceptor.ts  # Presentation: Tenant — global
├── strategies/jwt-strategy.ts    # Verifica JWT + consulta revocación (Redis)
└── revoked-session-cache-key.ts  # Contrato compartido con LogoutUseCase

core/config/namespaces/
├── auth.config.ts               # JWT secrets + 🆕 TTLs/umbrales (sin consumidor)
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
| Value Objects 🆕                  |             1              |    1    |
| Events 🆕                         |             4              |    1    |
| Repositories (puerto + adaptador) |             12             |    0    |
| Services (use cases + providers)  |             11             |    3    |
| Validators                        |             3              |    0    |
| **Total módulo**                  |           **35**           | **10**  |
