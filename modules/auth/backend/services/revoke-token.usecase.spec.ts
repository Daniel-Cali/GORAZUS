import type { UserContext } from '@gorazus/contracts';
import type { CacheService } from '@gorazus/core-cache';
import type { sessions } from '@gorazus/core-database';
import { SessionRepository } from '../repositories/session.repository';
import { RevokeTokenUseCase, SesionNoEncontradaException } from './revoke-token.usecase';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

describe('RevokeTokenUseCase', () => {
  let sessionRepository: SessionRepository;
  let cacheService: CacheService;
  let updateCalls: Array<{ where: unknown; data: unknown }>;
  let revokeAllCalls: string[];
  let cacheSetCalls: Array<{ key: string; value: unknown }>;
  let activeIds: string[];
  let sessionById: sessions | null;

  beforeEach(() => {
    updateCalls = [];
    revokeAllCalls = [];
    cacheSetCalls = [];
    activeIds = ['session-1', 'session-2'];
    sessionById = { id: 'session-1', user_id: 'user-1', revoked_at: null } as sessions;

    sessionRepository = {
      findById: jest.fn(async () => sessionById),
      update: jest.fn(async (_context: unknown, where: unknown, data: unknown) => {
        updateCalls.push({ where, data });
        return sessionById;
      }),
      revokeAllForUser: jest.fn(async (_context: unknown, userId: string) => {
        revokeAllCalls.push(userId);
      }),
      findActiveIdsForUser: jest.fn(async () => activeIds),
    } as unknown as SessionRepository;

    cacheService = {
      set: jest.fn(async (key: string, value: unknown) => {
        cacheSetCalls.push({ key, value });
      }),
    } as unknown as CacheService;
  });

  function buildUseCase(): RevokeTokenUseCase {
    return new RevokeTokenUseCase(sessionRepository, cacheService);
  }

  it('con sessionId propio: revoca solo esa sesión y la marca en Redis', async () => {
    const result = await buildUseCase().execute(CONTEXT, 'session-1');

    expect(result).toEqual({ revokedSessions: 1 });
    expect(updateCalls).toHaveLength(1);
    expect(cacheSetCalls).toEqual([
      expect.objectContaining({ key: expect.stringContaining('session-1') }),
    ]);
    expect(sessionRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('con sessionId de otro usuario: lanza SesionNoEncontradaException (sin enumeración)', async () => {
    sessionById = { id: 'session-9', user_id: 'otro-usuario', revoked_at: null } as sessions;

    await expect(buildUseCase().execute(CONTEXT, 'session-9')).rejects.toThrow(
      SesionNoEncontradaException,
    );
    expect(updateCalls).toHaveLength(0);
  });

  it('con sessionId inexistente: lanza SesionNoEncontradaException', async () => {
    sessionById = null;

    await expect(buildUseCase().execute(CONTEXT, 'no-existe')).rejects.toThrow(
      SesionNoEncontradaException,
    );
  });

  it('con sessionId ya revocado: no vuelve a revocar, devuelve revokedSessions:0', async () => {
    sessionById = { id: 'session-1', user_id: 'user-1', revoked_at: new Date() } as sessions;

    const result = await buildUseCase().execute(CONTEXT, 'session-1');

    expect(result).toEqual({ revokedSessions: 0 });
    expect(updateCalls).toHaveLength(0);
  });

  it('sin sessionId: revoca todas las sesiones activas del usuario y las marca en Redis', async () => {
    const result = await buildUseCase().execute(CONTEXT);

    expect(result).toEqual({ revokedSessions: 2 });
    expect(revokeAllCalls).toEqual(['user-1']);
    expect(cacheSetCalls).toHaveLength(2);
  });
});
