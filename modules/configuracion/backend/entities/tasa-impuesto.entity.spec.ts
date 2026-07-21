import { TasaImpuesto } from './tasa-impuesto.entity';

describe('TasaImpuesto', () => {
  it('rechaza un porcentaje negativo', () => {
    expect(() => new TasaImpuesto('t1', 'i1', -1, new Date())).toThrow('entre 0 y 100');
  });

  it('rechaza un porcentaje mayor a 100', () => {
    expect(() => new TasaImpuesto('t1', 'i1', 101, new Date())).toThrow('entre 0 y 100');
  });

  it('acepta una tasa válida', () => {
    expect(() => new TasaImpuesto('t1', 'i1', 19, new Date())).not.toThrow();
  });
});
