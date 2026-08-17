/**
 * Barrel público de `clientes` (docs/architecture/01-estructura-monorepo.md §4-5)
 * — SOLO backend. Consumido por `modules/pos/backend` (checkout — resuelve
 * el cliente sentinela "Consumidor Final") y `modules/crm/backend`
 * (conversión de leads). El frontend (Clientes Parte 02) tiene su propio
 * barrel, `modules/clientes/frontend/index.ts` (`@gorazus/modules/clientes-frontend`)
 * — mismo motivo que documenta `modules/pos/index.ts`: mezclar acá
 * `clientesRoutes` arrastraría react-router-dom a estos dos módulos de
 * backend, y en sentido contrario arrastraría los clientes Prisma al
 * bundle del navegador si `apps/web` importara este barrel.
 */
export { ClientesModule } from './backend/clientes.module';
export { ClientesService } from './backend/services/clientes.service';
