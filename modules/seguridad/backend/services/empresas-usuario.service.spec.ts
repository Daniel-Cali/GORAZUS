import type { UserContext } from '@gorazus/contracts';
import type { users, user_companies } from '@gorazus/core-database';
import { EmpresaUsuarioRepository } from '../repositories/empresa-usuario.repository';
import { UsuarioAdminRepository } from '../repositories/usuario-admin.repository';
import { UsuarioNoEncontradoException } from './usuarios-admin.service';
import {
  AsignacionNoEncontradaException,
  EmpresaInactivaException,
  EmpresaYaAsignadaException,
  EmpresasUsuarioService,
} from './empresas-usuario.service';

const CONTEXT: UserContext = {
  userId: 'admin-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: null,
  sessionId: 'session-1',
};

describe('EmpresasUsuarioService', () => {
  let usuarioExiste: boolean;
  let empresaActiva: boolean;
  let yaAsignada: boolean;
  let asignarCalls: Array<{ userId: string; companyId: string; isDefault: boolean }>;
  let desasignarCalls: Array<{ userId: string; companyId: string }>;
  let empresaUsuarioRepository: EmpresaUsuarioRepository;
  let usuarioAdminRepository: UsuarioAdminRepository;

  beforeEach(() => {
    usuarioExiste = true;
    empresaActiva = true;
    yaAsignada = false;
    asignarCalls = [];
    desasignarCalls = [];

    empresaUsuarioRepository = {
      listarPorUsuario: jest.fn(async () => [] as user_companies[]),
      empresaActiva: jest.fn(async () => empresaActiva),
      yaAsignada: jest.fn(async () => yaAsignada),
      asignar: jest.fn(
        async (_ctx: unknown, userId: string, companyId: string, isDefault: boolean) => {
          asignarCalls.push({ userId, companyId, isDefault });
          return {
            id: 'uc-1',
            user_id: userId,
            target_company_id: companyId,
            is_default: isDefault,
          } as user_companies;
        },
      ),
      desasignar: jest.fn(async (_ctx: unknown, userId: string, companyId: string) => {
        desasignarCalls.push({ userId, companyId });
      }),
    } as unknown as EmpresaUsuarioRepository;

    usuarioAdminRepository = {
      findById: jest.fn(async () =>
        usuarioExiste ? ({ id: 'user-1', deleted_at: null } as users) : null,
      ),
    } as unknown as UsuarioAdminRepository;
  });

  function buildService(): EmpresasUsuarioService {
    return new EmpresasUsuarioService(empresaUsuarioRepository, usuarioAdminRepository);
  }

  it('asignar: usuario inexistente lanza UsuarioNoEncontradoException', async () => {
    usuarioExiste = false;
    await expect(buildService().asignar(CONTEXT, 'user-1', 'company-2', false)).rejects.toThrow(
      UsuarioNoEncontradoException,
    );
  });

  it('asignar: empresa inactiva lanza EmpresaInactivaException', async () => {
    empresaActiva = false;
    await expect(buildService().asignar(CONTEXT, 'user-1', 'company-2', false)).rejects.toThrow(
      EmpresaInactivaException,
    );
  });

  it('asignar: empresa ya asignada lanza EmpresaYaAsignadaException', async () => {
    yaAsignada = true;
    await expect(buildService().asignar(CONTEXT, 'user-1', 'company-2', false)).rejects.toThrow(
      EmpresaYaAsignadaException,
    );
  });

  it('asignar: caso feliz delega al repositorio con isDefault', async () => {
    await buildService().asignar(CONTEXT, 'user-1', 'company-2', true);
    expect(asignarCalls).toEqual([{ userId: 'user-1', companyId: 'company-2', isDefault: true }]);
  });

  it('desasignar: asignación inexistente lanza AsignacionNoEncontradaException', async () => {
    yaAsignada = false;
    await expect(buildService().desasignar(CONTEXT, 'user-1', 'company-2')).rejects.toThrow(
      AsignacionNoEncontradaException,
    );
  });

  it('desasignar: caso feliz delega al repositorio', async () => {
    yaAsignada = true;
    await buildService().desasignar(CONTEXT, 'user-1', 'company-2');
    expect(desasignarCalls).toEqual([{ userId: 'user-1', companyId: 'company-2' }]);
  });
});
