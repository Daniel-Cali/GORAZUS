import { Pedido } from './pedido.entity';

const LINEA_VALIDA = { productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 };

describe('Pedido', () => {
  it('caso feliz', () => {
    expect(() => new Pedido('pe-1', 'co-1', 'br-1', 'cu-1', [LINEA_VALIDA])).not.toThrow();
  });

  it('rechaza sin líneas', () => {
    expect(() => new Pedido('pe-1', 'co-1', 'br-1', 'cu-1', [])).toThrow(/al menos una línea/);
  });

  it('rechaza cantidad no positiva', () => {
    expect(
      () => new Pedido('pe-1', 'co-1', 'br-1', 'cu-1', [{ ...LINEA_VALIDA, quantity: -1 }]),
    ).toThrow(/mayor que cero/);
  });

  it('rechaza precio unitario negativo', () => {
    expect(
      () => new Pedido('pe-1', 'co-1', 'br-1', 'cu-1', [{ ...LINEA_VALIDA, unitPrice: -5 }]),
    ).toThrow(/no puede ser negativo/);
  });

  it('rechaza descuento fuera de rango', () => {
    expect(
      () =>
        new Pedido('pe-1', 'co-1', 'br-1', 'cu-1', [{ ...LINEA_VALIDA, discountPercentage: -1 }]),
    ).toThrow(/entre 0 y 100/);
  });
});
