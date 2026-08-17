/**
 * Entidad de dominio pura sobre `inventory.goods_issues`/`goods_issue_lines`
 * — salida física de inventario (Inventario Parte 05, Subfase 2: Salidas).
 * Mismo criterio que `RecepcionInventario`: el schema real no define columna
 * de estado, el estado se deriva en el servicio. `goods_issue_lines` no tiene
 * `unit_cost` (a diferencia de `goods_receipt_lines`) — el costo de salida lo
 * resuelve `CosteoService.resolverCostoDeSalida`, nunca lo informa el caller.
 */
export class SalidaInventario {
  constructor(
    public readonly warehouseId: string,
    public readonly lines: Array<{ productId: string; quantity: number }>,
    public readonly reasonId: string | null,
    public readonly sourceModule: string | null,
    public readonly sourceEntityId: string | null,
  ) {
    if (lines.length === 0) {
      throw new Error('La salida debe tener al menos una línea');
    }
    for (const linea of lines) {
      if (linea.quantity <= 0) {
        throw new Error('La cantidad de cada línea debe ser mayor que cero');
      }
    }
    const tieneModulo = sourceModule !== null && sourceModule.trim().length > 0;
    const tieneEntidad = sourceEntityId !== null && sourceEntityId.trim().length > 0;
    if (tieneModulo !== tieneEntidad) {
      throw new Error(
        'El documento origen debe indicar módulo y entidad juntos, o ninguno de los dos',
      );
    }
  }
}
