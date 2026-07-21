import { Sesion } from './sesion.entity';

describe('Sesion', () => {
  const ahora = new Date('2026-07-20T12:00:00Z');

  it('está vigente si no fue revocada y no expiró', () => {
    const sesion = new Sesion('s1', 'u1', 'hash', new Date('2026-07-27T12:00:00Z'), null);
    expect(sesion.estaVigente(ahora)).toBe(true);
  });

  it('no está vigente si expiró', () => {
    const sesion = new Sesion('s1', 'u1', 'hash', new Date('2026-07-19T12:00:00Z'), null);
    expect(sesion.estaVigente(ahora)).toBe(false);
  });

  it('no está vigente si fue revocada, aunque no haya expirado', () => {
    const sesion = new Sesion('s1', 'u1', 'hash', new Date('2026-07-27T12:00:00Z'), ahora);
    expect(sesion.estaVigente(ahora)).toBe(false);
  });

  it('verificarPuedeRevocarse lanza si ya estaba revocada', () => {
    const sesion = new Sesion('s1', 'u1', 'hash', new Date('2026-07-27T12:00:00Z'), ahora);
    expect(() => sesion.verificarPuedeRevocarse()).toThrow('ya estaba revocada');
  });

  it('verificarPuedeRevocarse no lanza si está vigente', () => {
    const sesion = new Sesion('s1', 'u1', 'hash', new Date('2026-07-27T12:00:00Z'), null);
    expect(() => sesion.verificarPuedeRevocarse()).not.toThrow();
  });
});
