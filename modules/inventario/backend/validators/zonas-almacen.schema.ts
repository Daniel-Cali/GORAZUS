import { z } from 'zod';

export const crearZonaAlmacenSchema = z.object({
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre de la zona es obligatorio'),
  zoneFunction: z.enum(['receiving', 'storage', 'picking', 'shipping']),
});
export type CrearZonaAlmacenInput = z.infer<typeof crearZonaAlmacenSchema>;

export const actualizarZonaAlmacenSchema = crearZonaAlmacenSchema
  .omit({ warehouseId: true })
  .partial();
export type ActualizarZonaAlmacenInput = z.infer<typeof actualizarZonaAlmacenSchema>;
