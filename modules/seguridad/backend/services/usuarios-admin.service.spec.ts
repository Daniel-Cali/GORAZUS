import type { UserContext } from '@gorazus/contracts';
import type { users, PaginatedResult } from '@gorazus/core-database';
import { UsuarioAdminRepository } from '../repositories/usuario-admin.repository';
import { AsignacionRepository } from '../repositories/asignacion.repository';
import {
  EmailYaRegistradoException,
  PasswordActualInvalidaException,
  UsuarioEliminadoException,
  UsuarioNoEncontradoException,
  UsuariosAdminService,
} from './usuarios-admin.service';

const CONTEXT: UserContext = {
  userId: 'admin-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: null,
  sessionId: 'session-1',
};

function buildUsuario(overrides: Partial<users> = {}): users {
  return {
    id: 'user-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    branch_id: null,
    email: 'demo@demo.local',
    // hash real de "Test1234!" — mismo criterio que login.usecase.spec.ts (probar contra la implementación real).
    password_hash:
      '$argon2id$v=19$m=65536,t=3,p=4$sqxyVl9VGeAv7GFmByINIw$TwpQ+5hHO09oFcf+XLBebGfmlwwj07LhimvrZQWnpjw',
    full_name: 'Demo',
    is_active: true,
    is_system_account: false,
    last_login_at: null,
    deleted_at: null,
    metadata: {},
    ...overrides,
  } as users;
}

