import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import type { payment_forms } from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import { FormaPagoRepository } from '../repositories/forma-pago.repository';

/** Catálogo de formas de pago (`configuration.payment_forms`, ya sembrado) — de solo lectura desde POS/Ventas, mismo criterio que `MonedasService`. */
@Injectable()
export class FormasPagoService {
  constructor(private readonly formaPagoRepository: FormaPagoRepository) {}

  async listar(
    context: UserContext,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<payment_forms>> {
    return this.formaPagoRepository.findMany(context, {}, pagination);
  }
}
