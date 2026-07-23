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
| `inventario`                                                                                                                                                                                                                                | 🟡 Almacenes (Almacén→Zona→Ubicación) — CRUD real. Stock/movimientos/costeo/conteos/producción (29 tablas restantes) sin backend todavía, fase "Inventario" siguiente                                                                                                                                         | ❌ Sin construir                                                          |
| `productos`                                                                                                                                                                                                                                 | 🟡 Unidades de Medida, Categorías, Marcas, Modelos, Productos (5 tablas núcleo) — CRUD real. Variantes/atributos/combos/kits/BOM/imágenes (30 tablas restantes) sin backend todavía                                                                                                                           | ❌ Sin construir                                                          |
| Resto (22 módulos: ventas, pos, compras, clientes, proveedores, caja, bancos, contabilidad, crm, rrhh, nómina, producción, servicios, activos-fijos, proyectos, reportes, bi, impuestos*, tesorería, dashboard, administracion, documentos) | ❌ Sin backend                                                                                                                                                                                                                                                                                                | 🟡 Placeholder `ComingSoonPage` (25 módulos ya registrados en el sidebar) |

\* El módulo de negocio `modules/impuestos` (motor de reglas/cálculo/percepciones/retenciones,
`docs/architecture/46-modulo-taxes.md`) es distinto del catálogo mínimo de perfiles/tasas ya
construido dentro de `modules/configuracion/backend` — ver `CHANGELOG.md`, entrada FASE 02.

## Fase actual: FASE 04 — Productos (2026-07-23)

`v0.7.0` agregó `modules/productos/backend`: CRUD de Unidades de Medida, Categorías, Marcas,
Modelos y Productos (5 de 35 tablas del schema `products`) — ver `PRODUCTOS_REPORT.md` para el
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
  sucursal/almacén/zona padre. Stock/movimientos/costeo/conteos/producción siguen sin construir
  (fase "Inventario" siguiente, no esta).
- **Productos**: CRUD de Unidades de Medida, Categorías (jerárquica), Marcas, Modelos y Productos
  (`good`/`service`/`kit`/`combo`/`composite`), con validación cruzada marca↔modelo y el invariante
  de que un `service` no rastrea serie/lote. Variantes/atributos/combos/kits/BOM/imágenes siguen sin
  construir.
- **Archivos**: `core/storage` con endpoint genérico de subida/descarga/borrado (MinIO, bucket por
  tenant) — infraestructura, no un módulo de negocio.
- Control de calidad: 231+ tests reales (no solo unitarios) verificados contra Postgres/Redis/MinIO/
  MailHog reales cuando la infraestructura estuvo disponible — ver `TEST_REPORT.md`/
  `PRODUCTOS_TEST_REPORT.md` para el detalle y una nota sobre disponibilidad de Docker.

### Próxima fase: Inventario

Con Productos completo, la Fase 04 del orden de desarrollo queda cerrada. Orden confirmado
(`NEXT_STEPS.md`): **Inventario** (stock/movimientos/costeo reales, sobre la base de Almacenes en
`0.6.0` y Productos en `0.7.0`) → Clientes → Ventas → Caja → POS.

## Backlog conocido

- Detección de reuso de refresh token (revocar toda la familia de sesiones ante un token ya
  rotado reutilizado) — gap documentado en el propio código (`RefreshTokenUseCase`).
- Patrón compartido de sort/filter/search para listados — cada controller lo resuelve ad hoc hoy.
- Publicación real de los Domain Events de `auth` (preparados, sin publicar) y de cualquier
  consumidor real de `EventBusService`/`SchedulerService` — ningún módulo de negocio los usa
  todavía.
- Catálogo de países/jurisdicciones fiscales (`configuration.countries`/`taxes.tax_jurisdictions`)
  no tiene CRUD ni UI — solo el script de seed mínimo que desbloquea Impuestos.
- Ver `CHANGELOG.md` sección "Pendiente conocido" y `TECHNICAL_DEBT.md` para el resto (39
  vulnerabilidades de dependencias transitivas, Kubernetes sin cluster real de prueba, etc.).
