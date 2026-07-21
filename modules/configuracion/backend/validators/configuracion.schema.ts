import { z } from 'zod';

export const fijarValorSchema = z.object({
  key: z.string().min(1, 'La clave del parámetro es obligatoria'),
  value: z.string().min(1, 'El valor es obligatorio'),
});
export type FijarValorInput = z.infer<typeof fijarValorSchema>;
