import { Parametro } from './parametro.entity';

describe('Parametro', () => {
  it('rechaza una clave vacía', () => {
    expect(() => new Parametro('p1', '   ', 'string')).toThrow('no puede estar vacía');
  });

  it('rechaza un tipo de dato no soportado', () => {
    expect(() => new Parametro('p1', 'inventario.dias_alerta_stock', 'fecha')).toThrow(
      'no es válido',
    );
  });

  it('acepta un parámetro válido', () => {
    expect(() => new Parametro('p1', 'inventario.dias_alerta_stock', 'number')).not.toThrow();
  });
});
