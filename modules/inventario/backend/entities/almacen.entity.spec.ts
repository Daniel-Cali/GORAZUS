import { Almacen } from './almacen.entity';

describe('Almacen', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Almacen('a1', 'c1', 'b1', '   ', 'ALM-01', 'physical')).toThrow(
      'no puede estar vacío',
    );
  });

  it('rechaza un código vacío', () => {
    expect(() => new Almacen('a1', 'c1', 'b1', 'Almacén Central', '   ', 'physical')).toThrow(
      'código del almacén',
    );
  });

  it('rechaza un tipo de almacén inválido', () => {
    expect(
      () => new Almacen('a1', 'c1', 'b1', 'Almacén Central', 'ALM-01', 'lo-que-sea' as never),
    ).toThrow('Tipo de almacén inválido');
  });

  it('acepta un almacén físico válido', () => {
    expect(
      () => new Almacen('a1', 'c1', 'b1', 'Almacén Central', 'ALM-01', 'physical'),
    ).not.toThrow();
  });

  it('acepta un almacén virtual válido', () => {
    expect(() => new Almacen('a1', 'c1', 'b1', 'Tránsito', 'ALM-TRANS', 'virtual')).not.toThrow();
  });
});
