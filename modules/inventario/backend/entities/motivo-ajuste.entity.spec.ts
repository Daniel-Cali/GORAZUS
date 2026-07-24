import { MotivoAjuste } from './motivo-ajuste.entity';

describe('MotivoAjuste', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new MotivoAjuste('m1', '   ')).toThrow(
      'nombre del motivo de ajuste no puede estar vacío',
    );
  });

  it('acepta un motivo válido', () => {
    expect(() => new MotivoAjuste('m1', 'Daño')).not.toThrow();
  });
});
