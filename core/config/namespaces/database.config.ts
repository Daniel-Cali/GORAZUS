import { registerAs } from '@nestjs/config';

/**
 * Namespace `database` — ver docs/architecture/12-backend-enterprise.md §7.3:
 * agrupa configuración validada por dominio técnico. Ningún módulo de
 * negocio lee `process.env.DATABASE_URL` directamente, siempre inyecta
 * ConfigService y pide `configService.get('database.url')`.
 */
export default registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));
