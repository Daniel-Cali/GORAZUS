import { FacturaCompra } from './factura-compra.entity';

describe('FacturaCompra', () => {
  const linea = { productId: 'prod-1', quantity: 5, unitCost: 12.5 };

  it('se construye con al menos una línea válida', () => {
    const factura = new FacturaCompra('f1', 'company-1', 'sup-1', 'FACT-001', [linea]);
    expect(factura.lines).toHaveLength(1);
  });

  it('rechaza número de documento del proveedor vacío', () => {
    expect(() => new FacturaCompra('f1', 'company-1', 'sup-1', '  ', [linea])).toThrow(
      'número de documento del proveedor no puede estar vacío',
    );
  });

  it('rechaza una factura sin líneas', () => {
    expect(() => new FacturaCompra('f1', 'company-1', 'sup-1', 'FACT-001', [])).toThrow(
      'al menos una línea',
    );
  });

  it('rechaza una línea con cantidad cero o negativa', () => {
    expect(
      () =>
        new FacturaCompra('f1', 'company-1', 'sup-1', 'FACT-001', [
          { productId: 'p1', quantity: 0, unitCost: 10 },
        ]),
    ).toThrow('mayor que cero');
  });

  it('rechaza una línea con costo unitario negativo', () => {
    expect(
      () =>
        new FacturaCompra('f1', 'company-1', 'sup-1', 'FACT-001', [
          { productId: 'p1', quantity: 5, unitCost: -1 },
        ]),
    ).toThrow('no puede ser negativo');
  });
});
