import { z } from 'zod';

const lineaOrdenCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
});

export const crearOrdenCompraSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  supplierId: z.string().uuid('El id de proveedor debe ser un UUID válido'),
  requisitionId: z.string().uuid('El id de solicitud de compra debe ser un UUID válido').optional(),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  lines: z.array(lineaOrdenCompraSchema).min(1, 'La orden de compra debe tener al menos una línea'),
});
export type CrearOrdenCompraInput = z.input<typeof crearOrdenCompraSchema>;

/** Editar — nunca reasigna empresa/sucursal/proveedor/solicitud/moneda, solo líneas (y solo mientras sigue en borrador). */
export const actualizarOrdenCompraSchema = z.object({
  lines: z.array(lineaOrdenCompraSchema).min(1, 'La orden de compra debe tener al menos una línea'),
});
export type ActualizarOrdenCompraInput = z.input<typeof actualizarOrdenCompraSchema>;
