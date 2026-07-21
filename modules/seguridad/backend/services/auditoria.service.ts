import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { audit_logs } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
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

  /** Historial de cambios de una fila puntual — usado por `UsuariosController` ("Historial" de un usuario), reutilizable por cualquier otro módulo que necesite lo mismo para su propia entidad. */
  async historialDeFila(
    context: UserContext,
    tableName: string,
    rowId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<audit_logs>> {
    return this.auditoriaRepository.listar(
      context,
      { table_name: tableName, row_id: rowId },
      pagination,
    );
  }
}
