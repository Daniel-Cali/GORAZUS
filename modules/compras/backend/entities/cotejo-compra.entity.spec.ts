import { CotejoCompra } from './cotejo-compra.entity';

describe('CotejoCompra', () => {
  it('se construye con datos válidos', () => {
    const cotejo = new CotejoCompra('c1', 'oc-1', 'rec-1', 'fc-1', 0, true);
    expect(cotejo.isWithinTolerance).toBe(true);
  });

  it('rechaza sin orden de compra', () => {
    expect(() => new CotejoCompra('c1', '  ', 'rec-1', 'fc-1', 0, true)).toThrow(
      'requiere una orden de compra',
    );
  });

  it('rechaza sin recepción', () => {
    expect(() => new CotejoCompra('c1', 'oc-1', '  ', 'fc-1', 0, true)).toThrow(
      'requiere una recepción de compra',
    );
  });

  it('rechaza sin factura', () => {
    expect(() => new CotejoCompra('c1', 'oc-1', 'rec-1', '  ', 0, true)).toThrow(
      'requiere una factura de compra',
    );
  });

  it('rechaza discrepancia negativa', () => {
    expect(() => new CotejoCompra('c1', 'oc-1', 'rec-1', 'fc-1', -1, false)).toThrow(
      'no puede ser negativo',
    );
  });

  it('acepta discrepancia fuera de tolerancia', () => {
    const cotejo = new CotejoCompra('c1', 'oc-1', 'rec-1', 'fc-1', 50, false);
    expect(cotejo.isWithinTolerance).toBe(false);
  });
});
