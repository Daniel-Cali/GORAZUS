import { ExpedienteImportacion } from './expediente-importacion.entity';

describe('ExpedienteImportacion', () => {
  it('se construye con datos válidos', () => {
    const expediente = new ExpedienteImportacion('imp-1', 'company-1', 'oc-1');
    expect(expediente.purchaseOrderId).toBe('oc-1');
  });

  it('rechaza sin orden de compra', () => {
    expect(() => new ExpedienteImportacion('imp-1', 'company-1', '  ')).toThrow(
      'requiere una orden de compra',
    );
  });
});
