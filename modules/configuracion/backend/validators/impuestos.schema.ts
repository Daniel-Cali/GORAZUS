import { z } from 'zod';
import { TIPOS_IMPUESTO } from '../entities/impuesto.entity';

export const crearImpuestoSchema = z.object({
  code: z.string().min(1, 'El código del impuesto es obligatorio'),
  jurisdictionId: z.string().uuid('El id de jurisdicción debe ser un UUID válido'),
  taxKind: z.enum(TIPOS_IMPUESTO),
});
export type CrearImpuestoInput = z.infer<typeof crearImpuestoSchema>;

export const crearTasaImpuestoSchema = z.object({
  taxId: z.string().uuid('El id de impuesto debe ser un UUID válido'),
  ratePercentage: z.number().min(0).max(100),
  effectiveFrom: z.string().min(1, 'La fecha de inicio de vigencia es obligatoria'),
  effectiveTo: z.string().optional(),
});
export type CrearTasaImpuestoInput = z.infer<typeof crearTasaImpuestoSchema>;
