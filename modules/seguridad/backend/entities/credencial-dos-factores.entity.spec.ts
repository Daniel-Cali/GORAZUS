import { CredencialDosFactores } from './credencial-dos-factores.entity';

describe('CredencialDosFactores', () => {
  it('rechaza un método no soportado', () => {
    expect(() => new CredencialDosFactores('c1', 'push', null)).toThrow('no es válido');
  });

  it('una credencial sin confirmar pasa verificarNoConfirmada sin lanzar', () => {
    const credencial = new CredencialDosFactores('c1', 'totp', null);
    expect(() => credencial.verificarNoConfirmada()).not.toThrow();
  });

  it('una credencial ya confirmada lanza en verificarNoConfirmada', () => {
    const credencial = new CredencialDosFactores('c1', 'totp', new Date());
    expect(() => credencial.verificarNoConfirmada()).toThrow('ya fue confirmada');
  });

  it('una credencial sin confirmar lanza en verificarConfirmada', () => {
    const credencial = new CredencialDosFactores('c1', 'totp', null);
    expect(() => credencial.verificarConfirmada()).toThrow('todavía no fue confirmada');
  });
});
