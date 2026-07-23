import { MovimientoStock } from './movimiento-stock.entity';

describe('MovimientoStock', () => {
  it('rechaza cantidad cero', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 0, null, null, null)).toThrow(
      'cantidad de un movimiento debe ser mayor que cero',
    );
  });

  it('rechaza cantidad negativa', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', -5, null, null, null)).toThrow(
      'cantidad de un movimiento debe ser mayor que cero',
    );
  });

  it('rechaza costo unitario negativo', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 10, -1, null, null)).toThrow(
      'costo unitario no puede ser negativo',
    );
  });

  it('rechaza módulo origen sin entidad origen', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 10, null, 'compras', null)).toThrow(
      'documento origen debe indicar módulo y entidad juntos',
    );
  });

  it('rechaza entidad origen sin módulo origen', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 10, null, null, 'e1')).toThrow(
      'documento origen debe indicar módulo y entidad juntos',
    );
  });

  it('acepta un movimiento sin documento origen', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 10, 5.5, null, null)).not.toThrow();
  });

  it('acepta un movimiento con documento origen completo', () => {
    expect(() => new MovimientoStock('p1', 'w1', 't1', 10, null, 'compras', 'e1')).not.toThrow();
  });
});
