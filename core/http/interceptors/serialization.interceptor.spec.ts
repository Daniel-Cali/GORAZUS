import { of } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { SerializationInterceptor } from './serialization.interceptor';

/** Objeto con forma de `Prisma.Decimal` (decimal.js): propiedades internas propias (`s`/`e`/`d`) + `toJSON`. */
class FakeDecimal {
  constructor(
    private readonly s: number,
    private readonly e: number,
    private readonly d: number[],
  ) {}
  toJSON(): string {
    return `${this.s < 0 ? '-' : ''}${this.d.join('')}`;
  }
}

describe('SerializationInterceptor', () => {
  const interceptor = new SerializationInterceptor();

  function run(value: unknown): Promise<unknown> {
    const handler: CallHandler = { handle: () => of(value) };
    return new Promise((resolve) => {
      interceptor.intercept({} as ExecutionContext, handler).subscribe((result) => resolve(result));
    });
  }

  it('convierte bigint a string', async () => {
    expect(await run({ local_id: 42n })).toEqual({ local_id: '42' });
  });

  it('conserva un objeto con toJSON propio (ej. Prisma.Decimal) sin destructurarlo', async () => {
    const decimal = new FakeDecimal(1, 1, [19]);
    const result = (await run({ rate_percentage: decimal })) as { rate_percentage: FakeDecimal };
    expect(JSON.stringify(result)).toBe('{"rate_percentage":"19"}');
  });

  it('conserva instancias de Date', async () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const result = (await run({ effective_from: date })) as { effective_from: Date };
    expect(result.effective_from).toBe(date);
  });

  it('recorre objetos planos anidados y arrays', async () => {
    expect(await run({ items: [{ local_id: 1n }, { local_id: 2n }] })).toEqual({
      items: [{ local_id: '1' }, { local_id: '2' }],
    });
  });
});
