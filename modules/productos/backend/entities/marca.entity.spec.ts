import { Marca } from './marca.entity';

describe('Marca', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Marca('m1', '   ')).toThrow('no puede estar vacío');
  });

  it('acepta una marca válida', () => {
    expect(() => new Marca('m1', 'Stanley')).not.toThrow();
  });
});
