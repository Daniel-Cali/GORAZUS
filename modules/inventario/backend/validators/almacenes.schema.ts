import { z } from 'zod';

export const crearAlmacenSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre del almacén es obligatorio'),
  code: z.string().min(1, 'El código del almacén es obligatorio'),
  warehouseType: z.enum(['physical', 'virtual']).default('physical'),
});
export type CrearAlmacenInput = z.infer<typeof crearAlmacenSchema>;

export const actualizarAlmacenSchema = crearAlmacenSchema
  .omit({ companyId: true, branchId: true })
  .partial();
export type ActualizarAlmacenInput = z.infer<typeof actualizarAlmacenSchema>;
