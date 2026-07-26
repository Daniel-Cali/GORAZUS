import { z } from 'zod';

const lineaFacturaSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  taxId: z.string().uuid('El id de impuesto debe ser un UUID válido').optional(),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  discountPercentage: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede superar 100')
    .default(0),
});

export const crearFacturaSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  customerId: z.string().uuid('El id de cliente debe ser un UUID válido'),
  salesChannel: z.enum(['store', 'pos', 'ecommerce', 'phone', 'mobile']).default('store'),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  /** Distinto del descuento por línea — se aplica sobre el subtotal ya neto de descuentos de línea. */
  generalDiscountPercentage: z
    .number()
    .min(0, 'El descuento general no puede ser negativo')
    .max(100, 'El descuento general no puede superar 100')
    .default(0),
  lines: z.array(lineaFacturaSchema).min(1, 'La factura debe tener al menos una línea'),
});
// `z.input`, no `z.infer` (que resuelve al tipo de SALIDA, donde todo campo con
// `.default()` se vuelve obligatorio) — los campos con default deben poder
// omitirse para quien construye el objeto en TypeScript directo (`pos-backend`,
// que no pasa por `ZodValidationPipe`), el default solo se aplica en el borde HTTP.
export type CrearFacturaInput = z.input<typeof crearFacturaSchema>;

/** Editar un borrador — nunca reasigna empresa/sucursal/cliente/canal/moneda, solo líneas y descuento general. */
export const actualizarFacturaSchema = z.object({
  generalDiscountPercentage: z
    .number()
    .min(0, 'El descuento general no puede ser negativo')
    .max(100, 'El descuento general no puede superar 100')
    .default(0),
  lines: z.array(lineaFacturaSchema).min(1, 'La factura debe tener al menos una línea'),
});
export type ActualizarFacturaInput = z.infer<typeof actualizarFacturaSchema>;

export const registrarReciboSchema = z.object({
  invoiceId: z.string().uuid('El id de factura debe ser un UUID válido'),
  paymentFormId: z.string().uuid('El id de forma de pago debe ser un UUID válido').optional(),
  amount: z.number().positive('El monto debe ser mayor que cero'),
});
export type RegistrarReciboInput = z.infer<typeof registrarReciboSchema>;
