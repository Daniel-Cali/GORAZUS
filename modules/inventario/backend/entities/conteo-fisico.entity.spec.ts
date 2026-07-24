import { ConteoFisico } from './conteo-fisico.entity';

describe('ConteoFisico', () => {
  const FECHA = new Date('2026-08-01');

  it('rechaza sin líneas', () => {
    expect(() => new ConteoFisico('c1', 'w1', FECHA, [])).toThrow('al menos una línea');
  });

  it('rechaza cantidad en sistema negativa', () => {
    expect(
      () => new ConteoFisico('c1', 'w1', FECHA, [{ productId: 'p1', systemQuantity: -1 }]),
    ).toThrow('cantidad en sistema de cada línea no puede ser negativa');
  });

  it('acepta un conteo válido con varias líneas', () => {
    expect(
      () =>
        new ConteoFisico('c1', 'w1', FECHA, [
          { productId: 'p1', systemQuantity: 10 },
          { productId: 'p2', systemQuantity: 0 },
        ]),
    ).not.toThrow();
  });
});
