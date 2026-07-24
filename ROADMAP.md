# Roadmap — GORAZUS ERP

Este documento responde _"¿qué código de negocio existe hoy, y qué sigue?"_ Complementa a
[docs/00-roadmap-fases.md](docs/00-roadmap-fases.md) (32 fases de **documentación de
arquitectura**, casi todas ✅) sin duplicarlo — ver detalle línea por línea de cada sesión de
trabajo en [CHANGELOG.md](CHANGELOG.md).

## Estado del backend por módulo de negocio (código real, no solo diseño)

| Módulo                                                                                                                                                                                                                                      | Backend                                                                                                                                                                                                                                                                                                       | Frontend                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `auth`                                                                                                                                                                                                                                      | ✅ Login (con bloqueo por intentos + 2FA exigido si está confirmado + "recordar sesión"), refresh (con protección de session-hijacking + verificación de empresa/sucursal activa), logout, `GET /auth/me`, `GET /auth/session`, `POST /auth/revoke`, recuperación de contraseña (email real), CSRF en refresh | ✅ Login                                                                  |
| `seguridad`                                                                                                                                                                                                                                 | ✅ Roles/permisos (RBAC), usuarios (CRUD completo + soft delete/restore + estado agregado + multiempresa + preferencias + avatar), auditoría, sesiones, 2FA (setup real, exigido en login desde `auth`)                                                                                                       | ✅ Listado/alta de usuarios                                               |
| `configuracion`                                                                                                                                                                                                                             | ✅ Empresas, Sucursales, Parámetros, Monedas, Impuestos (alcance mínimo)                                                                                                                                                                                                                                      | ❌ Sin construir                                                          |
| `inventario`                                                                                                                                                                                                                                | 🟡 Almacenes, motor de stock/movimientos, Reservas/Transferencias y Ajustes/Conteos Físicos — CRUD/motor real (15 de 34 tablas). 19 tablas restantes (recepciones/salidas/costeo/series/lotes/producción) diseñadas (`INVENTORY_ARCHITECTURE.md`), sin código todavía                                         | ❌ Sin construir                                                          |
| `productos`                                                                                                                                                                                                                                 | 🟡 Unidades de Medida, Categorías, Marcas, Modelos, Productos (5 tablas núcleo) — CRUD real. Variantes/atributos/combos/kits/BOM/imágenes (30 tablas restantes) sin backend todavía                                                                                                                           | ❌ Sin construir                                                          |
| Resto (22 módulos: ventas, pos, compras, clientes, proveedores, caja, bancos, contabilidad, crm, rrhh, nómina, producción, servicios, activos-fijos, proyectos, reportes, bi, impuestos*, tesorería, dashboard, administracion, documentos) | ❌ Sin backend                                                                                                                                                                                                                                                                                                | 🟡 Placeholder `ComingSoonPage` (25 módulos ya registrados en el sidebar) |

\* El módulo de negocio `modules/impuestos` (motor de reglas/cálculo/percepciones/retenciones,
`docs/architecture/46-modulo-taxes.md`) es distinto del catálogo mínimo de perfiles/tasas ya
construido dentro de `modules/configuracion/backend` — ver `CHANGELOG.md`, entrada FASE 02.

## Fase actual: FASE 05, Parte 04 — Ajustes y Conteos Físicos (2026-07-24)

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

### Próxima fase: Inventario, Parte 05 — Recepciones, Salidas y Reglas de Almacén

Con Ajustes y Conteos Físicos completos, la Parte 04 de la Fase 05 queda cerrada. Orden confirmado
(`INVENTORY_NEXT_PHASE.md`): **Parte 05 — Recepciones, salidas y reglas de almacén**
(`goods_receipts`/`goods_receipt_lines`/`goods_issues`/`goods_issue_lines`/`goods_issue_reasons`/
`putaway_rules`/`picking_rules`/`replenishment_rules`) → 06 Costeo → 07 Series/lotes →
08 Producción → Clientes → Ventas → Caja → POS.

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
