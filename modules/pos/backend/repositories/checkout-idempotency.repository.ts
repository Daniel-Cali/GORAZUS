import type { UserContext } from '@gorazus/contracts';
import type { pos_checkout_idempotency_keys } from '@gorazus/core-database';

/** `ganador: true` cuando esta llamada reservó la clave recién (debe continuar el checkout). `ganador: false` cuando la clave ya existía — trae la fila para que el llamador decida (replay / conflicto / en proceso). */
export type ReservaIdempotencia =
  { ganador: true; id: string } | { ganador: false; fila: pos_checkout_idempotency_keys };

/**
 * Puerto — ledger de idempotencia de `POST /pos/ventas` (P0-1). NO es un
 * repositorio de facturas/ventas: su única responsabilidad es la reserva
 * atómica de `idempotencyKey` y el registro del resultado final. Guarda
 * solo `invoice_id` + `cambio` — NUNCA una copia de la factura (evitaría
 * duplicar `sales.invoices` en otra forma, además de poder quedar
 * desactualizada). Un replay vuelve a pedir la factura real vía
 * `VentasService.obtener`. Mismo criterio de capa que
 * `ProductoLookupRepository` en este mismo módulo.
 */
export abstract class CheckoutIdempotencyRepository {
  abstract intentarReservar(
    context: UserContext,
    idempotencyKey: string,
    payloadFingerprint: string,
  ): Promise<ReservaIdempotencia>;

  abstract marcarExito(
    context: UserContext,
    id: string,
    invoiceId: string,
    cambio: number,
  ): Promise<void>;

  abstract marcarFallo(
    context: UserContext,
    id: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void>;
}
