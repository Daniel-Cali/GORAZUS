import { z } from 'zod';

export const crearProveedorSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  legalName: z.string().min(1, 'La razón social es obligatoria'),
  tradeName: z.string().optional(),
  taxId: z.string().min(1, 'La identificación fiscal es obligatoria'),
  paymentTermsDays: z.number().int().nonnegative().default(0),
});
export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;

export const actualizarProveedorSchema = crearProveedorSchema
  .omit({ companyId: true, taxId: true })
  .partial();
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;

export const bloquearProveedorSchema = z.object({
  reason: z.string().min(1, 'Indicar un motivo de bloqueo').optional(),
});
export type BloquearProveedorInput = z.infer<typeof bloquearProveedorSchema>;

export const desbloquearProveedorSchema = z.object({
  reason: z.string().optional(),
});
export type DesbloquearProveedorInput = z.infer<typeof desbloquearProveedorSchema>;
