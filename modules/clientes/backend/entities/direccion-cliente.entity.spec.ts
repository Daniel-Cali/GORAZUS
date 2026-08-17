import { DireccionCliente } from './direccion-cliente.entity';

describe('DireccionCliente', () => {
  it('rechaza un tipo de dirección fuera del CHECK de la base (billing/shipping/other)', () => {
    expect(
      () =>
        // @ts-expect-error — valor fuera del enum a propósito, para probar el invariante en runtime.
        new DireccionCliente('k1', 'c1', 'facturacion', 'Calle 1', null, null, null),
    ).toThrow('tipo de dirección debe ser uno de: billing, shipping, other');
  });

  it('rechaza línea 1 vacía', () => {
    expect(() => new DireccionCliente('k1', 'c1', 'billing', '  ', null, null, null)).toThrow(
      'línea 1 de la dirección no puede estar vacía',
    );
  });

  it('caso feliz', () => {
    const direccion = new DireccionCliente(
      'k1',
      'c1',
      'billing',
      'Calle 1 #23',
      null,
      null,
      '12345',
    );
    expect(direccion.isDefault).toBe(false);
  });
});
