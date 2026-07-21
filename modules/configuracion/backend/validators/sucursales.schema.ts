import { z } from 'zod';

export const crearSucursalSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre de la sucursal es obligatorio'),
  code: z.string().min(1, 'El código de la sucursal es obligatorio'),
  isMainBranch: z.boolean().default(false),
  addressLine: z.string().optional(),
  phone: z.string().optional(),
});
export type CrearSucursalInput = z.infer<typeof crearSucursalSchema>;

export const actualizarSucursalSchema = crearSucursalSchema.omit({ companyId: true }).partial();
export type ActualizarSucursalInput = z.infer<typeof actualizarSucursalSchema>;
