# Roadmap — GORAZUS ERP

Este documento responde _"¿qué código de negocio existe hoy, y qué sigue?"_ Complementa a
[docs/00-roadmap-fases.md](docs/00-roadmap-fases.md) (32 fases de **documentación de
arquitectura**, casi todas ✅) sin duplicarlo — ver detalle línea por línea de cada sesión de
trabajo en [CHANGELOG.md](CHANGELOG.md).

## Estado del backend por módulo de negocio (código real, no solo diseño)

| Módulo                                                                                                                                                                                                                                                             | Backend                                                                                       | Frontend                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `auth`                                                                                                                                                                                                                                                             | ✅ Login, refresh, logout, recuperación de contraseña                                         | ✅ Login                                                                  |
| `seguridad`                                                                                                                                                                                                                                                        | ✅ Roles/permisos (RBAC), usuarios (CRUD + perfil propio), auditoría, sesiones, 2FA preparado | ✅ Listado/alta de usuarios                                               |
| `configuracion`                                                                                                                                                                                                                                                    | ✅ Empresas, Sucursales, Parámetros, Monedas, Impuestos (alcance mínimo)                      | ❌ Sin construir                                                          |
| Resto (24 módulos: ventas, pos, inventario, compras, productos, clientes, proveedores, caja, bancos, contabilidad, crm, rrhh, nómina, producción, servicios, activos-fijos, proyectos, reportes, bi, impuestos*, tesorería, dashboard, administracion, documentos) | ❌ Sin backend                                                                                | 🟡 Placeholder `ComingSoonPage` (25 módulos ya registrados en el sidebar) |

\* El módulo de negocio `modules/impuestos` (motor de reglas/cálculo/percepciones/retenciones,
`docs/architecture/46-modulo-taxes.md`) es distinto del catálogo mínimo de perfiles/tasas ya
construido dentro de `modules/configuracion/backend` — ver `CHANGELOG.md`, entrada FASE 02.

## Fase actual: FASE 02 — Backend Core + Gestión de Versiones (✅ completa, 2026-07-21)

Objetivo: Backend Enterprise listo como base de ERP — Core (catálogos), Seguridad y Usuarios
completos, documentados, probados y versionados. Ver `CHANGELOG.md` para el detalle completo
(qué se construyó, qué bugs reales se encontraron y corrigieron, conteo de tests).

Entregado:

- **Core**: Empresas, Sucursales, Configuración General + Parámetros, Monedas, Impuestos (alcance mínimo).
- **Seguridad**: Auditoría (lectura), Sesiones (listar/revocar), Recuperación de contraseña
  (forgot/reset), 2FA preparado (TOTP real, no exigido en login todavía).
- **Usuarios**: perfil propio (ver/editar), cambio de contraseña self-service, activación/bloqueo
  (acción simétrica agregada), historial (reusa Auditoría).
- Control de calidad: compilación limpia, 111 tests nuevos/verificados, lint limpio, sin
  regresiones en los módulos ya existentes (`auth`, `seguridad` previos).

## Próxima fase: Inventario y Productos

Primer módulo de negocio con movimiento de stock real, después de que Core (Empresas/Sucursales/
Monedas) ya existe como prerequisito de datos maestros. Sin diseño de detalle todavía — ver
`docs/architecture/18-modulo-products.md` y `docs/architecture/19-modulo-inventory.md` para el
modelo de datos ya documentado (arquitectura, no código).

## Backlog conocido (no bloqueante para la fase actual)

- 2FA no está integrado como paso obligatorio de `LoginUseCase` — el mecanismo (setup/confirmar/
  deshabilitar) es real, falta la rama de login que lo exija cuando esté activo.
- `PasswordResetNotifier` solo tiene una implementación de logging — falta un canal de email real
  en Notification Center (`core/notifications` solo tiene WhatsApp, Fase 1).
- Catálogo de países/jurisdicciones fiscales (`configuration.countries`/`taxes.tax_jurisdictions`)
  no tiene CRUD ni UI — solo el script de seed mínimo que desbloquea Impuestos.
- Ver `CHANGELOG.md` sección "Pendiente conocido" para el resto (rate limiting, vulnerabilidades de
  dependencias transitivas, Kubernetes sin cluster real de prueba, etc. — heredado de fases previas).
