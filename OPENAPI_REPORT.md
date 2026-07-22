# OpenAPI Report — GORAZUS ERP

> Fase 2 — Desarrollo del Backend Core. Sesión del 2026-07-22, versión
> **0.3.0**. Estado de la generación del spec OpenAPI y del proceso seguido
> esta sesión para dejarlo real.

## 1. Mecanismo — sin cambios, confirmado funcionando

`core/kernel/bootstrap.ts` genera `docs/api/openapi.json` automáticamente en
cada arranque no-productivo (`NODE_ENV !== 'production'`), vía
`SwaggerModule.createDocument` + `writeFileSync`. Este mecanismo ya existía
desde la sesión de Backend Enterprise previa — esta sesión no lo modificó,
solo lo ejercitó para confirmar que sigue generando correctamente con las
rutas nuevas.

## 2. El spec estaba desactualizado — regenerado esta sesión

`docs/api/openapi.json` tenía fecha del 2026-07-20 23:53 — de antes de
**toda** la sesión anterior (infraestructura) y de esta (Backend Core),
porque nunca hubo un boot real de la app con ese código desde entonces (el
único contenedor Docker corriendo resultó ser una imagen congelada sin
volúmenes, ver `BACKEND_HEALTH_REPORT.md` §3).

**Regenerado** corriendo la app directo con `ts-node` en el host (mismo
comando que usa la imagen de producción,
`node_modules/.bin/ts-node --transpile-only apps/api/src/main.ts`) contra
la infraestructura real (Postgres/Redis/RabbitMQ/MinIO), dejándolo bootear,
y deteniéndolo una vez escrito el archivo.

| Antes                        | Después            |
| ---------------------------- | ------------------ |
| 26.820 bytes, 1068 líneas    | 31.201 bytes       |
| 33 rutas (`paths`)           | **38 rutas**       |
| Sin `/auth/login/2fa`        | ✅ presente        |
| Sin `/files`, `/files/{key}` | ✅ ambas presentes |

## 3. `docs/api/API.md` — actualizado a mano

Ese archivo es un índice de lectura rápida mantenido a mano (no generado),
que remitía a `openapi.json` como fuente de verdad. Tenía dos afirmaciones
ya falsas antes de esta sesión terminara:

- `/auth/forgot-password` decía "el token se entrega vía log
  (`LoggingPasswordResetNotifier`, canal email pendiente)" — ya no es
  cierto, `EmailPasswordResetNotifier` es la implementación por defecto.
- La sección de `seguridad` decía "2FA es preparado... todavía no es un
  paso obligatorio de `POST /auth/login`" — ya no es cierto.

Ambas corregidas, más las 4 filas nuevas (`/auth/login/2fa`, `/files`,
`/files/{key}` GET y DELETE).

## 4. Validación de OpenAPI en CI — sigue sin existir (ya documentado)

La sesión de infraestructura previa ya documentó (`CI_REPORT.md` §4.1) que
un job de CI que valide/regenere este spec automáticamente necesitaría
contenedores de servicio reales dentro del runner de GitHub Actions —
mismo prerequisito que los tests e2e reales en CI, ninguno de los dos
existe todavía. No se tocó esta sesión; el spec quedó regenerado a mano
como parte de este cierre, no automatizado hacia adelante.

## 5. No verificado esta sesión

- Que Postman/Insomnia importen el spec regenerado sin error — no se probó
  con un cliente real, solo se confirmó que el JSON es válido y contiene
  las rutas esperadas (`JSON.parse` + inspección de `paths`).
- Swagger UI (`GET /docs`, montado por el mismo `SwaggerModule.setup`) — no
  se abrió en navegador esta sesión, solo se confirmó que el `document`
  que la alimenta se genera bien (mismo objeto que se serializa a
  `openapi.json`).
