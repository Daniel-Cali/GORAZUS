import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING, withTenantScope } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  journal_entries,
  journal_entry_lines,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  AsientoRepository,
  type CrearAsientoParams,
  type AsientoConLineas,
  type OrdenAsiento,
} from './asiento.repository';

export class AsientoNoEncontradoParaActualizarError extends Error {}

@Injectable()
export class AsientoRepositoryPrisma extends AsientoRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) private readonly client: AccountingPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: CrearAsientoParams): Promise<AsientoConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const asiento = await tx.journal_entries.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId ?? null,
          fiscal_period_id: params.fiscalPeriodId,
          status_id: params.statusId,
          document_number: params.documentNumber,
          source_module: params.sourceModule ?? null,
          source_entity_id: params.sourceEntityId ?? null,
          ...(params.postingDate ? { posting_date: params.postingDate } : {}),
          description: params.description ?? null,
        },
      });
      await tx.journal_entry_lines.createMany({
        data: params.lines.map((line) => ({
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId ?? null,
          journal_entry_id: asiento.id,
          account_id: line.accountId,
          cost_center_id: line.costCenterId ?? null,
          profit_center_id: line.profitCenterId ?? null,
          debit_amount: line.debitAmount,
          credit_amount: line.creditAmount,
        })),
      });
      const journal_entry_lines = await tx.journal_entry_lines.findMany({
        where: { journal_entry_id: asiento.id, deleted_at: null },
      });
      return { ...asiento, journal_entry_lines };
    });
  }

  async obtener(context: UserContext, id: string): Promise<AsientoConLineas | null> {
    return withTenantScope(this.client, context, async (tx) => {
      const asiento = await tx.journal_entries.findFirst({ where: { id, deleted_at: null } });
      if (!asiento) return null;
      const journal_entry_lines = await tx.journal_entry_lines.findMany({
        where: { journal_entry_id: id, deleted_at: null },
      });
      return { ...asiento, journal_entry_lines };
    });
  }

  async listar(
    context: UserContext,
    filter: AccountingPrisma.journal_entriesWhereInput,
    pagination: PaginationParams,
    orden?: { campo: OrdenAsiento; direccion: 'asc' | 'desc' },
  ): Promise<PaginatedResult<journal_entries>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.journal_entries.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: orden ? { [orden.campo]: orden.direccion } : { posting_date: 'desc' },
        }),
        tx.journal_entries.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizarEstado(
    context: UserContext,
    id: string,
    statusId: string,
  ): Promise<journal_entries> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.journal_entries.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new AsientoNoEncontradoParaActualizarError(id);
      return tx.journal_entries.update({
        where: { id_posting_date: { id, posting_date: actual.posting_date } },
        data: { status_id: statusId },
      });
    });
  }

  /**
   * `journal_entry_lines` no tiene relación real de Prisma hacia
   * `journal_entries` (tabla particionada, mismo motivo que
   * `invoice_lines`/`invoices`) — join manual vía `$queryRaw`
   * parametrizado, mismo patrón que `CuentaPorCobrarRepository`.
   */
  async listarLineasPorCuenta(
    context: UserContext,
    params: {
      accountId: string;
      companyId: string;
      branchId?: string;
      desde?: Date;
      hasta?: Date;
      soloContabilizados: boolean;
    },
  ): Promise<Array<journal_entry_lines & { posting_date: Date; document_number: string }>> {
    return withTenantScope(
      this.client,
      context,
      (tx) =>
        tx.$queryRaw<Array<journal_entry_lines & { posting_date: Date; document_number: string }>>`
        SELECT jel.*, je.posting_date, je.document_number
        FROM accounting.journal_entry_lines jel
        JOIN accounting.journal_entries je ON je.id = jel.journal_entry_id
        JOIN accounting.journal_entry_status jes ON jes.id = je.status_id
        WHERE jel.account_id = ${params.accountId}::uuid
          AND je.company_id = ${params.companyId}::uuid
          AND jel.deleted_at IS NULL AND je.deleted_at IS NULL
          AND (${params.branchId ?? null}::uuid IS NULL OR je.branch_id = ${params.branchId ?? null}::uuid)
          AND (${params.desde ?? null}::date IS NULL OR je.posting_date >= ${params.desde ?? null}::date)
          AND (${params.hasta ?? null}::date IS NULL OR je.posting_date <= ${params.hasta ?? null}::date)
          AND (${params.soloContabilizados} = false OR jes.code IN ('posted', 'reversed'))
        ORDER BY je.posting_date ASC
      `,
    );
  }
}
