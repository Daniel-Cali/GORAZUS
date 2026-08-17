import { z } from 'zod';

export const crearLeadSchema = z
  .object({
    companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
    branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
    fullName: z.string().min(1, 'El nombre del lead es obligatorio'),
    email: z.string().email('El email no es válido').optional(),
    phone: z.string().min(1).optional(),
    sourceId: z.string().uuid('El id de origen debe ser un UUID válido').optional(),
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'El lead debe tener al menos un email o un teléfono de contacto',
    path: ['email'],
  });
export type CrearLeadInput = z.infer<typeof crearLeadSchema>;

export const cambiarEstadoLeadSchema = z.object({
  statusCode: z.string().min(1, 'El código de estado es obligatorio'),
});
export type CambiarEstadoLeadInput = z.infer<typeof cambiarEstadoLeadSchema>;

export const convertirLeadSchema = z.object({
  legalName: z.string().min(1, 'El nombre legal del cliente es obligatorio'),
  taxId: z.string().min(1, 'El identificador fiscal es obligatorio'),
  preferredCurrencyCode: z
    .string()
    .length(3, 'El código de moneda debe tener 3 letras (ISO 4217)')
    .default('USD'),
});
export type ConvertirLeadInput = z.infer<typeof convertirLeadSchema>;
