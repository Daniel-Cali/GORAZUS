import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { stock_adjustment_reasons } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { MotivoAjusteRepository } from '../repositories/motivo-ajuste.repository';
import { MotivoAjuste } from '../entities/motivo-ajuste.entity';
import type {
  CrearMotivoAjusteInput,
  ActualizarMotivoAjusteInput,
} from '../validators/motivos-ajuste.schema';

export class MotivoAjusteNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('MOTIVO_AJUSTE_NO_ENCONTRADO', `No existe el motivo de ajuste "${id}".`, 404);
  }
}

/** Catálogo de motivos de ajuste (`inventory.stock_adjustment_reasons`) — sin `eliminar`, un motivo referenciado por ajustes históricos no puede desaparecer. */
@Injectable()
export class MotivosAjusteService {
  constructor(private readonly motivoAjusteRepository: MotivoAjusteRepository) {}

  async crear(
    context: UserContext,
    input: CrearMotivoAjusteInput,
  ): Promise<stock_adjustment_reasons> {
    new MotivoAjuste('pendiente', input.name); // valida invariantes antes de tocar la base
    return this.motivoAjusteRepository.create(context, {
      tenant_id: context.tenantId,
      name: input.name,
    });
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<stock_adjustment_reasons>> {
    return this.motivoAjusteRepository.findMany(context, {}, pagination);
  }

  async obtener(context: UserContext, id: string): Promise<stock_adjustment_reasons> {
    const motivo = await this.motivoAjusteRepository.findById(context, { id });
    if (!motivo) throw new MotivoAjusteNoEncontradoException(id);
    return motivo;
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarMotivoAjusteInput,
  ): Promise<stock_adjustment_reasons> {
    await this.obtener(context, id);
    if (input.name !== undefined) {
      new MotivoAjuste('pendiente', input.name); // valida invariantes antes de tocar la base
    }
    return this.motivoAjusteRepository.update(
      context,
      { id },
      { ...(input.name !== undefined && { name: input.name }) },
    );
  }
}
