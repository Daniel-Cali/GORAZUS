import { OrdenCompra } from './orden-compra.entity';

describe('OrdenCompra', () => {
  const linea = { productId: 'prod-1', quantity: 10, unitPrice: 25.5 };

  it('se construye con al menos una línea válida', () => {
    const orden = new OrdenCompra('o1', 'company-1', 'branch-1', 'sup-1', [linea]);
    expect(orden.lines).toHaveLength(1);
  });

  it('rechaza una orden sin líneas', () => {
    expect(() => new OrdenCompra('o1', 'company-1', 'branch-1', 'sup-1', [])).toThrow(
      'al menos una línea',
    );
  });

  it('rechaza una línea con cantidad cero o negativa', () => {
    expect(
      () =>
        new OrdenCompra('o1', 'company-1', 'branch-1', 'sup-1', [
          { productId: 'p1', quantity: 0, unitPrice: 10 },
        ]),
    ).toThrow('mayor que cero');
  });

  it('rechaza una línea con precio unitario negativo', () => {
    expect(
      () =>
        new OrdenCompra('o1', 'company-1', 'branch-1', 'sup-1', [
          { productId: 'p1', quantity: 5, unitPrice: -1 },
        ]),
    ).toThrow('no puede ser negativo');
  });
});
