import { CheckoutIdempotencyRepositoryPrisma } from './checkout-idempotency.repository.prisma';

const CONTEXT = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  companyId: 'company-1',
  branchId: 'branch-1',
  sessionId: 'session-1',
};

/**
 * Regresión real (P0-1, validación contra Postgres) — `intentarReservar`
 * llamaba `create()` y, en el catch, `findFirst()` dentro de la MISMA
 * transacción Prisma. Contra Postgres real eso falla con `25P02 current
 * transaction is aborted...`: una vez que `create()` revienta por
 * `unique_violation`, la transacción entera queda abortada y CUALQUIER
 * statement siguiente en esa misma transacción también falla — incluido
 * el `findFirst` de recuperación. Este fake modela esa semántica real
 * (una transacción que ya tiró un error queda "envenenada" para el resto
 * de su propio callback) para que este test falle con el código viejo y
 * pase con el fix (dos `withTenantScope`/`$transaction` separados).
 */
function buildFakeSalesClient(existente: Record<string, unknown> | null) {
  let reservado = false;
  const fakeClient = {
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      let transaccionEnvenenada = false;
      const tx = {
        $executeRawUnsafe: jest.fn(async () => {
          if (transaccionEnvenenada) {
            throw { code: '25P02', message: 'current transaction is aborted' };
          }
        }),
        pos_checkout_idempotency_keys: {
          create: jest.fn(async () => {
            if (reservado) {
              transaccionEnvenenada = true;
              throw { code: 'P2002' };
            }
            reservado = true;
            return { id: 'idem-1' };
          }),
          findFirst: jest.fn(async () => {
            if (transaccionEnvenenada) {
              throw { code: '25P02', message: 'current transaction is aborted' };
            }
            return existente;
          }),
        },
      };
      return callback(tx);
    }),
  };
  return fakeClient;
}

describe('CheckoutIdempotencyRepositoryPrisma', () => {
  it('intentarReservar: cuando create() colisiona, recupera la fila existente en una transacción NUEVA (no la misma abortada)', async () => {
    const filaExistente = {
      id: 'idem-1',
      idempotency_key: 'k-1',
      payload_fingerprint: 'fp-1',
      status: 'succeeded',
    };
    const client = buildFakeSalesClient(filaExistente);
    const repo = new CheckoutIdempotencyRepositoryPrisma(client as never);

    // Primera reserva: gana.
    const primera = await repo.intentarReservar(CONTEXT, 'k-1', 'fp-1');
    expect(primera).toEqual({ ganador: true, id: 'idem-1' });

    // Segunda reserva, misma key: create() colisiona (P2002) — el fake
    // marca esa transacción como envenenada. Con el bug viejo (un solo
    // `withTenantScope` para ambas operaciones), el findFirst de
    // recuperación heredaría el envenenamiento y lanzaría 25P02. Con el
    // fix (dos `withTenantScope` separados), el findFirst corre en una
    // transacción nueva y limpia.
    const segunda = await repo.intentarReservar(CONTEXT, 'k-1', 'fp-1');
    expect(segunda).toEqual({ ganador: false, fila: filaExistente });

    // Dos transacciones separadas para el intento perdedor (create fallido
    // + findFirst de recuperación) — no una sola compartida.
    expect(client.$transaction).toHaveBeenCalledTimes(3); // 1ra reserva + (create fallido + findFirst) de la 2da
  });
});
