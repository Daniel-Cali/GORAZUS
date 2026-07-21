import * as React from 'react';
import { Button } from '@gorazus/ui-kit';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Raíz del árbol de providers (ROUTING.md §6, ERROR_HANDLING.md §1) — última
 * red antes de una pantalla en blanco. Los errores de carga de chunk lazy
 * (deploy nuevo + pestaña vieja) se manejan con un boundary por rama de ruta,
 * no acá (ERROR_HANDLING.md §1) — este solo cubre lo que se le escapa a todos
 * los demás.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl font-semibold">Ocurrió un error inesperado</p>
          <p className="text-sm text-muted-foreground">Recargá la página para continuar.</p>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
