/**
 * Barrel público frontend de `inventario` — separado de
 * `modules/inventario/index.ts` (backend, consumido por `pos-backend`/
 * `ventas-backend`) para no arrastrar react-router-dom a esos módulos.
 * Alias dedicado en `tsconfig.base.json`: `@gorazus/modules/inventario-frontend`.
 * Mismo criterio que `modules/clientes/frontend/index.ts`.
 */
export { inventarioRoutes } from './routes/inventario.routes';
