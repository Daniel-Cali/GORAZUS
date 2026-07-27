import { z } from 'zod';

const lineaAsientoSchema = z.object({
  accountId: z.string().uuid('El id de cuenta debe ser un UUID válido'),
  costCenterId: z.string().uuid('El id de centro de costo debe ser un UUID válido').optional(),
  profitCenterId: z.string().uuid('El id de centro de utilidad debe ser un UUID válido').optional(),
  debitAmount: z.number().nonnegative('El débito no puede ser negativo').default(0),
  creditAmount: z.number().nonnegative('El crédito no puede ser negativo').default(0),
});

export const crearAsientoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  postingDate: z.coerce.date().optional(),
  description: z.string().max(500).optional(),
  lines: z
    .array(lineaAsientoSchema)
    .min(2, 'Un asiento debe tener al menos 2 líneas (partida doble)'),
});
export type CrearAsientoInput = z.input<typeof crearAsientoSchema>;
