import { Moon, Sun } from 'lucide-react';
import { Button } from '../primitives/button';

export type Theme = 'light' | 'dark';

/**
 * Puramente presentacional — el estado (persistido en `uiSlice` de Zustand,
 * ver docs/frontend/STATE_MANAGEMENT.md §7) y el efecto de agregar/quitar
 * `.dark` en el elemento raíz los maneja el `ThemeProvider` de apps/web.
 */
export interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onToggle}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
