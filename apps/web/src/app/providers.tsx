import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import {
  ThemeProvider,
  Toaster,
  GlobalLoader,
  useAppStore,
  onSessionExpired,
  subscribeActiveRequests,
} from '@gorazus/ui-kit';
import { queryClient } from './query-client';
import { router } from './router';
import { ErrorBoundary } from './error-boundary';

/**
 * Árbol de providers (ROUTING.md §6):
 * `QueryClientProvider > ThemeProvider > I18nProvider > ErrorBoundary > RouterProvider`.
 * `I18nProvider` queda pendiente — `react-i18next` todavía no es una dependencia
 * instalada en ningún `package.json` del monorepo (FRONTEND_ARCHITECTURE.md §8 lo
 * describe, pero no está construido); se agrega cuando el primer módulo necesite
 * términos i18n reales, no antes.
 */
export function AppProviders() {
  const theme = useAppStore((s) => s.ui.theme);
  const clearSession = useAppStore((s) => s.clearSession);
  const [activeRequests, setActiveRequests] = React.useState(0);

  React.useEffect(() => subscribeActiveRequests(setActiveRequests), []);

  React.useEffect(() => {
    onSessionExpired(() => {
      clearSession();
      router.navigate('/login', { replace: true });
    });
  }, [clearSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <RouterProvider router={router} />
          <GlobalLoader show={activeRequests > 0} />
          <Toaster />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
