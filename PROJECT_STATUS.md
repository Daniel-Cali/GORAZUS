# Project Status — GORAZUS ERP

> Foto del estado general del proyecto a 2026-07-26. Complementa, sin
> duplicar, a [ROADMAP.md](./ROADMAP.md) (estado del código por módulo),
> [VERSION.md](./VERSION.md) (versión actual), [CHANGELOG.md](./CHANGELOG.md)
> (detalle por sesión de trabajo), [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)
> (deuda técnica consolidada), [PROJECT_HEALTH_REPORT.md](./docs/reports/backend/PROJECT_HEALTH_REPORT.md)
> (build/lint/test verificado en la sesión de diagnóstico) y
> [NEXT_STEPS.md](./NEXT_STEPS.md) (qué sigue). Actualizado tras CRM
> Partes 02-04 (Leads/Oportunidades/Campañas/Agenda, código real
> completo), Clientes Parte 02.1 (Contactos + Direcciones + Cuentas por
> Cobrar, con frontend real), y Roles Enterprise (CRUD completo +
> scoping tenant/empresa/sucursal + `code`/`description`/`roleType` +
> eventos de dominio preparados) — ver `SESSION_BACKUP.md` para el
> detalle técnico completo de esta ventana de trabajo.

## 1. En una frase

GORAZUS tiene **documentación de arquitectura y base de datos Enterprise
completa** (32 fases + DDD + certificación de base de datos) y **backend
real en 10 de 27 módulos de negocio (37%)** (`auth`, `seguridad` —
incluido Roles Enterprise (CRUD completo + scoping), `configuracion`,
`inventario` — Almacenes + motor de stock/movimientos + Reservas/
Transferencias + Ajustes/Conteos Físicos, `productos` — solo el producto
base, `clientes` — CRUD + Contactos + Direcciones + Cuentas por Cobrar,
`caja`, `ventas`, `pos` — checkout completo de venta, y `crm` — Leads +
Oportunidades + Campañas + Agenda), con el núcleo de identidad/
administración ya endurecido para producción (2FA exigido, bloqueo por
intentos, revocación de sesión, session-hijacking, verificación de
empresa/sucursal activa, CSRF, email real, gestión de usuarios completa
con multiempresa). Database Refactor Fase 01 generó el
estándar completo y el mapeo real de nomenclatura en español para toda
la base de datos (501 tablas, 728 columnas distintas) — **sin ejecutar
ningún renombrado todavía**, decisión explícita del usuario dado el
riesgo real de tocar una base certificada y congelada en una sola
sesión (ver `DATABASE_SPANISH_STANDARD.md`). Database Finalization
ejecutó dos migraciones reales desde entonces
(`35_functional_completion.sql`, `36_crm_customer_completion.sql` +
`37`/`38` seeds + `39_roles_enterprise_fields.sql`), 100% aditivas,
0 datos perdidos — **Database Enterprise v1.1.0** (ver
`DATABASE_FINAL_STATUS.md`).

## 2. Versión actual

