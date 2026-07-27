import { z } from 'zod';

export const crearAnioFiscalSchema = z
  .object({
    companyId: z.string().uuid('El id de empresa debe ser un UUID válido'),
    branchId: z.string().uuid('El id de sucursal debe ser un UUID válido').optional(),
    yearLabel: z.string().min(1, 'La etiqueta del año no puede estar vacía').max(20),
    startsOn: z.coerce.date(),
    endsOn: z.coerce.date(),
  })
  .refine((data) => data.endsOn > data.startsOn, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endsOn'],
  });
export type CrearAnioFiscalInput = z.input<typeof crearAnioFiscalSchema>;
