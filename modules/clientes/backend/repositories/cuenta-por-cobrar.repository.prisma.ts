import { Inject, Injectable } from '@nestjs/common';
import { PRISMA_CUSTOMERS, withTenantScope } from '@gorazus/core-database';
import type { CustomersPrismaClient } from '@gorazus/core-database';
import type { UserContext } from '@gorazus/contracts';
import { CuentaPorCobrarRepository, type CuentaPorCobrar } from './cuenta-por-cobrar.repository';

/** Fila cruda tal como la devuelve la vista (snake_case, columnas ver dictionary `03-customers.md`). */
interface FilaCuentaPorCobrar {
  customer_id: string;
  legal_name: string;
  invoice_id: string;
  document_number: string;
  total_amount: string;
  open_balance: string;
  days_outstanding: number;
  aging_bucket: string;
}

/**
 * `customers.v_accounts_receivable_aging` no es un modelo de Prisma
 * (el pipeline `db:pull` de `core-database` no tiene `previewFeatures =
 * ["views"]` habilitado — introspectar solo esta vista no justifica
 * regenerar los 21 clientes Prisma del proyecto). `$queryRaw` con
 * template tag parametrizado (nunca interpolación de string) dentro de
 * `withTenantScope`, mismo aislamiento de tenant/RLS que cualquier otro
 * repositorio — la vista lee de tablas con RLS forzado, no de una tabla
 * propia.
 */
@Injectable()
export class CuentaPorCobrarRepositoryPrisma extends CuentaPorCobrarRepository {
  constructor(@Inject(PRISMA_CUSTOMERS) private readonly client: CustomersPrismaClient) {
    super();
  }

  async listarPorCliente(context: UserContext, customerId: string): Promise<CuentaPorCobrar[]> {
    const filas = await withTenantScope(
      this.client,
      context,
      (tx) =>
        tx.$queryRaw<FilaCuentaPorCobrar[]>`
        SELECT customer_id, legal_name, invoice_id, document_number, total_amount,
               open_balance, days_outstanding, aging_bucket
        FROM customers.v_accounts_receivable_aging
        WHERE customer_id = ${customerId}::uuid
        ORDER BY days_outstanding DESC
      `,
    );

    return filas.map((fila) => ({
      customerId: fila.customer_id,
      legalName: fila.legal_name,
      invoiceId: fila.invoice_id,
      documentNumber: fila.document_number,
      totalAmount: fila.total_amount,
      openBalance: fila.open_balance,
      daysOutstanding: fila.days_outstanding,
      agingBucket: fila.aging_bucket,
    }));
  }
}
