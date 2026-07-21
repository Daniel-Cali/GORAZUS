import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaClient as CorePrismaClient } from '../prisma/schemas/core/generated';
import { PrismaClient as SecurityPrismaClient } from '../prisma/schemas/security/generated';
import { PrismaClient as CustomersPrismaClient } from '../prisma/schemas/customers/generated';
import { PrismaClient as SuppliersPrismaClient } from '../prisma/schemas/suppliers/generated';
import { PrismaClient as ProductsPrismaClient } from '../prisma/schemas/products/generated';
import { PrismaClient as InventoryPrismaClient } from '../prisma/schemas/inventory/generated';
import { PrismaClient as SalesPrismaClient } from '../prisma/schemas/sales/generated';
import { PrismaClient as PurchasesPrismaClient } from '../prisma/schemas/purchases/generated';
import { PrismaClient as CashPrismaClient } from '../prisma/schemas/cash/generated';
import { PrismaClient as BanksPrismaClient } from '../prisma/schemas/banks/generated';
import { PrismaClient as AccountingPrismaClient } from '../prisma/schemas/accounting/generated';
import { PrismaClient as TaxesPrismaClient } from '../prisma/schemas/taxes/generated';
import { PrismaClient as HrPrismaClient } from '../prisma/schemas/hr/generated';
import { PrismaClient as PayrollPrismaClient } from '../prisma/schemas/payroll/generated';
import { PrismaClient as CrmPrismaClient } from '../prisma/schemas/crm/generated';
import { PrismaClient as ServicesPrismaClient } from '../prisma/schemas/services/generated';
import { PrismaClient as ProjectsPrismaClient } from '../prisma/schemas/projects/generated';
import { PrismaClient as AssetsPrismaClient } from '../prisma/schemas/assets/generated';
import { PrismaClient as ReportsPrismaClient } from '../prisma/schemas/reports/generated';
import { PrismaClient as BiPrismaClient } from '../prisma/schemas/bi/generated';
import { PrismaClient as ConfigurationPrismaClient } from '../prisma/schemas/configuration/generated';
import {
  PRISMA_CORE,
  PRISMA_SECURITY,
  PRISMA_CUSTOMERS,
  PRISMA_SUPPLIERS,
  PRISMA_PRODUCTS,
  PRISMA_INVENTORY,
  PRISMA_SALES,
  PRISMA_PURCHASES,
  PRISMA_CASH,
  PRISMA_BANKS,
  PRISMA_ACCOUNTING,
  PRISMA_TAXES,
  PRISMA_HR,
  PRISMA_PAYROLL,
  PRISMA_CRM,
  PRISMA_SERVICES,
  PRISMA_PROJECTS,
  PRISMA_ASSETS,
  PRISMA_REPORTS,
  PRISMA_BI,
  PRISMA_CONFIGURATION,
} from './tokens';
export * from './tokens';

/**
 * Ver docs/architecture/02-arquitectura-modulos-backend.md §4: Prisma
 * es consumidor del SQL crudo, un schema de Postgres por módulo. Un
 * cliente Prisma MONOLÍTICO con los 500 modelos de los 21 schemas
 * juntos hace colgar `prisma generate` (WASM getDMMF, límite de
 * escala de Prisma 5.x — ver informe de resolución del bloqueo, EPIC
 * Foundation Platform). La solución validada: 21 clientes Prisma
 * independientes, uno por schema, cada uno con su propio
 * `prisma/schemas/<nombre>/schema.prisma` + cliente generado.
 *
 * Consecuencia intencional: los campos de relación Prisma que
 * cruzaban schemas (ej. `core.tenants` viendo las 500 tablas que le
 * apuntan) se podan en la extracción — no se pierde nada real, porque
 * las referencias cross-schema YA estaban prohibidas como FK de
 * Postgres (docs/architecture/02 §4: "IDs sueltos, nunca FK real
 * entre schemas de distintos módulos") — Prisma ahora refleja
 * exactamente esa regla, en vez de exponer una relación que la
 * aplicación no debería usar.
 *
 * Cada módulo de negocio inyecta SOLO el token de su propio schema
 * (`@Inject(PRISMA_VENTAS)`), nunca los 21 — mismo principio de
 * frontera que ya aplica el lint de Nx a nivel de import.
 */
@Global()
@Module({
  providers: [
    {
      provide: PRISMA_CORE,
      useFactory: () =>
        new CorePrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_SECURITY,
      useFactory: () =>
        new SecurityPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_CUSTOMERS,
      useFactory: () =>
        new CustomersPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_SUPPLIERS,
      useFactory: () =>
        new SuppliersPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_PRODUCTS,
      useFactory: () =>
        new ProductsPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_INVENTORY,
      useFactory: () =>
        new InventoryPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_SALES,
      useFactory: () =>
        new SalesPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_PURCHASES,
      useFactory: () =>
        new PurchasesPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_CASH,
      useFactory: () =>
        new CashPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_BANKS,
      useFactory: () =>
        new BanksPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_ACCOUNTING,
      useFactory: () =>
        new AccountingPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_TAXES,
      useFactory: () =>
        new TaxesPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_HR,
      useFactory: () =>
        new HrPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_PAYROLL,
      useFactory: () =>
        new PayrollPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_CRM,
      useFactory: () =>
        new CrmPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_SERVICES,
      useFactory: () =>
        new ServicesPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_PROJECTS,
      useFactory: () =>
        new ProjectsPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_ASSETS,
      useFactory: () =>
        new AssetsPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_REPORTS,
      useFactory: () =>
        new ReportsPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_BI,
      useFactory: () =>
        new BiPrismaClient({ datasources: { db: { url: process.env['DATABASE_URL'] } } }),
    },
    {
      provide: PRISMA_CONFIGURATION,
      useFactory: () =>
        new ConfigurationPrismaClient({
          datasources: { db: { url: process.env['DATABASE_URL'] } },
        }),
    },
  ],
  exports: [
    PRISMA_CORE,
    PRISMA_SECURITY,
    PRISMA_CUSTOMERS,
    PRISMA_SUPPLIERS,
    PRISMA_PRODUCTS,
    PRISMA_INVENTORY,
    PRISMA_SALES,
    PRISMA_PURCHASES,
    PRISMA_CASH,
    PRISMA_BANKS,
    PRISMA_ACCOUNTING,
    PRISMA_TAXES,
    PRISMA_HR,
    PRISMA_PAYROLL,
    PRISMA_CRM,
    PRISMA_SERVICES,
    PRISMA_PROJECTS,
    PRISMA_ASSETS,
    PRISMA_REPORTS,
    PRISMA_BI,
    PRISMA_CONFIGURATION,
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([
      this.moduleRef.get(PRISMA_CORE, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_SECURITY, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_CUSTOMERS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_SUPPLIERS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_PRODUCTS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_INVENTORY, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_SALES, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_PURCHASES, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_CASH, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_BANKS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_ACCOUNTING, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_TAXES, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_HR, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_PAYROLL, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_CRM, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_SERVICES, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_PROJECTS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_ASSETS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_REPORTS, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_BI, { strict: false })?.$disconnect(),
      this.moduleRef.get(PRISMA_CONFIGURATION, { strict: false })?.$disconnect(),
    ]);
  }
}
