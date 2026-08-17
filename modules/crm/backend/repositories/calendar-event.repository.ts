import type {
  CrmPrisma,
  PaginatedResult,
  PaginationParams,
  calendar_events,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';

export interface CrearCalendarEventParams {
  companyId: string;
  branchId: string | null;
  ownerUserId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  leadId: string | null;
  opportunityId: string | null;
}

export interface AgregarAsistenteParams {
  userId: string | null;
  externalEmail: string | null;
}

/** Adaptador sobre `crm.calendar_events` + `crm.calendar_event_attendees`. */
export abstract class CalendarEventRepository {
  abstract crear(context: UserContext, params: CrearCalendarEventParams): Promise<calendar_events>;

  abstract findById(context: UserContext, id: string): Promise<calendar_events | null>;

  abstract findMany(
    context: UserContext,
    filter: CrmPrisma.calendar_eventsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<calendar_events>>;

  abstract agregarAsistente(
    context: UserContext,
    eventId: string,
    params: AgregarAsistenteParams,
  ): Promise<void>;
}
