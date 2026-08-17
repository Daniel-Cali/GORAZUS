import { NotaCreditoCompra } from './nota-credito-compra.entity';

describe('NotaCreditoCompra', () => {
  const linea = { productId: 'prod-1', quantity: 2 };

  it('se construye con al menos una línea válida', () => {
    const nota = new NotaCreditoCompra('n1', 'company-1', 'fc-1', 40, [linea]);
    expect(nota.totalAmount).toBe(40);
  });

  it('rechaza una nota sin líneas', () => {
    expect(() => new NotaCreditoCompra('n1', 'company-1', 'fc-1', 0, [])).toThrow(
      'al menos una línea',
    );
  });

  it('rechaza una línea con cantidad cero o negativa', () => {
    expect(
      () =>
        new NotaCreditoCompra('n1', 'company-1', 'fc-1', 10, [{ productId: 'p1', quantity: 0 }]),
    ).toThrow('mayor que cero');
  });

  it('rechaza un monto total negativo', () => {
    expect(() => new NotaCreditoCompra('n1', 'company-1', 'fc-1', -1, [linea])).toThrow(
      'no puede ser negativo',
    );
  });
});
