import { z } from 'zod';

const lineaCotizacionSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  discountPercentage: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede superar 100')
    .default(0),
});

export const crearCotizacionSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  customerId: z.string().uuid('El id de cliente debe ser un UUID válido'),
  salespersonId: z.string().uuid('El id de vendedor debe ser un UUID válido').optional(),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  validUntil: z.coerce.date().optional(),
  lines: z.array(lineaCotizacionSchema).min(1, 'La cotización debe tener al menos una línea'),
});
export type CrearCotizacionInput = z.input<typeof crearCotizacionSchema>;

/** Editar — nunca reasigna empresa/sucursal/cliente/moneda, solo líneas/vigencia/vendedor. */
export const actualizarCotizacionSchema = z.object({
  salespersonId: z.string().uuid('El id de vendedor debe ser un UUID válido').optional(),
  validUntil: z.coerce.date().optional(),
  lines: z.array(lineaCotizacionSchema).min(1, 'La cotización debe tener al menos una línea'),
});
export type ActualizarCotizacionInput = z.input<typeof actualizarCotizacionSchema>;
