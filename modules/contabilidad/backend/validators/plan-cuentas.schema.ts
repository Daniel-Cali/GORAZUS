import { z } from 'zod';

export const crearCuentaContableSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  code: z.string().min(1, 'El código no puede estar vacío').max(50),
  name: z.string().min(1, 'El nombre no puede estar vacío').max(255),
  accountTypeId: z.string().uuid('El id de tipo de cuenta debe ser un UUID válido'),
  parentAccountId: z.string().uuid('El id de cuenta padre debe ser un UUID válido').optional(),
  acceptsPostings: z.boolean().default(true),
});
export type CrearCuentaContableInput = z.input<typeof crearCuentaContableSchema>;

export const actualizarCuentaContableSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  acceptsPostings: z.boolean().optional(),
});
export type ActualizarCuentaContableInput = z.input<typeof actualizarCuentaContableSchema>;
