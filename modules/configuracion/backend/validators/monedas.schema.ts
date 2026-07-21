import { z } from 'zod';

export const crearMonedaSchema = z.object({
  isoCode: z.string().length(3, 'El código ISO de la moneda debe tener 3 caracteres (ISO 4217)'),
  symbol: z.string().optional(),
  decimalPlaces: z.number().int().min(0).max(6).default(2),
});
export type CrearMonedaInput = z.infer<typeof crearMonedaSchema>;
