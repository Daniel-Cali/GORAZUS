import { Cotizacion } from './cotizacion.entity';

const LINEA_VALIDA = { productId: 'p-1', quantity: 2, unitPrice: 50, discountPercentage: 0 };

describe('Cotizacion', () => {
  it('caso feliz', () => {
    expect(() => new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [LINEA_VALIDA])).not.toThrow();
  });

  it('rechaza sin líneas', () => {
    expect(() => new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [])).toThrow(/al menos una línea/);
  });

  it('rechaza cantidad no positiva', () => {
    expect(
      () => new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [{ ...LINEA_VALIDA, quantity: 0 }]),
    ).toThrow(/mayor que cero/);
  });

  it('rechaza precio unitario negativo', () => {
    expect(
      () => new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [{ ...LINEA_VALIDA, unitPrice: -1 }]),
    ).toThrow(/no puede ser negativo/);
  });

  it('rechaza descuento fuera de rango', () => {
    expect(
      () =>
        new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [
          { ...LINEA_VALIDA, discountPercentage: 101 },
        ]),
    ).toThrow(/entre 0 y 100/);
  });

  it('acepta vigencia futura', () => {
    const futuro = new Date(Date.now() + 86400000);
    expect(
      () => new Cotizacion('c-1', 'co-1', 'br-1', 'cu-1', [LINEA_VALIDA], futuro),
    ).not.toThrow();
  });
});
