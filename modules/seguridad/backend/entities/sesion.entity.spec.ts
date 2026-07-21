import { Sesion } from './sesion.entity';

describe('Sesion', () => {
  it('una sesión activa puede revocarse', () => {
    const sesion = new Sesion('s1', 'u1', null);
    expect(() => sesion.verificarPuedeRevocarse()).not.toThrow();
  });

  it('una sesión ya revocada no puede revocarse de nuevo', () => {
    const sesion = new Sesion('s1', 'u1', new Date());
    expect(() => sesion.verificarPuedeRevocarse()).toThrow('ya fue revocada');
  });
});
