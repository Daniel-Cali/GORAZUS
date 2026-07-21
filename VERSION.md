# Versión — GORAZUS ERP

Versionado [SemVer](https://semver.org/lang/es/), pre-1.0: `MINOR` marca una fase de trabajo
completa y estable (no un release público), `PATCH` una corrección puntual. `0.0.0` no se usa —
el proyecto arrancó en `0.1.0` (bootstrap del monorepo + FASE 01-05). Sin releases públicos
todavía, así que no hay compromiso de compatibilidad entre versiones `0.x`.

## Versión actual: **0.2.0** (2026-07-21)

FASE 02 — Backend Core + Gestión de Versiones. Ver `CHANGELOG.md` para el detalle completo,
`ROADMAP.md` para el estado por módulo. Resumen:

- **Core** (`modules/configuracion/backend`, nuevo): Empresas, Sucursales, Configuración General +
  Parámetros, Monedas, Impuestos (alcance mínimo).
- **Seguridad** (extendido): Auditoría, Sesiones, Recuperación de contraseña, 2FA preparado (TOTP
  real, no exigido en login todavía).
- **Usuarios** (extendido): perfil propio, cambio de contraseña self-service, activación/bloqueo,
  historial.
- 2 bugs reales de plataforma corregidos (serialización de `Prisma.Decimal`, contador TOTP
  negativo cerca de epoch 0).
- 111 tests nuevos/verificados, 0 regresiones en `auth`/`seguridad` ya existentes.

## Historial

| Versión | Fecha      | Resumen                                                                                                                                                                                                                                                                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.2.0   | 2026-07-21 | FASE 02 — Backend Core (Empresas/Sucursales/Config/Monedas/Impuestos) + extensión de Seguridad (Auditoría/Sesiones/Reset de contraseña/2FA) + Usuarios (perfil/self-service/historial).                                                                                                                                      |
| 0.1.0   | 2026-07-20 | Bootstrap del monorepo + FASE 01-05: Foundation Platform (`core/*`), persistencia (21 clientes Prisma, RLS forzado), primeros módulos de negocio reales (`auth`, `seguridad`), frontend (`apps/web`, `ui-kit`), Notification Center (WhatsApp), Ollama, Kubernetes/monitoreo/HTTPS/backup, testing (Playwright, k6, CodeQL). |

## Próxima versión prevista

`0.3.0` — módulo de negocio Inventario y Productos (primer módulo con movimiento de stock real),
sobre la base de Core ya construida en `0.2.0`. Sin fecha comprometida.
