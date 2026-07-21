import { z } from 'zod';
import { OPERACIONES_AUDITORIA } from '../entities/registro-auditoria.entity';

export const filtroAuditoriaSchema = z.object({
  tableName: z.string().min(1).optional(),
  operation: z.enum(OPERACIONES_AUDITORIA).optional(),
  actorUserId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type FiltroAuditoriaInput = z.infer<typeof filtroAuditoriaSchema>;
