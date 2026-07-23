import { UbicacionAlmacen } from './ubicacion-almacen.entity';

describe('UbicacionAlmacen', () => {
  it('rechaza un código vacío', () => {
    expect(() => new UbicacionAlmacen('u1', 'z1', '   ', null)).toThrow('no puede estar vacío');
  });

  it('rechaza que la ubicación sea su propia ubicación padre', () => {
    expect(() => new UbicacionAlmacen('u1', 'z1', 'BIN-01', 'u1')).toThrow(
      'no puede ser su propia ubicación padre',
    );
  });

  it('acepta una ubicación raíz (sin padre)', () => {
    expect(() => new UbicacionAlmacen('u1', 'z1', 'PASILLO-A', null)).not.toThrow();
  });

  it('acepta una ubicación con un padre distinto', () => {
    expect(() => new UbicacionAlmacen('u2', 'z1', 'ESTANTE-A1', 'u1')).not.toThrow();
  });
});
