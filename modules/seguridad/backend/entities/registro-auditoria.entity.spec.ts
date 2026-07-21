import { RegistroAuditoria } from './registro-auditoria.entity';

describe('RegistroAuditoria', () => {
  it('rechaza un nombre de tabla vacío', () => {
    expect(() => new RegistroAuditoria('a1', '   ', 'INSERT')).toThrow('no puede estar vacío');
  });

  it('rechaza una operación no soportada', () => {
    expect(() => new RegistroAuditoria('a1', 'roles', 'TRUNCATE')).toThrow('no es válida');
  });

  it('acepta un registro válido', () => {
    expect(() => new RegistroAuditoria('a1', 'roles', 'INSERT')).not.toThrow();
  });
});
