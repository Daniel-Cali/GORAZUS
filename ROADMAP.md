# Roadmap — GORAZUS ERP

Este documento responde _"¿qué código de negocio existe hoy, y qué sigue?"_ Complementa a
[docs/00-roadmap-fases.md](docs/00-roadmap-fases.md) (32 fases de **documentación de
arquitectura**, casi todas ✅) sin duplicarlo — ver detalle línea por línea de cada sesión de
trabajo en [CHANGELOG.md](CHANGELOG.md).

## Estado del backend por módulo de negocio (código real, no solo diseño)

| Módulo                                                                                                                                                                                      | Backend                                                                                                                                                                                                                                                                                                                                                                                                                             | Frontend                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `auth`                                                                                                                                                                                      | ✅ Login (con bloqueo por intentos + 2FA exigido si está confirmado + "recordar sesión"), refresh (con protección de session-hijacking + verificación de empresa/sucursal activa), logout, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, recuperación de contraseña (email real), CSRF en refresh                                                                                                                       | ✅ Login                                                                           |
| `seguridad`                                                                                                                                                                                 | ✅ Roles (CRUD completo: crear/obtener/renombrar/eliminar + scoping tenant/empresa/sucursal + `code`/`description`/`roleType` + eventos de dominio preparados)/permisos (RBAC), usuarios (CRUD completo + soft delete/restore + estado agregado + multiempresa + preferencias + avatar), auditoría, sesiones, 2FA (setup real, exigido en login desde `auth`)                                                                       | ✅ Listado/alta de usuarios                                                        |
| `configuracion`                                                                                                                                                                             | ✅ Empresas, Sucursales, Parámetros, Monedas, Impuestos (alcance mínimo)                                                                                                                                                                                                                                                                                                                                                            | ❌ Sin construir                                                                   |
| `inventario`                                                                                                                                                                                | 🟡 Almacenes, motor de stock/movimientos, Reservas/Transferencias y Ajustes/Conteos Físicos — CRUD/motor real (15 de 34 tablas). 19 tablas restantes (recepciones/salidas/costeo/series/lotes/producción) diseñadas (`INVENTORY_ARCHITECTURE.md`), sin código todavía                                                                                                                                                               | ❌ Sin construir                                                                   |
| `productos`                                                                                                                                                                                 | 🟡 Unidades de Medida, Categorías, Marcas, Modelos, Productos (5 tablas núcleo) — CRUD real. Variantes/atributos/combos/kits/BOM/imágenes (30 tablas restantes) sin backend todavía                                                                                                                                                                                                                                                 | ❌ Sin construir                                                                   |
| `clientes`                                                                                                                                                                                  | 🟡 CRUD (`customers.customers`) + Consumidor Final + Contactos + Direcciones + Cuentas por Cobrar (vista `v_accounts_receivable_aging`, integración real con `sales`) — 4 de 17 tablas + 1 vista. Categorías/Notas/Timeline/Crédito/Precios/Tags/Documentos/Dashboard sin código, ver `CRM_ROADMAP.md` anexo                                                                                                                        | ✅ Listado + Detalle + Contactos + Direcciones (React 19 + Vite + Tailwind/shadcn) |
| `caja`                                                                                                                                                                                      | 🟡 Registros/apertura/cierre/tipos/movimientos (5 de 11 tablas)                                                                                                                                                                                                                                                                                                                                                                     | ❌ Sin construir                                                                   |
| `ventas`                                                                                                                                                                                    | 🟡 Motor de Facturación Enterprise Parte 1: crear/editar/eliminar borrador, confirmar, anular, duplicar, listar con filtros avanzados y orden, descuento general + por línea, recibos (5 de 55 tablas). Cotizaciones/Pedidos/Facturación Electrónica/CxC avanzadas sin código, ver `docs/reports/ventas/INVOICE_ARCHITECTURE.md`                                                                                                    | ❌ Sin construir                                                                   |
| `pos`                                                                                                                                                                                       | 🟡 Orquestador de checkout (sin tablas propias) — buscar→carrito→cobrar mixto→factura→stock→caja                                                                                                                                                                                                                                                                                                                                    | ✅ Pantalla `/pos` real (buscador, carrito, cobro, atajos)                         |
| `crm`                                                                                                                                                                                       | 🟡 Leads + Oportunidades + Campañas + Agenda — 12 de 17 tablas + 5 catálogos sembrados. Seguimientos sin código todavía, ver `docs/reports/crm/CRM_ROADMAP.md`                                                                                                                                                                                                                                                                      | ❌ Sin construir                                                                   |
| `contabilidad`                                                                                                                                                                              | 🟡 Contabilidad Enterprise Parte 1: plan de cuentas, motor de reglas contables, asientos (borrador/contabilizado/anulado/revertido), Libro Diario/Mayor, Balance General, Estado de Resultados, Flujo de Efectivo — 17 de 28 tablas. Integrado con `ventas` (asiento automático al confirmar factura). CxC/CxP/Bancos/Activos Fijos/Impuestos/Presupuestos/Cierre sin código, ver `docs/reports/contabilidad/ACCOUNTING_ROADMAP.md` | ❌ Sin construir                                                                   |
| Resto (16 módulos: compras, proveedores, bancos, rrhh, nómina, producción, servicios, activos-fijos, proyectos, reportes, bi, impuestos*, tesorería, dashboard, administracion, documentos) | ❌ Sin backend                                                                                                                                                                                                                                                                                                                                                                                                                      | 🟡 Placeholder `ComingSoonPage` (25 módulos ya registrados en el sidebar)          |

