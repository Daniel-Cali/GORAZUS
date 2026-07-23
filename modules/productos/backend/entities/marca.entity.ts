/** Entidad de dominio pura — marca comercial, plana (sin jerarquía, docs/architecture/18-modulo-products.md §3). */
export class Marca {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre de la marca no puede estar vacío');
    }
  }
}
