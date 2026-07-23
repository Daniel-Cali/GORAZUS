import { UnidadMedida } from './unidad-medida.entity';

describe('UnidadMedida', () => {
  it('rechaza un código vacío', () => {
    expect(() => new UnidadMedida('u1', '   ')).toThrow('no puede estar vacío');
  });

  it('acepta una unidad válida', () => {
    expect(() => new UnidadMedida('u1', 'UND')).not.toThrow();
  });
});
