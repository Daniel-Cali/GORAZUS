import type { UserContext } from '@gorazus/contracts';
import type { users } from '@gorazus/core-database';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationStatusRepository } from '../repositories/organization-status.repository';
import {
  EmpresaInactivaException,
  SucursalInactivaException,
  UsuarioInactivoException,
  ValidateTokenUseCase,
} from './validate-token.usecase';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

describe('ValidateTokenUseCase', () => {
  let userActive: boolean;
  let companyActive: boolean;
  let branchActive: boolean;
  let userRepository: UserRepository;
  let organizationStatusRepository: OrganizationStatusRepository;

  beforeEach(() => {
    userActive = true;
    companyActive = true;
    branchActive = true;

    userRepository = {
      findById: jest.fn(async () => ({ is_active: userActive }) as users),
    } as unknown as UserRepository;

    organizationStatusRepository = {
      isCompanyActive: jest.fn(async () => companyActive),
      isBranchActive: jest.fn(async () => branchActive),
    } as unknown as OrganizationStatusRepository;
  });

  function buildUseCase(): ValidateTokenUseCase {
    return new ValidateTokenUseCase(userRepository, organizationStatusRepository);
  }

  it('sesión válida devuelve valid:true con la identidad completa', async () => {
    const result = await buildUseCase().execute(CONTEXT);

    expect(result).toEqual({
      valid: true,
      userId: 'user-1',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      activeCompanyId: 'company-1',
      activeBranchId: 'branch-1',
    });
  });

  it('usuario inactivo lanza UsuarioInactivoException', async () => {
    userActive = false;

    await expect(buildUseCase().execute(CONTEXT)).rejects.toThrow(UsuarioInactivoException);
  });

  it('usuario inexistente lanza UsuarioInactivoException (mismo tratamiento que inactivo)', async () => {
    userRepository.findById = jest.fn(async () => null);

    await expect(buildUseCase().execute(CONTEXT)).rejects.toThrow(UsuarioInactivoException);
  });

  it('empresa activa inactiva lanza EmpresaInactivaException', async () => {
    companyActive = false;

    await expect(buildUseCase().execute(CONTEXT)).rejects.toThrow(EmpresaInactivaException);
  });

  it('sucursal activa inactiva lanza SucursalInactivaException', async () => {
    branchActive = false;

    await expect(buildUseCase().execute(CONTEXT)).rejects.toThrow(SucursalInactivaException);
  });

  it('sin empresa/sucursal seleccionada (null), no verifica esos flags', async () => {
    const context: UserContext = { ...CONTEXT, companyId: null, branchId: null };

    const result = await buildUseCase().execute(context);

    expect(result.activeCompanyId).toBeNull();
    expect(organizationStatusRepository.isCompanyActive).not.toHaveBeenCalled();
    expect(organizationStatusRepository.isBranchActive).not.toHaveBeenCalled();
  });
});
