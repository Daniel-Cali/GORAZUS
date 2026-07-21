import { registerAs } from '@nestjs/config';

/** Namespace `redis` — ver core/config/namespaces/database.config.ts (mismo patrón). */
export default registerAs('redis', () => ({
  url: process.env['REDIS_URL'],
}));
