import { Email, EmailInvalidoException } from './email.vo';

describe('Email (value object)', () => {
  it('acepta un email válido y lo expone vía toString()', () => {
    const email = new Email('admin@demo.local');
    expect(email.toString()).toBe('admin@demo.local');
  });

  it('normaliza a minúsculas al construir', () => {
    const email = new Email('Admin@Demo.Local');
    expect(email.toString()).toBe('admin@demo.local');
  });

  it('rechaza un formato inválido con EmailInvalidoException', () => {
    expect(() => new Email('no-es-un-email')).toThrow(EmailInvalidoException);
  });

  it('equals() compara por valor, sin importar mayúsculas', () => {
    const a = new Email('admin@demo.local');
    const b = new Email('ADMIN@DEMO.LOCAL');
    const c = new Email('otro@demo.local');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
