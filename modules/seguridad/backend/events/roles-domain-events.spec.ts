import { RolCreadoEvent } from './rol-creado.event';
import { RolActualizadoEvent } from './rol-actualizado.event';
import { RolEliminadoEvent } from './rol-eliminado.event';

const FIXED_DATE = new Date('2026-07-26T12:00:00.000Z');

describe('Eventos de dominio de Roles (preparados, Subfase 4.1)', () => {
  it('RolCreadoEvent — routingKey y payload serializable', () => {
    const event = new RolCreadoEvent(
      'rol-1',
      'tenant-1',
      'company-1',
      null,
      'Gerente de ventas',
      'company',
      FIXED_DATE,
    );
    expect(RolCreadoEvent.routingKey).toBe('seguridad.rol.creado');
    expect(event.toPayload()).toEqual({
      rolId: 'rol-1',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      branchId: null,
      name: 'Gerente de ventas',
      roleType: 'company',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('RolActualizadoEvent — routingKey y payload serializable', () => {
    const event = new RolActualizadoEvent(
      'rol-1',
      'tenant-1',
      'Vendedor',
      'Vendedor Senior',
      FIXED_DATE,
    );
    expect(RolActualizadoEvent.routingKey).toBe('seguridad.rol.actualizado');
    expect(event.toPayload()).toEqual({
      rolId: 'rol-1',
      tenantId: 'tenant-1',
      nombreAnterior: 'Vendedor',
      nombreNuevo: 'Vendedor Senior',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('RolEliminadoEvent — routingKey y payload serializable', () => {
    const event = new RolEliminadoEvent('rol-1', 'tenant-1', 'Vendedor', FIXED_DATE);
    expect(RolEliminadoEvent.routingKey).toBe('seguridad.rol.eliminado');
    expect(event.toPayload()).toEqual({
      rolId: 'rol-1',
      tenantId: 'tenant-1',
      name: 'Vendedor',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });
});
