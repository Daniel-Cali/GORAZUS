import { ModeloProducto } from './modelo-producto.entity';

describe('ModeloProducto', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new ModeloProducto('mo1', 'ma1', '   ')).toThrow('no puede estar vacío');
  });

  it('acepta un modelo válido', () => {
    expect(() => new ModeloProducto('mo1', 'ma1', 'FatMax')).not.toThrow();
  });
});
