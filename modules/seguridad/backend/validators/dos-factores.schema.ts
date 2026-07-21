import { z } from 'zod';

export const confirmarDosFactoresSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe ser numérico'),
});
export type ConfirmarDosFactoresInput = z.infer<typeof confirmarDosFactoresSchema>;
