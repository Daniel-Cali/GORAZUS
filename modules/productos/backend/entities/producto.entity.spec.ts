import { Producto } from './producto.entity';

describe('Producto', () => {
  it('rechaza un SKU vacío', () => {
    expect(() => new Producto('p1', '   ', 'good', 'u1', 'average', false, false)).toThrow(
      'no puede estar vacío',
    );
  });

  it('rechaza un tipo de producto inválido', () => {
    expect(
      () => new Producto('p1', 'SKU-1', 'lo-que-sea' as never, 'u1', 'average', false, false),
    ).toThrow('Tipo de producto inválido');
  });

  it('rechaza un método de costeo inválido', () => {
    expect(
      () => new Producto('p1', 'SKU-1', 'good', 'u1', 'lo-que-sea' as never, false, false),
    ).toThrow('Método de costeo inválido');
  });

  it('rechaza un servicio que rastrea serie', () => {
    expect(() => new Producto('p1', 'SKU-1', 'service', 'u1', 'average', true, false)).toThrow(
      'no puede rastrear serie ni lote',
    );
  });

  it('rechaza un servicio que rastrea lote', () => {
    expect(() => new Producto('p1', 'SKU-1', 'service', 'u1', 'average', false, true)).toThrow(
      'no puede rastrear serie ni lote',
    );
  });

  it('acepta un producto tipo good que rastrea serie y lote', () => {
    expect(() => new Producto('p1', 'SKU-1', 'good', 'u1', 'fifo', true, true)).not.toThrow();
  });

  it('acepta un servicio que no rastrea nada', () => {
    expect(
      () => new Producto('p1', 'SKU-1', 'service', 'u1', 'average', false, false),
    ).not.toThrow();
  });

  it.each(['good', 'service', 'kit', 'combo', 'composite'] as const)(
    'acepta el tipo de producto "%s"',
    (productType) => {
      expect(
        () => new Producto('p1', 'SKU-1', productType, 'u1', 'average', false, false),
      ).not.toThrow();
    },
  );
});
