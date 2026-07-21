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

## Versionado del modelo de datos (track independiente)

El **modelo de datos** de GORAZUS tiene su propio track de versión,
independiente del código de aplicación de arriba — un cambio de schema
no necesariamente implica una nueva versión de código, y viceversa.

### Database actual: **Enterprise v1.0.0** (2026-07-21)

Certificación formal tras 8 partes de auditoría exhaustiva (rama
`release/database-v1`) — 501 tablas, 5.164 relaciones, 22 schemas, 94/100
de calificación general. Ver
[docs/database/DATABASE_CERTIFICATION.md](docs/database/DATABASE_CERTIFICATION.md)
para la certificación completa y
[docs/database/DATABASE_CHANGELOG.md](docs/database/DATABASE_CHANGELOG.md)
para el historial de las 8 partes. **A partir de esta versión, el modelo
de datos queda congelado en su estructura fundamental** — todo cambio
estructural futuro requiere una migración versionada (`sql/NN_*.sql`)
que incremente esta versión.
