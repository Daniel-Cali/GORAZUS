import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CRM, withTenantScope } from '@gorazus/core-database';
import type {
  CrmPrisma,
  CrmPrismaClient,
  PaginatedResult,
  PaginationParams,
  calendar_events,
} from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  CalendarEventRepository,
  type CrearCalendarEventParams,
  type AgregarAsistenteParams,
} from './calendar-event.repository';

@Injectable()
export class CalendarEventRepositoryPrisma extends CalendarEventRepository {
  constructor(@Inject(PRISMA_CRM) private readonly client: CrmPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearCalendarEventParams): Promise<calendar_events> {
    return withTenantScope(this.client, context, (tx) =>
      tx.calendar_events.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId,
          owner_user_id: params.ownerUserId,
          title: params.title,
          starts_at: params.startsAt,
          ends_at: params.endsAt,
          lead_id: params.leadId,
          opportunity_id: params.opportunityId,
        },
      }),
    );
  }

  async findById(context: UserContext, id: string): Promise<calendar_events | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.calendar_events.findUnique({ where: { id } }),
    );
  }

  async findMany(
    context: UserContext,
    filter: CrmPrisma.calendar_eventsWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<calendar_events>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.calendar_events.findMany({ where, skip: (page - 1) * pageSize, take: pageSize }),
        tx.calendar_events.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async agregarAsistente(
    context: UserContext,
    eventId: string,
    params: AgregarAsistenteParams,
  ): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.calendar_event_attendees.create({
        data: {
          tenant_id: context.tenantId,
          event_id: eventId,
          user_id: params.userId,
          external_email: params.externalEmail,
        },
      }),
    );
  }
}
