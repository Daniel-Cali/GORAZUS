import { z } from 'zod';

export const crearClienteSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  legalName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  taxId: z.string().min(1, 'El identificador fiscal es obligatorio'),
  tradeName: z.string().optional(),
  preferredCurrencyCode: z
    .string()
    .length(3, 'El código de moneda debe tener 3 letras (ISO 4217)')
    .default('USD'),
});
export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export const actualizarClienteSchema = crearClienteSchema
  .omit({ companyId: true, branchId: true, taxId: true })
  .partial();
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
