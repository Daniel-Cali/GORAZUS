import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_SALES, withTenantScope } from '@gorazus/core-database';
import type { SalesPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  CheckoutIdempotencyRepository,
  type ReservaIdempotencia,
} from './checkout-idempotency.repository';

function esViolacionDeUnicidad(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

@Injectable()
export class CheckoutIdempotencyRepositoryPrisma extends CheckoutIdempotencyRepository {
  constructor(@Inject(PRISMA_SALES) private readonly client: SalesPrismaClient) {
    super();
  }

  /**
   * La reserva real es el `INSERT` — el índice único
   * `(tenant_id, idempotency_key)` (`48_pos_checkout_idempotency_keys.sql`)
   * serializa dos intentos concurrentes con la misma clave: uno gana, el
   * otro recibe `P2002` acá y recupera la fila ya reservada por el ganador.
   *
   * BUG REAL corregido tras probar contra Postgres real (no una suposición
   * de diseño): `create()` y el `findFirst()` de recuperación NO pueden
   * vivir en la MISMA transacción — Postgres aborta la transacción entera
   * en cuanto `create()` falla por `unique_violation`, y cualquier
   * statement siguiente en esa misma transacción (incluido el `findFirst`
   * de recuperación) falla a su vez con `25P02 current transaction is
   * aborted...`, en vez de recuperar. Reproducido real con dos requests
   * secuenciales a `POST /pos/ventas` con la misma `idempotencyKey`. Por
   * eso acá son DOS llamadas a `withTenantScope` separadas (dos
   * transacciones distintas), no una — la primera puede abortar sin
   * afectar a la segunda.
   */
  async intentarReservar(
    context: UserContext,
    idempotencyKey: string,
    payloadFingerprint: string,
  ): Promise<ReservaIdempotencia> {
    try {
      const fila = await withTenantScope(this.client, context, (tx) =>
        tx.pos_checkout_idempotency_keys.create({
          data: {
            tenant_id: context.tenantId,
            idempotency_key: idempotencyKey,
            payload_fingerprint: payloadFingerprint,
            status: 'processing',
          },
        }),
      );
      return { ganador: true, id: fila.id };
    } catch (error) {
      if (!esViolacionDeUnicidad(error)) throw error;
      const existente = await withTenantScope(this.client, context, (tx) =>
        tx.pos_checkout_idempotency_keys.findFirst({
          where: { tenant_id: context.tenantId, idempotency_key: idempotencyKey },
        }),
      );
      if (!existente) throw error;
      return { ganador: false, fila: existente };
    }
  }

  async marcarExito(
    context: UserContext,
    id: string,
    invoiceId: string,
    cambio: number,
  ): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.pos_checkout_idempotency_keys.update({
        where: { id },
        data: { status: 'succeeded', invoice_id: invoiceId, result: { cambio } },
      }),
    );
  }

  async marcarFallo(
    context: UserContext,
    id: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await withTenantScope(this.client, context, (tx) =>
      tx.pos_checkout_idempotency_keys.update({
        where: { id },
        data: { status: 'failed', error_code: errorCode, error_message: errorMessage },
      }),
    );
  }
}
