import { z } from 'zod';

export const crearCentroCostoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  code: z.string().min(1, 'El código no puede estar vacío').max(50),
  name: z.string().min(1, 'El nombre no puede estar vacío').max(255),
});
export type CrearCentroCostoInput = z.input<typeof crearCentroCostoSchema>;
