import { Stock } from './stock.entity';

describe('Stock', () => {
  it('rechaza cantidad en existencia negativa', () => {
    expect(() => new Stock('p1', 'w1', null, -1, 0)).toThrow(
      'cantidad en existencia no puede ser negativa',
    );
  });

  it('rechaza cantidad reservada negativa', () => {
    expect(() => new Stock('p1', 'w1', null, 10, -1)).toThrow(
      'cantidad reservada no puede ser negativa',
    );
  });

  it('rechaza reservado mayor que a mano', () => {
    expect(() => new Stock('p1', 'w1', null, 5, 10)).toThrow('cantidad reservada no puede superar');
  });

  it('acepta un stock válido y calcula el disponible', () => {
    const stock = new Stock('p1', 'w1', null, 10, 4);
    expect(stock.quantityAvailable).toBe(6);
  });

  it('acepta reservado igual a a mano (disponible cero)', () => {
    const stock = new Stock('p1', 'w1', 'loc1', 5, 5);
    expect(stock.quantityAvailable).toBe(0);
  });
});