\* El módulo de negocio `modules/impuestos` (motor de reglas/cálculo/percepciones/retenciones,
`docs/architecture/46-modulo-taxes.md`) es distinto del catálogo mínimo de perfiles/tasas ya
construido dentro de `modules/configuracion/backend` — ver `CHANGELOG.md`, entrada FASE 02.

`crm` pasó de arquitectura diseñada (`CRM_ARCHITECTURE.md`) a código real en Partes 02, 03 y 04
(`v0.12.0`/`v0.13.0`/`v0.14.0`, 2026-07-25) — ver arriba y `docs/reports/crm/CRM_ROADMAP.md` para
lo que sigue (Seguimientos, Frontend).

## Fase actual: Contabilidad Enterprise, Parte 1 — Núcleo Contable + Estados Financieros (2026-07-27)

`v0.23.0` — primer código real sobre el schema `accounting` (17 de 28 tablas, ya certificadas):
plan de cuentas jerárquico, motor de reglas contables (traduce un evento de negocio confirmado en
un asiento balanceado, `amount_formula` es el nombre de un campo, nunca una expresión evaluada),
asientos con ciclo de vida completo (borrador → contabilizado → anulado/revertido), Libro Diario,
Libro Mayor, Balance General, Estado de Resultados y Flujo de Efectivo (aproximado). Integrado de
forma real y no bloqueante con `ventas` — `confirmarFactura()` dispara el motor; sin ninguna regla
configurada, `ventas` sigue funcionando exactamente igual que antes.

Origen: pedido "PROMPT MAESTRO — MÓDULO DE CONTABILIDAD ENTERPRISE" con 20 secciones (alcance de
varias semanas) — se acordó con el usuario el orden de partes antes de escribir código, esta Parte
1 cubre el núcleo del que dependen las 19 secciones restantes. Un hallazgo real (no de diseño, un
bug) se encontró y corrigió en la verificación manual end-to-end: un asiento revertido quedaba
excluido de los reportes, rompiendo la ecuación contable — ver
`docs/reports/contabilidad/ACCOUNTING_HEALTH_REPORT.md §2`. Ver
`docs/reports/contabilidad/ACCOUNTING_ARCHITECTURE.md` para el detalle completo,
`ACCOUNTING_API_REPORT.md` para endpoints, `ACCOUNTING_TEST_REPORT.md` para testing,
`ACCOUNTING_ROADMAP.md` para las 19 secciones restantes.

## Fase anterior: FASE 04 — Módulo Facturación Enterprise, Parte 1 — Motor de Facturación (2026-07-26)

