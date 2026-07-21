import type { ConfigService } from '@nestjs/config';
import { LockAcquisitionError, LockService } from './lock.service';

/**
 * Contra Redis real (no mockeado) — la garantía que importa acá (SET NX
 * atómico, release solo si el token coincide vía Lua) es justo lo que un
 * fake de ioredis no podría probar de verdad. Requiere el Redis del
 * compose de desarrollo arriba (REDIS_URL, ver .env.example).
 */
describe('LockService', () => {
  let lockService: LockService;
  const testKeyPrefix = `test:lock-service-spec:${Date.now()}`;

  const fakeConfigService = {
    get: (key: string) => (key === 'redis.url' ? process.env['REDIS_URL'] : undefined),
  } as ConfigService;

  beforeAll(() => {
    lockService = new LockService(fakeConfigService);
    lockService.onModuleInit();
  });

  afterAll(async () => {
    await lockService.onModuleDestroy();
  });

  it('adquiere un lock libre y devuelve un token', async () => {
    const token = await lockService.acquire(`${testKeyPrefix}:acquire`, 5000);
    expect(token).toEqual(expect.any(String));
    await lockService.release(`${testKeyPrefix}:acquire`, token as string);
  });

  it('rechaza adquirir un lock ya tomado', async () => {
    const key = `${testKeyPrefix}:contended`;
    const first = await lockService.acquire(key, 5000);
    expect(first).not.toBeNull();

    const second = await lockService.acquire(key, 5000);
    expect(second).toBeNull();

    await lockService.release(key, first as string);
  });

  it('release con el token equivocado no libera el lock', async () => {
    const key = `${testKeyPrefix}:wrong-token`;
    const token = await lockService.acquire(key, 5000);

    const released = await lockService.release(key, 'token-que-no-es');
    expect(released).toBe(false);

    // sigue tomado: un segundo acquire con el key real debe fallar
    const stillLocked = await lockService.acquire(key, 5000);
    expect(stillLocked).toBeNull();

    await lockService.release(key, token as string);
  });

  it('withLock ejecuta fn y libera el lock incluso si fn lanza', async () => {
    const key = `${testKeyPrefix}:with-lock-throws`;

    await expect(
      lockService.withLock(key, 5000, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    // liberado: un nuevo withLock sobre la misma key debe poder adquirirla
    const result = await lockService.withLock(key, 5000, async () => 'ok');
    expect(result).toBe('ok');
  });

  it('withLock lanza LockAcquisitionError si el lock ya está tomado', async () => {
    const key = `${testKeyPrefix}:with-lock-contended`;
    const token = await lockService.acquire(key, 5000);

    await expect(lockService.withLock(key, 5000, async () => 'nunca corre')).rejects.toThrow(
      LockAcquisitionError,
    );

    await lockService.release(key, token as string);
  });
});
