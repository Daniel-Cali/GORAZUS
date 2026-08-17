/**
 * Entidad de dominio pura — `customers.customer_contacts`, Clientes
 * Parte 02 (Customer 360). Un cliente puede tener varios contactos; a lo
 * sumo uno marcado `isPrimary` (regla de negocio, no hay constraint en
 * DB — se aplica en `ContactosService.crear/marcarPrincipal`).
 */
export class ContactoCliente {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly fullName: string,
    public readonly jobTitle: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly isPrimary: boolean = false,
  ) {
    if (fullName.trim().length === 0) {
      throw new Error('El nombre del contacto no puede estar vacío');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('El email del contacto no es válido');
    }
  }
}
