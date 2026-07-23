import { TipoMovimientoStock } from './tipo-movimiento-stock.entity';

describe('TipoMovimientoStock', () => {
  it('rechaza un código vacío', () => {
    expect(() => new TipoMovimientoStock('t1', '   ', 'in')).toThrow(
      'código del tipo de movimiento',
    );
  });

  it('rechaza una dirección inválida', () => {
    expect(() => new TipoMovimientoStock('t1', 'receipt', 'lo-que-sea' as never)).toThrow(
      'Dirección de movimiento inválida',
    );
  });

  it('acepta un tipo de entrada válido', () => {
    expect(() => new TipoMovimientoStock('t1', 'receipt', 'in')).not.toThrow();
  });

  it('acepta un tipo de salida válido', () => {
    expect(() => new TipoMovimientoStock('t1', 'issue', 'out')).not.toThrow();
  });
});
