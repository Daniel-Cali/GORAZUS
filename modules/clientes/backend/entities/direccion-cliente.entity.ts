/**
 * Valores reales del CHECK `customer_addresses_address_type_check` en
 * `customers.customer_addresses` — sin este invariante acá, un valor
 * fuera de rango pasaba hasta el repositorio y rompía en un error de
 * Postgres sin traducir en vez de una excepción de dominio clara.
 */
export const TIPOS_DIRECCION_CLIENTE = ['billing', 'shipping', 'other'] as const;
export type TipoDireccionCliente = (typeof TIPOS_DIRECCION_CLIENTE)[number];

/**
 * Entidad de dominio pura — `customers.customer_addresses`, Clientes
 * Parte 02 (Customer 360). Un cliente puede tener varias direcciones; a
 * lo sumo una marcada `isDefault` (regla de negocio, no hay constraint
 * en DB — se aplica en `DireccionesService.crear/marcarPredeterminada`).
 */
export class DireccionCliente {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly addressType: TipoDireccionCliente,
    public readonly line1: string,
    public readonly line2: string | null,
    public readonly municipalityId: string | null,
    public readonly postalCode: string | null,
    public readonly isDefault: boolean = false,
  ) {
    if (!TIPOS_DIRECCION_CLIENTE.includes(addressType)) {
      throw new Error(
        `El tipo de dirección debe ser uno de: ${TIPOS_DIRECCION_CLIENTE.join(', ')}`,
      );
    }
    if (line1.trim().length === 0) {
      throw new Error('La línea 1 de la dirección no puede estar vacía');
    }
  }
}
