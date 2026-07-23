import { z } from 'zod';

export const crearTipoMovimientoSchema = z.object({
  code: z.string().min(1, 'El código del tipo de movimiento es obligatorio'),
  direction: z.enum(['in', 'out'], { errorMap: () => ({ message: 'Dirección inválida' }) }),
});
export type CrearTipoMovimientoInput = z.infer<typeof crearTipoMovimientoSchema>;

/** `code` es editable (no cambia la trazabilidad histórica); `direction` se valida en el servicio si ya hay movimientos registrados (`INVENTORY_ARCHITECTURE.md §6`). */
export const actualizarTipoMovimientoSchema = crearTipoMovimientoSchema.partial();
export type ActualizarTipoMovimientoInput = z.infer<typeof actualizarTipoMovimientoSchema>;
