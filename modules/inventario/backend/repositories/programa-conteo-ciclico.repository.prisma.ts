import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_INVENTORY } from '@gorazus/core-database';
import type { InventoryPrismaClient } from '@gorazus/core-database';
import { ProgramaConteoCiclicoRepository } from './programa-conteo-ciclico.repository';

@Injectable()
export class ProgramaConteoCiclicoRepositoryPrisma extends ProgramaConteoCiclicoRepository {
  constructor(@Inject(PRISMA_INVENTORY) client: InventoryPrismaClient) {
    super(client, (tx) => ({
      findUnique: (args) => tx.cycle_count_schedules.findUnique(args),
      findMany: (args) => tx.cycle_count_schedules.findMany(args),
      count: (args) => tx.cycle_count_schedules.count(args),
      create: (args) => tx.cycle_count_schedules.create(args),
      update: (args) => tx.cycle_count_schedules.update(args),
    }));
  }
}
