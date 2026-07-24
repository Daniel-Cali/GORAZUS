import { ProgramaConteoCiclico } from './programa-conteo-ciclico.entity';

describe('ProgramaConteoCiclico', () => {
  it('rechaza frecuencia cero', () => {
    expect(() => new ProgramaConteoCiclico('s1', 'z1', 0)).toThrow(
      'frecuencia en días debe ser mayor que cero',
    );
  });

  it('rechaza frecuencia negativa', () => {
    expect(() => new ProgramaConteoCiclico('s1', 'z1', -7)).toThrow(
      'frecuencia en días debe ser mayor que cero',
    );
  });

  it('acepta una frecuencia válida (semanal)', () => {
    expect(() => new ProgramaConteoCiclico('s1', 'z1', 7)).not.toThrow();
  });
});
