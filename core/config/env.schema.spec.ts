import { validateEnv } from './env.schema';

/**
 * Primer test unitario real de la plataforma (ver CHANGELOG.md,
 * "Pendiente conocido": sin tests reales todavía). Cubre exactamente
 * la garantía que `docs/architecture/12-backend-enterprise.md §7`
 * promete: fail-fast al boot si falta o es inválida una variable.
 */
describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/gorazus',
    REDIS_URL: 'redis://localhost:6379',
    RABBITMQ_URL: 'amqp://user:pass@localhost:5672',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_ROOT_USER: 'gorazus_app',
    MINIO_ROOT_PASSWORD: 'secret',
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    NOTIFICATIONS_ENCRYPTION_KEY:
      'b7a2a0c58672d7ea480a686123fc954a31b9e90e2e6e124a5e25c8f78ddca35e',
    OLLAMA_DEFAULT_MODEL: 'llama3.1',
  };

  it('parsea un entorno completo y válido sin lanzar', () => {
    const result = validateEnv(validEnv);
    expect(result.NODE_ENV).toBe('test');
    expect(result.API_PORT).toBe(3000); // default, no estaba en validEnv
  });

  it('coacciona MINIO_PORT/SMTP_PORT de string a number', () => {
    const result = validateEnv(validEnv);
    expect(typeof result.MINIO_PORT).toBe('number');
    expect(typeof result.SMTP_PORT).toBe('number');
  });

  it('falla rápido (fail-fast) si falta una variable requerida', () => {
    const { DATABASE_URL: _omitted, ...withoutDatabaseUrl } = validEnv;
    expect(() => validateEnv(withoutDatabaseUrl)).toThrow(/Variables de entorno inválidas/);
  });

  it('falla rápido si una variable tiene formato inválido', () => {
    expect(() => validateEnv({ ...validEnv, DATABASE_URL: 'no-es-una-url' })).toThrow();
  });

  it('rechaza un NODE_ENV fuera del enum permitido', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging-typo' })).toThrow();
  });
});
