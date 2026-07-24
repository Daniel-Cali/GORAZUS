import { AjusteStock } from './ajuste-stock.entity';

describe('AjusteStock', () => {
  it('rechaza sin líneas', () => {
    expect(() => new AjusteStock('a1', 'w1', 'r1', [])).toThrow('al menos una línea');
  });

  it('rechaza nueva cantidad negativa', () => {
    expect(
      () =>
        new AjusteStock('a1', 'w1', 'r1', [
          { productId: 'p1', previousQuantity: 10, newQuantity: -1 },
        ]),
    ).toThrow('nueva cantidad de cada línea no puede ser negativa');
  });

  it('acepta un ajuste válido con varias líneas', () => {
    expect(
      () =>
        new AjusteStock('a1', 'w1', 'r1', [
          { productId: 'p1', previousQuantity: 10, newQuantity: 8 },
          { productId: 'p2', previousQuantity: 5, newQuantity: 5 },
        ]),
    ).not.toThrow();
  });

  it('acepta una nueva cantidad de cero (ajuste a inventario inicial vacío)', () => {
    expect(
      () =>
        new AjusteStock('a1', 'w1', 'r1', [
          { productId: 'p1', previousQuantity: 3, newQuantity: 0 },
        ]),
    ).not.toThrow();
  });
});
