/**
 * Barrel público frontend de `ventas` — separado de `modules/ventas/index.ts`
 * (backend, consumido por `pos-backend`) para no arrastrar react-router-dom
 * a ese módulo. Alias dedicado en `tsconfig.base.json`:
 * `@gorazus/modules/ventas-frontend`. Mismo criterio que
 * `modules/inventario/frontend/index.ts`.
 */
export { ventasRoutes } from './routes/ventas.routes';
