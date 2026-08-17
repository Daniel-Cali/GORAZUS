import { Proveedor } from './proveedor.entity';

describe('Proveedor', () => {
  it('se construye con datos válidos', () => {
    const proveedor = new Proveedor('p1', 'Ferretería El Tornillo SRL', 'RNC-001', 30, false);
    expect(proveedor.legalName).toBe('Ferretería El Tornillo SRL');
    expect(proveedor.isBlocked).toBe(false);
  });

  it('rechaza razón social vacía', () => {
    expect(() => new Proveedor('p1', '   ', 'RNC-001', 30, false)).toThrow(
      'razón social del proveedor no puede estar vacía',
    );
  });

  it('rechaza identificación fiscal vacía', () => {
    expect(() => new Proveedor('p1', 'Nombre', '  ', 30, false)).toThrow(
      'identificación fiscal del proveedor no puede estar vacío',
    );
  });

  it('rechaza días de plazo de pago negativos', () => {
    expect(() => new Proveedor('p1', 'Nombre', 'RNC-001', -1, false)).toThrow(
      'no pueden ser negativos',
    );
  });

  it('acepta un proveedor bloqueado', () => {
    const proveedor = new Proveedor('p1', 'Nombre', 'RNC-001', 0, true);
    expect(proveedor.isBlocked).toBe(true);
  });
});
