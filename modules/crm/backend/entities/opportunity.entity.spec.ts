import { Opportunity } from './opportunity.entity';

describe('Opportunity', () => {
  it('rechaza una oportunidad sin lead ni cliente', () => {
    expect(() => new Opportunity('o1', 'e1', null, 'stage1', null, null, [])).toThrow(
      'debe originarse en un lead o en un cliente existente',
    );
  });

  it('rechaza una etapa de embudo vacía', () => {
    expect(() => new Opportunity('o1', 'e1', null, '  ', 'lead1', null, [])).toThrow(
      'debe tener una etapa de embudo asignada',
    );
  });

  it('rechaza una línea con cantidad estimada <= 0', () => {
    expect(
      () =>
        new Opportunity('o1', 'e1', null, 'stage1', 'lead1', null, [
          { productId: 'p1', estimatedQuantity: 0 },
        ]),
    ).toThrow('cantidad estimada de cada línea debe ser mayor a cero');
  });

  it('caso feliz — se origina en un cliente existente', () => {
    const oportunidad = new Opportunity('o1', 'e1', null, 'stage1', null, 'customer1', []);
    expect(oportunidad.customerId).toBe('customer1');
    expect(oportunidad.status).toBe('open');
  });
});
