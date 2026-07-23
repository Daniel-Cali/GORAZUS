# Project Status — GORAZUS ERP

> Foto del estado general del proyecto a 2026-07-23. Complementa, sin
> duplicar, a [ROADMAP.md](./ROADMAP.md) (estado del código por módulo),
> [VERSION.md](./VERSION.md) (versión actual), [CHANGELOG.md](./CHANGELOG.md)
> (detalle por sesión de trabajo), [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)
> (deuda técnica consolidada), [PROJECT_HEALTH_REPORT.md](./PROJECT_HEALTH_REPORT.md)
> (build/lint/test verificado esta sesión) y
> [NEXT_STEPS.md](./NEXT_STEPS.md) (qué sigue). Actualizado tras cerrar
> Almacenes — primer código real de `modules/inventario/backend`.

## 1. En una frase

GORAZUS tiene **documentación de arquitectura y base de datos Enterprise
completa** (32 fases + DDD + certificación de base de datos) y **backend
real en 4 de 27 módulos de negocio (15%)** (`auth`, `seguridad`,
`configuracion`, `inventario` — este último solo Almacenes, no el
Inventario completo), con el núcleo de identidad/administración ya
endurecido para producción (2FA exigido, bloqueo por intentos,
revocación de sesión, session-hijacking, verificación de empresa/
sucursal activa, CSRF, email real, gestión de usuarios completa con
multiempresa) — la lista de prioridad "primero" de FASE 03 queda 100%
cubierta con esta parte.

## 2. Versión actual

**0.6.0** (2026-07-23) — FASE 03, continuidad: Almacenes — CRUD de
Almacén→Zona→Ubicación (`inventory.warehouses`/`warehouse_zones`/
`warehouse_locations`), primer código real de `modules/inventario/backend`
(vacío desde su creación, confirmado en 3 auditorías previas). Ver
[VERSION.md](./VERSION.md) para el historial completo de versiones y
[ALMACENES_REPORT.md](./ALMACENES_REPORT.md) para el detalle de esta
parte.

## 3. Estado del código (resumen de ROADMAP.md)

| Pieza                                                                                                        | Estado                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                                | ✅                                                                              |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki)  | ✅ verificada de punta a punta en su momento — Docker caído 5 sesiones seguidas |
| CI/CD (GitHub Actions)                                                                                       | ✅ corrigiendo un bug real (apuntaba a una rama `main` inexistente)             |
| Foundation Platform (`core/*`)                                                                               | ✅ validado con servidor real                                                   |
| Persistencia (`core/database`, ahora 5 clientes Prisma con consumidor real, 21 expuestos, RLS)               | ✅                                                                              |
| Auth Enterprise (login, 2FA exigido, bloqueo, revocación, CSRF, refresh, hijacking, empresa/sucursal activa) | ✅ endurecido y probado (FASE 2 + FASE 03 Parte 02)                             |
| Gestión de Usuarios (CRUD completo, multiempresa, preferencias, avatar)                                      | ✅ FASE 03 Parte 03                                                             |
| Almacenes (Almacén→Zona→Ubicación)                                                                           | ✅ FASE 03 continuidad — CRUD real                                              |
| Almacenamiento de archivos (`core/storage`)                                                                  | ✅ endpoint genérico real, consumido por avatares de usuario                    |
| Módulos de negocio con backend real                                                                          | 🟡 4 de 27 (`auth`, `seguridad`, `configuracion`, `inventario`)                 |
| Resto de módulos de negocio (23)                                                                             | ❌ Sin backend — placeholder de frontend registrado                             |
| Testing (unitario/integración/e2e/carga/seguridad)                                                           | ✅ 178+ tests reales — ver nota de disponibilidad de Docker en `TEST_REPORT.md` |

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
Ningún cambio de schema desde entonces — el modelo de datos sigue siendo
el contrato que el backend consume, no al revés. Esta parte sí sumó el
**primer consumidor de aplicación** para 3 de las 32 tablas del schema
`inventory` (`warehouses`/`warehouse_zones`/`warehouse_locations`) — sin
tocar el schema en sí.

## 6. Lista de prioridad "primero" de FASE 03 — completa

Infraestructura/Autenticación/Usuarios/Roles/Permisos/Multiempresa/
Sucursales/Almacenes/Configuración/API REST/OpenAPI — **los 10 ítems ya
existen**, confirmado por última vez en Parte 01/02/03 y esta parte
(Almacenes, el único que faltaba). Detalle histórico de la discrepancia
original (el pedido de FASE 03 daba a entender que el desarrollo recién
empezaba, cuando la mayoría ya existía): `CHANGELOG.md`, entradas Parte
01-03.

La brecha real más grande sigue siendo la misma de siempre: **23 de 27
módulos de negocio (85%) todavía no tienen una sola línea de backend**,
aunque cada uno ya tiene su modelo de datos, arquitectura de módulo,
eventos de dominio y Aggregate Root completamente diseñados. Orden de
construcción confirmado (`NEXT_STEPS.md`): **Productos** → Inventario
(stock/movimientos reales, sobre la base de Almacenes ya construida) →
Clientes → Ventas → Caja → POS.

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
