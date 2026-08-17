import { Lead } from './lead.entity';

describe('Lead', () => {
  it('rechaza nombre vacío', () => {
    expect(() => new Lead('l1', 'e1', null, '  ', 's1', 'a@b.com')).toThrow(
      'nombre del lead no puede estar vacío',
    );
  });

  it('rechaza estado vacío', () => {
    expect(() => new Lead('l1', 'e1', null, 'Juan Pérez', '  ', 'a@b.com')).toThrow(
      'debe tener un estado asignado',
    );
  });

  it('rechaza lead sin email ni teléfono', () => {
    expect(() => new Lead('l1', 'e1', null, 'Juan Pérez', 's1')).toThrow(
      'al menos un email o un teléfono',
    );
  });

  it('acepta lead con solo teléfono', () => {
    const lead = new Lead('l1', 'e1', null, 'Juan Pérez', 's1', null, '555-1234');
    expect(lead.phone).toBe('555-1234');
  });

  it('caso feliz', () => {
    const lead = new Lead('l1', 'e1', 'b1', 'Juan Pérez', 's1', 'a@b.com');
    expect(lead.fullName).toBe('Juan Pérez');
    expect(lead.convertedCustomerId).toBeNull();
  });
});
