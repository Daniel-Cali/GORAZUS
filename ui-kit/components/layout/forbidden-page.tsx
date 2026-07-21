import { Button } from '../primitives/button';

export interface ForbiddenPageProps {
  onGoHome: () => void;
}

/**
 * "Sin acceso" — distinto del 404: la ruta existe pero el usuario no tiene
 * el permiso requerido (docs/frontend/ROUTING.md §5.2). La autorización real
 * ocurre siempre en el backend; esto es solo UX para no dejar al usuario
 * frente a una pantalla bloqueada sin explicación.
 */
export function ForbiddenPage({ onGoHome }: ForbiddenPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">403</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Sin acceso</h1>
        <p className="text-sm text-muted-foreground">No tenés permiso para ver esta pantalla.</p>
      </div>
      <Button onClick={onGoHome}>Volver al inicio</Button>
    </div>
  );
}
