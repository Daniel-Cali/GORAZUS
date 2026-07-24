/**
 * Barrel público de `pos` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Reservado para `apps/web` (rutas del frontend, mismo patrón que
 * `modules/auth/index.ts`) — todavía sin frontend registrado acá
 * (ver `modules/pos/backend` y `POS_COMPONENTS.md`).
 */
export { PosModule } from './backend/pos.module';
