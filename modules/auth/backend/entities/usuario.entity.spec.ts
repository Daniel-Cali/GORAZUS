import { Usuario } from './usuario.entity';

describe('Usuario', () => {
  it('rechaza un email con formato inválido', () => {
    expect(() => new Usuario('u1', 't1', 'no-es-un-email', 'hash', 'Nombre', true)).toThrow(
      'Email inválido',
    );
  });

  it('acepta un email válido', () => {
    const usuario = new Usuario('u1', 't1', 'ana@gorazus.com', 'hash', 'Ana', true);
    expect(usuario.email).toBe('ana@gorazus.com');
  });

  it('puedeAutenticarse es false sin passwordHash (cuenta sin credenciales locales, p. ej. futuro SSO)', () => {
    const usuario = new Usuario('u1', 't1', 'ana@gorazus.com', null, 'Ana', true);
    expect(usuario.puedeAutenticarse()).toBe(false);
  });

  it('puedeAutenticarse es false si el usuario está inactivo', () => {
    const usuario = new Usuario('u1', 't1', 'ana@gorazus.com', 'hash', 'Ana', false);
    expect(usuario.puedeAutenticarse()).toBe(false);
  });

  it('puedeAutenticarse es true con hash y activo', () => {
    const usuario = new Usuario('u1', 't1', 'ana@gorazus.com', 'hash', 'Ana', true);
    expect(usuario.puedeAutenticarse()).toBe(true);
  });
});
