import type { UserContext } from '@gorazus/contracts';
import type { calendar_events } from '@gorazus/core-database';
import { CalendarEventRepository } from '../repositories/calendar-event.repository';
import { AgendaService, EventoNoEncontradoException } from './agenda.service';
import type { CrearCalendarEventInput } from '../validators/calendar-events.schema';

const CONTEXT: UserContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

function buildEvent(overrides: Partial<calendar_events> = {}): calendar_events {
  return {
    id: 'evt-1',
    company_id: 'company-1',
    branch_id: null,
    owner_user_id: 'user-1',
    title: 'Reunión',
    ...overrides,
  } as calendar_events;
}

describe('AgendaService', () => {
  let eventoExistente: calendar_events | null;
  let calendarEventRepository: CalendarEventRepository;

  beforeEach(() => {
    eventoExistente = buildEvent();
    calendarEventRepository = {
      crear: jest.fn(async () => buildEvent()),
      findById: jest.fn(async () => eventoExistente),
      findMany: jest.fn(async () => ({
        data: eventoExistente ? [eventoExistente] : [],
        meta: { page: 1, pageSize: 20, total: eventoExistente ? 1 : 0 },
      })),
      agregarAsistente: jest.fn(async () => undefined),
    } as unknown as CalendarEventRepository;
  });

  function buildService(): AgendaService {
    return new AgendaService(calendarEventRepository);
  }

  function baseInput(overrides: Partial<CrearCalendarEventInput> = {}): CrearCalendarEventInput {
    return {
      companyId: 'company-1',
      ownerUserId: 'user-1',
      title: 'Reunión',
      startsAt: new Date('2026-01-01T10:00:00'),
      endsAt: new Date('2026-01-01T11:00:00'),
      ...overrides,
    };
  }

  it('crear: caso feliz', async () => {
    const evento = await buildService().crear(CONTEXT, baseInput());
    expect(evento.title).toBe('Reunión');
  });

  it('obtener: evento inexistente lanza EventoNoEncontradoException', async () => {
    eventoExistente = null;
    await expect(buildService().obtener(CONTEXT, 'evt-x')).rejects.toThrow(
      EventoNoEncontradoException,
    );
  });

  it('agregarAsistente: caso feliz interno', async () => {
    await buildService().agregarAsistente(CONTEXT, 'evt-1', { userId: 'user-2' });
    expect(calendarEventRepository.agregarAsistente).toHaveBeenCalledWith(CONTEXT, 'evt-1', {
      userId: 'user-2',
      externalEmail: null,
    });
  });

  it('agregarAsistente: caso feliz externo', async () => {
    await buildService().agregarAsistente(CONTEXT, 'evt-1', { externalEmail: 'a@b.com' });
    expect(calendarEventRepository.agregarAsistente).toHaveBeenCalledWith(CONTEXT, 'evt-1', {
      userId: null,
      externalEmail: 'a@b.com',
    });
  });
});
