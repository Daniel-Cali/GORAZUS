import { z } from 'zod';

const opportunityLineSchema = z.object({
  productId: z.string().uuid('El id de producto debe ser un UUID válido'),
  estimatedQuantity: z.number().positive('La cantidad estimada debe ser mayor a cero'),
});

export const crearOpportunitySchema = z
  .object({
    companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
    branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
    funnelStageId: z.string().uuid('El id de etapa de embudo debe ser un UUID válido'),
    leadId: z.string().uuid('El id de lead debe ser un UUID válido').optional(),
    customerId: z.string().uuid('El id de cliente debe ser un UUID válido').optional(),
    estimatedAmount: z.number().min(0).default(0),
    lines: z.array(opportunityLineSchema).default([]),
  })
  .refine((data) => Boolean(data.leadId) || Boolean(data.customerId), {
    message: 'La oportunidad debe originarse en un lead o en un cliente existente',
    path: ['leadId'],
  });
export type CrearOpportunityInput = z.infer<typeof crearOpportunitySchema>;

export const moverDeEtapaSchema = z.object({
  funnelStageId: z.string().uuid('El id de etapa de embudo debe ser un UUID válido'),
});
export type MoverDeEtapaInput = z.infer<typeof moverDeEtapaSchema>;

export const ganarOpportunitySchema = z.object({
  resultingSalesOrderId: z
    .string()
    .uuid('El id del pedido/factura resultante debe ser un UUID válido'),
});
export type GanarOpportunityInput = z.infer<typeof ganarOpportunitySchema>;

export const perderOpportunitySchema = z.object({
  lossReasonId: z.string().uuid('El motivo de pérdida es obligatorio y debe ser un UUID válido'),
});
export type PerderOpportunityInput = z.infer<typeof perderOpportunitySchema>;