`v0.22.0` extiende `modules/ventas/backend` (ya existía desde `v0.11.0`, POS Parte 01) con el ciclo
de vida completo de una factura: crear borrador, editar borrador, eliminar borrador (baja lógica),
confirmar (`draft → issued`), anular (`draft`/`issued` → `cancelled`, estado final), duplicar,
listar con filtros avanzados (sucursal/cliente/estado/rango de fechas) y orden
(fecha/total/número), más descuento general por factura (adicional al descuento por línea ya
existente). Origen: pedido "FASE 04 / MÓDULO FACTURACIÓN ENTERPRISE / PARTE 1" con arquitectura
CQRS/DDD/Value Objects/Factories y stack PHP — no aplica a este proyecto (NestJS/TypeScript/Prisma,
Clean Architecture por módulo sin CQRS ni VOs, mismo criterio que Roles Enterprise
`v0.18.0`-`v0.21.0`) y además ya existe un motor de facturación real desde `v0.11.0` — se extendió
ese, no se construyó uno paralelo. Cotizaciones/Pedidos/Compras/POS (ya integrado)/Facturación
Electrónica/Contabilidad/Cuentas por Cobrar avanzadas quedaron explícitamente fuera de alcance, tal
como pedía el prompt. Ver `docs/reports/ventas/INVOICE_ARCHITECTURE.md` para el detalle completo,
`INVOICE_API_REPORT.md` para referencia de endpoints, `INVOICE_TEST_REPORT.md` para testing,
`INVOICE_HEALTH_REPORT.md` para riesgos y deuda técnica.

## Fase anterior: CRM — Parte 04 — Campañas + Agenda (2026-07-25)

`v0.14.0` agregó Campañas (crear, agregar miembro — solo leads) y Agenda (crear evento, agregar
asistente interno/externo). Sin cambios de base de datos esta parte. Ver `CHANGELOG.md` para el
detalle completo y `docs/reports/crm/CRM_ROADMAP.md` para las partes siguientes.

## Fase anterior: CRM — Parte 03 — Oportunidades (2026-07-25)

`v0.13.0` agregó Oportunidades: crear (con líneas de producto estimadas), mover de etapa, ganar
(registra el pedido/factura resultante de `ventas`), perder (con motivo).

## Fase anterior: CRM — Parte 02 — Leads (2026-07-25)

`v0.12.0` agregó el primer código real de `crm`: Leads (crear, cambiar de estado con bitácora,
convertir a cliente).

## Fase anterior: FASE 06, Parte 01 — Punto de Venta (POS) Enterprise (2026-07-24)

`v0.11.0` agregó código real de venta: `clientes` (`customers.customers` + Consumidor Final),
`caja` (registros/apertura/cierre/movimientos), `ventas` (facturas/líneas/recibos con impuesto real
por línea) y `pos` (orquestador de checkout completo: buscar producto → carrito → cobrar, con pago
mixto → factura → descuenta stock → registra caja → confirma; suspender/recuperar venta). Primer
caso real de composición backend-a-backend entre módulos de negocio (`pos` importa `InventarioModule`/
`VentasModule`/`CajaModule`/`ClientesModule` vía sus barrels). Durante la verificación contra
Postgres real se encontraron y corrigieron dos bugs preexistentes de Fase 05 (doble aplicación de
stock, cast `uuid`). Ver `POS_ARCHITECTURE.md`/`POS_DATABASE.md`/`POS_API.md` para el detalle
completo, `POS_TEST_REPORT.md` para testing, `POS_HEALTH_REPORT.md` para riesgos y deuda técnica.

**Nota de orden**: esta parte se construyó fuera del orden previsto más abajo (Inventario Parte
05-08 seguía pendiente) por pedido explícito del usuario — Inventario Parte 05 sigue siendo la
continuación natural si se retoma ese camino. Ver `NEXT_STEPS.md`.

### Fase anterior: FASE 05, Parte 04 — Ajustes y Conteos Físicos (2026-07-24)

`v0.10.0` agregó código real sobre `stock_adjustment_reasons`/`stock_adjustments`/
`stock_adjustment_lines`/`physical_counts`/`physical_count_lines`/`cycle_count_schedules` (6 tablas
más de `inventory`, 15 de 34 en total) — ajustes que resuelven `previousQuantity` del stock real y
generan movimientos vía el motor multi-línea de Parte 03, conteos físicos con captura ciega y
generación automática de ajuste ante discrepancias, y programación de conteos cíclicos por zona.
Cierra el riesgo de concurrencia documentado desde Parte 02: bloqueo real de filas
(`SELECT ... FOR UPDATE`) en el motor de movimientos y en reservas. Ver
`INVENTORY_ADJUSTMENTS_REPORT.md`/`INVENTORY_PHYSICAL_COUNTS.md`/`INVENTORY_CYCLE_COUNT.md` para el
detalle completo, `PROJECT_STATUS.md` para el estado consolidado y `TECHNICAL_DEBT.md` para la
deuda técnica detectada.

