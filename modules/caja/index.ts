/**
 * Barrel público de `caja` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Primer consumidor: `modules/pos/backend` (checkout — valida apertura
 * activa y registra el cobro).
 */
export { CajaModule } from './backend/caja.module';
export {
  CajaService,
  CajaNoAbiertaException,
  CajaYaAbiertaException,
} from './backend/services/caja.service';
