/**
 * Barrel público frontend de `caja` — separado de `modules/caja/index.ts`
 * (backend, consumido por `pos-backend`) para no arrastrar react-router-dom
 * a ese módulo. Alias dedicado en `tsconfig.base.json`:
 * `@gorazus/modules/caja-frontend`. Mismo criterio que
 * `modules/ventas/frontend/index.ts`.
 */
export { cajaRoutes } from './routes/caja.routes';
