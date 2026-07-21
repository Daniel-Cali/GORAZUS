import { SetMetadata } from '@nestjs/common';

/**
 * `@RequirePermission('ventas.confirmar')` — ejemplo exacto ya usado en
 * docs/architecture/09-seguridad-y-multiempresa.md §2. `PermissionsGuard`
 * lee este metadato y lo resuelve contra el `PermissionsResolver`
 * (puerto, ver `guards/permissions-resolver.interface.ts`) — ningún
 * módulo implementa su propia verificación de permisos en paralelo.
 */
export const REQUIRE_PERMISSION_KEY = 'requirePermission';
export const RequirePermission = (permission: string): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
