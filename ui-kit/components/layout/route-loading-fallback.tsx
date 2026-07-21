import { Loader } from '../primitives/loader';

/** Fallback único de `<Suspense>` para todo `React.lazy()` de página — nunca uno distinto por módulo (docs/frontend/ROUTING.md §3). */
export function RouteLoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <Loader className="h-6 w-6" />
    </div>
  );
}
