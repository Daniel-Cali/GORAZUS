import { z } from 'zod';

export const crearReplenishmentRuleSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  minQuantity: z.number().nonnegative('La cantidad mínima no puede ser negativa'),
  maxQuantity: z.number().positive('La cantidad máxima debe ser mayor que cero'),
});
export type CrearReplenishmentRuleInput = z.infer<typeof crearReplenishmentRuleSchema>;

export const actualizarReplenishmentRuleSchema = crearReplenishmentRuleSchema
  .omit({ warehouseId: true, productId: true })
  .partial();
export type ActualizarReplenishmentRuleInput = z.infer<typeof actualizarReplenishmentRuleSchema>;
