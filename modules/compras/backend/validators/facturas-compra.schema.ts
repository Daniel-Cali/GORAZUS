import { z } from 'zod';

const lineaFacturaCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
  unitCost: z.number().nonnegative('El costo unitario no puede ser negativo'),
  taxId: z.string().uuid('El id de impuesto debe ser un UUID válido').optional(),
});

export const crearFacturaCompraSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  supplierId: z.string().uuid('El id de proveedor debe ser un UUID válido'),
  supplierDocumentNumber: z.string().min(1, 'El número de documento del proveedor es obligatorio'),
  purchaseOrderId: z.string().uuid('El id de orden de compra debe ser un UUID válido').optional(),
  currencyCode: z.string().length(3, 'El código de moneda debe tener 3 letras (ISO 4217)'),
  lines: z
    .array(lineaFacturaCompraSchema)
    .min(1, 'La factura de compra debe tener al menos una línea'),
});
export type CrearFacturaCompraInput = z.input<typeof crearFacturaCompraSchema>;

/** Editar — nunca reasigna empresa/sucursal/proveedor/referencia/orden/moneda, solo líneas (y solo mientras sigue en borrador). */
export const actualizarFacturaCompraSchema = z.object({
  lines: z
    .array(lineaFacturaCompraSchema)
    .min(1, 'La factura de compra debe tener al menos una línea'),
});
export type ActualizarFacturaCompraInput = z.input<typeof actualizarFacturaCompraSchema>;
