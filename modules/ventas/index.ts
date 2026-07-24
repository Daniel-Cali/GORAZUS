/**
 * Barrel público de `ventas` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Primer consumidor: `modules/pos/backend` (checkout — crea la factura,
 * la confirma y registra los recibos de cobro).
 */
export { VentasModule } from './backend/ventas.module';
export { VentasService } from './backend/services/ventas.service';
export type { FacturaConLineas } from './backend/repositories/factura.repository';
