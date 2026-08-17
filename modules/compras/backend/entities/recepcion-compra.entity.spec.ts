import { RecepcionCompra } from './recepcion-compra.entity';

describe('RecepcionCompra', () => {
  const linea = { productId: 'prod-1', quantity: 5 };

  it('se construye con al menos una línea válida', () => {
    const recepcion = new RecepcionCompra('r1', 'company-1', 'oc-1', [linea]);
    expect(recepcion.lines).toHaveLength(1);
  });

  it('rechaza una recepción sin líneas', () => {
    expect(() => new RecepcionCompra('r1', 'company-1', 'oc-1', [])).toThrow('al menos una línea');
  });

  it('rechaza una línea con cantidad recibida cero o negativa', () => {
    expect(
      () => new RecepcionCompra('r1', 'company-1', 'oc-1', [{ productId: 'p1', quantity: 0 }]),
    ).toThrow('mayor que cero');
  });
});
