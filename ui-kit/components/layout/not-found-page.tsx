import { Button } from '../primitives/button';

export interface NotFoundPageProps {
  /** Navegación real (react-router) la resuelve el consumidor — ui-kit no depende de react-router-dom. */
  onGoHome: () => void;
}

/** 404 único de todo el sistema — ruta comodín en el router, nunca reimplementado por módulo (docs/frontend/ROUTING.md §7). */
export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La página que buscás no existe o fue movida.
        </p>
      </div>
      <Button onClick={onGoHome}>Volver al inicio</Button>
    </div>
  );
}
