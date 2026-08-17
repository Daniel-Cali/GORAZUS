import { Campaign } from './campaign.entity';

describe('Campaign', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Campaign('c1', 'e1', null, '  ')).toThrow('no puede estar vacío');
  });

  it('rechaza un presupuesto negativo', () => {
    expect(() => new Campaign('c1', 'e1', null, 'Campaña', null, null, -100)).toThrow(
      'presupuesto de la campaña no puede ser negativo',
    );
  });

  it('rechaza fin anterior a inicio', () => {
    expect(
      () =>
        new Campaign('c1', 'e1', null, 'Campaña', new Date('2026-02-01'), new Date('2026-01-01')),
    ).toThrow('no puede ser anterior a la de inicio');
  });

  it('caso feliz', () => {
    const campana = new Campaign('c1', 'e1', null, 'Campaña de verano');
    expect(campana.name).toBe('Campaña de verano');
  });
});
