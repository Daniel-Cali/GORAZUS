import { z } from 'zod';

const lineaReglaSchema = z.object({
  accountId: z.string().uuid('El id de cuenta debe ser un UUID válido'),
  entrySide: z.enum(['debit', 'credit']),
  amountFormula: z.string().min(1, 'El campo de la fórmula no puede estar vacío').max(100),
});

export const crearReglaContableSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  eventCode: z.string().min(1, 'El código de evento no puede estar vacío').max(100),
  lines: z.array(lineaReglaSchema).min(2, 'Una regla debe tener al menos 2 líneas (partida doble)'),
});
export type CrearReglaContableInput = z.input<typeof crearReglaContableSchema>;
