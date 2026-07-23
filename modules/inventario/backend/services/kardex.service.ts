import { Injectable } from '@nestjs/common';
import type { UserContext } from '@gorazus/contracts';
import { KardexRepository, type KardexEntry } from '../repositories/kardex.repository';

@Injectable()
export class KardexService {
  constructor(private readonly kardexRepository: KardexRepository) {}

  async consultar(
    context: UserContext,
    filtro: { productId: string; warehouseId: string; desde?: Date; hasta?: Date },
    pagination: { page: number; pageSize: number },
  ): Promise<KardexEntry[]> {
    return this.kardexRepository.consultar(context, filtro, pagination);
  }
}
