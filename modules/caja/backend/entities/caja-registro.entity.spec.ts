import { CajaRegistro } from './caja-registro.entity';

describe('CajaRegistro', () => {
  it('rechaza nombre vacío', () => {
    expect(() => new CajaRegistro('r1', 'e1', 'b1', '  ', 'pos')).toThrow(
      'nombre de la caja no puede estar vacío',
    );
  });

  it('rechaza tipo inválido', () => {
    expect(() => new CajaRegistro('r1', 'e1', 'b1', 'Caja 1', 'invalido' as never)).toThrow(
      'Tipo de caja inválido',
    );
  });

  it('caso feliz', () => {
    const caja = new CajaRegistro('r1', 'e1', 'b1', 'Caja 1', 'pos');
    expect(caja.registerType).toBe('pos');
  });
});
