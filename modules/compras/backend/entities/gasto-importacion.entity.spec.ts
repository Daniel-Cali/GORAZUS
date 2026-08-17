import { GastoImportacion } from './gasto-importacion.entity';

describe('GastoImportacion', () => {
  it('se construye con datos válidos', () => {
    const gasto = new GastoImportacion('g1', 'imp-1', 'freight', 100);
    expect(gasto.expenseType).toBe('freight');
  });

  it('rechaza sin expediente de importación', () => {
    expect(() => new GastoImportacion('g1', '  ', 'freight', 100)).toThrow(
      'requiere un expediente de importación',
    );
  });

  it('rechaza un tipo de gasto inválido', () => {
    expect(() => new GastoImportacion('g1', 'imp-1', 'shipping' as never, 100)).toThrow(
      'Tipo de gasto de importación inválido',
    );
  });

  it('rechaza un monto cero o negativo', () => {
    expect(() => new GastoImportacion('g1', 'imp-1', 'customs', 0)).toThrow('mayor que cero');
  });
});
