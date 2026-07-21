import { SetMetadata } from '@nestjs/common';

/**
 * Marca un endpoint como accesible sin JWT — `JwtAuthGuard` lo revisa
 * antes de exigir el token (rutas de `auth`: login, refresh, health
 * check público). Ver docs/architecture/09-seguridad-y-multiempresa.md §1.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);
