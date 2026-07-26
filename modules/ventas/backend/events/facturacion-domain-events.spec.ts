import { FacturaCreadaEvent } from './factura-creada.event';
import { FacturaConfirmadaEvent } from './factura-confirmada.event';
import { FacturaAnuladaEvent } from './factura-anulada.event';

const FIXED_DATE = new Date('2026-07-26T12:00:00.000Z');

describe('Eventos de dominio de Facturación (preparados, Motor de Facturación Parte 1)', () => {
  it('FacturaCreadaEvent — routingKey y payload serializable', () => {
    const event = new FacturaCreadaEvent(
      'fac-1',
      'tenant-1',
      'company-1',
      'branch-1',
      'customer-1',
      1500.5,
      FIXED_DATE,
    );
    expect(FacturaCreadaEvent.routingKey).toBe('ventas.factura.creada');
    expect(event.toPayload()).toEqual({
      facturaId: 'fac-1',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      totalAmount: 1500.5,
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('FacturaConfirmadaEvent — routingKey y payload serializable', () => {
    const event = new FacturaConfirmadaEvent('fac-1', 'tenant-1', 'FAC-0001', 1500.5, FIXED_DATE);
    expect(FacturaConfirmadaEvent.routingKey).toBe('ventas.factura.confirmada');
    expect(event.toPayload()).toEqual({
      facturaId: 'fac-1',
      tenantId: 'tenant-1',
      documentNumber: 'FAC-0001',
      totalAmount: 1500.5,
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('FacturaAnuladaEvent — routingKey y payload serializable', () => {
    const event = new FacturaAnuladaEvent('fac-1', 'tenant-1', 'FAC-0001', 'issued', FIXED_DATE);
    expect(FacturaAnuladaEvent.routingKey).toBe('ventas.factura.anulada');
    expect(event.toPayload()).toEqual({
      facturaId: 'fac-1',
      tenantId: 'tenant-1',
      documentNumber: 'FAC-0001',
      estadoAnterior: 'issued',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });
});
