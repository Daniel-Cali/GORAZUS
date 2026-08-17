import { z } from 'zod';

export const crearCampaignSchema = z
  .object({
    companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
    branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
    name: z.string().min(1, 'El nombre de la campaña es obligatorio'),
    startsOn: z.coerce.date().optional(),
    endsOn: z.coerce.date().optional(),
    budgetAmount: z.number().min(0).optional(),
  })
  .refine((data) => !data.startsOn || !data.endsOn || data.endsOn >= data.startsOn, {
    message: 'La fecha de fin no puede ser anterior a la de inicio',
    path: ['endsOn'],
  });
export type CrearCampaignInput = z.infer<typeof crearCampaignSchema>;

export const agregarMiembroCampaignSchema = z.object({
  leadId: z.string().uuid('El id de lead debe ser un UUID válido'),
});
export type AgregarMiembroCampaignInput = z.infer<typeof agregarMiembroCampaignSchema>;
