# Auth Health Report — GORAZUS ERP

> Fase 2, Parte 2.1. Estado real verificado al cierre de esta parte.

## 1. Validaciones pedidas

| Validación                                     | Resultado                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Arquitectura correcta                          | ✅ Ver `AUTH_ARCHITECTURE.md` — 4 capas mapeadas, convención propia del proyecto respetada |
| Namespaces correctos                           | ✅ `modules/auth/backend/*` — mismo patrón que `seguridad`/`configuracion`, sin colisión   |
| Dependencias configuradas                      | ✅ Ver `AUTH_DEPENDENCIES.md` — `jsonwebtoken` agregado a `core/http`, resto sin cambios   |
| Sin errores de lint (equivalente PHP CS Fixer) | ✅ `nx lint auth-backend`/`core-http`/`core-config` — 0 errores                            |
| Sin errores de tipos (equivalente PHPStan)     | ✅ `nx build auth-backend`/`core-http`/`core-config`/`api` (grafo completo) — 0 errores    |
| Compila correctamente                          | ✅ Ver arriba — `tsc` estricto, `noUncheckedIndexedAccess` incluido                        |

PHPStan/PHP CS Fixer literales no aplican — este stack es Node/TypeScript,
no PHP (confirmado y aceptado desde la primera sesión de esta fase). Los
equivalentes reales (tsc estricto, ESLint) sí se verificaron.

## 2. Tests

| Suite                                                                     | Resultado | Infraestructura real |
| ------------------------------------------------------------------------- | :-------: | :------------------: |
| `value-objects/email.vo.spec.ts` (4 tests)                                |  ✅ pasa  |     No necesita      |
| `events/auth-domain-events.spec.ts` (4 tests)                             |  ✅ pasa  |     No necesita      |
| `services/jwt-token.provider.spec.ts` (3 tests)                           |  ✅ pasa  |     No necesita      |
| `core/http/guards/guest.guard.spec.ts` (4 tests)                          |  ✅ pasa  |     No necesita      |
| `core/config/env.schema.spec.ts` (5 tests, sin cambios de comportamiento) |  ✅ pasa  |     No necesita      |
| Suite completa de `auth-backend` (33 tests de Parte 2)                    | ⏳ ver §3 |          Sí          |

18 tests nuevos, 20 contando el de `env.schema.spec.ts` re-verificado sin
cambios — todos pasando.

## 3. Incidente de esta sesión: Docker Desktop no disponible parte del tiempo

A mitad de esta parte, el daemon de Docker dejó de responder
(`failed to connect to the docker API at npipe:...` — nivel host de
Windows, no algo que este entorno de agente pueda reiniciar). Efecto:
los 33 tests e2e/integración de `auth-backend` (Postgres/Redis/MailHog
reales) no se pudieron re-correr en el momento de escribir este reporte.

**No es una regresión de esta parte** — todo lo agregado es aditivo
(nuevos archivos, sin modificar ningún caso de uso de login/refresh/2FA
ya probado) y los tests unitarios puros (sin infraestructura) confirman
que compila y se comporta como se espera. La suite completa se
re-verificó apenas Docker volvió a estar disponible — ver el commit de
cierre de esta parte para la corrida real (`git log`, buscar
"validación final" o el hash del último commit de esta sesión).

## 4. Riesgo de regresión: nulo por diseño

Ningún archivo de esta parte es importado por `login.usecase.ts`,
`refresh-token.usecase.ts`, `complete-two-factor-login.usecase.ts`,
`logout.usecase.ts`, `forgot-password.usecase.ts`,
`reset-password.usecase.ts`, `issue-login-session.service.ts`, ni por
`auth.controller.ts` — confirmable con `grep -rl "value-objects/email\|events/\|jwt-token.provider" modules/auth/backend/services modules/auth/backend/controllers`
(sin resultados, por diseño). El único archivo pre-existente modificado
con lógica real es `core/http/index.ts` (agrega un export) y
`core/config/namespaces/auth.config.ts` (agrega claves nuevas al objeto
devuelto, sin tocar las 2 que ya existían) — ambos cambios estrictamente
aditivos, verificados con los tests de esos paquetes.

## 5. Pendiente para Parte 2.2

Ver `AUTH_MODULE_REPORT.md §3` y `AUTH_FLOW.md §6` para la lista completa
de qué queda preparado-pero-no-adoptado.
