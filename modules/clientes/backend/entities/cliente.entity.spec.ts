import { Cliente } from './cliente.entity';

describe('Cliente', () => {
  it('rechaza nombre vacío', () => {
    expect(() => new Cliente('c1', 'e1', null, '  ', 'CF123', 'USD')).toThrow(
      'nombre del cliente no puede estar vacío',
    );
  });

  it('rechaza tax_id vacío', () => {
    expect(() => new Cliente('c1', 'e1', null, 'Juan Pérez', '  ', 'USD')).toThrow(
      'identificador fiscal del cliente no puede estar vacío',
    );
  });

  it('rechaza código de moneda inválido', () => {
    expect(() => new Cliente('c1', 'e1', null, 'Juan Pérez', 'CF123', 'us')).toThrow(
      'código de moneda debe tener 3 letras',
    );
  });

  it('caso feliz', () => {
    const cliente = new Cliente('c1', 'e1', 'b1', 'Juan Pérez', 'CF123', 'USD');
    expect(cliente.isBlocked).toBe(false);
  });
});
