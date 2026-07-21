/** Tipos de dato soportados por un parámetro de sistema — validado también en Zod (`validators/parametros.schema.ts`). */
export const TIPOS_DATO_PARAMETRO = ['string', 'number', 'boolean', 'json'] as const;
export type TipoDatoParametro = (typeof TIPOS_DATO_PARAMETRO)[number];

/**
 * Entidad de dominio pura (docs/architecture/02 §3). Un parámetro es la
 * definición de una clave de configuración del sistema (`key`, `dataType`,
 * `defaultValue`) — el valor efectivo por tenant/empresa/sucursal vive en
 * `system_settings`, representado acá por `ConfiguracionValor`.
 */
export class Parametro {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly dataType: string,
  ) {
    if (key.trim().length === 0) {
      throw new Error('La clave del parámetro no puede estar vacía');
    }
    if (!TIPOS_DATO_PARAMETRO.includes(dataType as TipoDatoParametro)) {
      throw new Error(
        `El tipo de dato "${dataType}" no es válido — debe ser uno de: ${TIPOS_DATO_PARAMETRO.join(', ')}`,
      );
    }
  }
}
