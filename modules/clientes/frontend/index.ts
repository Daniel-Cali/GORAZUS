/**
 * Barrel público frontend de `clientes` — separado de `modules/clientes/index.ts`
 * (ese es solo backend, consumido por `pos-backend`/`crm-backend`) para no
 * arrastrar react-router-dom a esos dos módulos ni los clientes Prisma al
 * bundle del navegador. Alias dedicado en `tsconfig.base.json`:
 * `@gorazus/modules/clientes-frontend`. Mismo criterio que
 * `modules/pos/index.ts` documenta para el caso simétrico.
 */
export { clientesRoutes } from './routes/clientes.routes';
