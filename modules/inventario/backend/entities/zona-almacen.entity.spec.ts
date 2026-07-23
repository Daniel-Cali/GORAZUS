import { ZonaAlmacen } from './zona-almacen.entity';

describe('ZonaAlmacen', () => {
  it('rechaza un nombre vacío', () => {
    expect(() => new ZonaAlmacen('z1', 'a1', '   ', 'receiving')).toThrow('no puede estar vacío');
  });

  it('rechaza una función de zona inválida', () => {
    expect(() => new ZonaAlmacen('z1', 'a1', 'Recepción', 'lo-que-sea' as never)).toThrow(
      'Función de zona inválida',
    );
  });

  it.each(['receiving', 'storage', 'picking', 'shipping'] as const)(
    'acepta la función de zona "%s"',
    (zoneFunction) => {
      expect(() => new ZonaAlmacen('z1', 'a1', 'Zona', zoneFunction)).not.toThrow();
    },
  );
});
