import { Impuesto } from './impuesto.entity';

describe('Impuesto', () => {
  it('rechaza un código vacío', () => {
    expect(() => new Impuesto('i1', '   ', 'j1', 'sales_tax')).toThrow('no puede estar vacío');
  });

  it('rechaza un tipo de impuesto no soportado', () => {
    expect(() => new Impuesto('i1', 'IVA', 'j1', 'property_tax')).toThrow('no es válido');
  });

  it('acepta un impuesto válido', () => {
    expect(() => new Impuesto('i1', 'IVA', 'j1', 'sales_tax')).not.toThrow();
  });
});
