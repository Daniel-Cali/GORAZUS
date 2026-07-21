/**
 * Security Context completo — mencionado como pendiente en
 * core/logging/request-context.ts ("el Security Context completo...
 * vive en packages/contracts y lo llena el módulo `auth`"). Este
 * archivo define la FORMA; quién la llena en runtime es
 * core/http/interceptors/tenant.interceptor.ts a partir del JWT ya
 * verificado por JwtAuthGuard — ver
 * docs/architecture/09-seguridad-y-multiempresa.md §1.
 *
 * Deliberadamente NO incluye permisos/roles resueltos — el access
 * token no los lleva embebidos (revocar un permiso debe ser
 * instantáneo, §1 del mismo documento), así que este contexto solo
 * tiene lo que el JWT sí lleva. La resolución de permisos es un paso
 * aparte (PermissionsGuard + un `PermissionsResolver` inyectado, ver
 * core/http/guards/permissions.guard.ts) — no se cachea acá.
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  /** `null` cuando el usuario opera en modo "todas las empresas" (rol lo permite). */
  companyId: string | null;
  branchId: string | null;
  sessionId: string;
}

/** Payload exacto que el access token JWT lleva firmado (`sub`, `empresaId`, `sessionId` — 09-seguridad-y-multiempresa.md §1, "no lleva roles/permisos embebidos"). */
export interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  companyId: string | null;
  branchId: string | null;
  sessionId: string;
  iat: number;
  exp: number;
}
