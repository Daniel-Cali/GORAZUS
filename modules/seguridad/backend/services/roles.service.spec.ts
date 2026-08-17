import type { UserContext } from '@gorazus/contracts';
import type { roles, permissions } from '@gorazus/core-database';
import { RolRepository } from '../repositories/rol.repository';
import { PermisoRepository } from '../repositories/permiso.repository';
import { AsignacionRepository } from '../repositories/asignacion.repository';
import {
  RolesService,
  PermisoNoEncontradoException,
  RolNoEncontradoException,
} from './roles.service';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildRol(overrides: Partial<roles> = {}): roles {
  return {
    id: 'r-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: null,
    name: 'Vendedor',
    is_system_role: false,
    code: null,
    description: null,
    role_type: 'custom',
    ...overrides,
  } as roles;
}

function buildPermiso(overrides: Partial<permissions> = {}): permissions {
  return { id: 'p-1', code: 'ventas.gestionar_ventas', ...overrides } as permissions;
}

describe('RolesService', () => {
  let rolExistente: roles | null;
  let permisoEncontrado: permissions | null;
  let permisosDelRol: string[];
  let rolRepository: RolRepository;
  let permisoRepository: PermisoRepository;
  let asignacionRepository: AsignacionRepository;

  beforeEach(() => {
    rolExistente = buildRol();
    permisoEncontrado = buildPermiso();
    permisosDelRol = ['ventas.gestionar_ventas'];

    rolRepository = {
      create: jest.fn(async () => buildRol()),
      findById: jest.fn(async () => rolExistente),
      findMany: jest.fn(async () => ({
        data: rolExistente ? [rolExistente] : [],
        meta: { page: 1, pageSize: 20, total: rolExistente ? 1 : 0 },
      })),
      update: jest.fn(async () => buildRol({ name: 'Renombrado' })),
      softDelete: jest.fn(async () => buildRol({ deleted_at: new Date() } as Partial<roles>)),
    } as unknown as RolRepository;

    permisoRepository = {
      findByCode: jest.fn(async () => permisoEncontrado),
    } as unknown as PermisoRepository;

    asignacionRepository = {
      asignarPermisoARol: jest.fn(async () => undefined),
      revocarPermisoDeRol: jest.fn(async () => undefined),
      listarPermisosDeRol: jest.fn(async () => permisosDelRol),
    } as unknown as AsignacionRepository;
  });

  function buildService(): RolesService {
    return new RolesService(rolRepository, permisoRepository, asignacionRepository);
  }

  it('crear: usa la empresa activa de la sesión por defecto', async () => {
    await buildService().crear(CONTEXT, 'Vendedor');
    expect(rolRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ company_id: 'company-1', branch_id: null }),
    );
  });

  it('crear: companyId null explícito crea un rol de todo el tenant', async () => {
    await buildService().crear(CONTEXT, 'Rol tenant-wide', null);
    expect(rolRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ company_id: null }),
    );
  });

  it('crear: rechaza un nombre vacío', async () => {
    await expect(buildService().crear(CONTEXT, '  ')).rejects.toThrow('no puede estar vacío');
  });

  it('crear: normaliza nombre (trim) y código (trim + mayúsculas) antes de persistir', async () => {
    await buildService().crear(CONTEXT, '  Gerente  ', undefined, undefined, '  sales_manager  ');
    expect(rolRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ name: 'Gerente', code: 'SALES_MANAGER' }),
    );
  });

  it('crear: roleType por defecto es "custom"', async () => {
    await buildService().crear(CONTEXT, 'Vendedor');
    expect(rolRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({ role_type: 'custom' }),
    );
  });

  it('crear: pasa code/description/roleType', async () => {
    await buildService().crear(
      CONTEXT,
      'Gerente de ventas',
      undefined,
      undefined,
      'SALES_MANAGER',
      'Gerencia de ventas',
      'company',
    );
    expect(rolRepository.create).toHaveBeenCalledWith(
      CONTEXT,
      expect.objectContaining({
        code: 'SALES_MANAGER',
        description: 'Gerencia de ventas',
        role_type: 'company',
      }),
    );
  });

  it('listar: sin companyId no filtra por empresa', async () => {
    await buildService().listar(CONTEXT, undefined, { page: 1, pageSize: 20 });
    expect(rolRepository.findMany).toHaveBeenCalledWith(CONTEXT, {}, { page: 1, pageSize: 20 });
  });

  it('listar: con companyId filtra por esa empresa', async () => {
    await buildService().listar(CONTEXT, 'company-2', { page: 1, pageSize: 20 });
    expect(rolRepository.findMany).toHaveBeenCalledWith(
      CONTEXT,
      { company_id: 'company-2' },
      { page: 1, pageSize: 20 },
    );
  });

  it('obtener: rol inexistente lanza RolNoEncontradoException', async () => {
    rolExistente = null;
    await expect(buildService().obtener(CONTEXT, 'r-x')).rejects.toThrow(RolNoEncontradoException);
  });

  it('obtener: devuelve el rol junto con sus códigos de permiso', async () => {
    const resultado = await buildService().obtener(CONTEXT, 'r-1');
    expect(resultado.permissionCodes).toEqual(['ventas.gestionar_ventas']);
  });

  it('actualizar: rechaza renombrar un rol de fábrica', async () => {
    rolExistente = buildRol({ is_system_role: true, role_type: 'system' });
    await expect(buildService().actualizar(CONTEXT, 'r-1', 'Nuevo nombre')).rejects.toThrow(
      'rol de fábrica',
    );
  });

  it('actualizar: caso feliz', async () => {
    const rol = await buildService().actualizar(CONTEXT, 'r-1', 'Renombrado');
    expect(rol.name).toBe('Renombrado');
  });

  it('actualizar: normaliza el nombre nuevo (trim) antes de persistir', async () => {
    await buildService().actualizar(CONTEXT, 'r-1', '  Renombrado  ');
    expect(rolRepository.update).toHaveBeenCalledWith(
      CONTEXT,
      { id: 'r-1' },
      { name: 'Renombrado' },
    );
  });

  it('eliminar: rechaza eliminar un rol de fábrica', async () => {
    rolExistente = buildRol({ is_system_role: true, role_type: 'system' });
    await expect(buildService().eliminar(CONTEXT, 'r-1')).rejects.toThrow('rol de fábrica');
  });

  it('eliminar: caso feliz hace baja lógica', async () => {
    await buildService().eliminar(CONTEXT, 'r-1');
    expect(rolRepository.softDelete).toHaveBeenCalled();
  });

  it('asignarPermiso: rechaza un código de permiso inexistente', async () => {
    permisoEncontrado = null;
    await expect(
      buildService().asignarPermiso(CONTEXT, 'r-1', 'codigo.inexistente'),
    ).rejects.toThrow(PermisoNoEncontradoException);
  });

  it('asignarPermiso: caso feliz', async () => {
    await buildService().asignarPermiso(CONTEXT, 'r-1', 'ventas.gestionar_ventas');
    expect(asignacionRepository.asignarPermisoARol).toHaveBeenCalledWith(CONTEXT, 'r-1', 'p-1');
  });

  it('revocarPermiso: caso feliz', async () => {
    await buildService().revocarPermiso(CONTEXT, 'r-1', 'ventas.gestionar_ventas');
    expect(asignacionRepository.revocarPermisoDeRol).toHaveBeenCalledWith(CONTEXT, 'r-1', 'p-1');
  });
});
