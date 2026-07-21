# auth

**Propósito:** autenticación (login, refresh de sesión, cambio de contexto
Empresa/Sucursal). Puerta de entrada del sistema — no tiene menú de
navegación propio (su contraparte visible en el sidebar es `Seguridad`, ver
`docs/menus/00-convenciones.md §6`).

**Dueño de datos:** usuarios, sesiones, tokens (schema `auth` en Postgres,
`docs/architecture/02-arquitectura-modulos-backend.md §4`).

**Estado:** `backend/` todavía no implementado. `frontend/` expone
`/login` (`modules/auth/frontend/routes/auth.routes.tsx`) contra un
contrato de `POST /auth/login` asumido por convención — ver
`modules/auth/shared/contracts/login.types.ts` para el detalle de qué
queda por confirmar cuando el backend exista.

**Dependencias declaradas:** ninguna (no importa `index.ts` de otro módulo).
