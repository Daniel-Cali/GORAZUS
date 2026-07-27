import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_ACCOUNTING, withTenantScope } from '@gorazus/core-database';
import type {
  AccountingPrisma,
  AccountingPrismaClient,
  accounting_rules,
} from '@gorazus/core-database';
import type { PaginatedResult, PaginationParams } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import {
  ReglaContableRepository,
  type ReglaContableParams,
  type ReglaConLineas,
} from './regla-contable.repository';

export class ReglaContableNoEncontradaParaActualizarError extends Error {}

@Injectable()
export class ReglaContableRepositoryPrisma extends ReglaContableRepository {
  constructor(@Inject(PRISMA_ACCOUNTING) private readonly client: AccountingPrismaClient) {
    super();
  }

  async crear(context: UserContext, params: ReglaContableParams): Promise<ReglaConLineas> {
    return withTenantScope(this.client, context, (tx) =>
      tx.accounting_rules.create({
        data: {
          tenant_id: context.tenantId,
          company_id: params.companyId,
          branch_id: params.branchId ?? null,
          event_code: params.eventCode,
          accounting_rule_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId ?? null,
              account_id: line.accountId,
              entry_side: line.entrySide,
              amount_formula: line.amountFormula,
            })),
          },
        },
        include: { accounting_rule_lines: true },
      }),
    );
  }

  async obtener(context: UserContext, id: string): Promise<ReglaConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.accounting_rules.findFirst({
        where: { id, deleted_at: null },
        include: { accounting_rule_lines: { where: { deleted_at: null } } },
      }),
    );
  }

  async buscarPorEvento(
    context: UserContext,
    eventCode: string,
    companyId: string,
  ): Promise<ReglaConLineas | null> {
    return withTenantScope(this.client, context, (tx) =>
      tx.accounting_rules.findFirst({
        where: { event_code: eventCode, company_id: companyId, is_active: true, deleted_at: null },
        include: { accounting_rule_lines: { where: { deleted_at: null } } },
        orderBy: { created_at: 'desc' },
      }),
    );
  }

  async listar(
    context: UserContext,
    filter: AccountingPrisma.accounting_rulesWhereInput,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<accounting_rules>> {
    const { page, pageSize } = pagination;
    const where = { ...filter, deleted_at: null };
    return withTenantScope(this.client, context, async (tx) => {
      const [data, total] = await Promise.all([
        tx.accounting_rules.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { created_at: 'desc' },
        }),
        tx.accounting_rules.count({ where }),
      ]);
      return { data, meta: { page, pageSize, total } };
    });
  }

  async actualizar(
    context: UserContext,
    id: string,
    params: ReglaContableParams,
  ): Promise<ReglaConLineas> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.accounting_rules.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new ReglaContableNoEncontradaParaActualizarError(id);

      await tx.accounting_rule_lines.updateMany({
        where: { rule_id: id, deleted_at: null },
        data: { deleted_at: new Date() },
      });
      return tx.accounting_rules.update({
        where: { id },
        data: {
          event_code: params.eventCode,
          accounting_rule_lines: {
            create: params.lines.map((line) => ({
              tenant_id: context.tenantId,
              company_id: params.companyId,
              branch_id: params.branchId ?? null,
              account_id: line.accountId,
              entry_side: line.entrySide,
              amount_formula: line.amountFormula,
            })),
          },
        },
        include: { accounting_rule_lines: { where: { deleted_at: null } } },
      });
    });
  }

  async eliminar(context: UserContext, id: string): Promise<accounting_rules> {
    return withTenantScope(this.client, context, async (tx) => {
      const actual = await tx.accounting_rules.findFirst({ where: { id, deleted_at: null } });
      if (!actual) throw new ReglaContableNoEncontradaParaActualizarError(id);
      return tx.accounting_rules.update({
        where: { id },
        data: { deleted_at: new Date(), deleted_by: context.userId },
      });
    });
  }
}
