import { z } from 'zod';

export const crearPutawayRuleSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  targetZoneId: z.string().uuid('El id de zona destino debe ser un UUID válido'),
  priority: z.number().int().nonnegative('La prioridad no puede ser negativa').default(0),
  productCategoryId: z.string().uuid('El id de categoría debe ser un UUID válido').optional(),
});
export type CrearPutawayRuleInput = z.infer<typeof crearPutawayRuleSchema>;

export const actualizarPutawayRuleSchema = crearPutawayRuleSchema
  .omit({ warehouseId: true })
  .partial();
export type ActualizarPutawayRuleInput = z.infer<typeof actualizarPutawayRuleSchema>;

export const resolverPutawayQuerySchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  productCategoryId: z.string().uuid('El id de categoría debe ser un UUID válido').optional(),
});
export type ResolverPutawayQuery = z.infer<typeof resolverPutawayQuerySchema>;
