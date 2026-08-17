import { CalendarEvent, CalendarEventAttendee } from './calendar-event.entity';

describe('CalendarEvent', () => {
  it('rechaza un título vacío', () => {
    expect(
      () =>
        new CalendarEvent(
          'e1',
          'c1',
          null,
          'u1',
          '  ',
          new Date('2026-01-01T10:00:00'),
          new Date('2026-01-01T11:00:00'),
        ),
    ).toThrow('título del evento no puede estar vacío');
  });

  it('rechaza fin anterior o igual al inicio', () => {
    expect(
      () =>
        new CalendarEvent(
          'e1',
          'c1',
          null,
          'u1',
          'Reunión',
          new Date('2026-01-01T10:00:00'),
          new Date('2026-01-01T10:00:00'),
        ),
    ).toThrow('debe ser posterior a la de inicio');
  });

  it('caso feliz', () => {
    const evento = new CalendarEvent(
      'e1',
      'c1',
      null,
      'u1',
      'Reunión',
      new Date('2026-01-01T10:00:00'),
      new Date('2026-01-01T11:00:00'),
    );
    expect(evento.title).toBe('Reunión');
  });
});

describe('CalendarEventAttendee', () => {
  it('rechaza un asistente sin userId ni externalEmail', () => {
    expect(() => new CalendarEventAttendee('a1', 'e1', null, null)).toThrow(
      'interno (userId) o externo (externalEmail)',
    );
  });

  it('rechaza un asistente con ambos userId y externalEmail', () => {
    expect(() => new CalendarEventAttendee('a1', 'e1', 'u1', 'a@b.com')).toThrow(
      'interno (userId) o externo (externalEmail)',
    );
  });

  it('acepta un asistente interno', () => {
    const asistente = new CalendarEventAttendee('a1', 'e1', 'u1', null);
    expect(asistente.userId).toBe('u1');
  });

  it('acepta un asistente externo', () => {
    const asistente = new CalendarEventAttendee('a1', 'e1', null, 'a@b.com');
    expect(asistente.externalEmail).toBe('a@b.com');
  });
});