describe('UsuariosAdminService', () => {
  let usuarios: Map<string, users>;
  let usuarioAdminRepository: UsuarioAdminRepository;
  let asignacionRepository: AsignacionRepository;
  let asignarRolCalls: Array<{ userId: string; rolId: string }>;
  let revocarRolCalls: Array<{ userId: string; rolId: string }>;

  beforeEach(() => {
    usuarios = new Map([['user-1', buildUsuario()]]);

    usuarioAdminRepository = {
      findById: jest.fn(
        async (_ctx: unknown, where: { id: string }) => usuarios.get(where.id) ?? null,
      ),
      findMany: jest.fn(async (_ctx: unknown, filter: Partial<users>) => {
        const data = [...usuarios.values()].filter(
          (u) => filter.email === undefined || u.email === filter.email,
        );
        return {
          data,
          meta: { page: 1, pageSize: 20, total: data.length },
        } as PaginatedResult<users>;
      }),
      create: jest.fn(async (_ctx: unknown, data: Partial<users>) => {
        const nuevo = buildUsuario({ id: 'user-nuevo', ...data });
        usuarios.set(nuevo.id, nuevo);
        return nuevo;
      }),
      update: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<users>) => {
        const actual = usuarios.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizado = { ...actual, ...data };
        usuarios.set(where.id, actualizado);
        return actualizado;
      }),
      softDelete: jest.fn(async (_ctx: unknown, where: { id: string }, data: Partial<users>) => {
        const actual = usuarios.get(where.id);
        if (!actual) throw new Error('no existe');
        const actualizado = { ...actual, ...data };
        usuarios.set(where.id, actualizado);
        return actualizado;
      }),
    } as unknown as UsuarioAdminRepository;

    asignarRolCalls = [];
    revocarRolCalls = [];
    asignacionRepository = {
      asignarRolAUsuario: jest.fn(async (_ctx: unknown, userId: string, rolId: string) => {
        asignarRolCalls.push({ userId, rolId });
      }),
      revocarRolDeUsuario: jest.fn(async (_ctx: unknown, userId: string, rolId: string) => {
        revocarRolCalls.push({ userId, rolId });
      }),
    } as unknown as AsignacionRepository;
  });

  function buildService(): UsuariosAdminService {
    return new UsuariosAdminService(usuarioAdminRepository, asignacionRepository);
  }

  it('crear: nunca devuelve password_hash', async () => {
    const { usuario } = await buildService().crear(CONTEXT, 'nuevo@demo.local', 'Nuevo');
    expect(usuario).not.toHaveProperty('password_hash');
    expect(usuario.status).toBe('active');
  });

  it('crear: rechaza si el email ya está en uso', async () => {
    await expect(buildService().crear(CONTEXT, 'demo@demo.local', 'Otro')).rejects.toThrow(
      EmailYaRegistradoException,
    );
  });

  it('listar: ningún usuario devuelto incluye password_hash', async () => {
    const resultado = await buildService().listar(CONTEXT, { page: 1, pageSize: 20 });
    expect(resultado.data.every((u) => !('password_hash' in u))).toBe(true);
  });

  it('obtenerPerfil: usuario inexistente lanza UsuarioNoEncontradoException', async () => {
    await expect(buildService().obtenerPerfil(CONTEXT, 'no-existe')).rejects.toThrow(
      UsuarioNoEncontradoException,
    );
  });

  it('editar (admin): actualiza nombre y email cuando el email está libre', async () => {
    const usuario = await buildService().editar(CONTEXT, 'user-1', {
      fullName: 'Editado',
      email: 'editado@demo.local',
    });
    expect(usuario.full_name).toBe('Editado');
    expect(usuario.email).toBe('editado@demo.local');
  });

  it('editar (admin): rechaza si el email nuevo ya lo usa otro usuario', async () => {
    usuarios.set('user-2', buildUsuario({ id: 'user-2', email: 'ocupado@demo.local' }));
    await expect(
      buildService().editar(CONTEXT, 'user-1', { email: 'ocupado@demo.local' }),
    ).rejects.toThrow(EmailYaRegistradoException);
  });

  it('cambiarEstado a "suspended": is_active=false y metadata.status="suspended"', async () => {
    const usuario = await buildService().cambiarEstado(CONTEXT, 'user-1', 'suspended');
    expect(usuario.is_active).toBe(false);
    expect(usuario.status).toBe('suspended');
  });

  it('cambiarEstado a "active": is_active=true y limpia metadata.status', async () => {
    usuarios.set('user-1', buildUsuario({ is_active: false, metadata: { status: 'blocked' } }));
    const usuario = await buildService().cambiarEstado(CONTEXT, 'user-1', 'active');
    expect(usuario.is_active).toBe(true);
    expect(usuario.status).toBe('active');
  });

  it('eliminar: marca deleted_at, no borra físicamente', async () => {
    await buildService().eliminar(CONTEXT, 'user-1');
    expect(usuarioAdminRepository.softDelete).toHaveBeenCalled();
    expect(usuarios.get('user-1')?.deleted_at).not.toBeNull();
    expect(usuarios.get('user-1')?.is_active).toBe(false);
  });

  it('restaurar: limpia deleted_at y reactiva', async () => {
    usuarios.set('user-1', buildUsuario({ deleted_at: new Date(), is_active: false }));
    const usuario = await buildService().restaurar(CONTEXT, 'user-1');
    expect(usuario.deleted_at).toBeNull();
    expect(usuario.status).toBe('active');
  });

  it('restaurar: usuario inexistente lanza UsuarioNoEncontradoException', async () => {
    await expect(buildService().restaurar(CONTEXT, 'no-existe')).rejects.toThrow(
      UsuarioNoEncontradoException,
    );
  });

  it('un usuario eliminado no se puede editar/cambiar de estado — solo restaurar', async () => {
    usuarios.set('user-1', buildUsuario({ deleted_at: new Date(), is_active: false }));
    const service = buildService();

    await expect(service.editar(CONTEXT, 'user-1', { fullName: 'X' })).rejects.toThrow(
      UsuarioEliminadoException,
    );
    await expect(service.cambiarEstado(CONTEXT, 'user-1', 'active')).rejects.toThrow(
      UsuarioEliminadoException,
    );
  });

  it('cambiarPassword: contraseña actual incorrecta lanza PasswordActualInvalidaException', async () => {
    await expect(
      buildService().cambiarPassword(CONTEXT, 'user-1', 'incorrecta', 'NuevaPassword123!'),
    ).rejects.toThrow(PasswordActualInvalidaException);
  });

  it('cambiarPassword: contraseña actual correcta la actualiza', async () => {
    await buildService().cambiarPassword(CONTEXT, 'user-1', 'Test1234!', 'NuevaPassword123!');
    expect(usuarios.get('user-1')?.password_hash).not.toBe(buildUsuario().password_hash);
  });

  it('resetearPassword (admin): genera una temporal sin verificar la anterior', async () => {
    const { passwordTemporal } = await buildService().resetearPassword(CONTEXT, 'user-1');
    expect(passwordTemporal).toEqual(expect.any(String));
    expect(usuarios.get('user-1')?.password_hash).not.toBe(buildUsuario().password_hash);
  });

  it('asignarRol/revocarRol delegan al AsignacionRepository', async () => {
    const service = buildService();
    await service.asignarRol(CONTEXT, 'user-1', 'rol-1');
    await service.revocarRol(CONTEXT, 'user-1', 'rol-1');
    expect(asignarRolCalls).toEqual([{ userId: 'user-1', rolId: 'rol-1' }]);
    expect(revocarRolCalls).toEqual([{ userId: 'user-1', rolId: 'rol-1' }]);
  });
});
