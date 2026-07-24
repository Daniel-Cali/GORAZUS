import { ReservaStock } from './reserva-stock.entity';

describe('ReservaStock', () => {
  it('rechaza cantidad cero', () => {
    expect(() => new ReservaStock('p1', 'w1', 0, 'ventas', 'e1')).toThrow(
      'cantidad de una reserva debe ser mayor que cero',
    );
  });

  it('rechaza cantidad negativa', () => {
    expect(() => new ReservaStock('p1', 'w1', -1, 'ventas', 'e1')).toThrow(
      'cantidad de una reserva debe ser mayor que cero',
    );
  });

  it('rechaza módulo origen vacío', () => {
    expect(() => new ReservaStock('p1', 'w1', 5, '   ', 'e1')).toThrow(
      'módulo origen de la reserva es obligatorio',
    );
  });

  it('rechaza entidad origen vacía', () => {
    expect(() => new ReservaStock('p1', 'w1', 5, 'ventas', '   ')).toThrow(
      'entidad origen de la reserva es obligatoria',
    );
  });

  it('acepta una reserva válida', () => {
    expect(() => new ReservaStock('p1', 'w1', 5, 'ventas', 'e1')).not.toThrow();
  });
});
