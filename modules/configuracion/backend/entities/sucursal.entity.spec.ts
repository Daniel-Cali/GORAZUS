import { Sucursal } from './sucursal.entity';

describe('Sucursal', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Sucursal('s1', 'c1', '   ', 'SUC-01', false)).toThrow('no puede estar vacío');
  });

  it('rechaza un código vacío', () => {
    expect(() => new Sucursal('s1', 'c1', 'Sucursal Centro', '   ', false)).toThrow(
      'código de la sucursal',
    );
  });

  it('acepta una sucursal válida', () => {
    expect(() => new Sucursal('s1', 'c1', 'Sucursal Centro', 'SUC-01', true)).not.toThrow();
  });
});