**0.21.0** (2026-07-26) — resumen de las 10 versiones desde `0.11.1` (detalle completo en
`VERSION.md`/`CHANGELOG.md`, no se repite acá): CRM Parte 02 Leads (`0.12.0`), Parte 03
Oportunidades (`0.13.0`), Parte 04 Campañas+Agenda (`0.14.0`) — módulo `crm` completo de código
real. Clientes Parte 02.1 backend Contactos+Direcciones (`0.15.0`) y frontend real Listado+
Detalle+Contactos+Direcciones (`0.16.0`). CRM/Clientes preparación para producción — integración
real de Cuentas por Cobrar, 2 hallazgos de seguridad/consistencia corregidos, tests de
integración/API nuevos (`0.17.0`). Roles Enterprise: CRUD completo + scoping tenant/empresa/
sucursal (`0.18.0`), campos `code`/`description`/`roleType` + migración `39_roles_enterprise_fields.sql`
(`0.19.0`), invariantes de normalización incorporadas a la entidad sin Value Objects — decisión
explícita del usuario (`0.20.0`), eventos de dominio preparados (`0.21.0`, Subfase 4.1 de "Phase 03
Part 04" — 4.2-4.8 esperando aprobación explícita antes de continuar).

**0.11.1** (2026-07-24) — Frontend Redesign, Fase 01: Auditoría Visual
y Mejora de UI. `PATCH`, no `MINOR` — no agrega negocio nuevo, corrige
5 bugs reales de UI ya existente (sesión que perdía el nombre de
usuario tras recargar, Tailwind purgando clases de `modules/*/frontend`
—incluida una regresión real en el POS recién construido—, contraste
WCAG insuficiente del color destructivo, `DataTable` sin encabezado
fijo/columnas/tamaño de página/skeleton, tipografía bajo 14px), todos
verificados con Playwright real y medición de contraste, sin tocar
API/base de datos/reglas de negocio. Ver [VERSION.md](./VERSION.md)
para el historial completo y [FRONTEND_VISUAL_AUDIT.md](./docs/reports/frontend/FRONTEND_VISUAL_AUDIT.md)
para el detalle de esta fase.

**0.11.0** (2026-07-24) — FASE 06, Parte 01: Punto de Venta (POS)
Enterprise — checkout real (buscar → carrito → cobrar con pago mixto →
factura → descuenta stock → registra caja → confirma), suspender/
recuperar venta, primera composición backend-a-backend real entre
módulos de negocio (`pos` orquesta `inventario`/`ventas`/`caja`/
`clientes`). Corrigió dos bugs preexistentes de Fase 05 (doble
aplicación de stock, cast `uuid`) encontrados durante la verificación
end-to-end contra Postgres real. Ver [POS_ARCHITECTURE.md](./docs/reports/pos/POS_ARCHITECTURE.md)/
[POS_DATABASE.md](./docs/reports/pos/POS_DATABASE.md) para el detalle de esa parte.

## 3. Estado del código (resumen de ROADMAP.md)

| Pieza                                                                                                        | Estado                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                                | ✅                                                                                                                        |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki)  | ✅ verificada de punta a punta en su momento — Docker caído 8 sesiones seguidas                                           |
| CI/CD (GitHub Actions)                                                                                       | ✅ corrigiendo un bug real (apuntaba a una rama `main` inexistente)                                                       |
| Foundation Platform (`core/*`)                                                                               | ✅ validado con servidor real                                                                                             |
| Persistencia (`core/database`, ahora 6 clientes Prisma con consumidor real, 21 expuestos, RLS)               | ✅                                                                                                                        |
| Auth Enterprise (login, 2FA exigido, bloqueo, revocación, CSRF, refresh, hijacking, empresa/sucursal activa) | ✅ endurecido y probado (FASE 2 + FASE 03 Parte 02)                                                                       |
| Gestión de Usuarios (CRUD completo, multiempresa, preferencias, avatar)                                      | ✅ FASE 03 Parte 03                                                                                                       |
| Almacenes (Almacén→Zona→Ubicación)                                                                           | ✅ FASE 03 continuidad — CRUD real                                                                                        |
| Inventario — Motor de stock, movimientos, reservas, transferencias, ajustes y conteos                        | ✅ FASE 05 Parte 02-04 — motor real, bloqueo de filas real                                                                |
| Productos (Unidades/Categorías/Marcas/Modelos/Productos)                                                     | ✅ FASE 04 — CRUD real                                                                                                    |
| Clientes (CRUD + Consumidor Final + Contactos/Direcciones/Cuentas por Cobrar)                                | ✅ FASE 06 Parte 01 + Clientes Parte 02.1 — frontend real (Listado/Detalle)                                               |
| Caja (registros/apertura/cierre/movimientos)                                                                 | ✅ FASE 06 Parte 01 — mínimo real                                                                                         |
| Ventas (facturas con impuesto real/recibos)                                                                  | ✅ FASE 06 Parte 01 — mínimo real                                                                                         |
| POS (checkout completo, pantalla real)                                                                       | ✅ FASE 06 Parte 01                                                                                                       |
| CRM (Leads + Oportunidades + Campañas + Agenda)                                                              | ✅ Partes 02-04 completas, 49 tests — Seguimientos (Parte 05) sin código                                                  |
| Roles Enterprise (CRUD completo + scoping + eventos de dominio preparados)                                   | ✅ 49 tests — Jerarquía/Policies/90% coverage/docs formales sin empezar (Subfases 4.4/4.6-resto/4.7/4.8)                  |
| Almacenamiento de archivos (`core/storage`)                                                                  | ✅ endpoint genérico real, consumido por avatares de usuario                                                              |
| Módulos de negocio con backend real                                                                          | 🟡 10 de 27 (`auth`, `seguridad`, `configuracion`, `inventario`, `productos`, `clientes`, `caja`, `ventas`, `pos`, `crm`) |
| Resto de módulos de negocio (17)                                                                             | ❌ Sin backend — placeholder de frontend registrado                                                                       |
| Testing (unitario/integración/e2e/carga/seguridad)                                                           | ✅ 383+ tests reales — ver nota de disponibilidad de Docker en `TEST_REPORT.md`                                           |

Ver [ROADMAP.md](./ROADMAP.md) para la tabla completa módulo por módulo.

## 4. Estado de la documentación de arquitectura

