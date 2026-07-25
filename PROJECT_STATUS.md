# Project Status — GORAZUS ERP

> Foto del estado general del proyecto a 2026-07-24. Complementa, sin
> duplicar, a [ROADMAP.md](./ROADMAP.md) (estado del código por módulo),
> [VERSION.md](./VERSION.md) (versión actual), [CHANGELOG.md](./CHANGELOG.md)
> (detalle por sesión de trabajo), [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md)
> (deuda técnica consolidada), [PROJECT_HEALTH_REPORT.md](./PROJECT_HEALTH_REPORT.md)
> (build/lint/test verificado en la sesión de diagnóstico) y
> [NEXT_STEPS.md](./NEXT_STEPS.md) (qué sigue). Actualizado tras cerrar
> Frontend Redesign Fase 01 — Auditoría Visual y Mejora de UI, sobre la
> base de Fase 06 Parte 01 (Punto de Venta), primer código real de
> `modules/clientes`, `modules/caja`, `modules/ventas` y `modules/pos`.

## 1. En una frase

GORAZUS tiene **documentación de arquitectura y base de datos Enterprise
completa** (32 fases + DDD + certificación de base de datos) y **backend
real en 9 de 27 módulos de negocio (33%)** (`auth`, `seguridad`,
`configuracion`, `inventario` — Almacenes + motor de stock/movimientos +
Reservas/Transferencias + Ajustes/Conteos Físicos, `productos` — solo el
producto base, `clientes`, `caja`, `ventas` y `pos` — checkout completo
de venta), con el núcleo de identidad/administración ya endurecido
para producción (2FA exigido, bloqueo por intentos, revocación de
sesión, session-hijacking, verificación de empresa/sucursal activa,
CSRF, email real, gestión de usuarios completa con multiempresa) —
Fase 06 Parte 01 (Punto de Venta) queda cerrada con esta parte,
saltando el orden previsto de Inventario Parte 05-08 por pedido
explícito (ver `NEXT_STEPS.md`).

## 2. Versión actual

**0.11.1** (2026-07-24) — Frontend Redesign, Fase 01: Auditoría Visual
y Mejora de UI. `PATCH`, no `MINOR` — no agrega negocio nuevo, corrige
5 bugs reales de UI ya existente (sesión que perdía el nombre de
usuario tras recargar, Tailwind purgando clases de `modules/*/frontend`
—incluida una regresión real en el POS recién construido—, contraste
WCAG insuficiente del color destructivo, `DataTable` sin encabezado
fijo/columnas/tamaño de página/skeleton, tipografía bajo 14px), todos
verificados con Playwright real y medición de contraste, sin tocar
API/base de datos/reglas de negocio. Ver [VERSION.md](./VERSION.md)
para el historial completo y [FRONTEND_VISUAL_AUDIT.md](./FRONTEND_VISUAL_AUDIT.md)
para el detalle de esta fase.

**0.11.0** (2026-07-24) — FASE 06, Parte 01: Punto de Venta (POS)
Enterprise — checkout real (buscar → carrito → cobrar con pago mixto →
factura → descuenta stock → registra caja → confirma), suspender/
recuperar venta, primera composición backend-a-backend real entre
módulos de negocio (`pos` orquesta `inventario`/`ventas`/`caja`/
`clientes`). Corrigió dos bugs preexistentes de Fase 05 (doble
aplicación de stock, cast `uuid`) encontrados durante la verificación
end-to-end contra Postgres real. Ver [POS_ARCHITECTURE.md](./POS_ARCHITECTURE.md)/
[POS_DATABASE.md](./POS_DATABASE.md) para el detalle de esa parte.

## 3. Estado del código (resumen de ROADMAP.md)

| Pieza                                                                                                        | Estado                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Bootstrap del monorepo (Nx, pnpm, tsconfig, eslint, prettier)                                                | ✅                                                                                                                |
| Infraestructura Docker (Postgres, Redis, RabbitMQ, MinIO, nginx, pgAdmin, MailHog, Prometheus/Grafana/Loki)  | ✅ verificada de punta a punta en su momento — Docker caído 8 sesiones seguidas                                   |
| CI/CD (GitHub Actions)                                                                                       | ✅ corrigiendo un bug real (apuntaba a una rama `main` inexistente)                                               |
| Foundation Platform (`core/*`)                                                                               | ✅ validado con servidor real                                                                                     |
| Persistencia (`core/database`, ahora 6 clientes Prisma con consumidor real, 21 expuestos, RLS)               | ✅                                                                                                                |
| Auth Enterprise (login, 2FA exigido, bloqueo, revocación, CSRF, refresh, hijacking, empresa/sucursal activa) | ✅ endurecido y probado (FASE 2 + FASE 03 Parte 02)                                                               |
| Gestión de Usuarios (CRUD completo, multiempresa, preferencias, avatar)                                      | ✅ FASE 03 Parte 03                                                                                               |
| Almacenes (Almacén→Zona→Ubicación)                                                                           | ✅ FASE 03 continuidad — CRUD real                                                                                |
| Inventario — Motor de stock, movimientos, reservas, transferencias, ajustes y conteos                        | ✅ FASE 05 Parte 02-04 — motor real, bloqueo de filas real                                                        |
| Productos (Unidades/Categorías/Marcas/Modelos/Productos)                                                     | ✅ FASE 04 — CRUD real                                                                                            |
| Clientes (CRUD + Consumidor Final)                                                                           | ✅ FASE 06 Parte 01 — mínimo real                                                                                 |
| Caja (registros/apertura/cierre/movimientos)                                                                 | ✅ FASE 06 Parte 01 — mínimo real                                                                                 |
| Ventas (facturas con impuesto real/recibos)                                                                  | ✅ FASE 06 Parte 01 — mínimo real                                                                                 |
| POS (checkout completo, pantalla real)                                                                       | ✅ FASE 06 Parte 01                                                                                               |
| Almacenamiento de archivos (`core/storage`)                                                                  | ✅ endpoint genérico real, consumido por avatares de usuario                                                      |
| Módulos de negocio con backend real                                                                          | 🟡 9 de 27 (`auth`, `seguridad`, `configuracion`, `inventario`, `productos`, `clientes`, `caja`, `ventas`, `pos`) |
| Resto de módulos de negocio (18)                                                                             | ❌ Sin backend — placeholder de frontend registrado                                                               |
| Testing (unitario/integración/e2e/carga/seguridad)                                                           | ✅ 383+ tests reales — ver nota de disponibilidad de Docker en `TEST_REPORT.md`                                   |

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
el contrato que el backend consume, no al revés. Esta parte sumó el
**primer consumidor de aplicación** para 6 tablas más del schema
`inventory` (`stock_adjustment_reasons`/`stock_adjustments`/
`stock_adjustment_lines`/`physical_counts`/`physical_count_lines`/
`cycle_count_schedules`, 15 de 34 en total) — sin tocar el schema en sí.

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
