import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { calendar_events } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { DomainException } from '@gorazus/core-http';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { CalendarEvent } from '../entities/calendar-event.entity';
import type {
  CrearCalendarEventInput,
  AgregarAsistenteInput,
} from '../validators/calendar-events.schema';

export class EventoNoEncontradoException extends DomainException {
  constructor(id: string) {
    super('EVENTO_NO_ENCONTRADO', `No existe el evento de agenda "${id}".`, 404);
  }
}

/**
 * Agenda/Calendario (`CRM_ARCHITECTURE.md §4`) — `crm.calendar_events` ya
 * consolida ambos conceptos en una sola tabla, no hay tabla `agenda`
 * separada (`27-modulo-crm.md §4`).
 */
@Injectable()
export class AgendaService {
  constructor(private readonly calendarEventRepository: CalendarEventRepository) {}

  async crear(context: UserContext, input: CrearCalendarEventInput): Promise<calendar_events> {
    new CalendarEvent(
      'pendiente',
      input.companyId,
      input.branchId ?? null,
      input.ownerUserId,
      input.title,
      input.startsAt,
      input.endsAt,
      input.leadId ?? null,
      input.opportunityId ?? null,
    ); // valida invariantes antes de tocar la base

    return this.calendarEventRepository.crear(context, {
      companyId: input.companyId,
      branchId: input.branchId ?? null,
      ownerUserId: input.ownerUserId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      leadId: input.leadId ?? null,
      opportunityId: input.opportunityId ?? null,
    });
  }

  async listar(
    context: UserContext,
    companyId: string | undefined,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<calendar_events>> {
    return this.calendarEventRepository.findMany(
      context,
      { ...(companyId && { company_id: companyId }) },
      pagination,
    );
  }

  async obtener(context: UserContext, id: string): Promise<calendar_events> {
    const evento = await this.calendarEventRepository.findById(context, id);
    if (!evento) throw new EventoNoEncontradoException(id);
    return evento;
  }

  async agregarAsistente(
    context: UserContext,
    eventId: string,
    input: AgregarAsistenteInput,
  ): Promise<void> {
    await this.obtener(context, eventId);
    await this.calendarEventRepository.agregarAsistente(context, eventId, {
      userId: input.userId ?? null,
      externalEmail: input.externalEmail ?? null,
    });
  }
}
