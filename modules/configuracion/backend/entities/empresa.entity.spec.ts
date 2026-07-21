import { Empresa } from './empresa.entity';

describe('Empresa', () => {
  it('rechaza una razón social vacía', () => {
    expect(() => new Empresa('e1', '   ', 'NIT-1', 'USD', 1)).toThrow('razón social');
  });

  it('rechaza un identificador tributario vacío', () => {
    expect(() => new Empresa('e1', 'Acme S.A.', '   ', 'USD', 1)).toThrow(
      'identificador tributario',
    );
  });

  it('rechaza un código de moneda que no tenga 3 caracteres', () => {
    expect(() => new Empresa('e1', 'Acme S.A.', 'NIT-1', 'US', 1)).toThrow('3 caracteres');
  });

  it('rechaza un mes de inicio de año fiscal fuera de 1-12', () => {
    expect(() => new Empresa('e1', 'Acme S.A.', 'NIT-1', 'USD', 13)).toThrow('entre 1 y 12');
  });

  it('acepta una empresa válida', () => {
    expect(() => new Empresa('e1', 'Acme S.A.', 'NIT-1', 'USD', 1)).not.toThrow();
  });
});
