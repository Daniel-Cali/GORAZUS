import { z } from 'zod';

export const crearPickingRuleSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  strategy: z.enum(['fifo', 'lifo', 'fefo', 'nearest_location']),
});
export type CrearPickingRuleInput = z.infer<typeof crearPickingRuleSchema>;

export const actualizarPickingRuleSchema = crearPickingRuleSchema
  .omit({ warehouseId: true })
  .partial();
export type ActualizarPickingRuleInput = z.infer<typeof actualizarPickingRuleSchema>;
