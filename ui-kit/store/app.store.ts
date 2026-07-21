import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, setAccessToken } from '../http';
import { invalidateAppQueries } from '../query/invalidation-bridge';
import type { Theme } from '../components/layout/theme-toggle';

/**
 * Store raíz único con slices — decisión cerrada en
 * docs/architecture/29-frontend-enterprise.md §5, forma detallada en
 * docs/frontend/STATE_MANAGEMENT.md §3. Vive en `ui-kit/` y no en `apps/web`
 * — a propósito: `docs/frontend/FOLDER_STRUCTURE.md §2.1` (fila "Store de
 * Zustand") permite explícitamente `apps/web` **o** `ui-kit`, nunca un
 * módulo; solo `ui-kit` es importable desde `modules/<x>/frontend`
 * (`FOLDER_STRUCTURE.md §6`), y `modules/auth/frontend` necesita escribir la
 * sesión al loguearse — de ahí la elección entre las dos ubicaciones
 * permitidas. `authSlice` a nivel raíz + `ui` anidado, mismo shape que el
 * ejemplo de selector de esa sección (`useAppStore(s => s.ui.theme)`).
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface UiSlice {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebarCollapsed: () => void;
}

export interface AppStore {
  user: AuthUser | null;
  activeCompanyId: string | null;
  activeBranchId: string | null;
  locale: string;
  setSession: (user: AuthUser, companyId: string | null, branchId: string | null) => void;
  clearSession: () => void;
  /**
   * Único método de cambio de contexto (STATE_MANAGEMENT.md §3.3): pide token
   * nuevo, actualiza el store, invalida cache de queries "de sucursal". El
   * endpoint exacto no está cerrado todavía en `modules/auth` (backend no
   * implementado aún) — se asume `/auth/switch-context` por consistencia de
   * namespace, a confirmar contra el contrato real cuando exista.
   */
  switchCompanyContext: (companyId: string, branchId: string) => Promise<void>;
  ui: UiSlice;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      activeCompanyId: null,
      activeBranchId: null,
      locale: 'es',

      setSession: (user, companyId, branchId) =>
        set({ user, activeCompanyId: companyId, activeBranchId: branchId }),

      clearSession: () => {
        setAccessToken(null);
        set({ user: null, activeCompanyId: null, activeBranchId: null });
      },

      switchCompanyContext: async (companyId, branchId) => {
        const response = await apiClient.post<{ accessToken: string }>('/auth/switch-context', {
          companyId,
          branchId,
        });
        setAccessToken(response.data.accessToken);
        set({ activeCompanyId: companyId, activeBranchId: branchId });
        // Invalida todo por ahora — la clasificación fina "de sucursal/consolidable"
        // vs. "de empresa sin sucursal" (STATE_MANAGEMENT.md §3.3,
        // docs/product/07_SCREEN_CATALOG.md §5) todavía no existe como metadata
        // de queryKey; cuando exista, este predicate se ajusta para no invalidar
        // catálogos "de empresa, sin sucursal".
        await invalidateAppQueries();
      },

      ui: {
        theme: 'light',
        sidebarCollapsed: false,
        setTheme: (theme) => set((state) => ({ ui: { ...state.ui, theme } })),
        toggleSidebarCollapsed: () =>
          set((state) => ({ ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed } })),
      },
    }),
    {
      name: 'gorazus-app-store',
      partialize: (state) => ({
        activeCompanyId: state.activeCompanyId,
        activeBranchId: state.activeBranchId,
        locale: state.locale,
        ui: { theme: state.ui.theme, sidebarCollapsed: state.ui.sidebarCollapsed },
      }),
    },
  ),
);
