import { z } from 'zod';

const lineaVentaSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  locationId: z.string().uuid('El id de ubicación debe ser un UUID válido').optional(),
  taxId: z.string().uuid('El id de impuesto debe ser un UUID válido').optional(),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  discountPercentage: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede superar 100')
    .default(0),
});

const pagoVentaSchema = z.object({
  paymentFormId: z.string().uuid('El id de forma de pago debe ser un UUID válido').optional(),
  amount: z.number().positive('El monto del pago debe ser mayor que cero'),
});

export const confirmarVentaSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  registerId: z.string().uuid('El id de caja debe ser un UUID válido'),
  customerId: z.string().uuid('El id de cliente debe ser un UUID válido').optional(),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  lines: z.array(lineaVentaSchema).min(1, 'La venta debe tener al menos una línea'),
  payments: z.array(pagoVentaSchema).min(1, 'La venta debe tener al menos un pago'),
});
export type ConfirmarVentaInput = z.infer<typeof confirmarVentaSchema>;

export const suspenderVentaSchema = confirmarVentaSchema
  .omit({ payments: true })
  .extend({ customerId: z.string().uuid().optional() });
export type SuspenderVentaInput = z.infer<typeof suspenderVentaSchema>;
