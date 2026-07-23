const TIPOS_PRODUCTO = ['good', 'service', 'kit', 'combo', 'composite'] as const;
export type TipoProducto = (typeof TIPOS_PRODUCTO)[number];

const METODOS_COSTEO = ['fifo', 'lifo', 'average', 'standard'] as const;
export type MetodoCosteo = (typeof METODOS_COSTEO)[number];

/**
 * Entidad de dominio pura — producto/servicio, entidad central del
 * módulo (docs/architecture/18-modulo-products.md §1). `productType`
 * determina el comportamiento de todo lo demás, no una tabla separada
 * por tipo. Invariante agregado acá (el propio documento de arquitectura
 * lo señala como "no reforzado hoy por CHECK cruzado", a nivel de
 * `entities/`): un producto `service` no tiene existencia física, así
 * que `tracksSerial`/`tracksLot` no tienen sentido para ese tipo.
 *
 * La consistencia `brandId`↔`modelId.brandId` (el modelo, si se indica,
 * debe pertenecer a la marca indicada) requiere consultar
 * `product_models` — fuera del alcance de una entidad pura, se valida en
 * `ProductosService`.
 */
export class Producto {
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly productType: TipoProducto,
    public readonly baseUnitId: string,
    public readonly costingMethod: MetodoCosteo,
    public readonly tracksSerial: boolean,
    public readonly tracksLot: boolean,
  ) {
    if (sku.trim().length === 0) {
      throw new Error('El SKU del producto no puede estar vacío');
    }
    if (!TIPOS_PRODUCTO.includes(productType)) {
      throw new Error(`Tipo de producto inválido: "${productType}"`);
    }
    if (!METODOS_COSTEO.includes(costingMethod)) {
      throw new Error(`Método de costeo inválido: "${costingMethod}"`);
    }
    if (productType === 'service' && (tracksSerial || tracksLot)) {
      throw new Error(
        'Un producto de tipo "service" no puede rastrear serie ni lote — no tiene existencia física',
      );
    }
  }
}
