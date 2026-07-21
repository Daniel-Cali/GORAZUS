import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { sessions } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { SesionRepository } from '../repositories/sesion.repository';
import { Sesion } from '../entities/sesion.entity';

export class SesionNoEncontradaException extends DomainException {
  constructor(id: string) {
    super('SESION_NO_ENCONTRADA', `No existe la sesión "${id}".`, 404);
  }
}

export class SesionYaRevocadaException extends DomainException {
  constructor(id: string) {
    super('SESION_YA_REVOCADA', `La sesión "${id}" ya fue revocada.`, 409);
  }
}

/** Gestión administrativa de sesiones (`core.sessions`) — listar por usuario, revocar una específica (docs/architecture/15-modulo-security.md). */
@Injectable()
export class SesionesService {
  constructor(private readonly sesionRepository: SesionRepository) {}

  async listarPorUsuario(
    context: UserContext,
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<sessions>> {
    return this.sesionRepository.listarPorUsuario(context, userId, pagination);
  }

  async revocar(context: UserContext, id: string): Promise<sessions> {
    const sesionRaw = await this.sesionRepository.findById(context, { id });
    if (!sesionRaw) throw new SesionNoEncontradaException(id);

    const sesion = new Sesion(sesionRaw.id, sesionRaw.user_id, sesionRaw.revoked_at);
    try {
      sesion.verificarPuedeRevocarse();
    } catch {
      throw new SesionYaRevocadaException(id);
    }

    return this.sesionRepository.update(context, { id }, { revoked_at: new Date() });
  }
}
