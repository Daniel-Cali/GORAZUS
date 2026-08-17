import { Rol, NOMBRE_ROL_MAX_LENGTH, CODIGO_ROL_MAX_LENGTH } from './rol.entity';

describe('Rol', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new Rol('r1', '   ', false)).toThrow('no puede estar vacío');
  });

  it('recorta espacios del nombre (normalización, no solo validación)', () => {
    const rol = new Rol('r1', '  Vendedor  ', false);
    expect(rol.name).toBe('Vendedor');
  });

  it('rechaza un nombre más largo que el máximo', () => {
    expect(() => new Rol('r1', 'a'.repeat(NOMBRE_ROL_MAX_LENGTH + 1), false)).toThrow(
      `no puede superar los ${NOMBRE_ROL_MAX_LENGTH} caracteres`,
    );
  });

  it('normaliza el código a mayúsculas y sin espacios', () => {
    const rol = new Rol('r1', 'Vendedor', false, '  sales_rep  ');
    expect(rol.code).toBe('SALES_REP');
  });

  it('rechaza un código con caracteres inválidos', () => {
    expect(() => new Rol('r1', 'Vendedor', false, 'SALES-REP!')).toThrow(
      'solo puede tener letras, números y guion bajo',
    );
  });

  it('rechaza un código más largo que el máximo', () => {
    expect(() => new Rol('r1', 'Vendedor', false, 'A'.repeat(CODIGO_ROL_MAX_LENGTH + 1))).toThrow(
      `no puede superar los ${CODIGO_ROL_MAX_LENGTH} caracteres`,
    );
  });

  it('code null es válido (opcional)', () => {
    const rol = new Rol('r1', 'Vendedor', false, null);
    expect(rol.code).toBeNull();
  });

  it('un rol de fábrica no puede eliminarse', () => {
    const rol = new Rol('r1', 'Administrador', true, null, null, 'system');
    expect(() => rol.verificarPuedeEliminarse()).toThrow('rol de fábrica');
  });

  it('un rol de fábrica no puede renombrarse', () => {
    const rol = new Rol('r1', 'Administrador', true, null, null, 'system');
    expect(() => rol.verificarPuedeRenombrarse()).toThrow('rol de fábrica');
  });

  it('un rol normal sí puede eliminarse/renombrarse', () => {
    const rol = new Rol('r1', 'Vendedor', false);
    expect(() => rol.verificarPuedeEliminarse()).not.toThrow();
    expect(() => rol.verificarPuedeRenombrarse()).not.toThrow();
  });

  it('rechaza un roleType fuera del enum real', () => {
    expect(
      // @ts-expect-error — valor fuera del enum a propósito, para probar el invariante en runtime.
      () => new Rol('r1', 'Vendedor', false, null, null, 'department'),
    ).toThrow('El tipo de rol debe ser uno de: system, tenant, company, branch, custom');
  });

  it('rechaza isSystemRole=true con roleType distinto de "system"', () => {
    expect(() => new Rol('r1', 'Administrador', true, null, null, 'custom')).toThrow(
      'debe tener roleType "system"',
    );
  });

  it('roleType por defecto es "custom"', () => {
    const rol = new Rol('r1', 'Vendedor', false);
    expect(rol.roleType).toBe('custom');
  });

  it('acepta code y description', () => {
    const rol = new Rol('r1', 'Vendedor', false, 'SALES_REP', 'Vendedores de mostrador', 'company');
    expect(rol.code).toBe('SALES_REP');
    expect(rol.description).toBe('Vendedores de mostrador');
    expect(rol.roleType).toBe('company');
  });
});
