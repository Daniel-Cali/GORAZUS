import { SolicitudCompra } from './solicitud-compra.entity';

describe('SolicitudCompra', () => {
  const linea = { productId: 'prod-1', quantity: 10 };

  it('se construye con al menos una línea válida', () => {
    const solicitud = new SolicitudCompra('s1', 'company-1', 'branch-1', [linea]);
    expect(solicitud.lines).toHaveLength(1);
  });

  it('acepta branchId nulo (solicitud a nivel de empresa)', () => {
    const solicitud = new SolicitudCompra('s1', 'company-1', null, [linea]);
    expect(solicitud.branchId).toBeNull();
  });

  it('rechaza una solicitud sin líneas', () => {
    expect(() => new SolicitudCompra('s1', 'company-1', 'branch-1', [])).toThrow(
      'al menos una línea',
    );
  });

  it('rechaza una línea con cantidad cero o negativa', () => {
    expect(
      () => new SolicitudCompra('s1', 'company-1', 'branch-1', [{ productId: 'p1', quantity: 0 }]),
    ).toThrow('mayor que cero');
  });
});
