import { registerAs } from '@nestjs/config';

/**
 * Namespace `storage` (MinIO) — ver core/config/namespaces/database.config.ts
 * (mismo patrón) y docs/architecture/08-infraestructura-y-despliegue.md §5.
 */
export default registerAs('storage', () => ({
  endpoint: process.env['MINIO_ENDPOINT'],
  port: Number(process.env['MINIO_PORT']),
  rootUser: process.env['MINIO_ROOT_USER'],
  rootPassword: process.env['MINIO_ROOT_PASSWORD'],
}));
