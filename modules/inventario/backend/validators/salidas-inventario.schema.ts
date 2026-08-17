import { z } from 'zod';

/** Inventario Parte 05 Subfase 3: selección de lote/series a consumir — solo obligatorios si el producto tiene `tracks_lot`/`tracks_serial` (validado en el servicio). A diferencia de Recepciones, acá se referencia un lote EXISTENTE por id (no se crea uno nuevo al emitir). */
const lineaSalidaInventarioSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  lotId: z.string().uuid('El id de lote debe ser un UUID válido').optional(),
  serialNumbers: z.array(z.string().min(1, 'El número de serie no puede estar vacío')).optional(),
});

export const crearSalidaInventarioSchema = z
  .object({
    warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
    lines: z.array(lineaSalidaInventarioSchema).min(1, 'La salida debe tener al menos una línea'),
    reasonId: z.string().uuid('El id de motivo debe ser un UUID válido').optional(),
    sourceModule: z.string().min(1).optional(),
    sourceEntityId: z
      .string()
      .uuid('El id de la entidad origen debe ser un UUID válido')
      .optional(),
  })
  .refine((data) => Boolean(data.sourceModule) === Boolean(data.sourceEntityId), {
    message: 'sourceModule y sourceEntityId deben indicarse juntos, o ninguno de los dos',
    path: ['sourceEntityId'],
  });
export type CrearSalidaInventarioInput = z.infer<typeof crearSalidaInventarioSchema>;

/** ISSUE-07: opcional para no romper clientes existentes — reutiliza `inventory.movement_idempotency_keys` vía `MovimientosService`. */
export const confirmarSalidaInventarioSchema = z.object({
  idempotencyKey: z.string().min(1).max(255).optional(),
});
export type ConfirmarSalidaInventarioInput = z.infer<typeof confirmarSalidaInventarioSchema>;
