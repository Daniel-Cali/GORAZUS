/**
 * Barrel público de `inventario` (docs/architecture/01-estructura-monorepo.md §4-5)
 * — lo único que otro módulo de negocio puede importar de acá. Primer
 * consumidor: `modules/pos/backend` (checkout — valida disponible y
 * descuenta stock real vía `MovimientosService.registrarLote`).
 */
export { InventarioModule } from './backend/inventario.module';
export { StockService } from './backend/services/stock.service';
export type { StockConDisponible } from './backend/services/stock.service';
export {
  MovimientosService,
  ProductoInvalidoException,
  AlmacenInvalidoException,
  StockInsuficienteException,
} from './backend/services/movimientos.service';
