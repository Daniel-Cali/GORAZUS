import type { UserContext } from '@gorazus/contracts';
import type { users } from '@gorazus/core-database';
import { UserRepository } from '../repositories/user.repository';
import { GetCurrentUserUseCase, UsuarioNoEncontradoException } from './get-current-user.usecase';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

describe('GetCurrentUserUseCase', () => {
  it('devuelve la identidad del usuario autenticado', async () => {
    const record: Partial<users> = {
      id: 'user-1',
      email: 'demo@demo.local',
      full_name: 'Demo User',
      is_active: true,
      last_login_at: new Date('2026-07-20'),
      tenant_id: 'tenant-1',
    };
    const userRepository = {
      findById: jest.fn(async () => record as users),
    } as unknown as UserRepository;
    const useCase = new GetCurrentUserUseCase(userRepository);

    const result = await useCase.execute(CONTEXT);

    expect(result).toEqual({
      id: 'user-1',
      email: 'demo@demo.local',
      fullName: 'Demo User',
      isActive: true,
      lastLoginAt: record.last_login_at,
      tenantId: 'tenant-1',
      activeCompanyId: 'company-1',
      activeBranchId: 'branch-1',
    });
    expect(userRepository.findById).toHaveBeenCalledWith(CONTEXT, { id: 'user-1' });
  });

  it('usuario inexistente lanza UsuarioNoEncontradoException', async () => {
    const userRepository = {
      findById: jest.fn(async () => null),
    } as unknown as UserRepository;
    const useCase = new GetCurrentUserUseCase(userRepository);

    await expect(useCase.execute(CONTEXT)).rejects.toThrow(UsuarioNoEncontradoException);
  });
});
