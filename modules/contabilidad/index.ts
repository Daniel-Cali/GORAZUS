/**
 * Barrel público de `contabilidad` (docs/architecture/01-estructura-monorepo.md §4-5).
 * Primer consumidor: `modules/ventas/backend` (dispara el motor de
 * reglas al confirmar una factura, no bloqueante si no hay regla
 * configurada — ver `MotorContableService`).
 */
export { ContabilidadModule } from './backend/contabilidad.module';
export { MotorContableService } from './backend/services/motor-contable.service';
export type { HechoContable } from './backend/services/motor-contable.service';
export { PlanCuentasService } from './backend/services/plan-cuentas.service';