### Ya completo (no repetir en próximas fases)

- **Core**: Empresas, Sucursales, Configuración General + Parámetros, Monedas, Impuestos (alcance mínimo).
- **Auth**: login (bloqueo por intentos, 2FA exigido si está confirmado, "recordar sesión"), refresh
  (rotación + CSRF + protección de session-hijacking + verificación de empresa/sucursal activa),
  logout (revocación inmediata de sesión), `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`
  (una sesión o todas), recuperación de contraseña (email real por SMTP).
- **Seguridad**: RBAC (roles/permisos), usuarios (CRUD administrativo completo, soft delete/restore,
  estado agregado, multiempresa, preferencias, avatar, perfil propio + self-service), auditoría
  (lectura), sesiones (listar/revocar — administrativo, distinto del autoservicio de `auth`), 2FA
  (setup/confirmar/deshabilitar, TOTP real).
- **Inventario — Almacenes**: CRUD de Almacén→Zona→Ubicación, con validación real de empresa/
  sucursal/almacén/zona padre.
- **Inventario — Motor de stock y movimientos**: catálogo de tipos de movimiento, registro de
  movimientos con actualización atómica de `stock`, consulta de disponible, kardex real, **bloqueo
  real de filas** (`SELECT ... FOR UPDATE`, Parte 04).
- **Inventario — Reservas y Transferencias**: reservas que protegen stock (`quantity_reserved`),
  transferencias con flujo de estados completo y movimientos atómicos por línea.
- **Inventario — Ajustes y Conteos Físicos**: catálogo de motivos, ajustes que resuelven
  `previousQuantity` real y generan movimientos al confirmar, conteos con captura ciega y generación
  automática de ajuste ante discrepancias, programación cíclica por zona. 19 tablas restantes
  (recepciones/salidas/costeo/series/lotes/producción) ya diseñadas (`INVENTORY_ARCHITECTURE.md`),
  sin código todavía.
- **Productos**: CRUD de Unidades de Medida, Categorías (jerárquica), Marcas, Modelos y Productos
  (`good`/`service`/`kit`/`combo`/`composite`), con validación cruzada marca↔modelo y el invariante
  de que un `service` no rastrea serie/lote. Variantes/atributos/combos/kits/BOM/imágenes siguen sin
  construir.
- **Archivos**: `core/storage` con endpoint genérico de subida/descarga/borrado (MinIO, bucket por
  tenant) — infraestructura, no un módulo de negocio.
- Control de calidad: 383+ tests reales (no solo unitarios) verificados contra Postgres/Redis/MinIO/
  MailHog reales cuando la infraestructura estuvo disponible — ver `TEST_REPORT.md`/
  `INVENTORY_TEST_REPORT.md` para el detalle y una nota sobre disponibilidad de Docker.
- **Clientes**: CRUD mínimo + resolución idempotente de "Consumidor Final".
- **Caja**: registros, apertura (única activa por caja a nivel de base), cierre con monto esperado
  calculado, catálogo de tipos de movimiento, movimientos.
- **Ventas**: facturas con impuesto real calculado por línea, recibos con allocations, transición
  `draft → issued`.
- **POS**: checkout completo (buscar → carrito → cobrar con pago mixto → factura → stock → caja),
  suspender/recuperar venta, pantalla real `/pos` con atajos de teclado. 42 tests nuevos, 42/42.

### Frontend Redesign, Fase 01 — Auditoría Visual y Mejora de UI (`v0.11.1`, 2026-07-24)

Otro desvío del orden de negocio de arriba, también por pedido explícito: una fase transversal de
UI, no de un módulo puntual. Auditó las 4 pantallas reales que existen hoy (Login, Dashboard,
Usuarios, POS) más el componente compartido `ComingSoonPage` (cubre las 18 pantallas restantes que
el sidebar navega pero que no tienen backend/UI propia todavía), y corrigió 5 bugs reales de UI
—incluida una regresión visual real en el POS recién construido (`max-w-md` purgado por Tailwind)—
sin tocar API/base de datos/reglas de negocio. Ver `FRONTEND_VISUAL_AUDIT.md` para el detalle
completo. El design system (`ui-kit`) queda más sólido para cuando se construyan las próximas
pantallas reales: `DataTable` ahora soporta encabezado fijo, columnas ocultables, control de
tamaño de página y skeleton loaders — para cualquier módulo futuro, no solo para Usuarios.

