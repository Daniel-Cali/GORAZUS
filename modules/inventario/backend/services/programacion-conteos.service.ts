import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { cycle_count_schedules } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { ProgramaConteoCiclicoRepository } from '../repositories/programa-conteo-ciclico.repository';
import { ZonaAlmacenRepository } from '../repositories/zona-almacen.repository';
import { ConteosService } from './conteos.service';
import { ProgramaConteoCiclico } from '../entities/programa-conteo-ciclico.entity';
import type { ConteoConLineas } from '../repositories/conteo-fisico.repository';
import type {
  CrearProgramaConteoInput,
  ActualizarProgramaConteoInput,
} from '../validators/programacion-conteos.schema';

export class ProgramaConteoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('PROGRAMA_CONTEO_NO_ENCONTRADO', `No existe la programación de conteo "${id}".`, 404);
  }
}

export class ZonaProgramaInvalidaException extends DomainException {
  constructor(zoneId: string) {
    super('ZONA_INVALIDA', `No existe la zona "${zoneId}".`, 400);
  }
}

/**
 * Programación de conteos cíclicos (`inventory.cycle_count_schedules`)
 * — un calendario recurrente por zona (`INVENTORY_CYCLE_COUNT.md §2`).
 * `generar` crea un `physical_count` real para el almacén dueño de la
 * zona, con líneas autogeneradas filtradas a esa zona
 * (`ConteosService.crear` con `zoneId`), y avanza `next_run_date` en
 * `frequency_days` — no ejecuta nada solo, hay que llamarlo (no hay
 * scheduler de background en este proyecto, `TECHNICAL_DEBT.md`
 * — `core/scheduler` sin consumidores).
 */
@Injectable()
export class ProgramacionConteosService {
  constructor(
    private readonly programaRepository: ProgramaConteoCiclicoRepository,
    private readonly zonaAlmacenRepository: ZonaAlmacenRepository,
    private readonly conteosService: ConteosService,
  ) {}

  async crear(
    context: UserContext,
    input: CrearProgramaConteoInput,
  ): Promise<cycle_count_schedules> {
    new ProgramaConteoCiclico('pendiente', input.zoneId, input.frequencyDays); // valida invariantes antes de tocar la base

    const zona = await this.zonaAlmacenRepository.findById(context, { id: input.zoneId });
    if (!zona) throw new ZonaProgramaInvalidaException(input.zoneId);

    return this.programaRepository.create(context, {
      tenant_id: context.tenantId,
      zone_id: input.zoneId,
      frequency_days: input.frequencyDays,
      next_run_date: input.nextRunDate ?? null,
    });
  }

  async obtener(context: UserContext, id: string): Promise<cycle_count_schedules> {
    const programa = await this.programaRepository.findById(context, { id });
    if (!programa) throw new ProgramaConteoNoEncontradoException(id);
    return programa;
  }

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<cycle_count_schedules>> {
    return this.programaRepository.findMany(context, {}, pagination);
  }

  async actualizar(
    context: UserContext,
    id: string,
    input: ActualizarProgramaConteoInput,
  ): Promise<cycle_count_schedules> {
    const actual = await this.obtener(context, id);
    if (input.frequencyDays !== undefined) {
      new ProgramaConteoCiclico('pendiente', actual.zone_id, input.frequencyDays); // valida invariantes antes de tocar la base
    }
    return this.programaRepository.update(
      context,
      { id },
      {
        ...(input.frequencyDays !== undefined && { frequency_days: input.frequencyDays }),
        ...(input.nextRunDate !== undefined && { next_run_date: input.nextRunDate }),
      },
    );
  }

  /** Genera un conteo físico real desde la programación y avanza `next_run_date`. */
  async generar(
    context: UserContext,
    id: string,
  ): Promise<{ conteo: ConteoConLineas; programa: cycle_count_schedules }> {
    const programa = await this.obtener(context, id);
    const zona = await this.zonaAlmacenRepository.findById(context, { id: programa.zone_id });
    if (!zona) throw new ZonaProgramaInvalidaException(programa.zone_id);

    const hoy = new Date();
    const conteo = await this.conteosService.crear(context, {
      warehouseId: zona.warehouse_id,
      scheduledDate: hoy,
      zoneId: programa.zone_id,
    });

    const base = programa.next_run_date ?? hoy;
    const proximaFecha = new Date(base);
    proximaFecha.setDate(proximaFecha.getDate() + programa.frequency_days);

    const programaActualizado = await this.programaRepository.update(
      context,
      { id },
      { next_run_date: proximaFecha },
    );

    return { conteo, programa: programaActualizado };
  }
}
