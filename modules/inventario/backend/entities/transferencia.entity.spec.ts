import { Transferencia } from './transferencia.entity';

describe('Transferencia', () => {
  const LINEAS = [{ productId: 'p1', quantity: 10 }];

  it('rechaza número de documento vacío', () => {
    expect(() => new Transferencia('t1', 'w1', 'w2', '   ', LINEAS)).toThrow(
      'número de documento de la transferencia no puede estar vacío',
    );
  });

  it('rechaza origen y destino iguales', () => {
    expect(() => new Transferencia('t1', 'w1', 'w1', 'DOC-1', LINEAS)).toThrow(
      'no pueden ser el mismo',
    );
  });

  it('rechaza sin líneas', () => {
    expect(() => new Transferencia('t1', 'w1', 'w2', 'DOC-1', [])).toThrow('al menos una línea');
  });

  it('rechaza una línea con cantidad cero', () => {
    expect(
      () => new Transferencia('t1', 'w1', 'w2', 'DOC-1', [{ productId: 'p1', quantity: 0 }]),
    ).toThrow('cantidad de cada línea debe ser mayor que cero');
  });

  it('acepta una transferencia válida con varias líneas', () => {
    expect(
      () =>
        new Transferencia('t1', 'w1', 'w2', 'DOC-1', [
          { productId: 'p1', quantity: 10 },
          { productId: 'p2', quantity: 5 },
        ]),
    ).not.toThrow();
  });
});
