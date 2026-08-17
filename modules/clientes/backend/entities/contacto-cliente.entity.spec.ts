import { ContactoCliente } from './contacto-cliente.entity';

describe('ContactoCliente', () => {
  it('rechaza nombre vacío', () => {
    expect(() => new ContactoCliente('k1', 'c1', '  ', null, null, null)).toThrow(
      'nombre del contacto no puede estar vacío',
    );
  });

  it('rechaza email inválido', () => {
    expect(() => new ContactoCliente('k1', 'c1', 'Ana López', null, 'no-es-email', null)).toThrow(
      'email del contacto no es válido',
    );
  });

  it('caso feliz', () => {
    const contacto = new ContactoCliente(
      'k1',
      'c1',
      'Ana López',
      'Gerente',
      'ana@ej.com',
      '555-0001',
    );
    expect(contacto.isPrimary).toBe(false);
  });
});
