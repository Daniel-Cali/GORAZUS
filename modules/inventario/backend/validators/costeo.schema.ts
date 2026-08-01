import { z } from 'zod';

export const registrarEntradaCosteoSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  /** Solo se usa si el producto es FIFO — `goods_receipt_lines` (recepciones) todavía no tiene código de aplicación, se deja el campo listo para cuando exista. */
  sourceReceiptLineId: z
    .string()
    .uuid('El id de línea de recepción debe ser un UUID válido')
    .optional(),
});
export type RegistrarEntradaCosteoInput = z.infer<typeof registrarEntradaCosteoSchema>;

export const resolverCostoSalidaSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
});
export type ResolverCostoSalidaInput = z.infer<typeof resolverCostoSalidaSchema>;
