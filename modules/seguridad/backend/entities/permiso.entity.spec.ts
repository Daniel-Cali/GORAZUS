import { Permiso } from './permiso.entity';

describe('Permiso', () => {
  it('acepta un código bien formado', () => {
    const permiso = new Permiso('p1', 'productos.ver', 'productos', 'ver');
    expect(permiso.code).toBe('productos.ver');
  });

  it('rechaza un código sin punto separador', () => {
    expect(() => new Permiso('p1', 'productosver', 'productos', 'ver')).toThrow(
      'Código de permiso inválido',
    );
  });

  it('rechaza un código con mayúsculas', () => {
    expect(() => new Permiso('p1', 'Productos.Ver', 'Productos', 'Ver')).toThrow(
      'Código de permiso inválido',
    );
  });

  it('rechaza cuando code no coincide con module_code.action_code', () => {
    expect(() => new Permiso('p1', 'productos.ver', 'productos', 'crear')).toThrow('no coincide');
  });
});