32 fases originales pedidas por el usuario — casi todas ✅ completas, ver
[docs/00-roadmap-fases.md](./docs/00-roadmap-fases.md) para el detalle
fase por fase. Sin cambios sustanciales en esta pieza desde la última
foto — ver la versión anterior de este documento (`git log
PROJECT_STATUS.md`) para el detalle completo de EPICs/Fases de
documentación, no repetido acá para no duplicar.

## 5. Estado de la base de datos

**Enterprise v1.1.0** (2026-07-25) — primer cambio de schema desde el congelamiento de v1.0.0
(2026-07-21): 503 tablas (501+2), ~5.169 FK (100% válidas), 2.964 índices (0 inválidos), RLS
forzado en 475 de 503 tablas (`core.restore_test_logs` sigue excluida a propósito). La migración
`docs/database/sql/35_functional_completion.sql` cerró 7 gaps funcionales ya documentados y
especificados por auditorías previas (`FUNCTIONAL_GAPS.md`, `INVENTORY_ARCHITECTURE.md §5.2`) —
100% aditivo, 0 datos perdidos, backend existente verificado sin regresión. Ver
[VERSION.md §Versionado del modelo de datos](./VERSION.md),
[docs/database/DATABASE_CERTIFICATION.md](./docs/database/DATABASE_CERTIFICATION.md) (v1.0.0
original) y [DATABASE_FINAL_STATUS.md](./docs/reports/database/DATABASE_FINAL_STATUS.md) (v1.1.0, recomendación de
production readiness 9.4/10). El modelo de datos sigue siendo el contrato que el backend
consume, no al revés — sigue congelado en su estructura fundamental, el siguiente cambio también
requiere una migración versionada.

## 6. Orden de desarrollo — Fase 06 Parte 01 (POS) cerrada, fuera del orden previsto

Con el checkout del Punto de Venta completo, la Parte 01 de la Fase 06 queda cerrada. Esta parte
se construyó **saltando el orden previsto** en `INVENTORY_NEXT_PHASE.md` (que tenía Inventario
Parte 05-08 antes de Clientes/Ventas/Caja/POS) porque el pedido explícito de esta sesión fue
construir el POS directamente. Se documenta como desviación honesta, no como cambio de plan
silencioso — ver `NEXT_STEPS.md` para el detalle y las dos rutas abiertas hacia adelante.

La brecha real más grande sigue siendo la misma de siempre: **18 de 27
módulos de negocio (67%) todavía no tienen una sola línea de backend**,
aunque cada uno ya tiene su modelo de datos, arquitectura de módulo,
eventos de dominio y Aggregate Root completamente diseñados. Dentro de
`inventario` mismo, 19 de las 34 tablas del schema siguen sin código
(recepciones/salidas/costeo/series/lotes/producción), ya diseñadas en
`INVENTORY_ARCHITECTURE.md` y todavía pendientes (Inventario Parte 05 en
adelante, `INVENTORY_NEXT_PHASE.md`). Dentro de `clientes`/`ventas`/`caja`
también queda la enorme mayoría de tablas diseñadas sin código — ver
`POS_ARCHITECTURE.md §3` y `POS_DATABASE.md` para el detalle exacto de
qué se construyó (15 tablas) vs qué se diseñó y se difirió (96 tablas).

## 7. Puntos abiertos que requieren una decisión (no técnica, de negocio)

Ver [TECHNICAL_DEBT.md §2](./TECHNICAL_DEBT.md) (185 FK cruzando schemas,
`core.restore_test_logs` sin RLS) para el detalle consolidado, ya no
duplicado acá. Sigue abierto: 6 gaps de schema detectados en el diseño
de Inventario (QR/RFID, fecha de fabricación, peso/volumen/dimensiones,
obsolescencia, garantías, trazabilidad de caja) — ver
`INVENTORY_ARCHITECTURE.md §5.2`. Cancelar una transferencia ya
`in_transit` sigue sin soportarse. "Conteo doble" (dos capturas
independientes por línea) no soportado por el schema — ver
`INVENTORY_PHYSICAL_COUNTS.md §2`. Nuevo de esta parte: ¿continuar POS
Parte 02 (devoluciones/cambios) o retomar Inventario Parte 05
(Recepciones/Salidas) que quedó pendiente? — decisión de producto, no
técnica, ver `NEXT_STEPS.md §4`. El checkout de POS no es una
transacción distribuida real entre `inventario`/`ventas`/`caja` — ver
`POS_HEALTH_REPORT.md §3`.

## 8. Trazabilidad

Este documento es una síntesis — no introduce ningún hecho nuevo que no
esté ya documentado en `ROADMAP.md`, `CHANGELOG.md`, `TECHNICAL_DEBT.md`
o `docs/database/DATABASE_CERTIFICATION.md`. Actualizar este archivo
cada vez que cambie sustancialmente el estado del código o de la
documentación, en el mismo commit que ese cambio.
