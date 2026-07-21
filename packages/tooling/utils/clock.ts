/**
 * Ver docs/architecture/32-core-platform/10-utilidades-comunes.md §1.
 * Envuelve `new Date()`/`Date.now()` detrás de una interfaz para que
 * el código de negocio (cuando exista) dependa de `Clock`, no del
 * reloj global del sistema — permite fijar el tiempo en tests
 * (`FixedClock`) sin mockear `Date` globalmente.
 */
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Uso exclusivo en tests — nunca en código de producción. */
export class FixedClock implements Clock {
  constructor(private readonly fixedAt: Date) {}

  now(): Date {
    return this.fixedAt;
  }
}
