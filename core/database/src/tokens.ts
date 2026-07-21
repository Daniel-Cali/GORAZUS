/**
 * Un token de inyección por schema de Postgres — ver core/database/src/database.module.ts
 * para el porqué (cliente Prisma por schema, no uno monolítico).
 */
export const PRISMA_CORE = Symbol('PRISMA_CORE');
export const PRISMA_SECURITY = Symbol('PRISMA_SECURITY');
export const PRISMA_CUSTOMERS = Symbol('PRISMA_CUSTOMERS');
export const PRISMA_SUPPLIERS = Symbol('PRISMA_SUPPLIERS');
export const PRISMA_PRODUCTS = Symbol('PRISMA_PRODUCTS');
export const PRISMA_INVENTORY = Symbol('PRISMA_INVENTORY');
export const PRISMA_SALES = Symbol('PRISMA_SALES');
export const PRISMA_PURCHASES = Symbol('PRISMA_PURCHASES');
export const PRISMA_CASH = Symbol('PRISMA_CASH');
export const PRISMA_BANKS = Symbol('PRISMA_BANKS');
export const PRISMA_ACCOUNTING = Symbol('PRISMA_ACCOUNTING');
export const PRISMA_TAXES = Symbol('PRISMA_TAXES');
export const PRISMA_HR = Symbol('PRISMA_HR');
export const PRISMA_PAYROLL = Symbol('PRISMA_PAYROLL');
export const PRISMA_CRM = Symbol('PRISMA_CRM');
export const PRISMA_SERVICES = Symbol('PRISMA_SERVICES');
export const PRISMA_PROJECTS = Symbol('PRISMA_PROJECTS');
export const PRISMA_ASSETS = Symbol('PRISMA_ASSETS');
export const PRISMA_REPORTS = Symbol('PRISMA_REPORTS');
export const PRISMA_BI = Symbol('PRISMA_BI');
export const PRISMA_CONFIGURATION = Symbol('PRISMA_CONFIGURATION');
