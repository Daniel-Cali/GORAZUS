import { RetencionCompra } from './retencion-compra.entity';

describe('RetencionCompra', () => {
  it('se construye con datos válidos', () => {
    const retencion = new RetencionCompra('r1', 'fc-1', 'rule-1', 50);
    expect(retencion.amount).toBe(50);
  });

  it('acepta withholdingRuleId nulo', () => {
    const retencion = new RetencionCompra('r1', 'fc-1', null, 50);
    expect(retencion.withholdingRuleId).toBeNull();
  });

  it('rechaza sin factura de compra', () => {
    expect(() => new RetencionCompra('r1', '  ', null, 50)).toThrow(
      'requiere una factura de compra',
    );
  });

  it('rechaza monto cero o negativo', () => {
    expect(() => new RetencionCompra('r1', 'fc-1', null, 0)).toThrow('mayor que cero');
  });
});
