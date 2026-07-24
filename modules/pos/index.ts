/**
 * Barrel público de `pos` (docs/architecture/01-estructura-monorepo.md §4-5)
 * — SOLO lo que el frontend puede necesitar. `PosModule` (backend) NO se
 * exporta acá a propósito: este archivo lo importa `apps/web` (bundler
 * Vite, sin tree-shaking real en dev) — reexportar el módulo NestJS acá
 * arrastraba toda la cadena de clientes Prisma al bundle del navegador
 * (`Cannot find export 'PrismaClient'` en `accounting/generated/index-browser.js`,
 * bug real encontrado al verificar el frontend del POS). `apps/api`
 * importa `PosModule` por ruta relativa directa, igual que el resto de
 * los módulos de negocio — nunca necesitó este barrel.
 */
export { posRoutes } from './frontend/routes/pos.routes';
