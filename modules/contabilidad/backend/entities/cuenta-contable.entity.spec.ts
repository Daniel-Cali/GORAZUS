import { CuentaContable } from './cuenta-contable.entity';

describe('CuentaContable', () => {
  it('caso feliz', () => {
    expect(() => new CuentaContable('1105', 'Caja General', 'type-1', true, null)).not.toThrow();
  });

  it('rechaza código vacío', () => {
    expect(() => new CuentaContable('   ', 'Caja General', 'type-1', true, null)).toThrow(
      /código de la cuenta no puede estar vacío/,
    );
  });

  it('rechaza código con caracteres inválidos', () => {
    expect(() => new CuentaContable('11 05!', 'Caja General', 'type-1', true, null)).toThrow(
      /letras, números, puntos y guiones/,
    );
  });

  it('acepta código jerárquico con puntos y guiones', () => {
    expect(() => new CuentaContable('1.1-05', 'Caja General', 'type-1', true, null)).not.toThrow();
  });

  it('rechaza nombre vacío', () => {
    expect(() => new CuentaContable('1105', '   ', 'type-1', true, null)).toThrow(
      /nombre de la cuenta no puede estar vacío/,
    );
  });
});
