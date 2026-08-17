/**
 * Entidad de dominio pura — mismo criterio que `Lead`/`Opportunity`/
 * `Campaign`. `crm.calendar_events` ya consolida "Agenda y Calendario"
 * en una sola tabla (`docs/architecture/27-modulo-crm.md §4`).
 */
export class CalendarEvent {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly branchId: string | null,
    public readonly ownerUserId: string,
    public readonly title: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
    public readonly leadId: string | null = null,
    public readonly opportunityId: string | null = null,
  ) {
    if (title.trim().length === 0) {
      throw new Error('El título del evento no puede estar vacío');
    }
    if (endsAt <= startsAt) {
      throw new Error('La fecha de fin del evento debe ser posterior a la de inicio');
    }
  }
}

/**
 * Asistente interno (`userId`) o externo (`externalEmail`, sin cuenta en
 * el sistema) — nunca ambos ni ninguno, ver `27-modulo-crm.md §4`.
 */
export class CalendarEventAttendee {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly userId: string | null,
    public readonly externalEmail: string | null,
  ) {
    if (Boolean(userId) === Boolean(externalEmail)) {
      throw new Error(
        'El asistente debe ser interno (userId) o externo (externalEmail), nunca ambos ni ninguno',
      );
    }
  }
}