### Database Refactor, Fase 01 — Estandarización al Español, diseño (sin ejecutar, 2026-07-24)

Tercer desvío del orden de negocio, también por pedido explícito. A diferencia de las dos fases
anteriores, esta **no ejecutó ningún cambio real** — el usuario eligió explícitamente "diseño
primero" dado que renombrar 501 tablas/728 columnas distintas/~19.500 objetos reales de una base
certificada y congelada (`VERSION.md`) en una sola sesión es un riesgo real de romper la
aplicación. Se generó el estándar completo de nomenclatura y el mapeo real objeto-por-objeto (no
una muestra) — 7 entregables, ver `DATABASE_SPANISH_STANDARD.md`. Queda como trabajo aprobado-pero-
no-iniciado: el plan de ejecución por fases está en `DATABASE_MIGRATION_REPORT.md`, empezando por
un piloto acotado en el schema `taxes` antes de tocar cualquier schema con backend real construido.

### Database Finalization — Database Enterprise v1.1.0 (2026-07-25)

Cuarto desvío del orden de negocio, también por pedido explícito — a diferencia de la fase
anterior (diseño puro, sin ejecutar), **esta sí ejecutó una migración real** contra la base
certificada: `docs/database/sql/35_functional_completion.sql`, cerrando 7 gaps funcionales ya
documentados y especificados por auditorías previas (`FUNCTIONAL_GAPS.md`,
`INVENTORY_ARCHITECTURE.md §5.2`) — ninguno inventado en esta sesión, siguiendo el principio
explícito del pedido ("el objetivo NO es crear más tablas"). 501→503 tablas, 100% aditivo, 0 datos
perdidos, backend existente verificado sin regresión. Ver `DATABASE_FINAL_STATUS.md` para el
detalle completo y la recomendación de production readiness (9.4/10).

### Próxima fase: a definir — Inventario Parte 05, continuar POS Parte 02, o iniciar el piloto de renombrado

`v0.11.0` cerró POS Parte 01, saltando el orden que tenía prevista Inventario Parte 05-08 antes de
Clientes/Ventas/Caja/POS (`INVENTORY_NEXT_PHASE.md`). Dos caminos abiertos, sin decisión tomada
todavía: (a) **POS Parte 02** — devoluciones/cambios/garantías u otro recorte del alcance diferido
en `POS_ARCHITECTURE.md §3`; (b) retomar **Inventario Parte 05 — Recepciones, salidas y reglas de
almacén** (`goods_receipts`/`goods_receipt_lines`/`goods_issues`/`goods_issue_lines`/
`goods_issue_reasons`/`putaway_rules`/`picking_rules`/`replenishment_rules`) → 06 Costeo → 07
Series/lotes → 08 Producción, que seguía pendiente antes de este desvío. `v0.11.1` (Frontend
Redesign) no cambia esta decisión pendiente — fue una fase transversal, no parte de ninguno de los
dos caminos.

## Backlog conocido

- Detección de reuso de refresh token (revocar toda la familia de sesiones ante un token ya
  rotado reutilizado) — gap documentado en el propio código (`RefreshTokenUseCase`).
- Patrón compartido de sort/filter/search para listados — cada controller lo resuelve ad hoc hoy.
- Publicación real de los Domain Events de `auth` (preparados, sin publicar) y de cualquier
  consumidor real de `EventBusService`/`SchedulerService` — ningún módulo de negocio los usa
  todavía (`cycle_count_schedules` es la primera pieza que se beneficiaría de un scheduler real,
  ver `INVENTORY_CYCLE_COUNT.md §4`).
- Catálogo de países/jurisdicciones fiscales (`configuration.countries`/`taxes.tax_jurisdictions`)
  no tiene CRUD ni UI — solo el script de seed mínimo que desbloquea Impuestos.
- Conteo "doble" (dos capturas independientes por línea) no soportado — el schema de
  `physical_count_lines` solo tiene una columna `counted_quantity` (`INVENTORY_PHYSICAL_COUNTS.md §2`).
- Cancelar una transferencia ya `in_transit` no está soportado — requeriría un movimiento de
  reversión no especificado en el pedido original.
- Ver `CHANGELOG.md` sección "Pendiente conocido" y `TECHNICAL_DEBT.md` para el resto (39
  vulnerabilidades de dependencias transitivas, Kubernetes sin cluster real de prueba, etc.).
