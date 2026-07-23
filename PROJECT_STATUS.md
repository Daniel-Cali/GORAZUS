# Project Status — GORAZUS ERP

> Foto del estado general del proyecto a 2026-07-22. Complementa, sin
> duplicar, a [ROADMAP.md](./ROADMAP.md) (estado del código por módulo),
> [VERSION.md](./VERSION.md) (versión actual), [CHANGELOG.md](./CHANGELOG.md)
> (detalle por sesión de trabajo), [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)
> (deuda técnica consolidada), [AUTH_REPORT.md](./AUTH_REPORT.md) (detalle
> de esta parte) y [docs/00-roadmap-fases.md](./docs/00-roadmap-fases.md)
> (estado de la documentación de arquitectura por fase). Actualizado como
> entregable de FASE 03 — Backend Core Enterprise, Parte 02
> (Autenticación Enterprise).

## 1. En una frase

GORAZUS tiene **documentación de arquitectura y base de datos Enterprise
completa** (32 fases + DDD + certificación de base de datos) y **backend
real en 3 de 27 módulos de negocio** (`auth`, `seguridad`,
`configuracion`), con ese núcleo ya endurecido para producción (2FA
exigido, bloqueo por intentos, revocación de sesión — inmediata o bajo
demanda —, protección de session-hijacking, verificación de
empresa/sucursal activa, CSRF, email real) — la brecha entre "diseñado" e
"implementado" sigue siendo grande en el resto de módulos, documentada
con honestidad, no oculta.

## 2. Versión actual

**0.5.0** (2026-07-22) — FASE 03, Parte 03: Gestión de Usuarios
Enterprise — CRUD administrativo completo, multiempresa
(`core.user_companies`), preferencias/avatar (`core.user_profiles`), y
corrección de una fuga real de `password_hash` en 5 endpoints
preexistentes. Ver [VERSION.md](./VERSION.md) para el historial completo
de versiones y [USERS_REPORT.md](./USERS_REPORT.md) para el detalle de
esta parte.

## 3. Estado del código (resumen de ROADMAP.md)

| Pieza                                                                                                        | Estado                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                                | ✅                                                                              |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki)  | ✅ verificada de punta a punta                                                  |
| CI/CD (GitHub Actions)                                                                                       | ✅ corrigiendo un bug real (apuntaba a una rama `main` inexistente)             |
| Foundation Platform (`core/*`)                                                                               | ✅ validado con servidor real                                                   |
| Persistencia (`core/database`, 21 clientes Prisma, RLS)                                                      | ✅                                                                              |
| Auth Enterprise (login, 2FA exigido, bloqueo, revocación, CSRF, refresh, hijacking, empresa/sucursal activa) | ✅ endurecido y probado (FASE 2 + FASE 03 Parte 02)                             |
| Almacenamiento de archivos (`core/storage`)                                                                  | ✅ endpoint genérico real, sin consumidor de negocio todavía                    |
| Módulos de negocio con backend real                                                                          | 🟡 3 de 27 (`auth`, `seguridad`, `configuracion`)                               |
| Resto de módulos de negocio (24, incluyendo `inventario`/Almacenes)                                          | ❌ Sin backend — placeholder de frontend registrado                             |
| Testing (unitario/integración/e2e/carga/seguridad)                                                           | ✅ 127+ tests reales — ver nota de disponibilidad de Docker en `TEST_REPORT.md` |

Ver [ROADMAP.md](./ROADMAP.md) para la tabla completa módulo por módulo.

## 4. Estado de la documentación de arquitectura

32 fases originales pedidas por el usuario — casi todas ✅ completas, ver
[docs/00-roadmap-fases.md](./docs/00-roadmap-fases.md) para el detalle
fase por fase. Sin cambios sustanciales en esta pieza desde la última
foto — ver la versión anterior de este documento (`git log
PROJECT_STATUS.md`) para el detalle completo de EPICs/Fases de
documentación, no repetido acá para no duplicar.

## 5. Estado de la base de datos

Sin cambios desde la certificación formal — **Enterprise v1.0.0**
(2026-07-21, congelada en su estructura fundamental): 501 tablas, 5.164
FK (100% válidas), 3.201 índices (0 duplicados), RLS forzado en 500/501
tablas. Ver [VERSION.md §Versionado del modelo de datos](./VERSION.md)
y [docs/database/DATABASE_CERTIFICATION.md](./docs/database/DATABASE_CERTIFICATION.md).
Ningún cambio de schema en las 3 sesiones de código desde entonces — el
modelo de datos sigue siendo el contrato que el backend consume, no al
revés.

## 6. Brecha principal — y una discrepancia real encontrada esta auditoría

FASE 03 (el pedido de esta sesión) listaba como prioridad "primero":
Infraestructura/Autenticación/Usuarios/Roles/Permisos/Multiempresa/
Sucursales/**Almacenes**/Configuración/API REST/OpenAPI — dando a
entender que el desarrollo recién comienza. **Discrepancia real**: de
esa lista, **todo ya existe excepto Almacenes** — confirmado
`modules/inventario/{backend,frontend,shared}` sin un solo archivo. El
resto (auth, RBAC, empresas/sucursales, configuración, API REST con
OpenAPI real) ya está construido, probado y endurecido en sesiones
previas (ver `CHANGELOG.md`). Detalle de por qué se documentó esto en
vez de reconstruir lo ya hecho: `AUTH_MODULE_REPORT.md §1` (mismo patrón
de discrepancia ya resuelto una vez en Parte 2.1 de la fase anterior).

La brecha real más grande sigue siendo la misma de siempre: **24 de 27
módulos de negocio todavía no tienen una sola línea de backend**, aunque
cada uno ya tiene su modelo de datos, arquitectura de módulo, eventos de
dominio y Aggregate Root completamente diseñados. Orden de construcción
confirmado (`ROADMAP.md`): **Almacenes** (único ítem real pendiente de
la lista "primero" de FASE 03) → Productos → Inventario → Clientes →
Ventas → Caja → POS.

## 7. Puntos abiertos que requieren una decisión (no técnica, de negocio)

Sin cambios desde la última foto — ver
[TECHNICAL_DEBT.md §2](./TECHNICAL_DEBT.md) (185 FK cruzando schemas,
`core.restore_test_logs` sin RLS) para el detalle consolidado, ya no
duplicado acá.

## 8. Trazabilidad

Este documento es una síntesis — no introduce ningún hecho nuevo que no
esté ya documentado en `ROADMAP.md`, `CHANGELOG.md`, `TECHNICAL_DEBT.md`
o `docs/database/DATABASE_CERTIFICATION.md`. Actualizar este archivo
cada vez que cambie sustancialmente el estado del código o de la
documentación, en el mismo commit que ese cambio.
