import { UsuarioAutenticadoEvent } from './usuario-autenticado.event';
import { LoginFallidoEvent } from './login-fallido.event';
import { CuentaBloqueadaEvent } from './cuenta-bloqueada.event';
import { SesionRevocadaEvent } from './sesion-revocada.event';

const FIXED_DATE = new Date('2026-07-22T12:00:00.000Z');

describe('Eventos de dominio de auth (preparados, Parte 2.1)', () => {
  it('UsuarioAutenticadoEvent — routingKey y payload serializable', () => {
    const event = new UsuarioAutenticadoEvent('user-1', 'tenant-1', 'session-1', true, FIXED_DATE);
    expect(UsuarioAutenticadoEvent.routingKey).toBe('auth.usuario.autenticado');
    expect(event.toPayload()).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      viaDosFactores: true,
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('LoginFallidoEvent — routingKey y payload serializable', () => {
    const event = new LoginFallidoEvent(
      'tenant-1',
      'demo@demo.local',
      null,
      '203.0.113.5',
      FIXED_DATE,
    );
    expect(LoginFallidoEvent.routingKey).toBe('auth.login.fallido');
    expect(event.toPayload()).toEqual({
      tenantId: 'tenant-1',
      emailIntentado: 'demo@demo.local',
      userId: null,
      ipAddress: '203.0.113.5',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('CuentaBloqueadaEvent — routingKey y payload serializable', () => {
    const event = new CuentaBloqueadaEvent(
      'tenant-1',
      'demo@demo.local',
      '203.0.113.5',
      FIXED_DATE,
    );
    expect(CuentaBloqueadaEvent.routingKey).toBe('auth.cuenta.bloqueada');
    expect(event.toPayload()).toEqual({
      tenantId: 'tenant-1',
      emailIntentado: 'demo@demo.local',
      ipAddress: '203.0.113.5',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });

  it('SesionRevocadaEvent — routingKey y payload serializable', () => {
    const event = new SesionRevocadaEvent('session-1', 'user-1', 'tenant-1', 'logout', FIXED_DATE);
    expect(SesionRevocadaEvent.routingKey).toBe('auth.sesion.revocada');
    expect(event.toPayload()).toEqual({
      sessionId: 'session-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      motivo: 'logout',
      ocurridoEn: FIXED_DATE.toISOString(),
    });
  });
});
