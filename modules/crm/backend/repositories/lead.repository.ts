import type { UserContext } from '@gorazus/contracts';
import { BaseRepository } from '@gorazus/core-database';
import type { CrmPrisma, CrmPrismaClient, leads } from '@gorazus/core-database';

/** Adaptador sobre `crm.leads`. */
export abstract class LeadRepository extends BaseRepository<
  CrmPrisma.leadsWhereUniqueInput,
  CrmPrisma.leadsWhereInput,
  CrmPrisma.leadsUncheckedCreateInput,
  CrmPrisma.leadsUncheckedUpdateInput,
  leads,
  CrmPrismaClient
> {
  /**
   * Cambia el estado del lead y registra el cambio en
   * `crm.lead_status_history` — una sola transacción, nunca dos
   * escrituras independientes (docs/architecture/02 §3, "toda
   * transacción se abre/cierra en services/", acá se delega en el
   * repositorio porque ambas tablas son del mismo agregado).
   */
  abstract cambiarEstado(
    context: UserContext,
    leadId: string,
    nuevoStatusId: string,
  ): Promise<leads>;
}
