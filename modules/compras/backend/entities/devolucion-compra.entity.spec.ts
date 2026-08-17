import { DevolucionCompra } from './devolucion-compra.entity';

describe('DevolucionCompra', () => {
  const linea = { productId: 'prod-1', quantity: 3 };

  it('se construye con al menos una línea válida', () => {
    const devolucion = new DevolucionCompra('d1', 'company-1', 'fc-1', [linea]);
    expect(devolucion.lines).toHaveLength(1);
  });

  it('rechaza una devolución sin líneas', () => {
    expect(() => new DevolucionCompra('d1', 'company-1', 'fc-1', [])).toThrow('al menos una línea');
  });

  it('rechaza una línea con cantidad devuelta cero o negativa', () => {
    expect(
      () => new DevolucionCompra('d1', 'company-1', 'fc-1', [{ productId: 'p1', quantity: 0 }]),
    ).toThrow('mayor que cero');
  });
});
