import { z } from 'zod';

/**
 * Valores reales del CHECK `customer_addresses_address_type_check`
 * (`ARRAY['billing', 'shipping', 'other']`) — hallazgo real durante la
 * verificación de producción: sin este enum, un valor fuera de rango
 * pasaba la validación de Zod y rompía en un 500 de Postgres en vez de
 * un 400 limpio.
 */
export const TIPOS_DIRECCION = ['billing', 'shipping', 'other'] as const;

export const crearDireccionSchema = z.object({
  addressType: z.enum(TIPOS_DIRECCION, {
    errorMap: () => ({
      message: `El tipo de dirección debe ser uno de: ${TIPOS_DIRECCION.join(', ')}`,
    }),
  }),
  line1: z.string().min(1, 'La línea 1 es obligatoria'),
  line2: z.string().optional(),
  municipalityId: z.string().uuid('El id de municipio debe ser un UUID válido').optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type CrearDireccionInput = z.infer<typeof crearDireccionSchema>;

export const actualizarDireccionSchema = crearDireccionSchema.partial();
export type ActualizarDireccionInput = z.infer<typeof actualizarDireccionSchema>;
