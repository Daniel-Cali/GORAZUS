import { z } from 'zod';

const lineaSolicitudCompraSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  quantity: z.number().positive('La cantidad debe ser mayor que cero'),
});

export const crearSolicitudCompraSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
  lines: z
    .array(lineaSolicitudCompraSchema)
    .min(1, 'La solicitud de compra debe tener al menos una línea'),
});
export type CrearSolicitudCompraInput = z.input<typeof crearSolicitudCompraSchema>;

/** Editar — nunca reasigna empresa/sucursal, solo líneas (y solo mientras sigue en borrador). */
export const actualizarSolicitudCompraSchema = z.object({
  lines: z
    .array(lineaSolicitudCompraSchema)
    .min(1, 'La solicitud de compra debe tener al menos una línea'),
});
export type ActualizarSolicitudCompraInput = z.input<typeof actualizarSolicitudCompraSchema>;
