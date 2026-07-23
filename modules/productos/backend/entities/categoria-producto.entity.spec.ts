import { CategoriaProducto } from './categoria-producto.entity';

describe('CategoriaProducto', () => {
  it('rechaza un código vacío', () => {
    expect(() => new CategoriaProducto('c1', '   ', null)).toThrow('no puede estar vacío');
  });

  it('rechaza que la categoría sea su propia categoría padre', () => {
    expect(() => new CategoriaProducto('c1', 'HERR', 'c1')).toThrow(
      'no puede ser su propia categoría padre',
    );
  });

  it('acepta una categoría raíz (sin padre)', () => {
    expect(() => new CategoriaProducto('c1', 'HERR', null)).not.toThrow();
  });

  it('acepta una categoría con un padre distinto', () => {
    expect(() => new CategoriaProducto('c2', 'HERR-MANUAL', 'c1')).not.toThrow();
  });
});
