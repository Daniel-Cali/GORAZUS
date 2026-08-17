import { z } from 'zod';

export const crearConteoSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  scheduledDate: z.coerce.date({ errorMap: () => ({ message: 'Fecha programada inválida' }) }),
  /** Si se omite `productIds`, se autogeneran las líneas desde el stock con existencia > 0 del almacén — filtrado a esta zona si se indica (Conteo por Zona/Almacén). Ignorado si `productIds` viene explícito. */
  zoneId: z.string().uuid('El id de zona debe ser un UUID válido').optional(),
  /** Prompt 1 (Foundation Completion): granularidad más fina que zoneId — si viene, filtra por ubicación puntual en vez de zona. */
  locationId: z.string().uuid('El id de ubicación debe ser un UUID válido').optional(),
  /** Si se omite, se autogeneran las líneas (Conteo General/por Almacén/por Zona). Con esto, Conteo Parcial — para "por categoría/marca/proveedor", filtrar productIds desde el módulo Productos antes de llamar acá. */
  productIds: z
    .array(z.string().uuid('Cada id de producto debe ser un UUID válido'))
    .min(1, 'Si se indica productIds, necesita al menos un producto')
    .optional(),
  /** Prompt 1 (Foundation Completion): granularidad de las líneas autogeneradas. Ignorado si `productIds` viene explícito. Default 'product'. */
  countBy: z.enum(['product', 'lot', 'serial']).default('product'),
});
export type CrearConteoInput = z.infer<typeof crearConteoSchema>;

export const capturarLineaConteoSchema = z.object({
  countedQuantity: z.number().nonnegative('La cantidad contada no puede ser negativa'),
});
export type CapturarLineaConteoInput = z.infer<typeof capturarLineaConteoSchema>;
