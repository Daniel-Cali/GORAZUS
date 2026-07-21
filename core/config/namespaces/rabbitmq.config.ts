import { registerAs } from '@nestjs/config';

/** Namespace `rabbitmq` — ver core/config/namespaces/database.config.ts (mismo patrón). */
export default registerAs('rabbitmq', () => ({
  url: process.env['RABBITMQ_URL'],
}));
