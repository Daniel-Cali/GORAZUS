import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { audit_logs } from '@gorazus/core-database';
import type { PaginatedResult } from '@gorazus/core-database';
import { AuditoriaRepository } from '../repositories/auditoria.repository';
import type { FiltroAuditoriaInput } from '../validators/auditoria.schema';

/** Lectura de `core.audit_logs` — sin escritura desde la aplicación, ver `repositories/auditoria.repository.ts`. */
@Injectable()
export class AuditoriaService {
  constructor(private readonly auditoriaRepository: AuditoriaRepository) {}

  async listar(
    context: UserContext,
    filtro: FiltroAuditoriaInput,
  ): Promise<PaginatedResult<audit_logs>> {
    return this.auditoriaRepository.listar(
      context,
      {
        table_name: filtro.tableName,
        operation: filtro.operation,
        actor_user_id: filtro.actorUserId,
      },
      { page: filtro.page, pageSize: filtro.pageSize },
    );
  }
}
