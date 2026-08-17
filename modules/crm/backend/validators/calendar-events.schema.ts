import { z } from 'zod';

export const crearCalendarEventSchema = z
  .object({
    companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
    branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
    ownerUserId: z.string().uuid('El id de usuario dueño del evento debe ser un UUID válido'),
    title: z.string().min(1, 'El título del evento es obligatorio'),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    leadId: z.string().uuid('El id de lead debe ser un UUID válido').optional(),
    opportunityId: z.string().uuid('El id de oportunidad debe ser un UUID válido').optional(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'La fecha de fin debe ser posterior a la de inicio',
    path: ['endsAt'],
  });
export type CrearCalendarEventInput = z.infer<typeof crearCalendarEventSchema>;

export const agregarAsistenteSchema = z
  .object({
    userId: z.string().uuid('El id de usuario debe ser un UUID válido').optional(),
    externalEmail: z.string().email('El email externo no es válido').optional(),
  })
  .refine((data) => Boolean(data.userId) !== Boolean(data.externalEmail), {
    message:
      'El asistente debe ser interno (userId) o externo (externalEmail), nunca ambos ni ninguno',
    path: ['userId'],
  });
export type AgregarAsistenteInput = z.infer<typeof agregarAsistenteSchema>;
