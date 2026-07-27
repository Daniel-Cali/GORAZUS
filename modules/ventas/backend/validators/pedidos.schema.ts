import { z } from 'zod';

const lineaPedidoSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  discountPercentage: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede superar 100')
    .default(0),
});

export const crearPedidoSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  customerId: z.string().uuid('El id de cliente debe ser un UUID válido'),
  salespersonId: z.string().uuid('El id de vendedor debe ser un UUID válido').optional(),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  warehouseId: z.string().uuid('El id de almacén debe ser un UUID válido'),
  lines: z.array(lineaPedidoSchema).min(1, 'El pedido debe tener al menos una línea'),
});
export type CrearPedidoInput = z.input<typeof crearPedidoSchema>;

/** Qué convertir a factura — vacío/omitido = todas las líneas, por su cantidad pendiente completa. */
export const convertirPedidoAFacturaSchema = z.object({
  lines: z
    .array(
      z.object({
        salesOrderLineId: z.string().uuid('El id de línea de pedido debe ser un UUID válido'),
        quantity: z.number().positive('La cantidad a facturar debe ser mayor que cero'),
      }),
    )
    .optional(),
});
export type ConvertirPedidoAFacturaInput = z.input<typeof convertirPedidoAFacturaSchema>;
