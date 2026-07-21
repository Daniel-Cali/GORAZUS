import { z } from 'zod';
import { TIPOS_DATO_PARAMETRO } from '../entities/parametro.entity';

export const crearParametroSchema = z.object({
  key: z.string().min(1, 'La clave del parámetro es obligatoria'),
  dataType: z.enum(TIPOS_DATO_PARAMETRO),
  defaultValue: z.string().optional(),
});
export type CrearParametroInput = z.infer<typeof crearParametroSchema>;
