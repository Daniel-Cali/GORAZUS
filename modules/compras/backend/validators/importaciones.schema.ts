import { z } from 'zod';

const TIPOS_GASTO_IMPORTACION = ['freight', 'insurance', 'customs', 'other'] as const;

export const crearExpedienteImportacionSchema = z.object({
  purchaseOrderId: z.string().uuid('El id de orden de compra debe ser un UUID válido'),
});
export type CrearExpedienteImportacionInput = z.infer<typeof crearExpedienteImportacionSchema>;

export const agregarGastoImportacionSchema = z.object({
  expenseType: z.enum(TIPOS_GASTO_IMPORTACION),
  amount: z.number().positive('El monto del gasto debe ser mayor que cero'),
});
export type AgregarGastoImportacionInput = z.infer<typeof agregarGastoImportacionSchema>;
