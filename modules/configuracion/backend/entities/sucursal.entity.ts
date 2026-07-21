/**
 * Entidad de dominio pura (docs/architecture/02 §3). Toda sucursal
 * pertenece a exactamente una empresa (`companyId`) — el invariante de
 * unicidad de la sucursal principal (`isMainBranch`) se valida a nivel de
 * servicio, no acá, porque requiere consultar otras filas de la misma
 * empresa (fuera del alcance de una entidad de dominio pura).
 */
export class Sucursal {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly isMainBranch: boolean,
  ) {
    if (name.trim().length === 0) {
      throw new Error('El nombre de la sucursal no puede estar vacío');
    }
    if (code.trim().length === 0) {
      throw new Error('El código de la sucursal no puede estar vacío');
    }
  }
}
