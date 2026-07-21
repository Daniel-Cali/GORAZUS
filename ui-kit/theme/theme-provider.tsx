import * as React from 'react';
import type { Theme } from '../components/layout/theme-toggle';

export interface ThemeProviderProps {
  /** Fuente de verdad — vive en el `uiSlice` de Zustand de apps/web (docs/frontend/STATE_MANAGEMENT.md §3.2), nunca duplicada acá. */
  theme: Theme;
  children: React.ReactNode;
}

/** Único responsable de sincronizar `.dark` en `<html>` con el tema activo (docs/frontend/UI_GUIDELINES.md §3). */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}
