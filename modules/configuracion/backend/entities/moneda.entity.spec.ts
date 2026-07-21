import { Moneda } from './moneda.entity';

describe('Moneda', () => {
  it('rechaza un código ISO que no tenga 3 caracteres', () => {
    expect(() => new Moneda('m1', 'US', 2)).toThrow('3 caracteres');
  });

  it('rechaza una cantidad de decimales fuera de 0-6', () => {
    expect(() => new Moneda('m1', 'USD', 7)).toThrow('entre 0 y 6');
  });

  it('acepta una moneda válida', () => {
    expect(() => new Moneda('m1', 'USD', 2)).not.toThrow();
  });
});
