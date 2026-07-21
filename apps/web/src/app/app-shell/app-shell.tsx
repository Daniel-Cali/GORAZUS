import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell as UiAppShell, Button, ThemeToggle, useAppStore } from '@gorazus/ui-kit';
import { LogOut } from 'lucide-react';
import { useAppSidebarProps } from './sidebar';

/**
 * Layout raíz — nav global vía `AppSidebar` + selector empresa/sucursal
 * (pendiente: no hay endpoint de listado de empresas/sucursales todavía en
 * `modules/auth/backend`, se agrega cuando exista, ver STATE_MANAGEMENT.md
 * §3.1). Envuelve todas las rutas autenticadas — `router.tsx` la monta como
 * elemento de la ruta padre bajo `<RequireAuth>` (ROUTING.md §4).
 */
export function AppShellLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.ui.theme);
  const sidebarCollapsed = useAppStore((s) => s.ui.sidebarCollapsed);
  const setTheme = useAppStore((s) => s.ui.setTheme);
  const toggleSidebarCollapsed = useAppStore((s) => s.ui.toggleSidebarCollapsed);
  const clearSession = useAppStore((s) => s.clearSession);
  const sidebarProps = useAppSidebarProps();

  return (
    <UiAppShell
      sidebar={{
        ...sidebarProps,
        collapsed: sidebarCollapsed,
        onToggleCollapsed: toggleSidebarCollapsed,
      }}
      topbar={{
        right: (
          <>
            {user && <span className="mr-2 text-sm text-muted-foreground">{user.name}</span>}
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                clearSession();
                navigate('/login', { replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </>
        ),
      }}
    >
      {children}
    </UiAppShell>
  );
}
