import { z } from 'zod';

const TIPOS_PRODUCTO = ['good', 'service', 'kit', 'combo', 'composite'] as const;
const METODOS_COSTEO = ['fifo', 'lifo', 'average', 'standard'] as const;

export const crearProductoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  sku: z.string().min(1, 'El SKU es obligatorio'),
  productType: z.enum(TIPOS_PRODUCTO),
  baseUnitId: z.string().uuid('El id de unidad de medida debe ser un UUID válido'),
  categoryId: z.string().uuid('El id de categoría debe ser un UUID válido').optional(),
  brandId: z.string().uuid('El id de marca debe ser un UUID válido').optional(),
  modelId: z.string().uuid('El id de modelo debe ser un UUID válido').optional(),
  costingMethod: z.enum(METODOS_COSTEO).default('average'),
  tracksSerial: z.boolean().default(false),
  tracksLot: z.boolean().default(false),
  standardCost: z.number().nonnegative().optional(),
  listPrice: z.number().nonnegative().optional(),
});
export type CrearProductoInput = z.infer<typeof crearProductoSchema>;

export const actualizarProductoSchema = crearProductoSchema
  .omit({ companyId: true, sku: true, baseUnitId: true })
  .partial();
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
