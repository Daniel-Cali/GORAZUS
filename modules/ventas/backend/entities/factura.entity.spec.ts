import { Factura } from './factura.entity';

describe('Factura', () => {
  it('rechaza sin líneas', () => {
    expect(() => new Factura('f1', 'e1', 'b1', 'c1', [])).toThrow('al menos una línea');
  });

  it('rechaza cantidad no positiva', () => {
    expect(
      () => new Factura('f1', 'e1', 'b1', 'c1', [{ productId: 'p1', quantity: 0, unitPrice: 10 }]),
    ).toThrow('cantidad de cada línea debe ser mayor que cero');
  });

  it('rechaza precio unitario negativo', () => {
    expect(
      () => new Factura('f1', 'e1', 'b1', 'c1', [{ productId: 'p1', quantity: 1, unitPrice: -1 }]),
    ).toThrow('precio unitario de cada línea no puede ser negativo');
  });

  it('rechaza descuento fuera de rango', () => {
    expect(
      () =>
        new Factura('f1', 'e1', 'b1', 'c1', [
          { productId: 'p1', quantity: 1, unitPrice: 10, discountPercentage: 150 },
        ]),
    ).toThrow('descuento de cada línea debe estar entre 0 y 100');
  });

  it('caso feliz', () => {
    const factura = new Factura('f1', 'e1', 'b1', 'c1', [
      { productId: 'p1', quantity: 2, unitPrice: 10 },
    ]);
    expect(factura.lines).toHaveLength(1);
  });
});
