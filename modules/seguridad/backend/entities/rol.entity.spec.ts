import { Rol } from './rol.entity';

describe('Rol', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Rol('r1', '   ', false)).toThrow('no puede estar vacío');
  });

  it('un rol de fábrica no puede eliminarse', () => {
    const rol = new Rol('r1', 'Administrador', true);
    expect(() => rol.verificarPuedeEliminarse()).toThrow('rol de fábrica');
  });

  it('un rol de fábrica no puede renombrarse', () => {
    const rol = new Rol('r1', 'Administrador', true);
    expect(() => rol.verificarPuedeRenombrarse()).toThrow('rol de fábrica');
  });

  it('un rol normal sí puede eliminarse/renombrarse', () => {
    const rol = new Rol('r1', 'Vendedor', false);
    expect(() => rol.verificarPuedeEliminarse()).not.toThrow();
    expect(() => rol.verificarPuedeRenombrarse()).not.toThrow();
  });
});
