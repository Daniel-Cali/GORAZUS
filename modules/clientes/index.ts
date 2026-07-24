/**
 * Barrel público de `clientes` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Primer consumidor: `modules/pos/backend` (checkout — resuelve el
 * cliente sentinela "Consumidor Final" cuando no se selecciona uno).
 */
export { ClientesModule } from './backend/clientes.module';
export { ClientesService } from './backend/services/clientes.service';
