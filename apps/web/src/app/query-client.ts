import { QueryClient } from '@tanstack/react-query';
import { registerQueryInvalidator } from '@gorazus/ui-kit';

/**
 * Instancia única — importada por `providers.tsx` para `<QueryClientProvider>`.
 * `staleTime` por defecto acá es el caso "listados transaccionales" (STATE_MANAGEMENT.md
 * §2.2) — cada hook de catálogo/turno-activo sobreescribe el suyo puntualmente, nunca al
 * revés. Se registra como el invalidador real del `appStore` (`ui-kit/store/app.store.ts`,
 * ver `ui-kit/query/invalidation-bridge.ts`) para que `switchCompanyContext` pueda limpiar
 * cache sin que `ui-kit` dependa de esta instancia concreta.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

registerQueryInvalidator(() => queryClient.invalidateQueries());
