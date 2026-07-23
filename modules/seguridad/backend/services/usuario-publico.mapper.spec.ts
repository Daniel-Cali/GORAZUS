import type { users } from '@gorazus/core-database';
import { resolverEstado, toUsuarioPublico } from './usuario-publico.mapper';

function buildUsuario(overrides: Partial<users> = {}): users {
  return {
    id: 'user-1',
    tenant_id: 'tenant-1',
    company_id: null,
    branch_id: null,
    email: 'demo@demo.local',
    password_hash: 'argon2id$hash-secreto',
    full_name: 'Demo',
    is_active: true,
    is_system_account: false,
    last_login_at: null,
    deleted_at: null,
    metadata: {},
    ...overrides,
  } as users;
}

describe('toUsuarioPublico', () => {
  it('nunca incluye password_hash en el resultado', () => {
    const usuario = buildUsuario();
    const publico = toUsuarioPublico(usuario, 'active');
    expect(publico).not.toHaveProperty('password_hash');
    expect(publico.id).toBe('user-1');
    expect(publico.status).toBe('active');
  });
});

describe('resolverEstado', () => {
  it('is_active=true, sin deleted_at → active', () => {
    expect(resolverEstado(buildUsuario({ is_active: true }))).toBe('active');
  });

  it('deleted_at seteado → deleted, sin importar is_active', () => {
    expect(resolverEstado(buildUsuario({ is_active: true, deleted_at: new Date() }))).toBe(
      'deleted',
    );
  });

  it('is_active=false sin metadata.status → inactive (default)', () => {
    expect(resolverEstado(buildUsuario({ is_active: false, metadata: {} }))).toBe('inactive');
  });

  it('is_active=false + metadata.status="suspended" → suspended', () => {
    expect(
      resolverEstado(buildUsuario({ is_active: false, metadata: { status: 'suspended' } })),
    ).toBe('suspended');
  });

  it('is_active=false + metadata.status="blocked" → blocked', () => {
    expect(
      resolverEstado(buildUsuario({ is_active: false, metadata: { status: 'blocked' } })),
    ).toBe('blocked');
  });

  it('is_active=false + metadata.status="pending_activation" → pending_activation', () => {
    expect(
      resolverEstado(
        buildUsuario({ is_active: false, metadata: { status: 'pending_activation' } }),
      ),
    ).toBe('pending_activation');
  });

  it('is_active=false + metadata.status con valor desconocido → inactive (fallback seguro)', () => {
    expect(
      resolverEstado(buildUsuario({ is_active: false, metadata: { status: 'lo-que-sea' } })),
    ).toBe('inactive');
  });
});
