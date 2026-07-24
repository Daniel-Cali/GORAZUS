import { z } from 'zod';

export const crearCajaSchema = z.object({
  companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
  branchId: z.string().uuid('El id de sucursal debe ser un UUID válido'),
  name: z.string().min(1, 'El nombre de la caja es obligatorio'),
  registerType: z.enum(['administrative', 'pos']).default('pos'),
});
export type CrearCajaInput = z.infer<typeof crearCajaSchema>;

export const abrirCajaSchema = z.object({
  registerId: z.string().uuid('El id de caja debe ser un UUID válido'),
  openingAmount: z.number().nonnegative('El monto de apertura no puede ser negativo'),
});
export type AbrirCajaInput = z.infer<typeof abrirCajaSchema>;

export const cerrarCajaSchema = z.object({
  openingId: z.string().uuid('El id de apertura debe ser un UUID válido'),
  countedAmount: z.number().nonnegative('El monto contado no puede ser negativo'),
});
export type CerrarCajaInput = z.infer<typeof cerrarCajaSchema>;
